"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

const PLAN_FREE = 0;
const PLAN_URGENT = 2500;
const PLAN_DURATION_LABEL = "30 días";

type LocationRow = {
  id: string;
  name: string;
  region: string;
  province: string;
  is_featured: boolean;
};

type JobRow = {
  id: string;
  user_id: string;
  title: string | null;
  town: string | null;
  whatsapp: string | null;
  description: string | null;
  status: string | null;
  job_type: "SEEKING" | "OFFERING" | null;
};

export default function Page() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [msg, setMsg] = useState("Cargando...");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [title, setTitle] = useState("");
  const [town, setTown] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [description, setDescription] = useState("");
  const [jobType, setJobType] = useState<"SEEKING" | "OFFERING">("SEEKING");

  const [plan, setPlan] = useState<"FREE" | "URGENT">("FREE");
  const [locations, setLocations] = useState<LocationRow[]>([]);

  const canPublish = useMemo(() => {
    return (
      title.trim().length >= 4 &&
      town.trim().length >= 2 &&
      whatsapp.trim().length >= 6 &&
      description.trim().length >= 20
    );
  }, [title, town, whatsapp, description]);

  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    try {
      setMsg("Cargando...");
      await loadLocations();
      await loadJob();
      setMsg("");
    } catch (e: any) {
      setMsg(e?.message || "Error cargando empleo");
    }
  };

  const loadLocations = async () => {
    const supabase = supabaseBrowser();

    const { data, error } = await supabase
      .from("locations")
      .select("id,name,region,province,is_featured")
      .order("is_featured", { ascending: false })
      .order("region", { ascending: true })
      .order("name", { ascending: true });

    if (error) throw error;
    setLocations((data ?? []) as LocationRow[]);
  };

  const loadJob = async () => {
    if (!id) return;

    const supabase = supabaseBrowser();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Debes iniciar sesión.");

    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    const row = data as JobRow;

    if (row.user_id !== userData.user.id) {
      throw new Error("No tienes permiso.");
    }

    setTitle(row.title || "");
    setTown(row.town || "");
    setWhatsapp(row.whatsapp || "");
    setDescription(row.description || "");
    setJobType(row.job_type || "SEEKING");
  };

  const buildPayload = () => ({
    title: title.trim(),
    town: town.trim(),
    whatsapp: whatsapp.trim() || null,
    description: description.trim(),
    job_type: jobType,
  });

  const saveDraft = async () => {
    try {
      setSaving(true);
      setMsg("");

      const supabase = supabaseBrowser();

      const { error } = await supabase
        .from("jobs")
        .update({
          ...buildPayload(),
          status: "DRAFT",
        })
        .eq("id", id);

      if (error) throw error;

      setMsg("Guardado ✅");
      router.push("/mis-empleos");
    } catch (e: any) {
      setMsg(e?.message || "Error guardando");
    } finally {
      setSaving(false);
    }
  };

  const continueToPayment = async () => {
    try {
      setPublishing(true);
      setMsg("");

      if (!canPublish) {
        setMsg("Completa todos los campos antes de continuar.");
        return;
      }

      const supabase = supabaseBrowser();

      await supabase
        .from("jobs")
        .update({
          ...buildPayload(),
          status: "DRAFT",
        })
        .eq("id", id);

      const amount = plan === "URGENT" ? PLAN_URGENT : PLAN_FREE;

      router.push(
        `/pagar?type=job&id=${id}&amount=${amount}&urgent=${
          plan === "URGENT" ? 1 : 0
        }`
      );
    } catch (e: any) {
      setMsg(e?.message || "Error preparando publicación");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <main style={page}>
      <div style={container}>
        <button onClick={() => router.push("/mis-empleos")} style={backBtn}>
          ← Volver
        </button>

        <h1 style={titleStyle}>Publicar trabajo</h1>
        <p style={subtitle}>
          Completa los datos para publicar en la zona energética.
        </p>

        {msg && <p style={{ marginTop: 10 }}>{msg}</p>}

        {/* FORM */}
        <div style={card}>
          <SectionTitle text="Información del puesto" />

          <input
            placeholder="Ej: Soldador con experiencia en oil & gas"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={input}
          />

          <select value={jobType} onChange={(e) => setJobType(e.target.value as any)} style={input}>
            <option value="SEEKING">Busco trabajo</option>
            <option value="OFFERING">Ofrezco trabajo</option>
          </select>

          <select value={town} onChange={(e) => setTown(e.target.value)} style={input}>
            <option value="">Elegí localidad</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.name}>
                {loc.name} — {loc.region}
              </option>
            ))}
          </select>

          <input
            placeholder="WhatsApp"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            style={input}
          />

          <textarea
            placeholder="Describe el trabajo, requisitos, horarios, etc..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ ...input, minHeight: 120 }}
          />
        </div>

        {/* PLANES */}
        <div style={card}>
          <SectionTitle text="Impulsa tu publicación" />

          <div style={{ display: "grid", gap: 12 }}>
            <PlanCard
              active={plan === "FREE"}
              onClick={() => setPlan("FREE")}
              title="Publicación estándar"
              price="$0"
              desc="Publicación normal"
            />

            <PlanCard
              active={plan === "URGENT"}
              onClick={() => setPlan("URGENT")}
              title="🔴 Publicación urgente"
              price={`$${PLAN_URGENT}`}
              desc="Arriba de todo durante 9 días"
              highlight
            />
          </div>
        </div>

        {/* CTA */}
        <div style={ctaBox}>
          <div>
            Total:{" "}
            <b>${plan === "URGENT" ? PLAN_URGENT : PLAN_FREE} ARS</b>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={saveDraft} style={secondaryBtn}>
              Guardar
            </button>

            <button onClick={continueToPayment} style={primaryBtn}>
              Continuar →
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

/* COMPONENTES UI */

function SectionTitle({ text }: { text: string }) {
  return (
    <div style={{ fontWeight: 900, marginBottom: 10 }}>
      {text}
    </div>
  );
}

function PlanCard({
  active,
  onClick,
  title,
  price,
  desc,
  highlight,
}: any) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: 14,
        borderRadius: 10,
        cursor: "pointer",
        border: active ? "2px solid #F97316" : "1px solid #ddd",
        background: highlight ? "#fff3f3" : "white",
      }}
    >
      <strong>{title}</strong>
      <div>{price} / 30 días</div>
      <small>{desc}</small>
    </div>
  );
}

/* ESTILOS */

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#F8F7F3",
  padding: 30,
};

const container: React.CSSProperties = {
  maxWidth: 760,
  margin: "0 auto",
};

const titleStyle: React.CSSProperties = {
  fontSize: 36,
  fontWeight: 900,
};

const subtitle: React.CSSProperties = {
  color: "#64748B",
};

const card: React.CSSProperties = {
  marginTop: 20,
  padding: 20,
  borderRadius: 12,
  background: "white",
  border: "1px solid #E5E7EB",
};

const input: React.CSSProperties = {
  width: "100%",
  padding: 10,
  marginTop: 10,
  borderRadius: 6,
  border: "1px solid #ccc",
};

const ctaBox: React.CSSProperties = {
  marginTop: 20,
  padding: 16,
  background: "white",
  border: "1px solid #ddd",
  borderRadius: 10,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const primaryBtn: React.CSSProperties = {
  padding: 12,
  background: "#F97316",
  color: "white",
  border: "none",
  borderRadius: 8,
  fontWeight: "bold",
};

const secondaryBtn: React.CSSProperties = {
  padding: 12,
  background: "white",
  border: "1px solid #ccc",
  borderRadius: 8,
};

const backBtn: React.CSSProperties = {
  padding: "6px 10px",
  border: "1px solid #ccc",
  borderRadius: 6,
  background: "white",
};