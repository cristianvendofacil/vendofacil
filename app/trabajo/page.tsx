"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Job = {
  id: string;
  title: string | null;
  town: string | null;
  description: string | null;
  job_type: string | null;
  featured_until: string | null;
  urgent_until: string | null;
  petrol_priority: boolean | null;
  petrol_priority_until: string | null;
  views: number | null;
  created_at: string | null;
};

function jobTypeLabel(value?: string | null) {
  if (!value) return "Trabajo";
  if (value === "SEEKING") return "Busco trabajo";
  if (value === "OFFERING") return "Ofrezco trabajo";
  return value;
}

export default function TrabajoPage() {
  const [items, setItems] = useState<Job[]>([]);
  const [msg, setMsg] = useState("Cargando...");

  useEffect(() => {
    const load = async () => {
      try {
        setMsg("Cargando...");
        const supabase = supabaseBrowser();

        const { data, error } = await supabase
          .from("jobs")
          .select("*")
          .eq("status", "PUBLISHED")
          .order("created_at", { ascending: false });

        if (error) throw error;

        const rows = (data ?? []) as Job[];
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
        setMsg(sorted.length ? "" : "No hay publicaciones de trabajo.");
      } catch (e: any) {
        setItems([]);
        setMsg(e?.message || "Error cargando trabajos");
      }
    };

    load();
  }, []);

  const summary = useMemo(() => {
    const now = Date.now();

    return {
      petrol: items.filter(
        (x) =>
          x.petrol_priority &&
          x.petrol_priority_until &&
          new Date(x.petrol_priority_until).getTime() > now
      ).length,
      urgent: items.filter(
        (x) => x.urgent_until && new Date(x.urgent_until).getTime() > now
      ).length,
      featured: items.filter(
        (x) => x.featured_until && new Date(x.featured_until).getTime() > now
      ).length,
    };
  }, [items]);

  return (
    <main className="vf-container" style={{ padding: "28px 20px 40px" }}>
      <div style={hero}>
        <div>
          <h1 style={title}>
            Oportunidades laborales en{" "}
            <span style={{ color: "#f97316" }}>Vaca Muerta</span>
          </h1>

          <p style={subtitle}>
            Empleo en petróleo, construcción, logística y servicios.
          </p>

          <a
            href="/publicar?type=job"
            className="vf-btn-primary"
            style={{ marginTop: 16 }}
          >
            Publicar trabajo
          </a>
        </div>

        <div style={stats}>
          <Stat label="Publicaciones" value={items.length} />
          <Stat label="Petroleras" value={summary.petrol} color="#f97316" />
          <Stat label="Urgentes" value={summary.urgent} color="#dc2626" />
          <Stat label="Destacadas" value={summary.featured} color="#f59e0b" />
        </div>
      </div>

      {msg && <p style={{ marginTop: 20 }}>{msg}</p>}

      <div style={grid}>
        {items.map((item) => {
          const now = Date.now();

          const isPetrol =
            item.petrol_priority &&
            item.petrol_priority_until &&
            new Date(item.petrol_priority_until).getTime() > now;

          const isUrgent =
            item.urgent_until &&
            new Date(item.urgent_until).getTime() > now;

          const isFeatured =
            item.featured_until &&
            new Date(item.featured_until).getTime() > now;

          return (
            <a key={item.id} href={`/trabajo/${item.id}`} style={card}>
              <div style={cardTop}>
                <div style={badges}>
                  {isPetrol && <Badge text="🛢 PETROLERA" />}
                  {!isPetrol && isUrgent && <Badge text="🔴 URGENTE" />}
                  {!isPetrol && !isUrgent && isFeatured && (
                    <Badge text="⭐ DESTACADO" />
                  )}
                </div>

                <div style={vfBox}>VF</div>
              </div>

              <div style={cardBody}>
                <div style={jobType}>{jobTypeLabel(item.job_type)}</div>

                <div style={jobTitle}>{item.title || "Sin título"}</div>

                <div style={town}>📍 {item.town || "Sin ciudad"}</div>

                {item.description && (
                  <div style={desc}>
                    {item.description.slice(0, 90)}
                    {item.description.length > 90 ? "..." : ""}
                  </div>
                )}

                <div style={views}>👁 {item.views || 0} visitas</div>
              </div>
            </a>
          );
        })}
      </div>
    </main>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span
      style={{
        background: "#111827",
        color: "white",
        fontSize: 12,
        padding: "4px 8px",
        borderRadius: 999,
        fontWeight: 800,
      }}
    >
      {text}
    </span>
  );
}

function Stat({
  label,
  value,
  color = "#0f172a",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div style={stat}>
      <div style={{ color: "#64748B", fontSize: 13 }}>{label}</div>
      <div style={{ fontWeight: 900, fontSize: 26, color }}>
        {value}
      </div>
    </div>
  );
}

const hero: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.5fr 1fr",
  gap: 20,
  alignItems: "center",
};

const title: React.CSSProperties = {
  fontSize: 42,
  fontWeight: 900,
};

const subtitle: React.CSSProperties = {
  marginTop: 10,
  color: "#64748B",
  fontSize: 18,
};

const stats: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2,1fr)",
  gap: 12,
};

const stat: React.CSSProperties = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 12,
};

const grid: React.CSSProperties = {
  marginTop: 28,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
  gap: 18,
};

const card: React.CSSProperties = {
  display: "block",
  textDecoration: "none",
  background: "white",
  borderRadius: 20,
  overflow: "hidden",
  border: "1px solid #e5e7eb",
  boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
};

const cardTop: React.CSSProperties = {
  padding: 12,
};

const badges: React.CSSProperties = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
};

const vfBox: React.CSSProperties = {
  marginTop: 10,
  height: 120,
  borderRadius: 12,
  background: "linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#f97316 100%)",
  display: "grid",
  placeItems: "center",
  color: "white",
  fontWeight: 900,
  fontSize: 28,
};

const cardBody: React.CSSProperties = {
  padding: 14,
};

const jobType: React.CSSProperties = {
  fontSize: 12,
  color: "#64748B",
};

const jobTitle: React.CSSProperties = {
  marginTop: 6,
  fontWeight: 900,
  fontSize: 18,
};

const town: React.CSSProperties = {
  marginTop: 6,
  color: "#64748B",
};

const desc: React.CSSProperties = {
  marginTop: 10,
  fontSize: 14,
  color: "#334155",
  lineHeight: 1.5,
};

const views: React.CSSProperties = {
  marginTop: 10,
  fontSize: 13,
  color: "#64748B",
};