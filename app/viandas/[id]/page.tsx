"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import FavoriteButton from "../../components/FavoriteButton";

const BUCKET = "meal-photos";

type Meal = {
  id: string | null;
  title: string | null;
  town: string | null;
  description: string | null;
  price: number | null;
  currency: string | null;
  featured_until: string | null;
  urgent_until: string | null;
  views: number | null;
  photo_paths: string[] | null;
  whatsapp?: string | null;

  // 🔥 NUEVO
  meal_category?: string | null;
  delivery_type?: string | null;
  delivery_price?: number | null;
  pickup_address?: string | null;
  availability?: string | null;
};

export default function ViandaDetallePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [meal, setMeal] = useState<Meal | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [msg, setMsg] = useState("Cargando...");

  useEffect(() => {
    const load = async () => {
      try {
        if (!id) {
          setMsg("ID vacío.");
          return;
        }

        const supabase = supabaseBrowser();

        const { data, error } = await supabase
          .from("meals")
          .select("*")
          .eq("id", id)
          .single();

        if (error || !data) {
          throw new Error("No se encontró la vianda.");
        }

        const row = data as Meal;
        setMeal(row);

        await supabase
          .from("meals")
          .update({ views: (row.views || 0) + 1 })
          .eq("id", row.id);

        if (row.photo_paths && row.photo_paths.length > 0) {
          const { data: signed, error: signError } = await supabase.storage
            .from(BUCKET)
            .createSignedUrls(row.photo_paths, 3600);

          if (signError) throw signError;

          const urls = (signed || [])
            .map((x) => x?.signedUrl)
            .filter(Boolean) as string[];

          setPhotoUrls(urls);
        } else {
          setPhotoUrls([]);
        }

        setMsg("");
      } catch (e: any) {
        setMsg(e?.message || "Error cargando vianda");
      }
    };

    load();
  }, [id]);

  const isUrgent = useMemo(() => {
    if (!meal?.urgent_until) return false;
    return new Date(meal.urgent_until).getTime() > Date.now();
  }, [meal]);

  const isFeatured = useMemo(() => {
    if (!meal?.featured_until) return false;
    return new Date(meal.featured_until).getTime() > Date.now();
  }, [meal]);

  const whatsappHref = meal?.whatsapp
    ? `https://wa.me/${meal.whatsapp.replace(/[^\d]/g, "")}`
    : null;

  if (!meal) {
    return (
      <main style={pageWrap}>
        <div style={pageContainer}>
          <a href="/viandas" style={backStyle}>
            ← Volver a viandas
          </a>

          <div style={emptyStateBox}>
            <p style={{ margin: 0 }}>{msg}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={pageWrap}>
      <div style={pageContainer}>
        <a href="/viandas" style={backStyle}>
          ← Volver a viandas
        </a>

        <div style={topGrid}>
          <div>
            <div style={badgeRow}>
              {isUrgent && <Badge bg="#991B1B" text="🔴 URGENTE" />}
              {!isUrgent && isFeatured && <Badge bg="#92400E" text="⭐ DESTACADO" />}
              <Badge bg="#E5E7EB" text="🍱 Vianda" dark />
            </div>

            <h1 style={titleStyle}>{meal.title || "Sin título"}</h1>

            <div style={metaRow}>
              <div style={townStyle}>📍 {meal.town || "Sin ciudad"}</div>
              <div style={viewsStyle}>👁 {meal.views || 0} visitas</div>
            </div>

            {meal.price !== null && (
              <div style={priceStyle}>
                {meal.price} {meal.currency || ""}
              </div>
            )}

            <div style={heroImageWrap}>
              {photoUrls.length > 0 ? (
                <img
                  src={photoUrls[activeIndex]}
                  alt={meal.title || "foto"}
                  style={heroImage}
                />
              ) : (
                <div style={noPhotoBox}>Sin imágenes</div>
              )}
            </div>

            {photoUrls.length > 1 && (
              <div style={thumbGrid}>
                {photoUrls.map((url, index) => (
                  <button
                    key={`${url}-${index}`}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    style={{
                      ...thumbBtn,
                      border:
                        index === activeIndex
                          ? "2px solid #F97316"
                          : "1px solid #D1D5DB",
                      boxShadow:
                        index === activeIndex
                          ? "0 8px 18px rgba(249,115,22,0.18)"
                          : "none",
                    }}
                  >
                    <img
                      src={url}
                      alt={`miniatura ${index + 1}`}
                      style={thumbImage}
                    />
                  </button>
                ))}
              </div>
            )}

            <section style={contentCard}>
              <h2 style={sectionTitle}>Descripción</h2>
              <section style={contentCard}>
  <h2 style={sectionTitle}>Información</h2>

  <div style={{ marginTop: 12, display: "grid", gap: 10 }}>

    {meal.meal_category && (
      <InfoRow label="Categoría" value={meal.meal_category} />
    )}

    {meal.availability && (
      <InfoRow label="Disponibilidad" value={meal.availability} />
    )}

    {meal.delivery_type && (
      <InfoRow
        label="Entrega"
        value={
          meal.delivery_type === "DELIVERY"
            ? "Solo delivery"
            : meal.delivery_type === "RETIRO"
            ? "Solo retiro"
            : "Retiro / Delivery"
        }
      />
    )}

    {meal.delivery_price !== null && (
      <InfoRow
        label="Costo delivery"
        value={`$${meal.delivery_price}`}
      />
    )}

    {meal.pickup_address && (
      <InfoRow label="Dirección retiro" value={meal.pickup_address} />
    )}
  </div>
</section>
              <p style={descriptionStyle}>
                {meal.description || "Sin descripción."}
              </p>
            </section>
          </div>

          <aside
            style={{
              ...asideCard,
              border: isUrgent
                ? "2px solid #DC2626"
                : isFeatured
                ? "2px solid #F59E0B"
                : "1px solid #E5E7EB",
            }}
          >
            <div style={asideTopLabel}>Precio</div>

            <div style={asidePriceStyle}>
              {meal.price !== null ? `${meal.price} ${meal.currency || ""}` : "Consultar"}
            </div>

            <div style={asideInfoGrid}>
              <InfoRow label="Ciudad" value={meal.town || "Sin ciudad"} />
              <InfoRow label="Visitas" value={String(meal.views || 0)} />
              <InfoRow label="Estado" value="Publicado" />
            </div>

            {isUrgent && (
              <div style={statusNoticeRed}>Publicación urgente activa</div>
            )}

            {isFeatured && !isUrgent && (
              <div style={statusNoticeGold}>Publicación destacada activa</div>
            )}

            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: "none" }}
              >
                <button type="button" style={waBtn}>
                  Pedir por WhatsApp
                </button>
              </a>
            )}

            <div style={{ marginTop: 12 }}>
              <FavoriteButton itemType="meal" itemId={String(meal.id)} />
            </div>

            <div style={trustBox}>
              <div style={trustTitle}>Consejo</div>
              <div style={trustText}>
                Aclara horarios, entrega, cantidad y forma de pago antes de confirmar el pedido.
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={infoRow}>
      <span style={infoLabel}>{label}</span>
      <span style={infoValue}>{value}</span>
    </div>
  );
}

function Badge({
  bg,
  text,
  dark = false,
}: {
  bg: string;
  text: string;
  dark?: boolean;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: bg,
        color: dark ? "#111827" : "white",
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

const pageWrap: React.CSSProperties = {
  background:
    "radial-gradient(circle at top left, rgba(249,115,22,0.06), transparent 24%), linear-gradient(180deg, #f8fafc 0%, #f8f7f3 100%)",
  minHeight: "100vh",
  padding: "28px 0 56px",
};

const pageContainer: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
  padding: "0 20px",
  fontFamily: "system-ui",
};

const backStyle: React.CSSProperties = {
  textDecoration: "none",
  color: "#2563EB",
  fontWeight: 800,
};

const emptyStateBox: React.CSSProperties = {
  marginTop: 20,
  padding: 20,
  background: "white",
  borderRadius: 12,
  border: "1px solid #eee",
  textAlign: "center",
  fontWeight: 700,
  color: "#64748B",
};

const topGrid: React.CSSProperties = {
  marginTop: 22,
  display: "grid",
  gridTemplateColumns: "1.55fr 0.95fr",
  gap: 24,
  alignItems: "start",
};

const badgeRow: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  marginBottom: 14,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 48,
  lineHeight: 1.02,
  color: "#0F172A",
  fontWeight: 950,
  letterSpacing: "-0.03em",
};

const metaRow: React.CSSProperties = {
  marginTop: 12,
  display: "flex",
  gap: 14,
  flexWrap: "wrap",
  alignItems: "center",
};

const townStyle: React.CSSProperties = {
  color: "#64748B",
  fontWeight: 700,
  fontSize: 16,
};

const viewsStyle: React.CSSProperties = {
  color: "#64748B",
  fontWeight: 700,
  fontSize: 14,
};

const priceStyle: React.CSSProperties = {
  marginTop: 18,
  fontWeight: 950,
  fontSize: 38,
  color: "#0F172A",
  lineHeight: 1,
};

const heroImageWrap: React.CSSProperties = {
  marginTop: 24,
  height: 540,
  borderRadius: 28,
  overflow: "hidden",
  background: "#E5E7EB",
  border: "1px solid #E5E7EB",
  boxShadow: "0 16px 34px rgba(15,23,42,0.08)",
};

const heroImage: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const thumbGrid: React.CSSProperties = {
  marginTop: 14,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(92px,1fr))",
  gap: 10,
};

const thumbBtn: React.CSSProperties = {
  padding: 0,
  height: 88,
  borderRadius: 14,
  overflow: "hidden",
  background: "white",
  cursor: "pointer",
};

const thumbImage: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const contentCard: React.CSSProperties = {
  marginTop: 30,
  background: "white",
  borderRadius: 22,
  border: "1px solid #E5E7EB",
  padding: 24,
  boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
};

const sectionTitle: React.CSSProperties = {
  margin: 0,
  color: "#0F172A",
  fontSize: 28,
  fontWeight: 950,
};

const descriptionStyle: React.CSSProperties = {
  marginTop: 14,
  lineHeight: 1.8,
  color: "#475569",
  fontSize: 16,
};

const asideCard: React.CSSProperties = {
  borderRadius: 22,
  padding: 22,
  background: "white",
  boxShadow: "0 14px 30px rgba(15,23,42,0.06)",
  position: "sticky",
  top: 20,
};

const asideTopLabel: React.CSSProperties = {
  fontSize: 14,
  color: "#64748B",
  fontWeight: 800,
};

const asidePriceStyle: React.CSSProperties = {
  marginTop: 8,
  fontSize: 38,
  fontWeight: 950,
  color: "#0F172A",
  lineHeight: 1,
};

const asideInfoGrid: React.CSSProperties = {
  marginTop: 18,
  display: "grid",
  gap: 10,
};

const infoRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
  paddingBottom: 10,
  borderBottom: "1px solid #EEF2F7",
};

const infoLabel: React.CSSProperties = {
  color: "#64748B",
  fontWeight: 700,
};

const infoValue: React.CSSProperties = {
  color: "#0F172A",
  fontWeight: 900,
  textAlign: "right",
};

const statusNoticeRed: React.CSSProperties = {
  marginTop: 16,
  background: "#FEF2F2",
  color: "#B91C1C",
  border: "1px solid #FCA5A5",
  padding: "10px 12px",
  borderRadius: 12,
  fontWeight: 800,
};

const statusNoticeGold: React.CSSProperties = {
  marginTop: 16,
  background: "#FFFBEB",
  color: "#A16207",
  border: "1px solid #FCD34D",
  padding: "10px 12px",
  borderRadius: 12,
  fontWeight: 800,
};

const waBtn: React.CSSProperties = {
  marginTop: 20,
  width: "100%",
  padding: 15,
  borderRadius: 14,
  border: "none",
  background: "#25D366",
  color: "white",
  fontWeight: 900,
  fontSize: 16,
  cursor: "pointer",
};

const trustBox: React.CSSProperties = {
  marginTop: 16,
  background: "#F8FAFC",
  border: "1px solid #E2E8F0",
  borderRadius: 14,
  padding: 14,
};

const trustTitle: React.CSSProperties = {
  fontWeight: 900,
  color: "#0F172A",
};

const trustText: React.CSSProperties = {
  marginTop: 8,
  color: "#64748B",
  lineHeight: 1.6,
  fontSize: 14,
};

const noPhotoBox: React.CSSProperties = {
  width: "100%",
  height: "100%",
  display: "grid",
  placeItems: "center",
  color: "#64748B",
  fontWeight: 700,
  fontSize: 18,
};