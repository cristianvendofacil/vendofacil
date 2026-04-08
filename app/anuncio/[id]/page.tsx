"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import FavoriteButton from "../../components/FavoriteButton";
import VerificationBadge from "../../components/VerificationBadge";

const BUCKET = "listing-photos";

type Listing = {
  id: string;
  user_id: string | null;
  title: string | null;
  town: string | null;
  description: string | null;
  price: number | null;
  currency: string | null;
  whatsapp: string | null;
  views: number | null;
  photo_paths: string[] | null;
  featured_until: string | null;
  urgent_until: string | null;
  petrol_priority: boolean | null;
  petrol_priority_until: string | null;
};

type VerificationRow = {
  is_verified: boolean | null;
  verification_type: string | null;
  status: string | null;
  verified_until: string | null;
};

export default function AnuncioDetallePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [item, setItem] = useState<Listing | null>(null);
  const [similar, setSimilar] = useState<Listing[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [verification, setVerification] = useState<VerificationRow | null>(null);
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
  .from("listings")
  .select(
    "id,user_id,title,town,description,price,currency,whatsapp,views,photo_paths,featured_until,urgent_until,petrol_priority,petrol_priority_until,status"
  )
  .eq("id", id)
  .eq("status", "PUBLISHED")
  .single();

        if (error || !data) {
          throw new Error("No se encontró el anuncio.");
        }

        const listing = data as Listing;
        setItem(listing);

        await supabase
          .from("listings")
          .update({ views: (listing.views || 0) + 1 })
          .eq("id", listing.id);

        if (listing.photo_paths && listing.photo_paths.length > 0) {
          const { data: signed, error: signError } = await supabase.storage
            .from(BUCKET)
            .createSignedUrls(listing.photo_paths, 3600);

          if (signError) throw signError;

          const urls = (signed || [])
            .map((x) => x?.signedUrl)
            .filter(Boolean) as string[];

          setPhotoUrls(urls);
        } else {
          setPhotoUrls([]);
        }

        if (listing.user_id) {
          const { data: verData } = await supabase
            .from("user_verifications")
            .select("is_verified,verification_type,status,verified_until")
            .eq("user_id", listing.user_id)
            .maybeSingle();

          setVerification((verData as VerificationRow) || null);
        }

        const { data: similarData, error: similarError } = await supabase
          .from("listings")
          .select(
            "id,user_id,title,town,description,price,currency,whatsapp,views,photo_paths,featured_until,urgent_until,petrol_priority,petrol_priority_until"
          )
          .eq("town", listing.town)
          .neq("id", listing.id)
          .limit(6);

        if (similarError) throw similarError;

        setSimilar((similarData ?? []) as Listing[]);
        setMsg("");
      } catch (e: any) {
        setMsg(e?.message || "Error cargando anuncio");
      }
    };

    load();
  }, [id]);

  const isUrgent = useMemo(() => {
    if (!item?.urgent_until) return false;
    return new Date(item.urgent_until).getTime() > Date.now();
  }, [item]);

  const isFeatured = useMemo(() => {
    if (!item?.featured_until) return false;
    return new Date(item.featured_until).getTime() > Date.now();
  }, [item]);

  const isPetrol = useMemo(() => {
    if (!item?.petrol_priority) return false;
    if (!item?.petrol_priority_until) return false;
    return new Date(item.petrol_priority_until).getTime() > Date.now();
  }, [item]);
  const isVerifiedOwner = useMemo(() => {
  return (
    !!verification?.is_verified &&
    !!verification?.verified_until &&
    new Date(verification.verified_until).getTime() > Date.now()
  );
}, [verification]);

  const whatsappHref = item?.whatsapp
    ? `https://wa.me/${item.whatsapp.replace(/[^\d]/g, "")}`
    : null;

  if (!item) {
    return (
      <main style={pageWrap}>
        <div style={pageContainer}>
          <a href="/anuncio" style={backStyle}>
            ← Volver a inmuebles
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
        <a href="/anuncio" style={backStyle}>
          ← Volver a inmuebles
        </a>

        <div style={topGrid}>
          <div>
            <div style={badgeRow}>
              {isPetrol && <Badge bg="#111827" text="🛢 PRIORIDAD PETROLERA" />}
              {!isPetrol && isUrgent && <Badge bg="#991B1B" text="🔴 URGENTE" />}
              {!isPetrol && !isUrgent && isFeatured && (
                <Badge bg="#92400E" text="⭐ DESTACADO" />
              )}
              <Badge bg="#E5E7EB" text="🏠 Inmueble" dark />
              <VerificationBadge
                isVerified={verification?.is_verified}
                verificationType={verification?.verification_type}
                status={verification?.status}
                verifiedUntil={verification?.verified_until}
              />
            </div>

            <h1 style={titleStyle}>{item.title || "Sin título"}</h1>

            <div style={metaRow}>
              <div style={townStyle}>📍 {item.town || "Sin ciudad"}</div>
              <div style={viewsStyle}>👁 {item.views || 0} visitas</div>
            </div>

            {item.price !== null && (
              <div style={priceStyle}>
                {item.price} {item.currency || ""}
              </div>
            )}

            <div style={heroImageWrap}>
              {photoUrls.length > 0 ? (
                <img
                  src={photoUrls[activeIndex]}
                  alt={item.title || "foto"}
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
              <p style={descriptionStyle}>
                {item.description || "Sin descripción."}
              </p>
            </section>
          </div>
<aside
  style={{
    ...asideCard,
    border: isVerifiedOwner
      ? "2px solid #22c55e"
      : isPetrol
      ? "2px solid #F97316"
      : isUrgent
      ? "2px solid #DC2626"
      : isFeatured
      ? "2px solid #F59E0B"
      : "1px solid #E5E7EB",

    boxShadow: isVerifiedOwner
      ? "0 0 0 2px rgba(34,197,94,0.15), 0 14px 30px rgba(15,23,42,0.06)"
      : asideCard.boxShadow,
  }}
>
            <div style={asideTopLabel}>Precio</div>

            <div style={asidePriceStyle}>
              {item.price !== null ? `${item.price} ${item.currency || ""}` : "Consultar"}
            </div>

            <div style={asideInfoGrid}>
              <InfoRow label="Ciudad" value={item.town || "Sin ciudad"} />
              <InfoRow label="Visitas" value={String(item.views || 0)} />
              <InfoRow label="Estado" value="Publicado" />
            </div>

            {isPetrol && (
              <div style={statusNoticeOrange}>Prioridad petrolera activa</div>
            )}

            {isUrgent && !isPetrol && (
              <div style={statusNoticeRed}>Publicación urgente activa</div>
            )}

            {isFeatured && !isPetrol && !isUrgent && (
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
                  Contactar por WhatsApp
                </button>
              </a>
            )}

            <div style={{ marginTop: 12 }}>
              <FavoriteButton itemType="listing" itemId={item.id} />
            </div>

            <div style={trustBox}>
              <div style={trustTitle}>Consejo de seguridad</div>
              <div style={trustText}>
                Verifica la información, coordina visitas con claridad y utiliza
                canales confiables para cerrar acuerdos.
              </div>
            </div>
          </aside>
        </div>

        {similar.length > 0 && (
          <section style={{ marginTop: 58 }}>
            <div style={similarHead}>
              <div>
                <h2 style={similarTitle}>Te puede interesar</h2>
                <p style={similarSubtitle}>
                  Otras oportunidades en la misma zona.
                </p>
              </div>
            </div>

            <div style={similarGrid}>
              {similar.map((x) => {
                const simPetrol =
                  x.petrol_priority === true &&
                  !!x.petrol_priority_until &&
                  new Date(x.petrol_priority_until).getTime() > Date.now();

                const simUrgent =
                  !!x.urgent_until &&
                  new Date(x.urgent_until).getTime() > Date.now();

                const simFeatured =
                  !!x.featured_until &&
                  new Date(x.featured_until).getTime() > Date.now();

                return (
                  <a
                    key={x.id}
                    href={`/anuncio/${x.id}`}
                    style={{
                      ...similarCard,
                      border: simPetrol
                        ? "2px solid #F97316"
                        : simUrgent
                        ? "2px solid #DC2626"
                        : simFeatured
                        ? "2px solid #F59E0B"
                        : "1px solid #E5E7EB",
                    }}
                  >
                    <div style={similarImageBox}>
                      <span style={similarImageVF}>VF</span>
                    </div>

                    <div style={similarCardBody}>
                      <div style={similarBadgeRow}>
                        {simPetrol && <Badge bg="#111827" text="🛢 PETROLERA" />}
                        {!simPetrol && simUrgent && <Badge bg="#991B1B" text="🔴 URGENTE" />}
                        {!simPetrol && !simUrgent && simFeatured && (
                          <Badge bg="#92400E" text="⭐ DESTACADO" />
                        )}
                      </div>

                      <div style={similarCardTitle}>{x.title || "Sin título"}</div>

                      <div style={similarTown}>📍 {x.town || "Sin ciudad"}</div>

                      {x.price !== null && (
                        <div style={similarPrice}>
                          {x.price} {x.currency || ""}
                        </div>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}
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
        letterSpacing: "0.02em",
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

const statusNoticeOrange: React.CSSProperties = {
  marginTop: 16,
  background: "#FFF7ED",
  color: "#C2410C",
  border: "1px solid #FDBA74",
  padding: "10px 12px",
  borderRadius: 12,
  fontWeight: 800,
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

const similarHead: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "end",
  gap: 12,
  flexWrap: "wrap",
};

const similarTitle: React.CSSProperties = {
  margin: 0,
  color: "#0F172A",
  fontSize: 34,
  fontWeight: 950,
  letterSpacing: "-0.02em",
};

const similarSubtitle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#64748B",
  fontSize: 16,
};

const similarGrid: React.CSSProperties = {
  marginTop: 18,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
  gap: 16,
};

const similarCard: React.CSSProperties = {
  display: "block",
  textDecoration: "none",
  color: "#0F172A",
  background: "white",
  borderRadius: 18,
  overflow: "hidden",
  boxShadow: "0 8px 22px rgba(15,23,42,0.05)",
};

const similarImageBox: React.CSSProperties = {
  height: 150,
  background: "linear-gradient(135deg, #0f172a 0%, #1e293b 48%, #f97316 100%)",
  display: "grid",
  placeItems: "center",
};

const similarImageVF: React.CSSProperties = {
  color: "white",
  fontWeight: 950,
  fontSize: 38,
  opacity: 0.9,
};

const similarCardBody: React.CSSProperties = {
  padding: 16,
};

const similarBadgeRow: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  marginBottom: 10,
  minHeight: 28,
};

const similarCardTitle: React.CSSProperties = {
  fontWeight: 900,
  fontSize: 18,
};

const similarTown: React.CSSProperties = {
  marginTop: 6,
  color: "#64748B",
  fontWeight: 700,
};

const similarPrice: React.CSSProperties = {
  marginTop: 10,
  fontWeight: 950,
  color: "#0F172A",
  fontSize: 22,
};