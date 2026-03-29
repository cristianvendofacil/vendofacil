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

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("pricing_rules")
      .select("id,item_type,plan_code,title,price_ars,is_active")
      .eq("is_active", true)
      .order("item_type", { ascending: true })
      .order("plan_code", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: data ?? [],
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Error cargando precios públicos" },
      { status: 500 }
    );
  }
}