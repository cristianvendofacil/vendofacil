"use client";

import { ChangeEvent, CSSProperties, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

const BUCKET = "classified-photos";
const PLAN_DURATION_LABEL = "30 días";

type PlanType = "STANDARD" | "FEATURED" | "URGENT";

type PlanConfig = {
  label: string;
  price: number;
  photoLimit: number;
  badge: string;
  toneBg: string;
  toneBorder: string;
  toneText: string;
  note: string;
};

type PricingRuleRow = {
  id: string;
  item_type: string;
  plan_code: string;
  title: string;
  price_ars: number;
  is_active: boolean;
};

const FALLBACK_PLAN_CONFIG: Record<PlanType, PlanConfig> = {
  STANDARD: {
    label: "Publicación estándar",
    price: 1000,
    photoLimit: 3,
    badge: "Normal",
    toneBg: "#FFFFFF",
    toneBorder: "#CBD5E1",
    toneText: "#0F172A",
    note: "Incluye hasta 3 fotos.",
  },
  FEATURED: {
    label: "Publicación destacada",
    price: 4000,
    photoLimit: 6,
    badge: "Destacado",
    toneBg: "#FFF7ED",
    toneBorder: "#F59E0B",
    toneText: "#92400E",
    note: "Incluye hasta 6 fotos y mejor visibilidad.",
  },
  URGENT: {
    label: "Publicación urgente",
    price: 4000,
    photoLimit: 10,
    badge: "Urgente",
    toneBg: "#FEF2F2",
    toneBorder: "#DC2626",
    toneText: "#991B1B",
    note: "Incluye hasta 10 fotos y prioridad superior.",
  },
};

type LocationRow = {
  id: string;
  name: string;
  region: string | null;
  province: string | null;
  is_featured: boolean | null;
};

type ClassifiedRow = {
  id: string;
  user_id: string;
  title: string | null;
  town: string | null;
  whatsapp: string | null;
  description: string | null;
  status: string | null;
  category: string | null;
  price: number | null;
  currency: string | null;
  photo_paths: string[] | null;
};

function planToRuleCode(plan: PlanType): string {
  if (plan === "FEATURED") return "featured";
  if (plan === "URGENT") return "urgent";
  return "normal";
}

function buildPlanConfigFromRules(rules: PricingRuleRow[]): Record<PlanType, PlanConfig> {
  const getRulePrice = (code: string, fallback: number) => {
    const rule = rules.find(
      (r) =>
        r.item_type === "classified" &&
        r.plan_code.toLowerCase() === code.toLowerCase() &&
        r.is_active
    );
    return rule?.price_ars ?? fallback;
  };

  return {
    STANDARD: {
      ...FALLBACK_PLAN_CONFIG.STANDARD,
      price: getRulePrice("normal", FALLBACK_PLAN_CONFIG.STANDARD.price),
    },
    FEATURED: {
      ...FALLBACK_PLAN_CONFIG.FEATURED,
      price: getRulePrice("featured", FALLBACK_PLAN_CONFIG.FEATURED.price),
    },
    URGENT: {
      ...FALLBACK_PLAN_CONFIG.URGENT,
      price: getRulePrice("urgent", FALLBACK_PLAN_CONFIG.URGENT.price),
    },
  };
}

export default function ClassifiedEditorPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [msg, setMsg] = useState("Cargando...");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const [title, setTitle] = useState("");
  const [town, setTown] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [price, setPrice] = useState("");
  const [currency] = useState("ARS");

  const [plan, setPlan] = useState<PlanType>("STANDARD");
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [planConfig, setPlanConfig] =
    useState<Record<PlanType, PlanConfig>>(FALLBACK_PLAN_CONFIG);

  const [userId, setUserId] = useState("");
  const [photoPaths, setPhotoPaths] = useState<string[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  const selectedPlan = planConfig[plan];
  const maxPhotosForPlan = selectedPlan.photoLimit;
  const totalAmount = selectedPlan.price;

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (title.trim().length < 4) errors.push("Título muy corto");
    if (!town.trim()) errors.push("Falta ciudad");
    if (whatsapp.trim().length < 6) errors.push("WhatsApp inválido");
    if (description.trim().length < 12) errors.push("Descripción muy corta");
    if (!price.trim()) errors.push("Falta precio");
    return errors;
  }, [title, town, whatsapp, description, price]);

  const canPublish = validationErrors.length === 0;

  useEffect(() => {
    void loadAll();
  }, [id]);

  const loadAll = async () => {
    try {
      if (!id) {
        setMsg("ID inválido.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setMsg("Cargando...");

      const supabase = supabaseBrowser();

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error("Debes iniciar sesión.");

      setUserId(userData.user.id);

      const [locationsResult, classifiedResult, pricingRulesResult] = await Promise.all([
        supabase
          .from("locations")
          .select("id,name,region,province,is_featured")
          .order("is_featured", { ascending: false })
          .order("region", { ascending: true })
          .order("name", { ascending: true }),
        supabase.from("classifieds").select("*").eq("id", id).single(),
        supabase
          .from("pricing_rules")
          .select("id,item_type,plan_code,title,price_ars,is_active")
          .eq("item_type", "classified"),
      ]);

      if (locationsResult.error) throw locationsResult.error;
      if (classifiedResult.error) throw classifiedResult.error;
      if (pricingRulesResult.error) throw pricingRulesResult.error;

      const row = classifiedResult.data as ClassifiedRow;

      if (row.user_id !== userData.user.id) {
        throw new Error("No tienes permiso para editar este clasificado.");
      }

      const pricingRules = (pricingRulesResult.data ?? []) as PricingRuleRow[];
      setPlanConfig(buildPlanConfigFromRules(pricingRules));

      setLocations((locationsResult.data ?? []) as LocationRow[]);
      setTitle(row.title || "");
      setTown(row.town || "");
      setWhatsapp(row.whatsapp || "");
      setDescription(row.description || "");
      setCategory(row.category || "GENERAL");
      setPrice(row.price !== null && row.price !== undefined ? String(row.price) : "");

      const paths = Array.isArray(row.photo_paths) ? row.photo_paths : [];
      setPhotoPaths(paths);
      await refreshSignedPhotoUrls(paths);

      setMsg("");
    } catch (e: any) {
      setMsg(e?.message || "Error cargando clasificado");
    } finally {
      setLoading(false);
    }
  };

  const refreshSignedPhotoUrls = async (paths: string[]) => {
    try {
      const supabase = supabaseBrowser();

      if (!paths.length) {
        setPhotoUrls([]);
        return;
      }

      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(paths, 3600);

      if (error) throw error;

      setPhotoUrls((data ?? []).map((x) => x?.signedUrl || "").filter(Boolean));
    } catch {
      setPhotoUrls([]);
    }
  };

  const buildPayload = () => ({
    title: title.trim(),
    town: town.trim(),
    whatsapp: whatsapp.trim() || null,
    description: description.trim(),
    category,
    price: Number(price || 0),
    currency,
    photo_paths: photoPaths,
  });

  const saveDraft = async () => {
    try {
      if (!id) return;

      setSaving(true);
      setMsg("");

      const supabase = supabaseBrowser();

      const { error } = await supabase
        .from("classifieds")
        .update({
          ...buildPayload(),
          status: "DRAFT",
        })
        .eq("id", id);

      if (error) throw error;

      setMsg("Guardado ✅");
      router.push("/mis-clasificados");
    } catch (e: any) {
      setMsg(e?.message || "Error guardando borrador");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    try {
      if (!id || !userId) return;

      const files = Array.from(e.target.files || []);
      if (!files.length) return;

      const remaining = maxPhotosForPlan - photoPaths.length;
      if (remaining <= 0) {
        setMsg(`Tu plan permite máximo ${maxPhotosForPlan} fotos.`);
        e.target.value = "";
        return;
      }

      const selectedFiles = files.slice(0, remaining);

      setUploadingPhotos(true);
      setMsg("");

      const supabase = supabaseBrowser();
      const uploadedPaths: string[] = [];

      for (const file of selectedFiles) {
        const safeName = file.name.replace(/\s+/g, "-");
        const path = `${userId}/${id}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}-${safeName}`;

        const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
          upsert: false,
          contentType: file.type || "image/jpeg",
        });

        if (error) throw error;
        uploadedPaths.push(path);
      }

      const nextPaths = [...photoPaths, ...uploadedPaths];

      const { error: updateError } = await supabase
        .from("classifieds")
        .update({ photo_paths: nextPaths })
        .eq("id", id);

      if (updateError) throw updateError;

      setPhotoPaths(nextPaths);
      await refreshSignedPhotoUrls(nextPaths);
      setMsg("Fotos subidas ✅");
      e.target.value = "";
    } catch (e: any) {
      setMsg(e?.message || "Error subiendo fotos");
    } finally {
      setUploadingPhotos(false);
    }
  };

  const removePhoto = async (index: number) => {
    try {
      if (!id) return;

      const pathToRemove = photoPaths[index];
      const nextPaths = photoPaths.filter((_, i) => i !== index);

      const supabase = supabaseBrowser();

      const { error: updateError } = await supabase
        .from("classifieds")
        .update({ photo_paths: nextPaths })
        .eq("id", id);

      if (updateError) throw updateError;

      if (pathToRemove) {
        await supabase.storage.from(BUCKET).remove([pathToRemove]);
      }

      setPhotoPaths(nextPaths);
      await refreshSignedPhotoUrls(nextPaths);
      setMsg("Foto eliminada ✅");
    } catch (e: any) {
      setMsg(e?.message || "Error eliminando foto");
    }
  };

  const continueToPayment = async () => {
    try {
      if (!id) return;

      setPublishing(true);
      setMsg("");

      if (!canPublish) {
        setMsg("Faltan datos: " + validationErrors.join(", "));
        return;
      }

      const supabase = supabaseBrowser();

      const { error } = await supabase
        .from("classifieds")
        .update({
          ...buildPayload(),
          status: "DRAFT",
        })
        .eq("id", id);

      if (error) throw error;

      const qs = new URLSearchParams({
        type: "classified",
        id,
        title: title.trim() || "Clasificado",
        plan,
        planCode: planToRuleCode(plan),
        amount: String(totalAmount),
        durationDays: "30",
        featured: plan === "FEATURED" ? "1" : "0",
        urgent: plan === "URGENT" ? "1" : "0",
      });

      router.push(`/pagar?${qs.toString()}`);
    } catch (e: any) {
      setMsg(e?.message || "Error preparando pago");
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <main style={pageWrap}>
        <div style={container}>
          <div style={loadingCard}>Cargando clasificado...</div>
        </div>
      </main>
    );
  }

  return (
    <main style={pageWrap}>
      <div style={container}>
        <button
          type="button"
          onClick={() => router.push("/mis-clasificados")}
          style={backBtn}
        >
          ← Volver a mis clasificados
        </button>

        <div style={{ marginTop: 18 }}>
          <div style={kicker}>📦 Editor profesional de clasificado</div>
          <h1 style={titleStyle}>Editar clasificado</h1>
          <p style={subtitleStyle}>
            Completa los datos, elige una ciudad válida, sube fotos y selecciona el plan.
          </p>
        </div>

        {msg && (
          <div
            style={{
              ...messageBox,
              background: msg.includes("✅") ? "#ECFDF5" : "#F8FAFC",
              color: msg.includes("✅") ? "#166534" : "#334155",
              borderColor: msg.includes("✅") ? "#BBF7D0" : "#E2E8F0",
            }}
          >
            {msg}
          </div>
        )}

        <div style={layoutGrid}>
          <section style={card}>
            <div style={sectionTitle}>Datos del clasificado</div>

            <div style={formGrid}>
              <div style={fieldBlockFull}>
                <label style={labelStyle}>Título</label>
                <input
                  style={inputStyle}
                  placeholder="Ej: Camioneta 4x4, herramientas, generador..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div style={fieldBlock}>
                <label style={labelStyle}>Ciudad</label>
                <select
                  style={inputStyle}
                  value={town}
                  onChange={(e) => setTown(e.target.value)}
                >
                  <option value="">Elegí ciudad</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.name}>
                      {loc.name}
                      {loc.region ? ` — ${loc.region}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div style={fieldBlock}>
                <label style={labelStyle}>WhatsApp</label>
                <input
                  style={inputStyle}
                  placeholder="Ej: 2991234567"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                />
              </div>

              <div style={fieldBlock}>
                <label style={labelStyle}>Precio</label>
                <input
                  style={inputStyle}
                  placeholder="Ej: 850000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))}
                />
              </div>

              <div style={fieldBlock}>
                <label style={labelStyle}>Moneda</label>
                <input
                  style={{ ...inputStyle, background: "#F1F5F9", fontWeight: 800 }}
                  value="ARS"
                  disabled
                />
              </div>

              <div style={fieldBlockFull}>
                <label style={labelStyle}>Categoría</label>
                <select
                  style={inputStyle}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="GENERAL">General</option>
                  <option value="VEHICULO">Vehículo</option>
                  <option value="HERRAMIENTA">Herramienta</option>
                  <option value="MAQUINARIA">Maquinaria</option>
                  <option value="ELECTRONICA">Electrónica</option>
                  <option value="MUEBLES">Muebles</option>
                  <option value="SERVICIO">Servicio</option>
                </select>
              </div>

              <div style={fieldBlockFull}>
                <label style={labelStyle}>Descripción</label>
                <textarea
                  style={{ ...inputStyle, minHeight: 150, resize: "vertical" }}
                  placeholder="Describe el estado, uso, detalles importantes, entrega, ubicación y todo lo relevante."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div style={subSectionHead}>
              <div style={sectionTitle}>Fotos</div>
              <div style={hintStyle}>
                {photoPaths.length} / {maxPhotosForPlan} usadas
              </div>
            </div>

            <div style={uploadBox}>
              <div style={uploadTopRow}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhotos || photoPaths.length >= maxPhotosForPlan}
                />
                <div style={smallMuted}>
                  Tu plan actual permite hasta {maxPhotosForPlan} fotos.
                </div>
              </div>

              {uploadingPhotos && (
                <div style={{ marginTop: 12, fontWeight: 800 }}>Subiendo fotos...</div>
              )}

              {photoUrls.length > 0 && (
                <div style={photoGrid}>
                  {photoUrls.map((url, index) => (
                    <div key={`${url}-${index}`} style={photoCard}>
                      <img src={url} alt={`Foto ${index + 1}`} style={photoImg} />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        style={removePhotoBtn}
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside style={rightCol}>
            <section style={card}>
              <div style={sectionTitle}>Elegí tu plan</div>

              <div style={planList}>
                {(Object.keys(planConfig) as PlanType[]).map((planKey) => {
                  const config = planConfig[planKey];
                  const active = plan === planKey;

                  return (
                    <button
                      key={planKey}
                      type="button"
                      onClick={() => setPlan(planKey)}
                      style={{
                        ...planBtn,
                        background: config.toneBg,
                        borderColor: active ? config.toneBorder : "#E5E7EB",
                        boxShadow: active ? "0 0 0 2px rgba(249,115,22,0.12)" : "none",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          alignItems: "center",
                        }}
                      >
                        <div style={{ fontWeight: 900, color: "#0F172A" }}>
                          {config.label}
                        </div>
                        <span
                          style={{
                            background: active ? config.toneBorder : "#E5E7EB",
                            color: active ? "white" : "#334155",
                            borderRadius: 999,
                            padding: "5px 9px",
                            fontSize: 12,
                            fontWeight: 900,
                          }}
                        >
                          {config.badge}
                        </span>
                      </div>

                      <div style={{ marginTop: 6, color: config.toneText, fontWeight: 800 }}>
                        ${config.price} / {PLAN_DURATION_LABEL}
                      </div>

                      <div style={{ marginTop: 8, color: "#64748B", fontSize: 14 }}>
                        {config.note}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section style={card}>
              <div style={sectionTitle}>Resumen</div>

              <div style={summaryList}>
                <div style={summaryRow}>
                  <span>Categoría</span>
                  <b>{category}</b>
                </div>

                <div style={summaryRow}>
                  <span>Ciudad</span>
                  <b>{town || "Sin elegir"}</b>
                </div>

                <div style={summaryRow}>
                  <span>Fotos</span>
                  <b>
                    {photoPaths.length} / {maxPhotosForPlan}
                  </b>
                </div>

                <div style={summaryRow}>
                  <span>Duración</span>
                  <b>{PLAN_DURATION_LABEL}</b>
                </div>
              </div>

              <div style={totalBox}>${totalAmount} ARS</div>

              {!canPublish && (
                <div style={errorBox}>
                  Faltan datos para publicar: {validationErrors.join(", ")}
                </div>
              )}

              <div style={actionGrid}>
                <button
                  type="button"
                  onClick={saveDraft}
                  disabled={saving}
                  style={saveBtn}
                >
                  {saving ? "Guardando..." : "Guardar borrador"}
                </button>

                <button
                  type="button"
                  onClick={continueToPayment}
                  disabled={publishing}
                  style={payBtn}
                >
                  {publishing ? "Preparando..." : "Continuar al pago"}
                </button>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

const pageWrap: CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(249,115,22,0.07), transparent 24%), linear-gradient(180deg, #fffaf5 0%, #f8f7f3 100%)",
  padding: "28px 20px 44px",
  fontFamily: "system-ui",
};

const container: CSSProperties = {
  maxWidth: 1120,
  margin: "0 auto",
};

const loadingCard: CSSProperties = {
  background: "white",
  border: "1px solid #E5E7EB",
  borderRadius: 20,
  padding: 24,
  fontWeight: 800,
  color: "#0F172A",
};

const backBtn: CSSProperties = {
  display: "inline-block",
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #CBD5E1",
  background: "white",
  cursor: "pointer",
  fontWeight: 800,
  color: "#0F172A",
};

const kicker: CSSProperties = {
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
};

const titleStyle: CSSProperties = {
  margin: "16px 0 0",
  fontSize: 46,
  lineHeight: 1.05,
  color: "#0F172A",
  fontWeight: 900,
  letterSpacing: "-0.02em",
};

const subtitleStyle: CSSProperties = {
  marginTop: 12,
  color: "#64748B",
  fontSize: 18,
  maxWidth: 760,
  lineHeight: 1.6,
};

const messageBox: CSSProperties = {
  marginTop: 18,
  border: "1px solid #E2E8F0",
  borderRadius: 14,
  padding: 14,
  fontWeight: 800,
};

const layoutGrid: CSSProperties = {
  marginTop: 24,
  display: "grid",
  gap: 24,
  gridTemplateColumns: "1.2fr 0.8fr",
  alignItems: "start",
};

const rightCol: CSSProperties = {
  display: "grid",
  gap: 20,
  position: "sticky",
  top: 18,
};

const card: CSSProperties = {
  background: "white",
  border: "1px solid #E5E7EB",
  borderRadius: 22,
  padding: 22,
  boxShadow: "0 12px 30px rgba(15,23,42,0.05)",
};

const sectionTitle: CSSProperties = {
  fontSize: 24,
  fontWeight: 900,
  color: "#0F172A",
};

const formGrid: CSSProperties = {
  display: "grid",
  gap: 14,
  marginTop: 18,
  gridTemplateColumns: "1fr 1fr",
};

const fieldBlock: CSSProperties = {
  display: "grid",
  gap: 8,
};

const fieldBlockFull: CSSProperties = {
  display: "grid",
  gap: 8,
  gridColumn: "1 / -1",
};

const labelStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 800,
  color: "#334155",
};

const inputStyle: CSSProperties = {
  padding: 12,
  borderRadius: 12,
  border: "1px solid #CBD5E1",
  background: "white",
  fontSize: 15,
  color: "#0F172A",
  width: "100%",
  boxSizing: "border-box",
};

const subSectionHead: CSSProperties = {
  marginTop: 30,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const hintStyle: CSSProperties = {
  color: "#64748B",
  fontSize: 14,
  fontWeight: 700,
};

const uploadBox: CSSProperties = {
  marginTop: 14,
  padding: 18,
  border: "1px dashed #CBD5E1",
  borderRadius: 18,
  background: "#F8FAFC",
};

const uploadTopRow: CSSProperties = {
  display: "grid",
  gap: 10,
};

const smallMuted: CSSProperties = {
  color: "#64748B",
  fontSize: 14,
  fontWeight: 700,
};

const photoGrid: CSSProperties = {
  marginTop: 18,
  display: "grid",
  gap: 12,
  gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
};

const photoCard: CSSProperties = {
  border: "1px solid #E5E7EB",
  borderRadius: 16,
  overflow: "hidden",
  background: "white",
  boxShadow: "0 8px 18px rgba(15,23,42,0.04)",
};

const photoImg: CSSProperties = {
  width: "100%",
  height: 150,
  objectFit: "cover",
  display: "block",
};

const removePhotoBtn: CSSProperties = {
  width: "100%",
  border: "none",
  background: "#B91C1C",
  color: "white",
  padding: 11,
  fontWeight: 800,
  cursor: "pointer",
};

const planList: CSSProperties = {
  display: "grid",
  gap: 12,
  marginTop: 16,
};

const planBtn: CSSProperties = {
  padding: 16,
  borderRadius: 16,
  cursor: "pointer",
  textAlign: "left",
  border: "1px solid #E5E7EB",
};

const summaryList: CSSProperties = {
  marginTop: 14,
  display: "grid",
  gap: 10,
  color: "#475569",
};

const summaryRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
};

const totalBox: CSSProperties = {
  marginTop: 18,
  paddingTop: 16,
  borderTop: "1px solid #E5E7EB",
  fontSize: 30,
  fontWeight: 900,
  color: "#0F172A",
};

const errorBox: CSSProperties = {
  marginTop: 14,
  padding: 12,
  borderRadius: 12,
  background: "#FEF2F2",
  color: "#991B1B",
  fontWeight: 700,
  fontSize: 14,
  lineHeight: 1.5,
};

const actionGrid: CSSProperties = {
  display: "grid",
  gap: 10,
  marginTop: 18,
};

const saveBtn: CSSProperties = {
  padding: 13,
  background: "#0A7CFF",
  color: "white",
  border: "none",
  borderRadius: 12,
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 10px 24px rgba(10,124,255,0.18)",
};

const payBtn: CSSProperties = {
  padding: 13,
  background: "#111827",
  color: "white",
  border: "none",
  borderRadius: 12,
  fontWeight: 900,
  cursor: "pointer",
};