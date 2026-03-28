"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type FavoriteRow = {
  id: string;
  item_id: string;
  item_type: "listing" | "classified" | "job" | "meal";
  created_at: string;
};

type ListingItem = {
  id: string;
  title: string | null;
  town: string | null;
  price: number | null;
  currency: string | null;
  description: string | null;
};

export default function MisFavoritosPage() {
  const [items, setItems] = useState<ListingItem[]>([]);
  const [msg, setMsg] = useState("Cargando...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = supabaseBrowser();

        const { data: userRes, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;

        if (!userRes.user) {
          window.location.href = "/login?next=/mis-favoritos";
          return;
        }

        const { data: favs, error: favsError } = await supabase
          .from("favorites")
          .select("id,item_id,item_type,created_at")
          .eq("user_id", userRes.user.id)
          .order("created_at", { ascending: false });

        if (favsError) throw favsError;

        const favoriteRows = (favs ?? []) as FavoriteRow[];

        const listingIds = favoriteRows
          .filter((x) => x.item_type === "listing")
          .map((x) => x.item_id);

        if (listingIds.length === 0) {
          setItems([]);
          setMsg("Todavía no guardaste inmuebles en favoritos.");
          return;
        }

        const { data: listingData, error: listingError } = await supabase
          .from("listings")
          .select("id,title,town,price,currency,description")
          .in("id", listingIds);

        if (listingError) throw listingError;

        const listings = (listingData ?? []) as ListingItem[];

        const ordered = listingIds
          .map((id) => listings.find((x) => x.id === id))
          .filter(Boolean) as ListingItem[];

        setItems(ordered);
        setMsg(ordered.length ? "" : "Todavía no guardaste inmuebles en favoritos.");
      } catch (e: any) {
        setItems([]);
        setMsg(e?.message || "Error cargando favoritos");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const stats = useMemo(() => {
    const withPrice = items.filter((x) => x.price !== null).length;
    return {
      total: items.length,
      conPrecio: withPrice,
    };
  }, [items]);

  return (
    <main className="vf-fav-page">
      <div className="vf-container vf-fav-wrap">
        <a href="/" className="vf-fav-back">
          ← Volver
        </a>

        <section className="vf-fav-hero">
          <div className="vf-fav-kicker">⭐ Favoritos</div>

          <h1 className="vf-fav-title">Tus publicaciones guardadas</h1>

          <p className="vf-fav-subtitle">
            Aquí tienes los inmuebles que marcaste para revisar después, comparar
            o contactar más tarde.
          </p>
        </section>

        <section className="vf-fav-stats">
          <StatCard label="Favoritos" value={stats.total} />
          <StatCard label="Con precio visible" value={stats.conPrecio} accent="#F97316" />
        </section>

        {loading && <p className="vf-fav-message">Cargando...</p>}
        {!loading && msg && <p className="vf-fav-message">{msg}</p>}

        {!loading && !msg && (
          <section className="vf-fav-grid">
            {items.map((item, index) => (
              <a
                key={item.id}
                href={`/anuncio/${item.id}`}
                className="vf-fav-card"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <div className="vf-fav-card-top">
                  <div className="vf-fav-badge-row">
                    <span className="vf-fav-badge">Guardado</span>
                  </div>

                  <div className="vf-fav-visual">
                    <span>VF</span>
                  </div>
                </div>

                <div className="vf-fav-card-body">
                  <h3 className="vf-fav-card-title">{item.title || "Sin título"}</h3>

                  <div className="vf-fav-town">📍 {item.town || "Sin ciudad"}</div>

                  {item.description && (
                    <div className="vf-fav-desc">
                      {item.description.slice(0, 110)}
                      {item.description.length > 110 ? "..." : ""}
                    </div>
                  )}

                  {item.price !== null && (
                    <div className="vf-fav-price">
                      {item.price} {item.currency || "ARS"}
                    </div>
                  )}
                </div>
              </a>
            ))}
          </section>
        )}

        {!loading && !msg && items.length === 0 && (
          <div className="vf-fav-empty">
            <div className="vf-fav-empty-icon">⭐</div>
            <div className="vf-fav-empty-title">Todavía no tienes favoritos</div>
            <div className="vf-fav-empty-text">
              Cuando guardes publicaciones, aparecerán aquí para volver a verlas rápido.
            </div>
            <a href="/anuncio" className="vf-btn-primary" style={{ marginTop: 18 }}>
              Explorar inmuebles
            </a>
          </div>
        )}
      </div>

      <style jsx>{`
        .vf-fav-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(249, 115, 22, 0.07), transparent 24%),
            linear-gradient(180deg, #f8fafc 0%, #f8f7f3 100%);
        }

        .vf-fav-wrap {
          padding-top: 28px;
          padding-bottom: 44px;
        }

        .vf-fav-back {
          text-decoration: none;
          color: #2563eb;
          font-weight: 800;
        }

        .vf-fav-hero {
          margin-top: 18px;
          animation: fadeUp 0.45s ease both;
        }

        .vf-fav-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #fef3c7;
          color: #92400e;
          border: 1px solid #fcd34d;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 800;
        }

        .vf-fav-title {
          margin: 16px 0 0;
          font-size: 48px;
          line-height: 1.02;
          color: #0f172a;
          font-weight: 950;
          letter-spacing: -0.03em;
          max-width: 860px;
        }

        .vf-fav-subtitle {
          margin-top: 14px;
          color: #64748b;
          font-size: 18px;
          line-height: 1.7;
          max-width: 820px;
        }

        .vf-fav-stats {
          margin-top: 26px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 14px;
          animation: fadeUp 0.55s ease both;
        }

        .vf-fav-message {
          margin-top: 22px;
          color: #334155;
          font-weight: 700;
          animation: fadeUp 0.45s ease both;
        }

        .vf-fav-grid {
          margin-top: 28px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 18px;
        }

        .vf-fav-card {
          display: block;
          text-decoration: none;
          color: #0f172a;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 22px;
          overflow: hidden;
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
          transition:
            transform 0.22s ease,
            box-shadow 0.22s ease,
            border-color 0.22s ease;
          animation: fadeUp 0.45s ease both;
        }

        .vf-fav-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 18px 42px rgba(15, 23, 42, 0.1);
          border-color: #cbd5e1;
        }

        .vf-fav-card-top {
          padding: 14px 14px 0;
        }

        .vf-fav-badge-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          min-height: 28px;
        }

        .vf-fav-badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 10px;
          border-radius: 999px;
          background: #fff7ed;
          color: #c2410c;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.02em;
          transition: transform 0.2s ease;
        }

        .vf-fav-card:hover .vf-fav-badge {
          transform: scale(1.04);
        }

        .vf-fav-visual {
          margin-top: 12px;
          height: 168px;
          border-radius: 16px;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 48%, #f97316 100%);
          display: grid;
          place-items: center;
          position: relative;
          overflow: hidden;
        }

        .vf-fav-visual::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            120deg,
            transparent 0%,
            rgba(255, 255, 255, 0.08) 45%,
            transparent 70%
          );
          transform: translateX(-120%);
          transition: transform 0.6s ease;
        }

        .vf-fav-card:hover .vf-fav-visual::after {
          transform: translateX(120%);
        }

        .vf-fav-visual span {
          color: white;
          font-weight: 950;
          font-size: 44px;
          letter-spacing: -0.03em;
          opacity: 0.92;
        }

        .vf-fav-card-body {
          padding: 16px;
        }

        .vf-fav-card-title {
          margin: 0;
          font-size: 22px;
          line-height: 1.18;
          font-weight: 950;
          color: #0f172a;
        }

        .vf-fav-town {
          margin-top: 8px;
          color: #64748b;
          font-size: 15px;
          font-weight: 700;
        }

        .vf-fav-desc {
          margin-top: 12px;
          color: #475569;
          font-size: 14px;
          line-height: 1.7;
        }

        .vf-fav-price {
          margin-top: 14px;
          font-size: 24px;
          font-weight: 950;
          color: #f97316;
        }

        .vf-fav-empty {
          margin-top: 28px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 24px;
          padding: 30px 22px;
          text-align: center;
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
          animation: fadeUp 0.45s ease both;
        }

        .vf-fav-empty-icon {
          font-size: 36px;
        }

        .vf-fav-empty-title {
          margin-top: 10px;
          font-size: 24px;
          font-weight: 900;
          color: #0f172a;
        }

        .vf-fav-empty-text {
          margin-top: 10px;
          color: #64748b;
          line-height: 1.65;
          max-width: 560px;
          margin-left: auto;
          margin-right: auto;
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 640px) {
          .vf-fav-title {
            font-size: 38px;
          }

          .vf-fav-subtitle {
            font-size: 17px;
          }

          .vf-fav-price {
            font-size: 21px;
          }
        }
      `}</style>
    </main>
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
        borderRadius: 18,
        padding: 18,
        boxShadow: "0 8px 20px rgba(15,23,42,0.04)",
      }}
    >
      <div
        style={{
          fontSize: 14,
          color: "#64748B",
          fontWeight: 700,
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 10,
          fontSize: 32,
          fontWeight: 950,
          lineHeight: 1,
          color: accent,
        }}
      >
        {value}
      </div>
    </div>
  );
}