"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import FavoriteButton from "../../components/FavoriteButton";

type Job = {
  id: string;
  title: string | null;
  town: string | null;
  description: string | null;
  job_type: string | null;
  whatsapp: string | null;
  featured_until: string | null;
  urgent_until: string | null;
  petrol_priority: boolean | null;
  petrol_priority_until: string | null;
  views: number | null;
};

function jobTypeLabel(value?: string | null) {
  if (!value) return "Trabajo";
  if (value === "SEEKING") return "Busco trabajo";
  if (value === "OFFERING") return "Ofrezco trabajo";
  return value;
}

export default function TrabajoDetallePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [item, setItem] = useState<Job | null>(null);
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
          .from("jobs")
          .select("*")
          .eq("id", id)
          .eq("status", "PUBLISHED")
          .single();

        if (error || !data) {
          throw new Error("No se encontró la publicación.");
        }

        const row = data as Job;
        setItem(row);

        await supabase
          .from("jobs")
          .update({ views: (row.views || 0) + 1 })
          .eq("id", row.id);

        setMsg("");
      } catch (e: any) {
        setMsg(e?.message || "Error cargando publicación");
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

  const whatsappHref = item?.whatsapp
    ? `https://wa.me/${item.whatsapp.replace(/[^\d]/g, "")}`
    : null;

  if (!item) {
    return (
      <main style={pageWrap}>
        <div style={pageContainer}>
          <a href="/trabajo" style={backStyle}>
            ← Volver a trabajo
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
        <a href="/trabajo" style={backStyle}>
          ← Volver a trabajo
        </a>

        <div style={topGrid}>
          <div>
            <div style={badgeRow}>
              {isPetrol && <Badge bg="#111827" text="🛢 PRIORIDAD PETROLERA" />}
              {!isPetrol && isUrgent && <Badge bg="#991B1B" text="🔴 URGENTE" />}
              {!isPetrol && !isUrgent && isFeatured && (
                <Badge bg="#92400E" text="⭐ DESTACADO" />
              )}
              <Badge bg="#E5E7EB" text={jobTypeLabel(item.job_type)} dark />
            </div>

            <h1 style={titleStyle}>{item.title || "Sin título"}</h1>

            <div style={metaRow}>
              <div style={townStyle}>📍 {item.town || "Sin ciudad"}</div>
              <div style={viewsStyle}>👁 {item.views || 0} visitas</div>
            </div>

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
              border: isPetrol
                ? "2px solid #F97316"
                : isUrgent
                ? "2px solid #DC2626"
                : isFeatured
                ? "2px solid #F59E0B"
                : "1px solid #E5E7EB",
            }}
          >
            <div style={asideTopLabel}>Tipo</div>

            <div style={asideMainValue}>
              {jobTypeLabel(item.job_type)}
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
              <FavoriteButton itemType="job" itemId={item.id} />
            </div>

            <div style={trustBox}>
              <div style={trustTitle}>Consejo</div>
              <div style={trustText}>
                Verifica condiciones, horarios, ubicación y forma de contacto antes
                de avanzar.
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

const asideMainValue: React.CSSProperties = {
  marginTop: 8,
  fontSize: 30,
  fontWeight: 950,
  color: "#0F172A",
  lineHeight: 1.1,
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