"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Listing = {
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

export default function AnunciosPage() {
  const searchParams = useSearchParams();

  const [items, setItems] = useState<Listing[]>([]);
  const [msg, setMsg] = useState("Cargando...");
  const [selectedTown, setSelectedTown] = useState(searchParams.get("town") || "");
  const [userCity, setUserCity] = useState("");
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setMsg("Cargando...");
        const supabase = supabaseBrowser();

        const { data, error } = await supabase
          .from("listings")
          .select(
            "id,title,town,description,price,currency,featured_until,urgent_until,petrol_priority,petrol_priority_until,views,created_at"
          )
          .eq("status", "PUBLISHED")
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false });

        if (error) throw error;

        const rows = (data ?? []) as Listing[];
        const sorted = [...rows].sort((a, b) => getListingScore(b, selectedTown) - getListingScore(a, selectedTown));

        setItems(sorted);
        setMsg(sorted.length ? "" : "No hay anuncios publicados.");
      } catch (e: any) {
        setItems([]);
        setMsg(e?.message || "Error cargando anuncios");
      }
    };

    load();
  }, [selectedTown]);

  const summary = useMemo(() => {
    const now = Date.now();

    const petrol = items.filter((x) => isPetrolActive(x, now)).length;
    const urgent = items.filter((x) => isUrgentActive(x, now)).length;
    const featured = items.filter((x) => isFeaturedActive(x, now)).length;
    const local = selectedTown
      ? items.filter((x) => normalizeTown(x.town) === normalizeTown(selectedTown)).length
      : 0;

    return { petrol, urgent, featured, local };
  }, [items, selectedTown]);

  const detectNearestTown = () => {
    if (!navigator.geolocation) return;

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );

          const data = await response.json();
          const text =
            data?.address?.city ||
            data?.address?.town ||
            data?.address?.village ||
            data?.address?.state ||
            "";

          setUserCity(text);
          setSelectedTown(text);
        } catch {
          // silencioso
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
      }
    );
  };

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
            🏠 Inmuebles
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
            Inmuebles en la zona energética
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
            Alquileres, ventas, terrenos, oficinas y oportunidades destacadas en
            Vaca Muerta y alrededores.
          </p>

          <div
            style={{
              marginTop: 14,
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              onClick={detectNearestTown}
              style={{
                border: "1px solid #dbeafe",
                background: "#eff6ff",
                color: "#1d4ed8",
                borderRadius: 12,
                padding: "10px 14px",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {locating ? "Detectando ubicación..." : "Usar mi ubicación"}
            </button>

            {selectedTown && (
              <div
                style={{
                  fontSize: 14,
                  color: "#334155",
                  fontWeight: 700,
                }}
              >
                Prioridad local activa: <b>{selectedTown}</b>
              </div>
            )}

            {!selectedTown && userCity && (
              <div
                style={{
                  fontSize: 14,
                  color: "#334155",
                  fontWeight: 700,
                }}
              >
                Ubicación detectada: <b>{userCity}</b>
              </div>
            )}
          </div>

          <div
            style={{
              marginTop: 18,
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <a
              href="/publicar?type=listing"
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
              Publicar inmueble
            </a>

            <a
              href="/buscar?type=listing"
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
              Buscar inmuebles
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
          <StatCard
            label={selectedTown ? `En ${selectedTown}` : "Destacadas"}
            value={selectedTown ? summary.local : summary.featured}
            accent={selectedTown ? "#2563EB" : "#D97706"}
          />
        </div>
      </section>

      <section
        style={{
          marginTop: 22,
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #334155 100%)",
          color: "white",
          borderRadius: 22,
          padding: 22,
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          gap: 18,
          alignItems: "center",
          boxShadow: "0 14px 40px rgba(15,23,42,0.14)",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "rgba(249,115,22,0.14)",
              color: "#FDBA74",
              border: "1px solid rgba(249,115,22,0.28)",
              padding: "7px 12px",
              borderRadius: 999,
              fontWeight: 900,
              fontSize: 12,
              letterSpacing: "0.03em",
              textTransform: "uppercase",
            }}
          >
            Más visibilidad, más contactos
          </div>

          <h2
            style={{
              margin: "14px 0 0",
              fontSize: 30,
              lineHeight: 1.08,
              fontWeight: 900,
              letterSpacing: "-0.02em",
            }}
          >
            Los avisos pagos aparecen antes y ganan prioridad en la zona del usuario
          </h2>

          <p
            style={{
              marginTop: 12,
              color: "rgba(255,255,255,0.78)",
              lineHeight: 1.7,
              fontSize: 16,
              maxWidth: 720,
            }}
          >
            En esta sección, los inmuebles con mayor plan de visibilidad suben posiciones,
            se ven mejor y reciben prioridad cuando coinciden con la localidad elegida o detectada.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gap: 10,
          }}
        >
          <VisibilityPoint text="🔴 Urgente: aparece primero y llama más la atención" />
          <VisibilityPoint text="⭐ Destacado: mejor presencia dentro de la sección y en portada" />
          <VisibilityPoint text="🛢 Prioridad petrolera: máxima exposición en la zona energética" />
          <VisibilityPoint text={selectedTown ? `📍 Prioridad local activa en ${selectedTown}` : "📍 La prioridad local se activa según ciudad elegida o detectada"} />
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

          const isPetrol = isPetrolActive(item, now);
          const isUrgent = isUrgentActive(item, now);
          const isFeatured = isFeaturedActive(item, now);
          const isLocalPriority =
            !!selectedTown && normalizeTown(item.town) === normalizeTown(selectedTown);

          return (
            <a
              key={item.id}
              href={`/anuncio/${item.id}`}
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
                  : isLocalPriority
                  ? "1px solid #60A5FA"
                  : "1px solid #E5E7EB",
                borderRadius: 18,
                overflow: "hidden",
                boxShadow: isPetrol
                  ? "0 16px 36px rgba(249,115,22,0.15)"
                  : isUrgent
                  ? "0 16px 36px rgba(220,38,38,0.12)"
                  : isFeatured
                  ? "0 16px 36px rgba(245,158,11,0.12)"
                  : "0 10px 30px rgba(15,23,42,0.06)",
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
                    : isLocalPriority
                    ? "linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)"
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
                  {isUrgent && <Badge bg="#991B1B" text="🔴 URGENTE" />}
                  {isFeatured && <Badge bg="#92400E" text="⭐ DESTACADO" />}
                  {isLocalPriority && <Badge bg="#1D4ED8" text="📍 EN TU ZONA" />}
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

function isPetrolActive(item: Listing, now: number) {
  const hasBool = item.petrol_priority === true;
  const hasFutureDate =
    !!item.petrol_priority_until &&
    new Date(item.petrol_priority_until).getTime() > now;

  return hasBool || hasFutureDate;
}

function isUrgentActive(item: Listing, now: number) {
  return !!item.urgent_until && new Date(item.urgent_until).getTime() > now;
}

function isFeaturedActive(item: Listing, now: number) {
  return !!item.featured_until && new Date(item.featured_until).getTime() > now;
}

function normalizeTown(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

function getListingScore(item: Listing, selectedTown?: string) {
  const now = Date.now();
  let score = 0;

  const petrol = isPetrolActive(item, now);
  const urgent = isUrgentActive(item, now);
  const featured = isFeaturedActive(item, now);
  const localPriority =
    !!selectedTown && normalizeTown(item.town) === normalizeTown(selectedTown);

  if (petrol) score += 1000;
  if (urgent) score += 700;
  if (featured) score += 400;
  if (localPriority) score += 250;

  score += Math.min(Number(item.views || 0), 500);

  const createdAt = item.created_at ? new Date(item.created_at).getTime() : 0;
  if (!Number.isNaN(createdAt)) {
    score += Math.floor(createdAt / 10000000);
  }

  return score;
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

function VisibilityPoint({ text }: { text: string }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 14,
        padding: "12px 14px",
        color: "white",
        fontWeight: 800,
        lineHeight: 1.45,
      }}
    >
      {text}
    </div>
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