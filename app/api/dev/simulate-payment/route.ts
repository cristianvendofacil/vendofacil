import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    // ✅ Solo en modo dev con flag
    if (process.env.DEV_BYPASS_PAYMENTS !== "true") {
      return NextResponse.json({ error: "Dev bypass disabled" }, { status: 403 });
    }

    const { listingId } = await req.json();

    if (!listingId) {
      return NextResponse.json({ error: "listingId requerido" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      return NextResponse.json({ error: "Falta NEXT_PUBLIC_SUPABASE_URL" }, { status: 500 });
    }
    if (!serviceRole) {
      return NextResponse.json({ error: "Falta SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });
    }

    // ✅ Leer sesión del usuario desde cookies (Auth Helpers)
    // Para no depender de helpers, pedimos el JWT del navegador en el request:
    // -> lo resolvemos del lado cliente con supabase.auth.getSession()
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (!token) {
      return NextResponse.json({ error: "Falta token de sesión" }, { status: 401 });
    }

    // Cliente con token del usuario para chequear dueño
    const supabaseUser = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    });

    const { data: me, error: meErr } = await supabaseUser.auth.getUser();
    if (meErr) return NextResponse.json({ error: meErr.message }, { status: 401 });
    if (!me.user) return NextResponse.json({ error: "No auth" }, { status: 401 });

    const userId = me.user.id;

    // Cliente service role para actualizar sin problemas de RLS (pero ya validamos dueño)
    const supabaseAdmin = createClient(supabaseUrl, serviceRole, {
      auth: { persistSession: false },
    });

    // Verificar dueño del anuncio
    const { data: listing, error: lErr } = await supabaseAdmin
      .from("listings")
      .select("id,user_id")
      .eq("id", listingId)
      .maybeSingle();

    if (lErr) return NextResponse.json({ error: lErr.message }, { status: 500 });
    if (!listing) return NextResponse.json({ error: "Listing no encontrado" }, { status: 404 });

    if (listing.user_id !== userId) {
      return NextResponse.json({ error: "No sos dueño del anuncio" }, { status: 403 });
    }

    // Publicar 30 días
    const publishedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await supabaseAdmin
      .from("listings")
      .update({
        status: "PUBLISHED",
        is_published: true,
        published_until: publishedUntil,
      })
      .eq("id", listingId);

    // (Opcional) registrar pago simulado si existe tabla payments
    await supabaseAdmin.from("payments").insert({
      provider: "simulated",
      provider_payment_id: `sim-${listingId}-${Date.now()}`,
      listing_id: listingId,
      status: "approved",
      amount: 0,
      currency: "ARS",
    });

    return NextResponse.json({ ok: true, published_until: publishedUntil });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}