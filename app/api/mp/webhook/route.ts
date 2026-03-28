import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
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

  const tables = ["listings", "classifieds", "jobs", "meals"];

  for (const table of tables) {
    const { data } = await supabase
      .from(table)
      .select("id")
      .eq("id", itemId)
      .maybeSingle();

    if (data) {
      return table;
    }
  }

  return "listings";
}

export async function POST(req: Request) {
  try {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!accessToken) {
      return NextResponse.json({ error: "Falta MP_ACCESS_TOKEN" }, { status: 500 });
    }

    if (!supabaseUrl) {
      return NextResponse.json(
        { error: "Falta NEXT_PUBLIC_SUPABASE_URL" },
        { status: 500 }
      );
    }

    if (!serviceRole) {
      return NextResponse.json(
        { error: "Falta SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 }
      );
    }

    const url = new URL(req.url);
    const topic = url.searchParams.get("topic") || url.searchParams.get("type") || "";

    if (topic === "merchant_order") {
      return NextResponse.json({ ok: true, ignored: "merchant_order" });
    }

    const bodyText = await req.text();

    let body: any = {};
    try {
      body = bodyText ? JSON.parse(bodyText) : {};
    } catch {
      body = {};
    }

    const bodyType = String(body?.type || body?.topic || "").trim();
    if (bodyType === "merchant_order") {
      return NextResponse.json({ ok: true, ignored: "merchant_order_body" });
    }

    const paymentId =
      url.searchParams.get("data.id") ||
      body?.data?.id ||
      body?.id ||
      (typeof body?.resource === "string" ? body.resource.split("/").pop() : null);

    if (!paymentId) {
      return NextResponse.json({ ok: true, note: "No payment id" });
    }

    const mp = new MercadoPagoConfig({ accessToken });
    const paymentApi = new Payment(mp);

    let payment: any;
    try {
      payment = await paymentApi.get({ id: String(paymentId) });
    } catch (e: any) {
      const msg = String(e?.message || "").toLowerCase();

      if (msg.includes("payment not found") || msg.includes("not_found")) {
        return NextResponse.json({
          ok: true,
          ignored: "payment_not_found",
          paymentId: String(paymentId),
        });
      }

      throw e;
    }

    const status = String(payment.status || "");
    const externalRef = String(payment.external_reference || "");
    const metadata = payment.metadata || {};

    let itemType = String(metadata.itemType || "").trim();
    let itemId = String(metadata.itemId || "").trim();

    if ((!itemType || !itemId) && externalRef) {
      const parts = externalRef.split(":");
      itemType = itemType || String(parts[0] || "").trim();
      itemId = itemId || String(parts[1] || "").trim();
    }

    if (!itemId) {
      return NextResponse.json({ ok: true, note: "No itemId parsed" });
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
      provider_payment_id: String(paymentId),
      listing_id: itemId,
      status,
      amount: payment.transaction_amount ?? null,
      currency: String(payment.currency_id || "ARS"),
    };

    // SOLO guardar en payments cuando el item pertenece a listings,
    // porque payments.listing_id tiene FK contra listings.id
    if (table === "listings") {
      const upsertRes = await supabase.from("payments").upsert(paymentPayload, {
        onConflict: "provider_payment_id",
      });

      if (upsertRes.error) {
        console.error("PAYMENTS UPSERT ERROR:", upsertRes.error);
        return NextResponse.json({ error: upsertRes.error.message }, { status: 500 });
      }
    } else {
      console.log("⏭️ Saltando payments (no es listing):", table);
    }

    if (status !== "approved") {
      return NextResponse.json({ ok: true, status });
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

    if (metadata.featured) {
      updateData.featured_until = publishedUntil;
    }

    if (metadata.urgent) {
      updateData.urgent_until = publishedUntil;
    }

    if (metadata.petrol) {
      updateData.petrol_priority = true;
      updateData.petrol_priority_until = publishedUntil;
    }

    let updRes = await supabase
      .from(table)
      .update(updateData)
      .eq("id", itemId)
      .select();

    if (!updRes.error && (!updRes.data || updRes.data.length === 0)) {
      console.log("⚠️ No encontró por id, probando por listing_id...");

      updRes = await supabase
        .from(table)
        .update(updateData)
        .eq("listing_id", itemId)
        .select();
    }

    if (updRes.error) {
      console.error(`${table.toUpperCase()} UPDATE ERROR:`, updRes.error);
      return NextResponse.json({ error: updRes.error.message }, { status: 500 });
    }

    if (!updRes.data || updRes.data.length === 0) {
      console.error("❌ NO SE ENCONTRÓ EL REGISTRO EN NINGUNA TABLA");
      console.log("itemId:", itemId);
      console.log("itemType:", itemType);
      console.log("table:", table);
      return NextResponse.json(
        { error: "No se encontró el registro a publicar" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      paymentId: String(paymentId),
      itemId,
      itemType,
      table,
      status,
    });
  } catch (e: any) {
    console.error("WEBHOOK ERROR:", e);
    return NextResponse.json(
      { error: e?.message || "Webhook error" },
      { status: 500 }
    );
  }
}