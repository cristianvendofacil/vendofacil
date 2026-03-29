"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

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

type PricingRuleRow = {
  id: string;
  item_type: string;
  plan_code: string;
  title: string | null;
  price_ars: number;
  is_active: boolean;
};

export default function Page() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [msg, setMsg] = useState("Cargando...");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [pricingLoading, setPricingLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [town, setTown] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [description, setDescription] = useState("");
  const [jobType, setJobType] = useState<"SEEKING" | "OFFERING">("SEEKING");

  const [selectedPlanCode, setSelectedPlanCode] = useState("normal");
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRuleRow[]>([]);

  const canPublish = useMemo(() => {
    return (
      title.trim().length >= 4 &&
      town.trim().length >= 2 &&
      whatsapp.trim().length >= 6 &&
      description.trim().length >= 20
    );
  }, [title, town, whatsapp, description]);

  const jobPlans = useMemo(() => {
    const order: Record<string, number> = {
      normal: 1,
      urgent: 2,
      featured: 3,
      petrol: 4,
    };

    return pricingRules
      .filter((rule) => String(rule.item_type || "").toLowerCase() === "job" && rule.is_active)
      .map((rule) => ({
        ...rule,
        plan_code: String(rule.plan_code || "").toLowerCase(),
      }))
      .sort((a, b) => {
        const aOrder = order[a.plan_code] ?? 999;
        const bOrder = order[b.plan_code] ?? 999;

        if (aOrder !== bOrder) return aOrder - bOrder;
        return (a.title || "").localeCompare(b.title || "");
      });
  }, [pricingRules]);

  const selectedRule = useMemo(() => {
    return (
      jobPlans.find((rule) => rule.plan_code === selectedPlanCode) ||
      jobPlans[0] ||
      null
    );
  }, [jobPlans, selectedPlanCode]);

  const amount = useMemo(() => {
    return selectedRule ? Number(selectedRule.price_ars || 0) : 0;
  }, [selectedRule]);

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    if (jobPlans.length > 0) {
      const stillExists = jobPlans.some(
        (rule) => rule.plan_code === selectedPlanCode
      );

      if (!stillExists) {
        setSelectedPlanCode(jobPlans[0].plan_code);
      }
    }
  }, [jobPlans, selectedPlanCode]);

  const load = async () => {
    try {
      setMsg("Cargando...");

      await Promise.all([loadLocations(), loadJob(), loadPricing()]);

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

  const loadPricing = async () => {
    try {
      setPricingLoading(true);

      const res = await fetch("/api/pricing/public", {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "No se pudieron cargar los precios");
      }

      setPricingRules((json?.data ?? []) as PricingRuleRow[]);
    } finally {
      setPricingLoading(false);
    }
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

      if (!selectedRule) {
        setMsg("No hay un plan activo disponible para trabajo.");
        return;
      }

      const supabase = supabaseBrowser();

      const { error: updateError } = await supabase
        .from("jobs")
        .update({
          ...buildPayload(),
          status: "DRAFT",
        })
        .eq("id", id);

      if (updateError) throw updateError;

      const planCode = selectedRule.plan_code;
      const planParam = planCodeToPagarPlan(planCode);

      router.push(
        `/pagar?itemType=job&id=${encodeURIComponent(
          String(id || "")
        )}&title=${encodeURIComponent(
          title.trim() || "Trabajo"
        )}&amount=${amount}&plan=${encodeURIComponent(
          planParam
        )}&featured=${planCode === "featured" ? 1 : 0}&urgent=${
          planCode === "urgent" ? 1 : 0
        }&petrol=${planCode === "petrol" ? 1 : 0}`
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

        <div style={card}>
          <SectionTitle text="Información del puesto" />

          <input
            placeholder="Ej: Soldador con experiencia en oil & gas"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={input}
          />

          <select
            value={jobType}
            onChange={(e) => setJobType(e.target.value as "SEEKING" | "OFFERING")}
            style={input}
          >
            <option value="SEEKING">Busco trabajo</option>
            <option value="OFFERING">Ofrezco trabajo</option>
          </select>

          <select
            value={town}
            onChange={(e) => setTown(e.target.value)}
            style={input}
          >
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

        <div style={card}>
          <SectionTitle text="Impulsa tu publicación" />

          {pricingLoading ? (
            <div style={{ color: "#64748B" }}>Cargando planes...</div>
          ) : jobPlans.length === 0 ? (
            <div style={{ color: "#b91c1c", fontWeight: 700 }}>
              No hay planes activos para trabajo. Revisa el admin.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {jobPlans.map((rule) => (
                <PlanCard
                  key={rule.id}
                  active={selectedPlanCode === rule.plan_code}
                  onClick={() => setSelectedPlanCode(rule.plan_code)}
                  title={rule.title?.trim() || defaultPlanTitle("job", rule.plan_code)}
                  price={formatPrice(rule.price_ars)}
                  desc={defaultPlanDescription("job", rule.plan_code)}
                  highlight={rule.plan_code !== "normal"}
                />
              ))}
            </div>
          )}
        </div>

        <div style={ctaBox}>
          <div>
            Total: <b>{amount === 0 ? "Gratis" : `$${amount} ARS`}</b>
            <div style={{ marginTop: 4, fontSize: 13, color: "#64748B" }}>
              {PLAN_DURATION_LABEL}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={saveDraft} style={secondaryBtn} disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </button>

            <button
              onClick={continueToPayment}
              style={primaryBtn}
              disabled={publishing || pricingLoading || !selectedRule}
            >
              {publishing ? "Preparando..." : "Continuar →"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function planCodeToPagarPlan(planCode: string): string {
  const normalized = String(planCode || "").toLowerCase();

  if (normalized === "featured") return "FEATURED";
  if (normalized === "urgent") return "URGENT";
  if (normalized === "petrol") return "PETROL";
  return "STANDARD";
}

function formatPrice(value: number | null | undefined): string {
  const amount = Number(value || 0);
  return amount === 0 ? "Gratis" : `$${amount}`;
}

function defaultPlanTitle(itemType: string, planCode: string): string {
  const item = itemType === "job" ? "Trabajo" : "Publicación";
  const normalized = String(planCode || "").toLowerCase();

  if (normalized === "featured") return `${item} destacado`;
  if (normalized === "urgent") return `${item} urgente`;
  if (normalized === "petrol") return `${item} petrolero`;
  return `${item} estándar`;
}

function defaultPlanDescription(itemType: string, planCode: string): string {
  const normalized = String(planCode || "").toLowerCase();

  if (itemType === "job") {
    if (normalized === "urgent") return "Arriba de todo durante 9 días";
    if (normalized === "featured") return "Mayor visibilidad dentro de la sección";
    if (normalized === "petrol") return "Mayor prioridad para el entorno petrolero";
    return "Publicación normal";
  }

  return "Publicación";
}

function SectionTitle({ text }: { text: string }) {
  return <div style={{ fontWeight: 900, marginBottom: 10 }}>{text}</div>;
}

function PlanCard({
  active,
  onClick,
  title,
  price,
  desc,
  highlight,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  price: string;
  desc: string;
  highlight?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: 14,
        borderRadius: 10,
        cursor: "pointer",
        border: active ? "2px solid #F97316" : "1px solid #ddd",
        background: highlight ? "#fff7ed" : "white",
      }}
    >
      <strong>{title}</strong>
      <div>
        {price} / {PLAN_DURATION_LABEL}
      </div>
      <small>{desc}</small>
    </div>
  );
}

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