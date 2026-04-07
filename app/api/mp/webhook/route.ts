import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

async function resolveTableSafe(
  supabase: any,
  itemId: string,
  itemType: string
) {
  if (itemType === "classified") return "classifieds";
  if (itemType === "job") return "jobs";
  if (itemType === "meal") return "meals";
  if (itemType === "listing") return "listings";
  if (itemType === "verification") return "verification_requests";

  const tables = [
    "listings",
    "classifieds",
    "jobs",
    "meals",
    "verification_requests",
  ];

  for (const table of tables) {
    const { data } = await supabase
      .from(table)
      .select("id")
      .eq("id", itemId)
      .maybeSingle();

    if (data) return table;
  }

  return "listings";
}

function parseBool(value: any): boolean {
  if (value === true) return true;
  if (value === false) return false;

  const v = String(value ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

async function mpGet(url: string, accessToken: string) {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MP GET ${url} failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function POST(req: Request) {
  try {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!accessToken || !supabaseUrl || !serviceRole) {
      console.error("WEBHOOK ENV ERROR", {
        hasAccessToken: !!accessToken,
        hasSupabaseUrl: !!supabaseUrl,
        hasServiceRole: !!serviceRole,
      });

      return NextResponse.json({ ok: true, ignored: "missing_env" });
    }

    const url = new URL(req.url);
    const bodyText = await req.text();

    let body: any = {};
    try {
      body = bodyText ? JSON.parse(bodyText) : {};
    } catch {
      body = {};
    }

    console.log("WEBHOOK MERCHANT ORDER HIT", {
      fullUrl: req.url,
      query: Object.fromEntries(url.searchParams.entries()),
      body,
    });

    const topic =
      String(url.searchParams.get("topic") || url.searchParams.get("type") || "")
        .trim();

    const bodyType = String(body?.type || body?.topic || "").trim();
    const action = String(body?.action || "").trim();

    const isMerchantOrder =
      topic === "merchant_order" ||
      bodyType === "merchant_order" ||
      topic === "topic_merchant_order_wh" ||
      bodyType === "topic_merchant_order_wh" ||
      action === "topic_merchant_order_wh" ||
      action === "merchant_order.updated" ||
      action === "merchant_order";

    if (!isMerchantOrder) {
      console.log("WEBHOOK IGNORADO (no merchant_order)", {
        topic,
        bodyType,
        action,
      });

      return NextResponse.json({ ok: true, ignored: "not_merchant_order" });
    }

    const merchantOrderId =
      body?.data?.id ||
      body?.id ||
      (typeof body?.resource === "string" ? body.resource.split("/").pop() : null);

    if (!merchantOrderId) {
      console.log("WEBHOOK IGNORADO: merchantOrderId vacío");
      return NextResponse.json({ ok: true, ignored: "no_merchant_order_id" });
    }

    const order = await mpGet(
      `https://api.mercadopago.com/merchant_orders/${merchantOrderId}`,
      accessToken
    );

    const payments = Array.isArray(order?.payments) ? order.payments : [];

    const approvedPayment = payments.find(
      (p: any) => String(p?.status || "").toLowerCase() === "approved" && p?.id
    );

    if (!approvedPayment?.id) {
      console.log("MERCHANT ORDER SIN PAGO APROBADO", {
        merchantOrderId,
        payments,
      });

      return NextResponse.json({
        ok: true,
        ignored: "merchant_order_without_approved_payment",
        merchantOrderId: String(merchantOrderId),
      });
    }

    const paymentId = String(approvedPayment.id);
    const payment = await mpGet(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      accessToken
    );

    const status = String(payment?.status || "").toLowerCase();
    if (status !== "approved") {
      console.log("PAGO NO APROBADO", { paymentId, status });
      return NextResponse.json({ ok: true, ignored: "payment_not_approved" });
    }

    const externalRef = String(payment?.external_reference || "");
    const metadata = payment?.metadata || {};

    let itemType = String(metadata.itemType || "").trim();
    let itemId = String(metadata.itemId || "").trim();

    if ((!itemType || !itemId) && externalRef) {
      const parts = externalRef.split(":");
      itemType = itemType || String(parts[0] || "").trim();
      itemId = itemId || String(parts[1] || "").trim();
    }

    if (!itemId) {
      console.error("NO SE PUDO RESOLVER itemId", {
        paymentId,
        externalRef,
        metadata,
      });

      return NextResponse.json({ ok: true, ignored: "no_item_id" });
    }

    const supabase = createClient(supabaseUrl, serviceRole, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const table = await resolveTableSafe(supabase, itemId, itemType);

    const paymentPayload = {
      provider: "mercadopago",
      provider_payment_id: paymentId,
      listing_id: itemId,
      status: String(payment?.status || ""),
      amount: payment?.transaction_amount ?? null,
      currency: String(payment?.currency_id || "ARS"),
    };

    if (table === "listings") {
      const upsertRes = await supabase.from("payments").upsert(paymentPayload, {
        onConflict: "provider_payment_id",
      });

      if (upsertRes.error) {
        console.error("PAYMENTS UPSERT ERROR:", upsertRes.error);
      }
    }

    const publishedUntil = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    const updateData: any = {
      status: "PUBLISHED",
      published_until: publishedUntil,
    };

    if (table === "listings") {
      updateData.is_published = true;
    }

    if (table === "verification_requests") {
      updateData.status = "PENDING_REVIEW";
      updateData.payment_status = "APPROVED";
      updateData.paid_at = new Date().toISOString();
    }

    if (parseBool(metadata.featured)) {
      updateData.featured_until = publishedUntil;
    }

    if (parseBool(metadata.urgent)) {
      updateData.urgent_until = publishedUntil;
    }

    if (parseBool(metadata.petrol)) {
      updateData.petrol_priority = true;
      updateData.petrol_priority_until = publishedUntil;
    }

    let updRes = await supabase
      .from(table)
      .update(updateData)
      .eq("id", itemId)
      .select();

    if (!updRes.error && (!updRes.data || updRes.data.length === 0)) {
      updRes = await supabase
        .from(table)
        .update(updateData)
        .eq("listing_id", itemId)
        .select();
    }

    if (updRes.error) {
      console.error("UPDATE ERROR:", updRes.error);
      return NextResponse.json({ ok: true, ignored: "update_error" });
    }

    if (!updRes.data || updRes.data.length === 0) {
      console.error("NO SE ENCONTRÓ REGISTRO A PUBLICAR", {
        table,
        itemId,
        itemType,
      });

      return NextResponse.json({ ok: true, ignored: "record_not_found" });
    }

    console.log("PUBLICACIÓN APROBADA Y ACTUALIZADA", {
      merchantOrderId,
      paymentId,
      itemId,
      itemType,
      table,
    });

    return NextResponse.json({
      ok: true,
      paymentId,
      itemId,
      itemType,
      table,
      status: "approved",
    });
  } catch (e: any) {
    console.error("WEBHOOK ERROR:", e);
    return NextResponse.json({ ok: true, ignored: "caught_error" });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, route: "mp webhook" });
}