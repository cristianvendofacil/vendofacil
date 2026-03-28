import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { calculateExpiry } from "@/lib/expiry";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function addDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const paymentId = body?.data?.id;

    if (!paymentId) {
      return NextResponse.json({ ok: true });
    }

    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        },
      }
    );

    const mpData = await mpRes.json();

    if (!mpRes.ok) {
      return NextResponse.json({ ok: false, mp: mpData }, { status: 500 });
    }

    const status = mpData.status;
    const itemId = mpData.metadata?.itemId;
    const itemType = mpData.metadata?.itemType;
    const featured = mpData.metadata?.featured === true;
    const urgent = mpData.metadata?.urgent === true;
    const petrol = mpData.metadata?.petrol === true;
    const couponId = mpData.metadata?.couponId || null;

    if (!itemId || !itemType) {
      return NextResponse.json({ ok: true });
    }

    if (status !== "approved") {
      return NextResponse.json({ ok: true, status });
    }

    const expiresAt = calculateExpiry(itemType);

    const payload: Record<string, any> = {
      status: "PUBLISHED",
      is_published: true,
      published_at: new Date().toISOString(),
      published_until: expiresAt,
      expires_at: expiresAt,
      featured: featured,
      petrol_priority: petrol,
    };

    if (featured) {
      payload.featured_until = addDays(30);
    } else {
      payload.featured_until = null;
    }

    if (urgent) {
      payload.urgent_until = addDays(9);
    } else {
      payload.urgent_until = null;
    }

    if (petrol) {
      payload.petrol_priority_until = addDays(30);
    } else {
      payload.petrol_priority_until = null;
    }

    if (itemType === "listing") {
      const { error } = await supabase.from("listings").update(payload).eq("id", itemId);
      if (error) throw error;
    }

    if (itemType === "classified") {
      const { error } = await supabase.from("classifieds").update(payload).eq("id", itemId);
      if (error) throw error;
    }

    if (itemType === "job") {
      const { error } = await supabase.from("jobs").update(payload).eq("id", itemId);
      if (error) throw error;
    }

    if (itemType === "meal") {
      const { error } = await supabase.from("meals").update(payload).eq("id", itemId);
      if (error) throw error;
    }

    if (couponId) {
      const { data, error } = await supabase
        .from("coupons")
        .select("used_count")
        .eq("id", couponId)
        .single();

      if (!error && data) {
        await supabase
          .from("coupons")
          .update({
            used_count: (data.used_count || 0) + 1,
          })
          .eq("id", couponId);
      }
    }

    return NextResponse.json({ ok: true, status: "approved" });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Error en webhook" },
      { status: 500 }
    );
  }
}