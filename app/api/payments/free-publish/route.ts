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

type TableName = "listings" | "classifieds" | "jobs" | "meals";

function resolveTable(itemType: string): TableName {
  if (itemType === "classified") return "classifieds";
  if (itemType === "job") return "jobs";
  if (itemType === "meal") return "meals";
  return "listings";
}

function resolvePublicHref(itemType: string, itemId: string) {
  if (itemType === "classified") return `/clasificados/${itemId}`;
  if (itemType === "job") return `/trabajo/${itemId}`;
  if (itemType === "meal") return `/viandas/${itemId}`;
  return `/anuncio/${itemId}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const itemId = String(body?.itemId || "").trim();
    const itemType = String(body?.itemType || "").trim();
    const featured = body?.featured === true;
    const urgent = body?.urgent === true;
    const petrol = body?.petrol === true;

    if (!itemId) {
      return NextResponse.json({ error: "itemId requerido" }, { status: 400 });
    }

    const table = resolveTable(itemType);

    const now = new Date();
    const plus30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const plus9 = new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000).toISOString();

    const payload: Record<string, any> = {
      status: "PUBLISHED",
      featured: featured,
      featured_until: featured ? plus30 : null,
      urgent_until: urgent ? plus9 : null,
      petrol_priority: petrol,
      petrol_priority_until: petrol ? plus30 : null,
    };

    const { error } = await supabase
      .from(table)
      .update(payload)
      .eq("id", itemId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      ok: true,
      redirectTo: resolvePublicHref(itemType, itemId),
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Error publicando gratis" },
      { status: 500 }
    );
  }
}