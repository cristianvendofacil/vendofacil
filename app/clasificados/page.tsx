"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Classified = {
  id: string;
  title: string | null;
  town: string | null;
  description: string | null;
  price: number | null;
  currency: string | null;
  featured_until: string | null;
  urgent_until: string | null;
  petrol_priority: boolean | null;
  petrol_priority_until: string | null;
  views: number | null;
  created_at: string | null;
};

export default function ClasificadosPage() {
  const [items, setItems] = useState<Classified[]>([]);
  const [msg, setMsg] = useState("Cargando...");

  useEffect(() => {
    const load = async () => {
      try {
        setMsg("Cargando...");
        const supabase = supabaseBrowser();

        const { data, error } = await supabase
          .from("classifieds")
          .select(
            "id,title,town,description,price,currency,featured_until,urgent_until,petrol_priority,petrol_priority_until,views,created_at"
          )
          .eq("status", "PUBLISHED")
          .order("created_at", { ascending: false });

        if (error) throw error;

        const rows = (data ?? []) as Classified[];
        const now = Date.now();

        const sorted = [...rows].sort((a, b) => {
          const aPetrol =
            a.petrol_priority === true &&
            !!a.petrol_priority_until &&
            new Date(a.petrol_priority_until).getTime() > now;

          const bPetrol =
            b.petrol_priority === true &&
            !!b.petrol_priority_until &&
            new Date(b.petrol_priority_until).getTime() > now;

          if (aPetrol !== bPetrol) return aPetrol ? -1 : 1;

          const aUrgent =
            !!a.urgent_until && new Date(a.urgent_until).getTime() > now;
          const bUrgent =
            !!b.urgent_until && new Date(b.urgent_until).getTime() > now;

          if (aUrgent !== bUrgent) return aUrgent ? -1 : 1;

          const aFeatured =
            !!a.featured_until && new Date(a.featured_until).getTime() > now;
          const bFeatured =
            !!b.featured_until && new Date(b.featured_until).getTime() > now;

          if (aFeatured !== bFeatured) return aFeatured ? -1 : 1;

          const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;

          return bCreated - aCreated;
        });

        setItems(sorted);
        setMsg(sorted.length ? "" : "No hay clasificados publicados.");
      } catch (e: any) {
        setItems([]);
        setMsg(e?.message || "Error cargando clasificados");
      }
    };

    load();
  }, []);

  const summary = useMemo(() => {
    const now = Date.now();

    const petrol = items.filter(
      (x) =>
        x.petrol_priority === true &&
        !!x.petrol_priority_until &&
        new Date(x.petrol_priority_until).getTime() > now
    ).length;

    const urgent = items.filter(
      (x) => !!x.urgent_until && new Date(x.urgent_until).getTime() > now
    ).length;

    const featured = items.filter(
      (x) => !!x.featured_until && new Date(x.featured_until).getTime() > now
    ).length;

    return { petrol, urgent, featured };
  }, [items]);

  return (
    <main
      style={{
        maxWidth: 1240,
        margin: "0 auto",
        padding: "28px 20px 40px",
        fontFamily: "system-ui",
        background: "#F8F7F3",
      }}
    >
      <a
        href="/"
        style={{
          textDecoration: "none",
          color: "#2563EB",
          fontWeight: 800,
        }}
      >
        ← Volver
      </a>

      <section
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr",
          gap: 20,
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#FFF7ED",
              color: "#C2410C",
              border: "1px solid #FDBA74",
              padding: "8px 12px",
              borderRadius: 999,
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            📦 Clasificados
          </div>

          <h1
            style={{
              margin: "16px 0 0",
              fontSize: 46,
              lineHeight: 1.05,
              color: "#0F172A",
              fontWeight: 900,
              letterSpacing: "-0.02em",
            }}
          >
            Clasificados de la zona energética
          </h1>

          <p
            style={{
              marginTop: 12,
              color: "#64748B",
              fontSize: 18,
              maxWidth: 820,
              lineHeight: 1.6,
            }}
          >
            Vehículos, herramientas, maquinaria, artículos y oportunidades para
            Vaca Muerta y alrededores.
          </p>

          <div
            style={{
              marginTop: 18,
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <a
              href="/publicar?type=classified"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                background: "#F97316",
                color: "white",
                fontWeight: 900,
                padding: "12px 16px",
                borderRadius: 12,
                boxShadow: "0 10px 24px rgba(249,115,22,0.18)",
              }}
            >
              Publicar clasificado
            </a>

            <a
              href="/buscar?type=classified"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                border: "1px solid #CBD5E1",
                background: "white",
                color: "#0F172A",
                fontWeight: 800,
                padding: "12px 16px",
                borderRadius: 12,
              }}
            >
              Buscar clasificados
            </a>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 14,
          }}
        >
          <StatCard label="Publicaciones" value={items.length} />
          <StatCard label="Petroleras" value={summary.petrol} accent="#F97316" />
          <StatCard label="Urgentes" value={summary.urgent} accent="#DC2626" />
          <StatCard label="Destacadas" value={summary.featured} accent="#D97706" />
        </div>
      </section>

      {msg && (
        <p
          style={{
            marginTop: 20,
            color: "#334155",
            fontWeight: 700,
          }}
        >
          {msg}
        </p>
      )}

      <div
        style={{
          marginTop: 26,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(290px,1fr))",
          gap: 18,
        }}
      >
        {items.map((item) => {
          const now = Date.now();

          const isPetrol =
            item.petrol_priority === true &&
            !!item.petrol_priority_until &&
            new Date(item.petrol_priority_until).getTime() > now;

          const isUrgent =
            !!item.urgent_until &&
            new Date(item.urgent_until).getTime() > now;

          const isFeatured =
            !!item.featured_until &&
            new Date(item.featured_until).getTime() > now;

          return (
            <a
              key={item.id}
              href={`/clasificados/${item.id}`}
              style={{
                display: "block",
                textDecoration: "none",
                color: "#0F172A",
                background: "white",
                border: isPetrol
                  ? "2px solid #F97316"
                  : isUrgent
                  ? "2px solid #DC2626"
                  : isFeatured
                  ? "2px solid #F59E0B"
                  : "1px solid #E5E7EB",
                borderRadius: 18,
                overflow: "hidden",
                boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
              }}
            >
              <div
                style={{
                  minHeight: 150,
                  background: isPetrol
                    ? "linear-gradient(135deg, #7C2D12 0%, #F97316 100%)"
                    : isUrgent
                    ? "linear-gradient(135deg, #7F1D1D 0%, #DC2626 100%)"
                    : isFeatured
                    ? "linear-gradient(135deg, #78350F 0%, #F59E0B 100%)"
                    : "linear-gradient(135deg, #0F172A 0%, #334155 100%)",
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  {isPetrol && <Badge bg="#111827" text="🛢 PRIORIDAD PETROLERA" />}
                  {!isPetrol && isUrgent && <Badge bg="#991B1B" text="🔴 URGENTE" />}
                  {!isPetrol && !isUrgent && isFeatured && (
                    <Badge bg="#92400E" text="⭐ DESTACADO" />
                  )}
                </div>

                <div
                  style={{
                    color: "white",
                    fontWeight: 900,
                    fontSize: 24,
                    lineHeight: 1.08,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {item.title || "Sin título"}
                </div>
              </div>

              <div style={{ padding: 16 }}>
                <div
                  style={{
                    marginTop: 2,
                    color: "#64748B",
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  📍 {item.town || "Sin ciudad"}
                </div>

                {item.price !== null && (
                  <div
                    style={{
                      marginTop: 12,
                      color: "#0F172A",
                      fontWeight: 900,
                      fontSize: 24,
                    }}
                  >
                    {item.price} {item.currency || ""}
                  </div>
                )}

                {!!item.views && (
                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 13,
                      color: "#64748B",
                      fontWeight: 700,
                    }}
                  >
                    👁 {item.views} visitas
                  </div>
                )}

                {item.description && (
                  <div
                    style={{
                      marginTop: 12,
                      fontSize: 14,
                      color: "#475569",
                      lineHeight: 1.6,
                    }}
                  >
                    {item.description.slice(0, 110)}
                    {item.description.length > 110 ? "..." : ""}
                  </div>
                )}
              </div>
            </a>
          );
        })}
      </div>
    </main>
  );
}

function Badge({ bg, text }: { bg: string; text: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: bg,
        color: "white",
        fontWeight: 900,
        fontSize: 12,
        padding: "6px 10px",
        borderRadius: 999,
        letterSpacing: "0.02em",
      }}
    >
      {text}
    </span>
  );
}

function StatCard({
  label,
  value,
  accent = "#0F172A",
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #E5E7EB",
        borderRadius: 16,
        padding: 16,
        boxShadow: "0 8px 20px rgba(15,23,42,0.04)",
      }}
    >
      <div
        style={{
          color: "#64748B",
          fontSize: 14,
          fontWeight: 700,
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 8,
          color: accent,
          fontSize: 30,
          fontWeight: 900,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}