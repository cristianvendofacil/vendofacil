import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL en .env.local");
}

if (!serviceRoleKey) {
  throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY en .env.local");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function GET() {
  try {
    const itemId = "1dff93cc-16f9-4dfb-ae55-3b4ee2dc5159";

    const { data: before, error: beforeError } = await supabase
      .from("listings")
      .select("id,status,title")
      .eq("id", itemId)
      .single();

    if (beforeError) {
      return NextResponse.json(
        { step: "before-select", error: beforeError.message },
        { status: 500 }
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from("listings")
      .update({ status: "PUBLISHED" })
      .eq("id", itemId)
      .select("id,status,title")
      .single();

    if (updateError) {
      return NextResponse.json(
        { step: "update", error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      before,
      updated,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        error: e?.message || "Error en debug publicar-test",
      },
      { status: 500 }
    );
  }
}