"use client";

export const dynamic = "force-dynamic";
export const revalidate = 0;
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import SaveSearchAlert from "../components/SaveSearchAlert";

type SearchRow = {
  id: string;
  title: string | null;
  town: string | null;
  price?: number | null;
  currency?: string | null;
  petrol_priority?: boolean | null;
  petrol_priority_until?: string | null;
  featured?: boolean | null;
  featured_until?: string | null;
  urgent_until?: string | null;
  description?: string | null;
  created_at?: string | null;
};

type LocationOption = {
  name: string;
  region?: string;
  province?: string;
  is_featured?: boolean;
};

export default function BuscarPage() {
  const router = useRouter();
  const params = useSearchParams();

  const query = params.get("q") || "";
  const town = params.get("town") || "";
  const itemType = params.get("type") || "listing";

  const [draftQuery, setDraftQuery] = useState(query);
  const [draftTown, setDraftTown] = useState(town);
  const [draftType, setDraftType] = useState(itemType);

  const [items, setItems] = useState<SearchRow[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setDraftQuery(query);
    setDraftTown(town);
    setDraftType(itemType);
  }, [query, town, itemType]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setMsg("");

        const supabase = supabaseBrowser();

        const { data: locationsData } = await supabase
          .from("locations")
          .select("name,region,province,is_featured")
          .order("is_featured", { ascending: false })
          .order("region", { ascending: true })
          .order("name", { ascending: true })
          .limit(80);

        if (locationsData) {
          setLocations((locationsData ?? []) as LocationOption[]);
        }

        let tableName = "listings";

        if (itemType === "classified") tableName = "classifieds";
        if (itemType === "job") tableName = "jobs";
        if (itemType === "meal") tableName = "meals";

        let req = supabase
          .from(tableName)
          .select(
            "id,title,town,price,currency,status,petrol_priority,petrol_priority_until,featured,featured_until,urgent_until,description,created_at"
          )
          .eq("status", "PUBLISHED");

        if (query.trim()) {
          req = req.ilike("title", `%${query.trim()}%`);
        }

        if (town.trim()) {
          req = req.eq("town", town.trim());
        }

        const { data, error } = await req.order("created_at", { ascending: false });

        if (error) throw error;

        const rows = (data ?? []) as SearchRow[];
        const now = Date.now();

        const sorted = [...rows].sort((a, b) => {
          const aPetrol =
            !!a.petrol_priority ||
            (!!a.petrol_priority_until &&
              new Date(a.petrol_priority_until).getTime() > now);

          const bPetrol =
            !!b.petrol_priority ||
            (!!b.petrol_priority_until &&
              new Date(b.petrol_priority_until).getTime() > now);

          if (aPetrol !== bPetrol) return aPetrol ? -1 : 1;

          const aUrgent =
            !!a.urgent_until && new Date(a.urgent_until).getTime() > now;
          const bUrgent =
            !!b.urgent_until && new Date(b.urgent_until).getTime() > now;

          if (aUrgent !== bUrgent) return aUrgent ? -1 : 1;

          const aFeatured =
            !!a.featured ||
            (!!a.featured_until && new Date(a.featured_until).getTime() > now);

          const bFeatured =
            !!b.featured ||
            (!!b.featured_until && new Date(b.featured_until).getTime() > now);

          if (aFeatured !== bFeatured) return aFeatured ? -1 : 1;

          const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;

          return bCreated - aCreated;
        });

        setItems(sorted);
      } catch (e: any) {
        setMsg(e?.message || "Error buscando publicaciones");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [query, town, itemType]);

  const getDetailPath = (id: string) => {
    if (itemType === "classified") return `/clasificados/${id}`;
    if (itemType === "job") return `/trabajo/${id}`;
    if (itemType === "meal") return `/viandas/${id}`;
    return `/anuncio/${id}`;
  };

  const typeLabel = useMemo(() => {
    if (itemType === "classified") return "Clasificados";
    if (itemType === "job") return "Trabajo";
    if (itemType === "meal") return "Viandas";
    return "Inmuebles";
  }, [itemType]);

  const featuredTownOptions = useMemo(
    () => locations.filter((x) => x.is_featured).slice(0, 10),
    [locations]
  );

  const handleSearch = () => {
    const qs = new URLSearchParams();

    if (draftQuery.trim()) qs.set("q", draftQuery.trim());
    if (draftTown.trim()) qs.set("town", draftTown.trim());
    if (draftType.trim()) qs.set("type", draftType.trim());

    router.push(`/buscar?${qs.toString()}`);
  };

  return (
    <main className="vf-home-page">
      <div className="vf-container" style={{ paddingTop: 28, paddingBottom: 40 }}>
        <a
          href="/"
          style={{
            textDecoration: "none",
            color: "#2563eb",
            fontWeight: 800,
          }}
        >
          ← Volver
        </a>

        <section
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: "1.08fr 0.92fr",
            gap: 24,
            alignItems: "start",
          }}
        >
          <div>
            <div className="vf-hero-kicker">Búsqueda inteligente</div>

            <h1
              style={{
                margin: "16px 0 0",
                fontSize: 48,
                lineHeight: 1.02,
                color: "#0f172a",
                fontWeight: 950,
                letterSpacing: "-0.03em",
                maxWidth: 860,
              }}
            >
              Resultados en <span className="vf-hero-accent">{typeLabel}</span>
            </h1>

            <p
              style={{
                marginTop: 14,
                color: "#64748b",
                fontSize: 18,
                lineHeight: 1.7,
                maxWidth: 860,
              }}
            >
              Encuentra oportunidades por texto, localidad y categoría en una sola vista.
            </p>
          </div>

          <div className="vf-home-search-card">
            <div className="vf-home-search-title">Refinar búsqueda</div>
            <div className="vf-home-search-subtitle">
              Ajusta los filtros y vuelve a buscar sin salir de la página.
            </div>

            <div className="vf-home-search-grid">
              <div className="vf-field-block vf-field-full">
                <label className="vf-field-label">¿Qué estás buscando?</label>
                <input
                  value={draftQuery}
                  onChange={(e) => setDraftQuery(e.target.value)}
                  placeholder="Ej: departamento, camioneta, soldador, viandas..."
                  className="vf-input"
                />
              </div>

              <div className="vf-field-block">
                <label className="vf-field-label">Categoría</label>
                <select
                  value={draftType}
                  onChange={(e) => setDraftType(e.target.value)}
                  className="vf-input"
                >
                  <option value="listing">Inmuebles</option>
                  <option value="classified">Clasificados</option>
                  <option value="job">Trabajo</option>
                  <option value="meal">Viandas</option>
                </select>
              </div>

              <div className="vf-field-block">
                <label className="vf-field-label">Localidad</label>
                <select
                  value={draftTown}
                  onChange={(e) => setDraftTown(e.target.value)}
                  className="vf-input"
                >
                  <option value="">Todas las localidades</option>
                  {locations.map((loc) => (
                    <option key={`${loc.name}-${loc.region || ""}`} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="vf-home-search-actions">
              <button
                type="button"
                onClick={handleSearch}
                className="vf-btn-primary vf-home-search-button"
              >
                Buscar ahora
              </button>
            </div>

            <div className="vf-town-pills">
              {featuredTownOptions.map((loc) => (
                <button
                  key={loc.name}
                  type="button"
                  onClick={() => setDraftTown(loc.name)}
                  className={`vf-town-pill ${draftTown === loc.name ? "vf-town-pill-active" : ""}`}
                >
                  {loc.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section
          style={{
            marginTop: 22,
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: 22,
            padding: 20,
            boxShadow: "0 10px 28px rgba(15,23,42,0.05)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 18,
              alignItems: "start",
            }}
          >
            <div>
              <div style={{ fontSize: 14, color: "#64748b", fontWeight: 700 }}>
                Filtros actuales
              </div>

              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <span className="badge" style={filterBadge}>
                  Texto: {query || "—"}
                </span>

                <span className="badge" style={filterBadge}>
                  Ciudad: {town || "—"}
                </span>

                <span className="badge" style={filterBadge}>
                  Tipo: {typeLabel}
                </span>

                <span className="badge" style={filterBadgeAccent}>
                  Resultados: {items.length}
                </span>
              </div>
            </div>

            <div style={{ minWidth: 230 }}>
              <SaveSearchAlert itemType={itemType} query={query} town={town} />
            </div>
          </div>
        </section>

        {loading && <p style={{ marginTop: 22 }}>Buscando...</p>}
        {msg && <p style={{ marginTop: 22 }}>{msg}</p>}

        {!loading && !msg && (
          <section
            style={{
              marginTop: 24,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
              gap: 18,
            }}
          >
            {items.length > 0 ? (
              items.map((item) => {
                const isPetrol =
                  !!item.petrol_priority ||
                  (!!item.petrol_priority_until &&
                    new Date(item.petrol_priority_until).getTime() > Date.now());

                const isUrgent =
                  !!item.urgent_until &&
                  new Date(item.urgent_until).getTime() > Date.now();

                const isFeatured =
                  !!item.featured ||
                  (!!item.featured_until &&
                    new Date(item.featured_until).getTime() > Date.now());

                return (
                  <a
                    key={item.id}
                    href={getDetailPath(item.id)}
                    style={{
                      display: "block",
                      textDecoration: "none",
                      color: "#0f172a",
                      background: "white",
                      border: isPetrol
                        ? "2px solid #f97316"
                        : isUrgent
                        ? "2px solid #dc2626"
                        : isFeatured
                        ? "2px solid #f59e0b"
                        : "1px solid #e5e7eb",
                      borderRadius: 22,
                      overflow: "hidden",
                      boxShadow: "0 10px 28px rgba(15,23,42,0.05)",
                    }}
                  >
                    <div style={{ padding: 14 }}>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                          minHeight: 28,
                        }}
                      >
                        {isPetrol && <span className="badge badge-petrol">PRIORIDAD</span>}
                        {!isPetrol && isUrgent && <span className="badge badge-urgent">URGENTE</span>}
                        {!isPetrol && !isUrgent && isFeatured && (
                          <span className="badge badge-featured">DESTACADO</span>
                        )}
                      </div>

                      <div
                        style={{
                          marginTop: 12,
                          height: 150,
                          borderRadius: 16,
                          background:
                            "linear-gradient(135deg, #0f172a 0%, #1e293b 48%, #f97316 100%)",
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <span
                          style={{
                            color: "white",
                            fontWeight: 950,
                            fontSize: 42,
                            letterSpacing: "-0.03em",
                            opacity: 0.9,
                          }}
                        >
                          VF
                        </span>
                      </div>
                    </div>

                    <div style={{ padding: 16 }}>
                      <div
                        style={{
                          fontWeight: 950,
                          fontSize: 22,
                          lineHeight: 1.18,
                          color: "#0f172a",
                        }}
                      >
                        {item.title || "Sin título"}
                      </div>

                      <div
                        style={{
                          marginTop: 8,
                          color: "#64748b",
                          fontSize: 15,
                          fontWeight: 700,
                        }}
                      >
                        📍 {item.town || "Sin ciudad"}
                      </div>

                      {item.description && (
                        <div
                          style={{
                            marginTop: 12,
                            color: "#475569",
                            fontSize: 14,
                            lineHeight: 1.7,
                          }}
                        >
                          {item.description.slice(0, 110)}
                          {item.description.length > 110 ? "..." : ""}
                        </div>
                      )}

                      {"price" in item && item.price != null && (
                        <div
                          style={{
                            marginTop: 14,
                            fontWeight: 950,
                            fontSize: 24,
                            color: "#f97316",
                          }}
                        >
                          {item.price} {item.currency || "ARS"}
                        </div>
                      )}
                    </div>
                  </a>
                );
              })
            ) : (
              <div
                style={{
                  gridColumn: "1 / -1",
                  background: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: 20,
                  padding: 22,
                }}
              >
                No se encontraron resultados.
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

const filterBadge: React.CSSProperties = {
  background: "#f8fafc",
  color: "#334155",
  border: "1px solid #e2e8f0",
  padding: "6px 10px",
};

const filterBadgeAccent: React.CSSProperties = {
  background: "#eff6ff",
  color: "#1d4ed8",
  border: "1px solid #bfdbfe",
  padding: "6px 10px",
};