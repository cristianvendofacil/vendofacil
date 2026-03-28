"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

type Job = {
  id: string;
  title: string;
  town: string;
  status: string;
  created_at: string;
  published_until: string | null;
  featured_until: string | null;
  job_type: "SEEKING" | "OFFERING";
  category: string;
  salary: string;
};

function jobTypeLabel(value: "SEEKING" | "OFFERING") {
  return value === "SEEKING" ? "Busco trabajo" : "Ofrezco puesto";
}

export default function MyJobsPage() {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [items, setItems] = useState<Job[]>([]);
  const [msg, setMsg] = useState("Cargando...");
  const [workingId, setWorkingId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setMsg("Cargando...");

      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;

      if (!userRes.user) {
        setMsg("Debes iniciar sesión.");
        setItems([]);
        return;
      }

      const { data, error } = await supabase
        .from("jobs")
        .select(
          "id,title,town,status,created_at,published_until,featured_until,job_type,category,salary"
        )
        .eq("user_id", userRes.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const rows = (data ?? []) as Job[];
      setItems(rows);
      setMsg(rows.length ? "" : "No tenés publicaciones todavía.");
    } catch (e: any) {
      setMsg(e?.message || "Error cargando publicaciones");
      setItems([]);
    }
  };

  const createDraft = async () => {
    try {
      setMsg("Creando borrador...");

      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) throw new Error("Debes iniciar sesión.");

      const payload = {
        user_id: userRes.user.id,
        title: "Nueva publicación laboral",
        town: "Añelo",
        description: "",
        whatsapp: "",
        job_type: "OFFERING",
        category: "GENERAL",
        schedule_type: "FULL_TIME",
        salary: "",
        status: "DRAFT",
        is_published: false,
      };

      const { data, error } = await supabase
        .from("jobs")
        .insert(payload)
        .select("id")
        .single();

      if (error) throw error;

      router.push(`/mis-empleos/${data.id}`);
    } catch (e: any) {
      setMsg("Error creando borrador: " + (e?.message || ""));
    }
  };

  const publish = async (id: string) => {
    try {
      setWorkingId(id);
      setMsg("Publicando...");

      const publishedUntil = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString();

      const { error } = await supabase
        .from("jobs")
        .update({
          status: "PUBLISHED",
          is_published: true,
          published_until: publishedUntil,
        })
        .eq("id", id);

      if (error) throw error;

      await load();
    } catch (e: any) {
      setMsg("Error publicando: " + (e?.message || ""));
    } finally {
      setWorkingId(null);
    }
  };

  const feature = async (id: string) => {
    try {
      setWorkingId(id);
      setMsg("Destacando...");

      const featuredUntil = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString();

      const { error } = await supabase
        .from("jobs")
        .update({ featured_until: featuredUntil })
        .eq("id", id);

      if (error) throw error;

      await load();
    } catch (e: any) {
      setMsg("Error destacando: " + (e?.message || ""));
    } finally {
      setWorkingId(null);
    }
  };

  const remove = async (id: string) => {
    const ok = confirm("¿Eliminar esta publicación?");
    if (!ok) return;

    try {
      setWorkingId(id);
      setMsg("Eliminando...");

      const { error } = await supabase.from("jobs").delete().eq("id", id);
      if (error) throw error;

      await load();
    } catch (e: any) {
      setMsg("Error eliminando: " + (e?.message || ""));
    } finally {
      setWorkingId(null);
    }
  };

  const isFeatured = (x: Job) =>
    !!x.featured_until && new Date(x.featured_until).getTime() > Date.now();

  const summary = useMemo(() => {
    const featured = items.filter((x) => isFeatured(x)).length;
    const published = items.filter((x) => x.status === "PUBLISHED").length;
    const drafts = items.filter((x) => x.status === "DRAFT").length;

    return {
      total: items.length,
      published,
      drafts,
      featured,
    };
  }, [items]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(249,115,22,0.06), transparent 24%), linear-gradient(180deg, #f8fafc 0%, #f8f7f3 100%)",
        padding: "28px 20px 44px",
        fontFamily: "system-ui",
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
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
                background: "#EFF6FF",
                color: "#1D4ED8",
                border: "1px solid #93C5FD",
                padding: "8px 12px",
                borderRadius: 999,
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              💼 Gestión de publicaciones laborales
            </div>

            <h1
              style={{
                margin: "16px 0 0",
                fontSize: 46,
                lineHeight: 1.04,
                color: "#0F172A",
                fontWeight: 950,
                letterSpacing: "-0.03em",
              }}
            >
              Mis publicaciones laborales
            </h1>

            <p
              style={{
                marginTop: 12,
                color: "#64748B",
                fontSize: 18,
                lineHeight: 1.65,
                maxWidth: 760,
              }}
            >
              Crea, edita, publica y destaca tus avisos laborales para la zona energética.
            </p>

            <button
              type="button"
              onClick={createDraft}
              style={{
                marginTop: 18,
                padding: "12px 16px",
                background: "#F97316",
                color: "white",
                border: "none",
                borderRadius: 12,
                cursor: "pointer",
                fontWeight: 900,
                boxShadow: "0 10px 24px rgba(249,115,22,0.18)",
              }}
            >
              + Crear publicación
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2,1fr)",
              gap: 12,
            }}
          >
            <SummaryCard label="Total" value={summary.total} />
            <SummaryCard label="Publicadas" value={summary.published} accent="#2563EB" />
            <SummaryCard label="Borradores" value={summary.drafts} accent="#64748B" />
            <SummaryCard label="Destacadas" value={summary.featured} accent="#D97706" />
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

        <section
          style={{
            marginTop: 26,
            display: "grid",
            gap: 16,
          }}
        >
          {items.map((x) => {
            const featured = isFeatured(x);
            const busy = workingId === x.id;
            const isPublished = x.status === "PUBLISHED";

            return (
              <div
                key={x.id}
                style={{
                  border: featured ? "2px solid #F59E0B" : "1px solid #E5E7EB",
                  borderRadius: 20,
                  background: "white",
                  overflow: "hidden",
                  boxShadow: featured
                    ? "0 14px 34px rgba(245,158,11,0.14)"
                    : "0 10px 26px rgba(15,23,42,0.05)",
                }}
              >
                <div
                  style={{
                    background: featured
                      ? "linear-gradient(135deg, #78350F 0%, #F59E0B 100%)"
                      : "linear-gradient(135deg, #0F172A 0%, #334155 100%)",
                    color: "white",
                    padding: 18,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        background: "rgba(255,255,255,0.15)",
                        color: "white",
                        fontWeight: 900,
                        fontSize: 12,
                        padding: "6px 10px",
                        borderRadius: 999,
                      }}
                    >
                      {jobTypeLabel(x.job_type)}
                    </span>

                    <span
                      style={{
                        background:
                          x.status === "PUBLISHED"
                            ? "rgba(34,197,94,0.18)"
                            : "rgba(255,255,255,0.15)",
                        color: "white",
                        fontWeight: 900,
                        fontSize: 12,
                        padding: "6px 10px",
                        borderRadius: 999,
                      }}
                    >
                      {x.status}
                    </span>

                    {featured && (
                      <span
                        style={{
                          background: "rgba(255,255,255,0.18)",
                          color: "white",
                          fontWeight: 900,
                          fontSize: 12,
                          padding: "6px 10px",
                          borderRadius: 999,
                        }}
                      >
                        ⭐ DESTACADO
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      marginTop: 14,
                      fontWeight: 950,
                      fontSize: 28,
                      lineHeight: 1.08,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {x.title || "Sin título"}
                  </div>
                </div>

                <div style={{ padding: 18 }}>
                  <div
                    style={{
                      color: "#64748B",
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    📍 {x.town || "Sin ciudad"} · {jobTypeLabel(x.job_type)} · {x.category}
                  </div>

                  {x.salary && (
                    <div
                      style={{
                        marginTop: 12,
                        fontWeight: 900,
                        fontSize: 22,
                        color: "#0F172A",
                      }}
                    >
                      {x.salary}
                    </div>
                  )}

                  <div
                    style={{
                      marginTop: 12,
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
                      gap: 10,
                    }}
                  >
                    <MiniInfo
                      label="Creada"
                      value={new Date(x.created_at).toLocaleDateString()}
                    />
                    <MiniInfo
                      label="Estado"
                      value={x.status}
                    />
                    <MiniInfo
                      label="Destacada hasta"
                      value={
                        featured && x.featured_until
                          ? new Date(x.featured_until).toLocaleDateString()
                          : "No"
                      }
                    />
                  </div>

                  <div
                    style={{
                      marginTop: 18,
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      style={secondaryActionBtn}
                      onClick={() => router.push(`/mis-empleos/${x.id}`)}
                    >
                      Editar
                    </button>

                    {!isPublished && (
                      <button
                        style={primaryActionBtn}
                        onClick={() => publish(x.id)}
                        disabled={busy}
                      >
                        {busy ? "Publicando..." : "Publicar"}
                      </button>
                    )}

                    {isPublished && !featured && (
                      <button
                        style={goldActionBtn}
                        onClick={() => feature(x.id)}
                        disabled={busy}
                      >
                        {busy ? "Destacando..." : "Destacar 7 días ⭐"}
                      </button>
                    )}

                    <button
                      style={secondaryActionBtn}
                      onClick={() => remove(x.id)}
                      disabled={busy}
                    >
                      {busy ? "Procesando..." : "Eliminar"}
                    </button>

                    {isPublished && (
                      <a href={`/trabajo/${x.id}`} style={{ textDecoration: "none" }}>
                        <button style={secondaryActionBtn}>Ver público</button>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
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
          fontWeight: 950,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function MiniInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: "#F8FAFC",
        border: "1px solid #E2E8F0",
        borderRadius: 14,
        padding: 12,
      }}
    >
      <div
        style={{
          color: "#64748B",
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 6,
          color: "#0F172A",
          fontSize: 14,
          fontWeight: 900,
          lineHeight: 1.35,
        }}
      >
        {value}
      </div>
    </div>
  );
}

const primaryActionBtn: React.CSSProperties = {
  padding: "10px 14px",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
  background: "#111",
  color: "white",
  fontWeight: 900,
};

const secondaryActionBtn: React.CSSProperties = {
  padding: "10px 14px",
  border: "1px solid #CBD5E1",
  borderRadius: 10,
  cursor: "pointer",
  background: "white",
  color: "#0F172A",
  fontWeight: 800,
};

const goldActionBtn: React.CSSProperties = {
  padding: "10px 14px",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
  background: "#F59E0B",
  color: "#111827",
  fontWeight: 900,
};