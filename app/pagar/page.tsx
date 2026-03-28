"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";

type QuoteResponse = {
  ok?: boolean;
  error?: string;
  itemType?: string;
  planCode?: string;
  basePrice?: number;
  finalPrice?: number;
  coupon?: {
    id: string;
    code: string;
    discount_type: string;
    discount_value: number;
  } | null;
};

type ItemType = "listing" | "classified" | "job" | "meal";
type PlanType = "STANDARD" | "FEATURED" | "URGENT" | "PETROL";

function normalizeItemType(value: string | null): ItemType {
  const v = String(value || "").toLowerCase().trim();

  if (v === "classified") return "classified";
  if (v === "job") return "job";
  if (v === "meal") return "meal";
  return "listing";
}

function normalizePlan(value: string | null): PlanType {
  const v = String(value || "").toUpperCase().trim();

  if (v === "FEATURED") return "FEATURED";
  if (v === "URGENT") return "URGENT";
  if (v === "PETROL") return "PETROL";
  return "STANDARD";
}

function planToPlanCode(plan: PlanType): string {
  if (plan === "FEATURED") return "featured";
  if (plan === "URGENT") return "urgent";
  if (plan === "PETROL") return "petrol";
  return "normal";
}

function planLabel(plan: PlanType): string {
  if (plan === "FEATURED") return "Destacado";
  if (plan === "URGENT") return "Urgente";
  if (plan === "PETROL") return "Prioridad petrolera";
  return "Normal";
}

function itemTypeLabel(itemType: ItemType): string {
  if (itemType === "classified") return "Clasificado";
  if (itemType === "job") return "Trabajo";
  if (itemType === "meal") return "Vianda";
  return "Inmueble";
}

function backHref(itemType: ItemType, itemId: string) {
  if (!itemId) return "/";
  if (itemType === "classified") return `/mis-clasificados/${itemId}`;
  if (itemType === "job") return `/mis-empleos/${itemId}`;
  if (itemType === "meal") return `/mis-viandas/${itemId}`;
  return `/mis-anuncios/${itemId}`;
}

export default function PagarPage() {
  const [params, setParams] = useState<URLSearchParams | null>(null);

  useEffect(() => {
    setParams(new URLSearchParams(window.location.search));
  }, []);

  const rawItemId = params?.get("itemId") || params?.get("id") || "";
  const rawItemType = params?.get("itemType") || params?.get("type") || "listing";
  const rawTitle = params?.get("title") || "Publicación";
  const rawPlan = params?.get("plan") || "STANDARD";
  const rawCoupon = params?.get("coupon") || "";
  const rawAmount = Number(params?.get("amount") || 0);

  const itemId = rawItemId;
  const itemType = normalizeItemType(rawItemType);
  const plan = normalizePlan(rawPlan);

  const featured =
    params?.get("featured") === "true" ||
    params?.get("featured") === "1" ||
    plan === "FEATURED";

  const urgent =
    params?.get("urgent") === "true" ||
    params?.get("urgent") === "1" ||
    plan === "URGENT";

  const petrol =
    params?.get("petrol") === "true" ||
    params?.get("petrol") === "1" ||
    plan === "PETROL";

  const [couponCode, setCouponCode] = useState(rawCoupon);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [msg, setMsg] = useState("");
  const [basePrice, setBasePrice] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);
  const [couponInfo, setCouponInfo] = useState<QuoteResponse["coupon"]>(null);

  useEffect(() => {
    setCouponCode(rawCoupon);
  }, [rawCoupon]);

  const planCode = useMemo(() => planToPlanCode(plan), [plan]);
  const goBackHref = useMemo(() => backHref(itemType, itemId), [itemType, itemId]);

  useEffect(() => {
    if (!params) return;

    const quote = async () => {
      try {
        setLoading(true);
        setMsg("");

        if (!itemId || !itemType) {
          setMsg("Faltan datos para iniciar el pago.");
          return;
        }

        if (rawAmount > 0) {
          let nextFinal = rawAmount;

          if (couponCode.trim()) {
            const res = await fetch("/api/pricing/quote", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                itemType,
                planCode,
                couponCode,
              }),
            });

            const data: QuoteResponse = await res.json();

            if (res.ok) {
              setCouponInfo(data.coupon || null);
              nextFinal =
                data.finalPrice !== undefined && data.finalPrice !== null
                  ? Number(data.finalPrice)
                  : rawAmount;
            }
          }

          setBasePrice(rawAmount);
          setFinalPrice(nextFinal);
          return;
        }

        const res = await fetch("/api/pricing/quote", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            itemType,
            planCode,
            couponCode,
          }),
        });

        const data: QuoteResponse = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "No se pudo calcular el precio");
        }

        setBasePrice(Number(data.basePrice || 0));
        setFinalPrice(
          data.finalPrice !== undefined && data.finalPrice !== null
            ? Number(data.finalPrice)
            : 0
        );
        setCouponInfo(data.coupon || null);
      } catch (e: any) {
        setMsg(e?.message || "Error calculando precio");
      } finally {
        setLoading(false);
      }
    };

    quote();
  }, [params, itemId, itemType, planCode, couponCode, rawAmount]);

  const aplicarCupon = async () => {
    try {
      setLoading(true);
      setMsg("");

      const res = await fetch("/api/pricing/quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemType,
          planCode,
          couponCode,
        }),
      });

      const data: QuoteResponse = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo aplicar el cupón");
      }

      setBasePrice(rawAmount > 0 ? rawAmount : Number(data.basePrice || 0));
      setFinalPrice(Number(data.finalPrice || 0));
      setCouponInfo(data.coupon || null);

      if (!data.coupon && couponCode.trim()) {
        setMsg("Cupón no válido o no aplicable.");
      }
    } catch (e: any) {
      setMsg(e?.message || "Error aplicando cupón");
    } finally {
      setLoading(false);
    }
  };

  const continuar = async () => {
    try {
      setProcessing(true);
      setMsg("");

      if (finalPrice <= 0) {
        const res = await fetch("/api/payments/free-publish", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            itemId,
            itemType,
            title: rawTitle,
            plan,
            featured,
            urgent,
            petrol,
            couponCode: couponInfo?.code || couponCode || null,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "No se pudo publicar gratis");
        }

        window.location.href = data.redirectTo || "/";
        return;
      }

      const res = await fetch("/api/mp/create-preference", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId,
          itemType,
          title: rawTitle,
          price: finalPrice,
          plan,
          featured,
          urgent,
          petrol,
          couponCode: couponInfo?.code || couponCode || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Error creando preferencia de pago");
      }

      if (!data?.init_point) {
        throw new Error("MercadoPago no devolvió init_point");
      }

      window.location.href = data.init_point;
    } catch (e: any) {
      setMsg(e?.message || "Error continuando al pago");
    } finally {
      setProcessing(false);
    }
  };

  if (!params) {
    return null;
  }

  if (!itemId || !itemType) {
    return (
      <main style={{ padding: 40, fontFamily: "system-ui" }}>
        <h1>Error</h1>
        <p>Faltan datos para iniciar el pago.</p>
      </main>
    );
  }

  return (
    <main
      style={{
        maxWidth: 700,
        margin: "0 auto",
        padding: 40,
        fontFamily: "system-ui",
      }}
    >
      <a
        href={goBackHref}
        style={{
          textDecoration: "none",
          color: "#2563eb",
          fontWeight: 700,
        }}
      >
        ← Volver a editar
      </a>

      <h1 style={{ marginTop: 20 }}>Confirmar pago</h1>

      <div
        style={{
          marginTop: 20,
          background: "white",
          border: "1px solid #eee",
          borderRadius: 16,
          padding: 20,
        }}
      >
        <div style={{ fontSize: 14, opacity: 0.7 }}>Publicación</div>
        <div style={{ marginTop: 6, fontSize: 24, fontWeight: 900 }}>
          {rawTitle}
        </div>

        <div style={{ marginTop: 16, fontSize: 14, opacity: 0.7 }}>Tipo</div>
        <div style={{ marginTop: 6, fontWeight: 700 }}>
          {itemTypeLabel(itemType)}
        </div>

        <div style={{ marginTop: 16, fontSize: 14, opacity: 0.7 }}>
          Modalidad
        </div>
        <div style={{ marginTop: 6, fontWeight: 700 }}>
          {planLabel(plan)}
        </div>

        {(featured || urgent || petrol) && (
          <div
            style={{
              marginTop: 12,
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {featured && <Badge bg="#f59e0b" text="⭐ Destacado" />}
            {urgent && <Badge bg="#dc2626" text="🔴 Urgente" />}
            {petrol && <Badge bg="#f97316" text="🛢 Prioridad petrolera" />}
          </div>
        )}

        <div style={{ marginTop: 24 }}>
          <label style={{ display: "block", fontWeight: 700 }}>
            Cupón de descuento
          </label>

          <div
            style={{
              marginTop: 10,
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Ej: VACA10"
              style={{
                flex: 1,
                minWidth: 220,
                padding: 12,
                borderRadius: 10,
                border: "1px solid #ddd",
              }}
            />

            <button
              type="button"
              onClick={aplicarCupon}
              disabled={loading || processing}
              style={{
                padding: "12px 16px",
                borderRadius: 10,
                border: "none",
                background: "#111",
                color: "white",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Aplicar cupón
            </button>
          </div>
        </div>

        <div
          style={{
            marginTop: 24,
            padding: 16,
            borderRadius: 12,
            background: "#fafafa",
            border: "1px solid #eee",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Precio base</span>
            <strong>{basePrice} ARS</strong>
          </div>

          {couponInfo && (
            <div
              style={{
                marginTop: 10,
                display: "flex",
                justifyContent: "space-between",
                color: "#2e7d32",
                fontWeight: 700,
              }}
            >
              <span>Cupón aplicado: {couponInfo.code}</span>
              <span>
                {couponInfo.discount_type === "free"
                  ? "Gratis"
                  : couponInfo.discount_type === "percent"
                  ? `${couponInfo.discount_value}%`
                  : `${couponInfo.discount_value} ARS`}
              </span>
            </div>
          )}

          <div
            style={{
              marginTop: 14,
              paddingTop: 14,
              borderTop: "1px solid #eee",
              display: "flex",
              justifyContent: "space-between",
              fontSize: 22,
              fontWeight: 900,
            }}
          >
            <span>Total</span>
            <span>{finalPrice} ARS</span>
          </div>
        </div>

        {msg && (
          <div
            style={{
              marginTop: 14,
              color: "#c62828",
              fontWeight: 700,
            }}
          >
            {msg}
          </div>
        )}

        <div
          style={{
            marginTop: 16,
            color: "#64748B",
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          {finalPrice === 0
            ? "Como el total quedó en 0 ARS, la publicación se activará directamente sin pasar por MercadoPago."
            : "Al pagar, volverás al sitio con el estado del pago y tu publicación se activará automáticamente cuando MercadoPago lo confirme."}
        </div>

        {!loading && (
          <button
            type="button"
            onClick={continuar}
            disabled={processing}
            style={{
              marginTop: 18,
              width: "100%",
              padding: "14px 16px",
              borderRadius: 12,
              border: "none",
              background: finalPrice === 0 ? "#16a34a" : "#009ee3",
              color: "white",
              fontWeight: 900,
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            {processing
              ? "Procesando..."
              : finalPrice === 0
              ? "Publicar gratis"
              : "Pagar con MercadoPago"}
          </button>
        )}
      </div>
    </main>
  );
}

function Badge({ bg, text }: { bg: string; text: string }) {
  return (
    <span
      style={{
        background: bg,
        color: "white",
        borderRadius: 999,
        padding: "6px 10px",
        fontSize: 12,
        fontWeight: 800,
      }}
    >
      {text}
    </span>
  );
}