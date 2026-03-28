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

type CouponRow = {
  id: string;
  code: string;
  discount_type: "percent" | "fixed" | "free";
  discount_value: number;
  item_type: string | null;
  plan_code: string | null;
  max_uses: number | null;
  used_count: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const itemType = String(body?.itemType || "").trim();
    const planCode = String(body?.planCode || "").trim();
    const couponCode = String(body?.couponCode || "")
      .trim()
      .toUpperCase();

    if (!itemType || !planCode) {
      return NextResponse.json(
        { error: "Faltan itemType o planCode" },
        { status: 400 }
      );
    }

    const { data: rule, error: ruleError } = await supabase
      .from("pricing_rules")
      .select("id,item_type,plan_code,title,price_ars,is_active")
      .eq("item_type", itemType)
      .eq("plan_code", planCode)
      .eq("is_active", true)
      .single();

    if (ruleError || !rule) {
      return NextResponse.json(
        { error: "No existe precio activo para esa combinación" },
        { status: 404 }
      );
    }

    const basePrice = Number(rule.price_ars);
    let finalPrice = basePrice;
    let appliedCoupon: null | {
      id: string;
      code: string;
      discount_type: string;
      discount_value: number;
    } = null;

    if (couponCode) {
      const { data: coupon, error: couponError } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode)
        .eq("is_active", true)
        .single();

      if (!couponError && coupon) {
        const c = coupon as CouponRow;
        const now = Date.now();
        const validFrom = c.valid_from ? new Date(c.valid_from).getTime() : null;
        const validUntil = c.valid_until ? new Date(c.valid_until).getTime() : null;

        const matchesItem = !c.item_type || c.item_type === itemType;
        const matchesPlan = !c.plan_code || c.plan_code === planCode;
        const inDateRange =
          (!validFrom || validFrom <= now) &&
          (!validUntil || validUntil >= now);
        const underLimit =
          c.max_uses === null || c.used_count < c.max_uses;

        if (matchesItem && matchesPlan && inDateRange && underLimit) {
          if (c.discount_type === "free") {
            finalPrice = 0;
          } else if (c.discount_type === "percent") {
            finalPrice = Math.max(
              0,
              basePrice - (basePrice * Number(c.discount_value)) / 100
            );
          } else if (c.discount_type === "fixed") {
            finalPrice = Math.max(0, basePrice - Number(c.discount_value));
          }

          appliedCoupon = {
            id: c.id,
            code: c.code,
            discount_type: c.discount_type,
            discount_value: Number(c.discount_value),
          };
        }
      }
    }

    return NextResponse.json({
      ok: true,
      itemType,
      planCode,
      basePrice,
      finalPrice,
      coupon: appliedCoupon,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Error calculando precio" },
      { status: 500 }
    );
  }
}