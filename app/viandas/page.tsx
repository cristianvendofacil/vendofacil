"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Meal = {
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
  availability?: string | null;
  available_date?: string | null;
  category?: string | null;
};

function formatCategoryLabel(value: string) {
  const map: Record<string, string> = {
    ASADO: "Asado",
    BEBIDAS: "Bebidas",
    CONDIMENTOS: "Condimentos",
    EMPANADAS: "Empanadas",
    FRUTOS_SECOS: "Frutos secos",
    HERBORISTERIA: "Herboristería",
    INTERNACIONAL: "Internacional",
    MILANESAS: "Milanesas",
    OTRA: "Otra",
    PANES_CASEROS: "Panes caseros",
    PARA_EL_MATE: "Para el mate",
    PASTAS: "Pastas",
    PIZZA: "Pizza",
    POLLO: "Pollo",
    POSTRES: "Postres",
    SALUDABLE: "Saludable",
    SANDWICHES: "Sandwiches",
    SIN_TACC: "Sin TACC",
    SUPLEMENTOS_DIETARIOS: "Suplementos dietarios",
    TORTAS_FRITAS: "Tortas fritas",
    TORTAS_Y_BUDINES: "Tortas y budines",
  };

  return map[value] || value;
}

export default function ViandasPage() {
  const [items, setItems] = useState<Meal[]>([]);
  const [msg, setMsg] = useState("Cargando...");
  const [selectedTown, setSelectedTown] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  useEffect(() => {
    const load = async () => {
      try {
        setMsg("Cargando...");
        const supabase = supabaseBrowser();

        const { data, error } = await supabase
          .from("meals")
          .select(
            "id,title,town,description,price,currency,featured_until,urgent_until,petrol_priority,petrol_priority_until,views,created_at,availability,available_date,category"
          )
          .eq("status", "PUBLISHED")
          .order("created_at", { ascending: false });

        if (error) throw error;

        const rows = (data ?? []) as Meal[];
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
        setMsg(sorted.length ? "" : "No hay viandas publicadas.");
      } catch (e: any) {
        setItems([]);
        setMsg(e?.message || "Error cargando viandas");
      }
    };

    load();
  }, []);

  const towns = useMemo(() => {
    const unique = Array.from(
      new Set(
        items
          .map((item) => item.town?.trim())
          .filter((town): town is string => !!town)
      )
    ).sort((a, b) => a.localeCompare(b));

    return ["ALL", ...unique];
  }, [items]);

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(
        items
          .map((item) => item.category?.trim())
          .filter((category): category is string => !!category)
      )
    ).sort((a, b) => formatCategoryLabel(a).localeCompare(formatCategoryLabel(b)));

    return ["ALL", ...unique];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const townOk = selectedTown === "ALL" || item.town === selectedTown;
      const categoryOk =
        selectedCategory === "ALL" || item.category === selectedCategory;

      return townOk && categoryOk;
    });
  }, [items, selectedTown, selectedCategory]);

  const grouped = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);

    const hoy: Meal[] = [];
    const proximos: Meal[] = [];
    const siempre: Meal[] = [];

    for (const item of filteredItems) {
      if (item.availability === "SIEMPRE") {
        siempre.push(item);
        continue;
      }

      if (item.available_date) {
        if (item.available_date === today) {
          hoy.push(item);
        } else if (item.available_date > today) {
          proximos.push(item);
        } else {
          proximos.push(item);
        }
      } else {
        siempre.push(item);
      }
    }

    proximos.sort((a, b) =>
      (a.available_date || "").localeCompare(b.available_date || "")
    );

    return { hoy, proximos, siempre };
  }, [filteredItems]);

  const destacados = useMemo(() => {
    const now = Date.now();

    const petrol: Meal[] = [];
    const urgent: Meal[] = [];
    const featured: Meal[] = [];

    for (const item of filteredItems) {
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

      if (isPetrol) {
        petrol.push(item);
      } else if (isUrgent) {
        urgent.push(item);
      } else if (isFeatured) {
        featured.push(item);
      }
    }

    return {
      petrol,
      urgent,
      featured,
      all: [...petrol, ...urgent, ...featured],
    };
  }, [filteredItems]);

  const summary = useMemo(() => {
    const now = Date.now();

    const petrol = filteredItems.filter(
      (x) =>
        x.petrol_priority === true &&
        !!x.petrol_priority_until &&
        new Date(x.petrol_priority_until).getTime() > now
    ).length;

    const urgent = filteredItems.filter(
      (x) => !!x.urgent_until && new Date(x.urgent_until).getTime() > now
    ).length;

    const featured = filteredItems.filter(
      (x) => !!x.featured_until && new Date(x.featured_until).getTime() > now
    ).length;

    return { petrol, urgent, featured };
  }, [filteredItems]);

  const renderItems = (list: Meal[]) => (
    <div
      style={{
        marginTop: 26,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(290px,1fr))",
        gap: 18,
      }}
    >
      {list.map((item) => {
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
            href={`/viandas/${item.id}`}
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
                  : "linear-gradient(135deg, #065F46 0%, #10B981 100%)",
                padding: 16,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <span>📍 {item.town || "Sin ciudad"}</span>
                {item.category && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      background: "#F1F5F9",
                      color: "#334155",
                      borderRadius: 999,
                      padding: "4px 8px",
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {formatCategoryLabel(item.category)}
                  </span>
                )}
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
  );

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
              background: "#ECFDF5",
              color: "#047857",
              border: "1px solid #6EE7B7",
              padding: "8px 12px",
              borderRadius: 999,
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            🍱 Viandas
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
            Viandas y comida casera en la zona energética
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
            Menús diarios, comida casera, delivery y opciones para trabajadores de
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
              href="/publicar?type=meal"
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
              Publicar vianda
            </a>

            <a
              href="/buscar?type=meal"
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
              Buscar viandas
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
          <StatCard label="Publicaciones" value={filteredItems.length} />
          <StatCard label="Petroleras" value={summary.petrol} accent="#F97316" />
          <StatCard label="Urgentes" value={summary.urgent} accent="#DC2626" />
          <StatCard label="Destacadas" value={summary.featured} accent="#D97706" />
        </div>
      </section>

      <section
        style={{
          marginTop: 22,
          display: "grid",
          gap: 14,
        }}
      >
        <div>
          <div
            style={{
              color: "#475569",
              fontWeight: 800,
              fontSize: 14,
              marginBottom: 10,
            }}
          >
            Filtrar por ciudad
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            {towns.map((town) => {
              const active = selectedTown === town;
              return (
                <button
                  key={town}
                  type="button"
                  onClick={() => setSelectedTown(town)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 999,
                    border: active ? "2px solid #F97316" : "1px solid #CBD5E1",
                    background: active ? "#FFF7ED" : "white",
                    color: active ? "#9A3412" : "#0F172A",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  {town === "ALL" ? "Todas" : town}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div
            style={{
              color: "#475569",
              fontWeight: 800,
              fontSize: 14,
              marginBottom: 10,
            }}
          >
            Filtrar por categoría
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            {categories.map((category) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 999,
                    border: active ? "2px solid #0EA5E9" : "1px solid #CBD5E1",
                    background: active ? "#EFF6FF" : "white",
                    color: active ? "#075985" : "#0F172A",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  {category === "ALL"
                    ? "Todas"
                    : formatCategoryLabel(category)}
                </button>
              );
            })}
          </div>
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

      {destacados.all.length > 0 && (
        <>
          <h2 style={{ marginTop: 30 }}>🔥 Destacados</h2>
          {renderItems(destacados.all)}
        </>
      )}

      {grouped.hoy.length > 0 && (
        <>
          <h2 style={{ marginTop: 30 }}>🔥 Hoy</h2>
          {renderItems(grouped.hoy)}
        </>
      )}

      {grouped.proximos.length > 0 && (
        <>
          <h2 style={{ marginTop: 30 }}>📅 Próximos días</h2>
          {renderItems(grouped.proximos)}
        </>
      )}

      {grouped.siempre.length > 0 && (
        <>
          <h2 style={{ marginTop: 30 }}>♾ Siempre disponibles</h2>
          {renderItems(grouped.siempre)}
        </>
      )}
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