export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const userId = String(body?.userId || "").trim();
    const itemType = String(body?.itemType || "").trim() || null;
    const query = String(body?.query || "").trim() || null;
    const town = String(body?.town || "").trim() || null;

    const notifyInApp = body?.notifyInApp !== false;
    const notifyEmail = body?.notifyEmail === true;
    const notifyWhatsapp = body?.notifyWhatsapp === true;
    const whatsappPhone = String(body?.whatsappPhone || "").trim() || null;

    if (!userId) {
      return NextResponse.json(
        { error: "Usuario requerido" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("saved_search_alerts")
      .insert({
        user_id: userId,
        item_type: itemType,
        query,
        town,
        notify_in_app: notifyInApp,
        notify_email: notifyEmail,
        notify_whatsapp: notifyWhatsapp,
        whatsapp_phone: whatsappPhone,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      alert: data,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Error creando alerta" },
      { status: 500 }
    );
  }
}