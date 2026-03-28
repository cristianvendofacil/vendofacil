export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const now = new Date().toISOString();

  await supabase
    .from("listings")
    .update({ status: "EXPIRED" })
    .lt("expires_at", now)
    .eq("status", "PUBLISHED");

  await supabase
    .from("classifieds")
    .update({ status: "EXPIRED" })
    .lt("expires_at", now)
    .eq("status", "PUBLISHED");

  await supabase
    .from("jobs")
    .update({ status: "EXPIRED" })
    .lt("expires_at", now)
    .eq("status", "PUBLISHED");

  await supabase
    .from("meals")
    .update({ status: "EXPIRED" })
    .lt("expires_at", now)
    .eq("status", "PUBLISHED");

  return NextResponse.json({ ok: true });
}