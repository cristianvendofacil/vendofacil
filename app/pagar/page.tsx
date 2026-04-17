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

type ItemType = "listing" | "classified" | "job" | "meal" | "verification";
type PlanType =
  | "STANDARD"
  | "FEATURED"
  | "URGENT"
  | "PETROL"
  | "PERSON"
  | "BUSINESS";

type PlanAvailabilityMap = Partial<Record<PlanType, boolean>>;

function normalizeItemType(value: string | null): ItemType {
  const v = String(value || "").toLowerCase().trim();

  if (v === "classified") return "classified";
  if (v === "job") return "job";
  if (v === "meal") return "meal";
  if (v === "verification") return "verification";
  return "listing";
}

function normalizePlan(value: string | null): PlanType {
  const v = String(value || "").toUpperCase().trim();

  if (v === "FEATURED") return "FEATURED";
  if (v === "URGENT") return "URGENT";
  if (v === "PETROL") return "PETROL";
  if (v === "PERSON") return "PERSON";
  if (v === "BUSINESS") return "BUSINESS";
  return "STANDARD";
}

function planToPlanCode(plan: PlanType): string {
  if (plan === "FEATURED") return "featured";
  if (plan === "URGENT") return "urgent";
  if (plan === "PETROL") return "petrol";
  if (plan === "PERSON") return "person";
  if (plan === "BUSINESS") return "business";
  return "normal";
}

function planLabel(plan: PlanType): string {
  if (plan === "FEATURED") return "Destacado";
  if (plan === "URGENT") return "Urgente";
  if (plan === "PETROL") return "Prioridad petrolera";
  if (plan === "PERSON") return "Perfil verificado";
  if (plan === "BUSINESS") return "Negocio verificado";
  return "Normal";
}

function itemTypeLabel(itemType: ItemType): string {
  if (itemType === "classified") return "Clasificado";
  if (itemType === "job") return "Trabajo";
  if (itemType === "meal") return "Vianda";
  if (itemType === "verification") return "Verificación";
  return "Inmueble";
}

function backHref(itemType: ItemType, itemId: string) {
  if (!itemId) return "/";
  if (itemType === "classified") return `/mis-clasificados/${itemId}`;
  if (itemType === "job") return `/mis-empleos/${itemId}`;
  if (itemType === "meal") return `/mis-viandas/${itemId}`;
  if (itemType === "verification") return `/verificacion`;
  return `/mis-anuncios/${itemId}`;
}

function getPlanStyle(plan: PlanType) {
  if (plan === "URGENT") {
    return {
      border: "2px solid #dc2626",
      headerBg: "linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)",
      accent: "#dc2626",
      softBg: "#fef2f2",
      badgeBg: "#991b1b",
    };
  }

  if (plan === "FEATURED") {
    return {
      border: "2px solid #f59e0b",
      headerBg: "linear-gradient(135deg, #78350f 0%, #f59e0b 100%)",
      accent: "#d97706",
      softBg: "#fffbeb",
      badgeBg: "#92400e",
    };
  }

  if (plan === "PETROL") {
    return {
      border: "2px solid #f97316",
      headerBg: "linear-gradient(135deg, #7c2d12 0%, #f97316 100%)",
      accent: "#ea580c",
      softBg: "#fff7ed",
      badgeBg: "#9a3412",
    };
  }

  if (plan === "BUSINESS") {
    return {
      border: "2px solid #0f172a",
      headerBg: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
      accent: "#0f172a",
      softBg: "#f8fafc",
      badgeBg: "#1e293b",
    };
  }

  if (plan === "PERSON") {
    return {
      border: "2px solid #16a34a",
      headerBg: "linear-gradient(135deg, #166534 0%, #16a34a 100%)",
      accent: "#15803d",
      softBg: "#f0fdf4",
      badgeBg: "#166534",
    };
  }

  return {
    border: "1px solid #e5e7eb",
    headerBg: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
    accent: "#0f172a",
    softBg: "#f8fafc",
    badgeBg: "#334155",
  };
}

function getPlanBenefits(plan: PlanType, itemType: ItemType) {
  const typeLabel = itemTypeLabel(itemType).toLowerCase();

  if (plan === "URGENT") {
    return [
      `Aparece primero entre los ${typeLabel}s de su sección`,
      "Gana máxima atención visual frente a publicaciones normales",
      "Tiene prioridad alta para generar contactos más rápido",
      "Ideal cuando necesitás resolver ya",
    ];
  }

  if (plan === "FEATURED") {
    return [
      `Sube posiciones dentro de la sección de ${typeLabel}s`,
      "Mayor presencia visual frente a publicaciones normales",
      "Puede tener exposición extra en portada",
      "Se percibe más fuerte y profesional",
    ];
  }

  if (plan === "PETROL") {
    return [
      "Máxima visibilidad en el contexto energético de Vaca Muerta",
      "Prioridad premium para anuncios clave de la zona",
      "Mayor valor comercial frente a publicaciones comunes",
      "Ideal para propiedades o servicios estratégicos",
    ];
  }

  if (plan === "BUSINESS") {
    return [
      "Tu perfil se ve más serio y confiable",
      "Mejora la percepción de marca o negocio",
      "Aumenta la confianza del usuario al contactarte",
      "Pensado para operar con imagen profesional",
    ];
  }

  if (plan === "PERSON") {
    return [
      "Tu perfil gana confianza frente a otros usuarios",
      "Mayor seguridad para quien ve tu publicación",
      "Ayuda a generar más credibilidad",
      "Ideal si querés diferenciarte del resto",
    ];
  }

  return [
    `Tu ${typeLabel} se publica con visibilidad normal`,
    "Compite contra anuncios con más prioridad",
    "No recibe empuje visual premium",
    "Es la opción básica para estar publicado",
  ];
}

function getAvailablePlans(itemType: ItemType): PlanType[] {
  if (itemType === "verification") {
    return ["PERSON", "BUSINESS"];
  }

  return ["STANDARD", "FEATURED", "URGENT", "PETROL"];
}

export default function PagarPage() {
  const [params, setParams] = useState<URLSearchParams | null>(null);

  useEffect(() => {
    setParams(new URLSearchParams(window.location.search));
  }, []);

  const rawItemId = params?.get("itemId") || params?.get("id") || "";
  const rawItemType =
    params?.get("itemType") || params?.get("type") || "listing";
  const rawTitle =
    params?.get("title") ||
    (rawItemType === "verification" ? "Verificación" : "Publicación");
  const rawPlan = params?.get("plan") || "STANDARD";
  const rawCoupon = params?.get("coupon") || "";

  const itemId = rawItemId;
  const itemType = normalizeItemType(rawItemType);

  const [selectedPlan, setSelectedPlan] = useState<PlanType>(normalizePlan(rawPlan));
  const [couponCode, setCouponCode] = useState(rawCoupon);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [msg, setMsg] = useState("");
  const [basePrice, setBasePrice] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);
  const [couponInfo, setCouponInfo] = useState<QuoteResponse["coupon"]>(null);
  const [planAvailability, setPlanAvailability] = useState<PlanAvailabilityMap>({});
  const [checkingPlans, setCheckingPlans] = useState(true);

  useEffect(() => {
    setSelectedPlan(normalizePlan(rawPlan));
  }, [rawPlan]);

  useEffect(() => {
    setCouponCode(rawCoupon);
  }, [rawCoupon]);

  const availablePlans = useMemo(() => getAvailablePlans(itemType), [itemType]);
  const planCode = useMemo(() => planToPlanCode(selectedPlan), [selectedPlan]);
  const goBackHref = useMemo(() => backHref(itemType, itemId), [itemType, itemId]);
  const planStyle = useMemo(() => getPlanStyle(selectedPlan), [selectedPlan]);
  const benefits = useMemo(() => getPlanBenefits(selectedPlan, itemType), [selectedPlan, itemType]);

  const featured = selectedPlan === "FEATURED";
  const urgent = selectedPlan === "URGENT";
  const petrol = selectedPlan === "PETROL";

  useEffect(() => {
    if (!params) return;

    const checkPlans = async () => {
      try {
        setCheckingPlans(true);

        const results = await Promise.all(
          availablePlans.map(async (planOption) => {
            const res = await fetch("/api/pricing/quote", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                itemType,
                planCode: planToPlanCode(planOption),
              }),
            });

            if (!res.ok) {
              return { plan: planOption, enabled: false };
            }

            const data: QuoteResponse = await res.json();

            const enabled =
              data &&
              data.basePrice !== undefined &&
              data.basePrice !== null &&
              !Number.isNaN(Number(data.basePrice));

            return { plan: planOption, enabled };
          })
        );

        const nextMap: PlanAvailabilityMap = {};
        for (const result of results) {
          nextMap[result.plan] = result.enabled;
        }

        setPlanAvailability(nextMap);

        const currentEnabled = nextMap[selectedPlan];
        if (!currentEnabled) {
          const firstEnabled = availablePlans.find((p) => nextMap[p]);
          if (firstEnabled) {
            setSelectedPlan(firstEnabled);
          }
        }
      } catch {
        const fallbackMap: PlanAvailabilityMap = {};
        for (const p of availablePlans) {
          fallbackMap[p] = p !== "PETROL";
        }
        setPlanAvailability(fallbackMap);

        if (!fallbackMap[selectedPlan]) {
          const firstEnabled = availablePlans.find((p) => fallbackMap[p]);
          if (firstEnabled) {
            setSelectedPlan(firstEnabled);
          }
        }
      } finally {
        setCheckingPlans(false);
      }
    };

    void checkPlans();
  }, [params, itemType]);

  useEffect(() => {
    if (!params || checkingPlans) return;

    const quote = async () => {
      try {
        setLoading(true);
        setMsg("");

        if (!itemId && itemType !== "verification") {
          setMsg("Faltan datos para iniciar el pago.");
          setBasePrice(0);
          setFinalPrice(0);
          return;
        }

        if (!planAvailability[selectedPlan]) {
          setBasePrice(0);
          setFinalPrice(0);
          setCouponInfo(null);
          setMsg("Ese plan no está disponible actualmente para esta categoría.");
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
        setBasePrice(0);
        setFinalPrice(0);
        setCouponInfo(null);
        setMsg(e?.message || "Error calculando precio");
      } finally {
        setLoading(false);
      }
    };

    void quote();
  }, [params, itemId, itemType, planCode, couponCode, checkingPlans, selectedPlan, planAvailability]);

  const aplicarCupon = async () => {
    try {
      if (itemType === "verification") {
        setMsg("Los cupones para verificación todavía no están habilitados.");
        return;
      }

      if (!planAvailability[selectedPlan]) {
        setMsg("Ese plan no está disponible actualmente para esta categoría.");
        return;
      }

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

      setBasePrice(Number(data.basePrice || 0));
      setFinalPrice(
        data.finalPrice !== undefined && data.finalPrice !== null
          ? Number(data.finalPrice)
          : 0
      );
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

      if (!planAvailability[selectedPlan]) {
        throw new Error("Ese plan no está disponible actualmente para esta categoría.");
      }

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
            plan: selectedPlan,
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
          plan: selectedPlan,
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

  if (!itemId && itemType !== "verification") {
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
        maxWidth: 1080,
        margin: "0 auto",
        padding: "36px 20px 50px",
        fontFamily: "system-ui",
        background: "#f8f7f3",
      }}
    >
      <a
        href={goBackHref}
        style={{
          textDecoration: "none",
          color: "#2563eb",
          fontWeight: 800,
        }}
      >
        ← Volver a editar
      </a>

      <div
        style={{
          marginTop: 20,
          display: "grid",
          gridTemplateColumns: "1.05fr 0.95fr",
          gap: 22,
          alignItems: "start",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: planStyle.softBg,
              color: planStyle.accent,
              border: `1px solid ${planStyle.accent}33`,
              padding: "8px 12px",
              borderRadius: 999,
              fontWeight: 900,
              fontSize: 12,
              letterSpacing: "0.03em",
              textTransform: "uppercase",
            }}
          >
            Confirmar plan
          </div>

          <h1
            style={{
              marginTop: 16,
              marginBottom: 0,
              fontSize: 44,
              lineHeight: 1.04,
              fontWeight: 950,
              letterSpacing: "-0.03em",
              color: "#0f172a",
            }}
          >
            Estás a un paso de darle más visibilidad a tu publicación
          </h1>

          <p
            style={{
              marginTop: 14,
              color: "#64748b",
              fontSize: 18,
              lineHeight: 1.7,
              maxWidth: 720,
            }}
          >
            Esta elección define qué tan arriba aparece tu publicación, cuánto destaca frente al resto
            y qué tan fácil será que te contacten.
          </p>

          <div
            style={{
              marginTop: 18,
              background: "white",
              borderRadius: 22,
              border: planStyle.border,
              overflow: "hidden",
              boxShadow: "0 14px 36px rgba(15,23,42,0.08)",
            }}
          >
            <div
              style={{
                background: planStyle.headerBg,
                color: "white",
                padding: 22,
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "rgba(255,255,255,0.14)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 999,
                  padding: "7px 12px",
                  fontWeight: 900,
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                {planLabel(selectedPlan)}
              </div>

              <div
                style={{
                  marginTop: 16,
                  fontSize: 30,
                  fontWeight: 950,
                  lineHeight: 1.08,
                  letterSpacing: "-0.02em",
                }}
              >
                {rawTitle}
              </div>

              <div
                style={{
                  marginTop: 10,
                  color: "rgba(255,255,255,0.84)",
                  fontWeight: 700,
                }}
              >
                {itemType === "verification" ? "Solicitud" : "Publicación"} · {itemTypeLabel(itemType)}
              </div>

              {(featured || urgent || petrol) && (
                <div
                  style={{
                    marginTop: 16,
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  {featured && <Badge bg="#92400e" text="⭐ Destacado" />}
                  {urgent && <Badge bg="#991b1b" text="🔴 Urgente" />}
                  {petrol && <Badge bg="#9a3412" text="🛢 Prioridad petrolera" />}
                </div>
              )}
            </div>

            <div style={{ padding: 22 }}>
              <div
                style={{
                  fontSize: 14,
                  color: "#64748b",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                Qué obtenés con este plan
              </div>

              <div
                style={{
                  marginTop: 14,
                  display: "grid",
                  gap: 10,
                }}
              >
                {benefits.map((benefit) => (
                  <BenefitRow key={benefit} text={benefit} />
                ))}
              </div>

              {selectedPlan === "STANDARD" && (
                <div
                  style={{
                    marginTop: 18,
                    padding: 14,
                    borderRadius: 14,
                    background: "#fff7ed",
                    border: "1px solid #fdba74",
                    color: "#9a3412",
                    fontWeight: 700,
                    lineHeight: 1.55,
                  }}
                >
                  Con el plan normal tu publicación queda activa, pero compite por debajo de avisos
                  urgentes, destacados o con prioridad petrolera.
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div
            style={{
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: 22,
              padding: 22,
              boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
            }}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: 950,
                color: "#0f172a",
              }}
            >
              Resumen del pago
            </div>

            <div style={{ marginTop: 18, fontSize: 14, color: "#64748b" }}>
              Tipo
            </div>
            <div style={{ marginTop: 6, fontWeight: 800, color: "#0f172a" }}>
              {itemTypeLabel(itemType)}
            </div>

            <div style={{ marginTop: 16, fontSize: 14, color: "#64748b" }}>
              Modalidad
            </div>
            <div style={{ marginTop: 6, fontWeight: 800, color: planStyle.accent }}>
              {planLabel(selectedPlan)}
            </div>

            <div
              style={{
                marginTop: 22,
                padding: 16,
                borderRadius: 16,
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 900,
                  color: "#0f172a",
                }}
              >
                Mejorar visibilidad
              </div>

              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                {availablePlans.map((planOption) => {
                  const active = selectedPlan === planOption;
                  const enabled = !!planAvailability[planOption];

                  return (
                    <button
                      key={planOption}
                      type="button"
                      onClick={() => {
                        if (!enabled) return;
                        setSelectedPlan(planOption);
                      }}
                      disabled={!enabled || loading || processing || checkingPlans}
                      title={
                        enabled
                          ? `Cambiar a ${planLabel(planOption)}`
                          : `${planLabel(planOption)} no disponible actualmente`
                      }
                      style={{
                        padding: "10px 14px",
                        borderRadius: 12,
                        border: active
                          ? "2px solid #f97316"
                          : enabled
                          ? "1px solid #ddd"
                          : "1px solid #d1d5db",
                        background: active
                          ? "#fff7ed"
                          : enabled
                          ? "white"
                          : "#f3f4f6",
                        color: enabled ? "#0f172a" : "#9ca3af",
                        fontWeight: 800,
                        cursor: enabled ? "pointer" : "not-allowed",
                        opacity: enabled ? 1 : 0.75,
                      }}
                    >
                      {planLabel(planOption)}
                      {!enabled ? " · No disponible" : ""}
                    </button>
                  );
                })}
              </div>

              <div
                style={{
                  marginTop: 10,
                  fontSize: 13,
                  color: "#64748b",
                  lineHeight: 1.5,
                }}
              >
                Cambiar el plan actual actualiza automáticamente el precio, los beneficios y el total.
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <label style={{ display: "block", fontWeight: 800, color: "#0f172a" }}>
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
                  disabled={itemType === "verification"}
                  style={{
                    flex: 1,
                    minWidth: 220,
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid #ddd",
                    background: itemType === "verification" ? "#f3f4f6" : "white",
                  }}
                />

                <button
                  type="button"
                  onClick={aplicarCupon}
                  disabled={loading || processing || itemType === "verification" || checkingPlans}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: "none",
                    background: "#111827",
                    color: "white",
                    fontWeight: 900,
                    cursor: itemType === "verification" ? "not-allowed" : "pointer",
                    opacity: itemType === "verification" ? 0.6 : 1,
                  }}
                >
                  Aplicar
                </button>
              </div>
            </div>

            <div
              style={{
                marginTop: 24,
                padding: 16,
                borderRadius: 16,
                background: "#fafafa",
                border: "1px solid #eee",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                <span style={{ color: "#64748b" }}>Precio base</span>
                <strong>{basePrice} ARS</strong>
              </div>

              {couponInfo && (
                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 16,
                    color: "#15803d",
                    fontWeight: 800,
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
                  borderTop: "1px solid #e5e7eb",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "end",
                  gap: 16,
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 800 }}>Total</span>
                <span
                  style={{
                    fontSize: 28,
                    fontWeight: 950,
                    color: finalPrice === 0 ? "#16a34a" : "#0f172a",
                  }}
                >
                  {finalPrice} ARS
                </span>
              </div>
            </div>

            {msg && (
              <div
                style={{
                  marginTop: 14,
                  color: "#c62828",
                  fontWeight: 700,
                  lineHeight: 1.5,
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
                lineHeight: 1.7,
              }}
            >
              {finalPrice === 0
                ? "Como el total quedó en 0 ARS, la solicitud se activará directamente sin pasar por MercadoPago."
                : "Al pagar, volverás al sitio con el estado del pago y tu solicitud se procesará automáticamente cuando MercadoPago lo confirme."}
            </div>

            {!loading && !checkingPlans && (
              <button
                type="button"
                onClick={continuar}
                disabled={processing || !planAvailability[selectedPlan]}
                style={{
                  marginTop: 18,
                  width: "100%",
                  padding: "15px 16px",
                  borderRadius: 14,
                  border: "none",
                  background: finalPrice === 0 ? "#16a34a" : "#009ee3",
                  color: "white",
                  fontWeight: 950,
                  fontSize: 16,
                  cursor: !planAvailability[selectedPlan] ? "not-allowed" : "pointer",
                  opacity: !planAvailability[selectedPlan] ? 0.6 : 1,
                  boxShadow:
                    finalPrice === 0
                      ? "0 12px 24px rgba(22,163,74,0.18)"
                      : "0 12px 24px rgba(0,158,227,0.18)",
                }}
              >
                {processing
                  ? "Procesando..."
                  : finalPrice === 0
                  ? "Activar gratis"
                  : "Pagar con MercadoPago"}
              </button>
            )}
          </div>

          <div
            style={{
              marginTop: 16,
              background: "#fff7ed",
              border: "1px solid #fdba74",
              borderRadius: 18,
              padding: 18,
            }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 900,
                color: "#9a3412",
              }}
            >
              ¿Por qué pagar más visibilidad?
            </div>

            <div
              style={{
                marginTop: 10,
                color: "#9a3412",
                lineHeight: 1.65,
                fontSize: 14,
              }}
            >
              En VendoFácil, los anuncios con mejor plan aparecen más arriba, se ven mejor
              y captan más atención que las publicaciones normales. Si querés vender o alquilar
              más rápido, la visibilidad importa.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function BenefitRow({ text }: { text: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        color: "#334155",
        lineHeight: 1.6,
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: 999,
          background: "#ecfdf5",
          color: "#15803d",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 900,
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        ✓
      </span>
      <span>{text}</span>
    </div>
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