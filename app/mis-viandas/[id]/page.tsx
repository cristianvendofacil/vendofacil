"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

const BUCKET = "meal-photos";

const PLAN_BASIC = 2000;
const PLAN_RECOMMENDED = 3500;
const PLAN_PREMIUM = 5000;
const URGENT_EXTRA = 3000;

type LocationRow = {
  id: string;
  name: string;
  region: string;
  province: string;
  is_featured: boolean;
};

type MealRow = {
  id: string;
  user_id: string;
  title: string | null;
  town: string | null;
  whatsapp: string | null;
  description: string | null;
  status: string | null;
  meal_type: string | null;
  delivery_type: string | null;
  price: number | null;
  currency: string | null;
  photo_paths: string[] | null;
  available_type?: string | null;
  available_date?: string | null;
  delivery_price?: number | null;
  pickup_address?: string | null;
  category?: string | null;
};

type PlanCode = "BASIC" | "RECOMMENDED" | "PREMIUM";

const CATEGORY_OPTIONS = [
  "ASADO",
  "BEBIDAS",
  "CONDIMENTOS",
  "EMPANADAS",
  "FRUTOS_SECOS",
  "HERBORISTERIA",
  "INTERNACIONAL",
  "MILANESAS",
  "PANES_CASEROS",
  "PARA_EL_MATE",
  "PASTAS",
  "PIZZA",
  "POLLO",
  "POSTRES",
  "SALUDABLE",
  "SANDWICHES",
  "SIN_TACC",
  "SUPLEMENTOS_DIETARIOS",
  "TORTAS_FRITAS",
  "TORTAS_Y_BUDINES",
  "OTRA",
] as const;

function formatCategoryLabel(value: string) {
  const map: Record<string, string> = {
    MILANESAS: "Milanesas",
    EMPANADAS: "Empanadas",
    PIZZA: "Pizza",
    ASADO: "Asado",
    PASTAS: "Pastas (canelones, ravioles, tallarines, etc)",
    POSTRES: "Postres",
    TORTAS_Y_BUDINES: "Tortas / Budines",
    BEBIDAS: "Bebidas",
    COMIDA_INTERNACIONAL: "Comida internacional",
    TORTAS_FRITAS: "Tortas fritas",
    POLLO: "Pollo",
    SALUDABLE: "Saludables / sana",
    SIN_TACC: "Sin TACC",
    PARA_EL_MATE: "Para el mate",
    SANDWICHES: "Sandwiches",
    FRUTOS_SECOS: "Frutos secos",
    HERBORISTERIA: "Herboristería",
    CONDIMENTOS: "Condimentos",
    SUPLEMENTOS_DIETARIOS: "Suplementos dietarios",
    PANES_CASEROS: "Panes caseros",
    OTRAS: "Otra",
  };

  return map[value] || value;
}

function hasDelivery(type: string) {
  return type === "DELIVERY" || type === "AMBOS";
}

function hasPickup(type: string) {
  return type === "RETIRO" || type === "AMBOS";
}

function sanitizeFilename(name: string) {
  const parts = name.split(".");
  const ext = parts.length > 1 ? parts.pop() || "jpg" : "jpg";
  const base = parts.join(".") || "foto";

  const safeBase = base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  const safeExt =
    ext.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";

  return `${safeBase || "foto"}.${safeExt}`;
}

function fileExtensionFromType(file: File) {
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/heic") return "heic";
  const original = file.name.split(".").pop()?.toLowerCase();
  return original?.replace(/[^a-z0-9]/g, "") || "jpg";
}

export default function Page() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const itemType = "meal";
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const supabase = useMemo(() => supabaseBrowser(), []);

  const [msg, setMsg] = useState("Cargando...");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState("");
  const [town, setTown] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [description, setDescription] = useState("");
  const [mealType, setMealType] = useState("VIANDA");
  const [deliveryType, setDeliveryType] = useState("AMBOS");
  const [price, setPrice] = useState("");

  const [category, setCategory] = useState("MILANESAS");
  const [availableType, setAvailableType] = useState<"always" | "date">("always");
  const [availableDate, setAvailableDate] = useState("");
  const [deliveryPrice, setDeliveryPrice] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");

  const [plan, setPlan] = useState<PlanCode>("BASIC");
  const [urgent, setUrgent] = useState(false);
  const [locations, setLocations] = useState<LocationRow[]>([]);

  const [photoPaths, setPhotoPaths] = useState<string[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  const durationDays = useMemo(() => {
    if (plan === "BASIC") return 7;
    if (plan === "RECOMMENDED") return 14;
    return 30;
  }, [plan]);

  const baseAmount = useMemo(() => {
    if (plan === "BASIC") return PLAN_BASIC;
    if (plan === "RECOMMENDED") return PLAN_RECOMMENDED;
    return PLAN_PREMIUM;
  }, [plan]);

  const totalAmount = useMemo(() => {
    return baseAmount + (urgent ? URGENT_EXTRA : 0);
  }, [baseAmount, urgent]);

  const maxPhotosForPlan = useMemo(() => {
    if (plan === "BASIC") return 3;
    if (plan === "RECOMMENDED") return 6;
    return 10;
  }, [plan]);

  const totalPhotoCount = photoPaths.length;

  const validationErrors = useMemo(() => {
    const errors: string[] = [];

    if (title.trim().length < 4) errors.push("Título muy corto");
    if (town.trim().length < 2) errors.push("Localidad faltante");
    if (whatsapp.trim().length < 6) errors.push("WhatsApp inválido");
    if (price.trim().length < 1) errors.push("Falta precio");
    if (!category.trim()) errors.push("Falta categoría");

    if (availableType === "date" && !availableDate) {
      errors.push("Falta fecha disponible");
    }

    if (hasDelivery(deliveryType) && deliveryPrice.trim().length < 1) {
      errors.push("Falta precio delivery");
    }

    if (hasPickup(deliveryType) && pickupAddress.trim().length < 4) {
      errors.push("Falta dirección de retiro");
    }

    if (photoPaths.length === 0) errors.push("Debes agregar al menos 1 foto");
    if (photoPaths.length > maxPhotosForPlan) {
      errors.push(`Tu plan permite hasta ${maxPhotosForPlan} fotos`);
    }

    return errors;
  }, [
    title,
    town,
    whatsapp,
    price,
    category,
    availableType,
    availableDate,
    deliveryType,
    deliveryPrice,
    pickupAddress,
    photoPaths,
    maxPhotosForPlan,
  ]);

  const canPublish = validationErrors.length === 0;

  const refreshSignedPhotoUrls = async (paths: string[]) => {
    if (!paths.length) {
      setPhotoUrls([]);
      return;
    }

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrls(paths, 3600);

    if (error) throw error;

    setPhotoUrls(
      (data ?? []).map((x) => x?.signedUrl).filter(Boolean) as string[]
    );
  };

  useEffect(() => {
    const load = async () => {
      try {
        if (!id) {
          setMsg("ID vacío.");
          return;
        }

        setMsg("Cargando...");

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!userData.user) throw new Error("Debes iniciar sesión.");

        const { data: locationsData, error: locationsError } = await supabase
          .from("locations")
          .select("id,name,region,province,is_featured")
          .order("is_featured", { ascending: false })
          .order("region", { ascending: true })
          .order("name", { ascending: true });

        if (locationsError) throw locationsError;
        setLocations((locationsData ?? []) as LocationRow[]);

        const { data, error } = await supabase
          .from("meals")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        const row = data as MealRow;

        if (row.user_id !== userData.user.id) {
          throw new Error("No tienes permiso para editar esta publicación.");
        }

        setTitle(row.title || "");
        setTown(row.town || "");
        setWhatsapp(row.whatsapp || "");
        setDescription(row.description || "");
        setMealType(row.meal_type || "VIANDA");
        setDeliveryType(row.delivery_type || "AMBOS");
        setPrice(row.price ? String(row.price) : "");

        setCategory(row.category || "MILANESAS");
        setAvailableType(row.available_type === "date" ? "date" : "always");
        setAvailableDate(row.available_date || "");
        setDeliveryPrice(
          row.delivery_price !== null && row.delivery_price !== undefined
            ? String(row.delivery_price)
            : ""
        );
        setPickupAddress(row.pickup_address || "");

        const paths = row.photo_paths || [];
        setPhotoPaths(paths);
        await refreshSignedPhotoUrls(paths);

        setMsg("");
      } catch (e: any) {
        setMsg(e?.message || "Error cargando vianda");
      }
    };

    load();
  }, [id, supabase]);

  const buildPayload = () => ({
    title: title.trim(),
    town: town.trim(),
    whatsapp: whatsapp.trim() || null,
    description: description.trim(),
    meal_type: mealType,
    delivery_type: deliveryType,
    price: Number(price || 0),
    currency: "ARS",
    photo_paths: photoPaths,
    category,
    available_type: availableType,
    available_date: availableType === "date" ? availableDate : null,
    delivery_price: hasDelivery(deliveryType)
      ? Number(deliveryPrice || 0)
      : null,
    pickup_address: hasPickup(deliveryType) ? pickupAddress.trim() : null,
  });

  const openPicker = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (files: FileList | null) => {
    try {
      if (!id || !files || files.length === 0) return;

      const selected = Array.from(files);
      const available = maxPhotosForPlan - photoPaths.length;

      if (available <= 0) {
        setMsg(`Tu plan permite hasta ${maxPhotosForPlan} fotos.`);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      const accepted = selected.slice(0, available);

      setUploading(true);
      setMsg("Subiendo fotos...");

      const uploadedPaths: string[] = [];

      for (const file of accepted) {
        const ext = fileExtensionFromType(file);
        const cleanOriginal = sanitizeFilename(file.name);
        const uniqueName = `${id}-${crypto.randomUUID()}.${ext}`;
        const path = uniqueName;

        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, {
            upsert: false,
            contentType: file.type || `image/${ext}`,
          });

        if (error) {
          throw new Error(`Error subiendo ${cleanOriginal}: ${error.message}`);
        }

        uploadedPaths.push(path);
      }

      const nextPaths = [...photoPaths, ...uploadedPaths];

      const { error: updateError } = await supabase
        .from("meals")
        .update({ photo_paths: nextPaths })
        .eq("id", id);

      if (updateError) throw updateError;

      setPhotoPaths(nextPaths);
      await refreshSignedPhotoUrls(nextPaths);

      setMsg("Fotos subidas ✅");
    } catch (e: any) {
      setMsg(e?.message || "Error subiendo fotos");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removePhoto = async (index: number) => {
    try {
      if (!id) return;

      const pathToRemove = photoPaths[index];
      const nextPaths = photoPaths.filter((_, i) => i !== index);

      if (pathToRemove) {
        const { error: removeError } = await supabase.storage
          .from(BUCKET)
          .remove([pathToRemove]);

        if (removeError) throw removeError;
      }

      const { error } = await supabase
        .from("meals")
        .update({ photo_paths: nextPaths })
        .eq("id", id);

      if (error) throw error;

      setPhotoPaths(nextPaths);
      await refreshSignedPhotoUrls(nextPaths);
      setMsg("Foto eliminada ✅");
    } catch (e: any) {
      setMsg(e?.message || "Error eliminando foto");
    }
  };

  const saveDraft = async () => {
    try {
      if (!id) return;
      setSaving(true);
      setMsg("");

      const { error } = await supabase
        .from("meals")
        .update({
          ...buildPayload(),
          status: "DRAFT",
        })
        .eq("id", id);

      if (error) throw error;

      setMsg("Guardado ✅");
      router.push("/mis-viandas");
    } catch (e: any) {
      setMsg(e?.message || "Error guardando");
    } finally {
      setSaving(false);
    }
  };

  const continueToPayment = async () => {
    try {
      if (!id) {
        return;
      }

      setPublishing(true);
      setMsg("");

      if (!canPublish) {
        setMsg("Faltan datos: " + validationErrors.join(", "));
        return;
      }

      const res = await supabase
        .from("meals")
        .update({
          ...buildPayload(),
          status: "DRAFT",
        })
        .eq("id", id);

      if (res.error) {
        throw res.error;
      }

      const qs = new URLSearchParams({
        type: itemType,
        id,
        title: title.trim() || "Vianda",
        plan,
        amount: String(totalAmount),
        durationDays: String(durationDays),
        featured: "0",
        urgent: urgent ? "1" : "0",
      });

      const target = `/pagar?${qs.toString()}`;
      window.location.href = target;
    } catch (e: any) {
      setMsg(e?.message || "Error preparando publicación");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <main
      style={{
        padding: 40,
        maxWidth: 820,
        margin: "0 auto",
        fontFamily: "system-ui",
      }}
    >
      <button
        type="button"
        onClick={() => router.push("/mis-viandas")}
        style={backBtn}
      >
        ← Volver
      </button>

      <h1 style={{ marginTop: 16 }}>Editar vianda / comida casera</h1>

      <p style={subtleText}>
        En viandas todas las publicaciones son pagas. Las fotos son obligatorias
        y la cantidad depende del plan elegido.
      </p>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}

      <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
        <input
          placeholder="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={input}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={input}
        >
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {formatCategoryLabel(option)}
            </option>
          ))}
        </select>

        <select
          value={mealType}
          onChange={(e) => setMealType(e.target.value)}
          style={input}
        >
          <option value="VIANDA">Vianda</option>
          <option value="COMIDA_CASERA">Comida casera</option>
          <option value="POSTRE">Postre</option>
          <option value="BEBIDA">Bebida</option>
        </select>

        <div style={sectionBox}>
          <div style={sectionMiniTitle}>Disponibilidad</div>

          <div style={radioRow}>
            <label style={radioLabel}>
              <input
                type="radio"
                checked={availableType === "always"}
                onChange={() => setAvailableType("always")}
              />
              Disponible siempre
            </label>

            <label style={radioLabel}>
              <input
                type="radio"
                checked={availableType === "date"}
                onChange={() => setAvailableType("date")}
              />
              Disponible en fecha específica
            </label>
          </div>

          {availableType === "date" && (
            <input
              type="date"
              value={availableDate}
              onChange={(e) => setAvailableDate(e.target.value)}
              style={{ ...input, marginTop: 4 }}
            />
          )}
        </div>

        <select
          value={deliveryType}
          onChange={(e) => setDeliveryType(e.target.value)}
          style={input}
        >
          <option value="AMBOS">Retiro / Delivery</option>
          <option value="RETIRO">Solo retiro</option>
          <option value="DELIVERY">Solo delivery</option>
        </select>

        {hasDelivery(deliveryType) && (
          <input
            placeholder="Precio delivery"
            value={deliveryPrice}
            onChange={(e) => setDeliveryPrice(e.target.value.replace(/[^\d]/g, ""))}
            style={input}
          />
        )}

        {hasPickup(deliveryType) && (
          <input
            placeholder="Dirección de retiro"
            value={pickupAddress}
            onChange={(e) => setPickupAddress(e.target.value)}
            style={input}
          />
        )}

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

        <input
          placeholder="Precio"
          value={price}
          onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))}
          style={input}
        />

        <select value="ARS" onChange={() => {}} style={input}>
          <option value="ARS">ARS</option>
        </select>

        <textarea
          placeholder="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ ...input, minHeight: 140 }}
        />
      </div>

      <div style={{ marginTop: 28 }}>
        <h2>Fotos</h2>
        <p style={subtleText}>
          Tu plan actual permite hasta <b>{maxPhotosForPlan}</b> fotos.
        </p>

        <div
          style={{
            marginTop: 12,
            padding: 16,
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            background: "#fafafa",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileChange(e.target.files)}
            style={{ display: "none" }}
          />

          <button
            type="button"
            onClick={openPicker}
            disabled={uploading || totalPhotoCount >= maxPhotosForPlan}
            style={pickPhotoBtn}
          >
            {uploading ? "Subiendo..." : "Agregar fotos"}
          </button>

          <div style={{ marginTop: 10, color: "#64748B", fontSize: 14 }}>
            Puedes agregar fotos varias veces hasta llegar al límite de tu plan.
          </div>

          {photoUrls.length > 0 && (
            <div
              style={{
                marginTop: 16,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
                gap: 12,
              }}
            >
              {photoUrls.map((url, index) => (
                <div key={`${url}-${index}`} style={photoCard}>
                  <div style={photoImageWrap}>
                    <img
                      src={url}
                      alt={`foto ${index + 1}`}
                      style={photoImage}
                    />
                  </div>

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
      </div>

      <h2 style={{ marginTop: 28 }}>Elegí cómo querés vender tu comida</h2>

      <div style={{ display: "grid", gap: 14, marginTop: 10 }}>
        <button
          type="button"
          onClick={() => setPlan("BASIC")}
          style={{
            ...planCard,
            border: plan === "BASIC" ? "2px solid #0a7cff" : "1px solid #ddd",
            background: "white",
          }}
        >
          <strong>Plan básico</strong>
          <div style={{ marginTop: 6 }}>${PLAN_BASIC} / 7 días</div>
          <small style={smallMuted}>Hasta 3 fotos.</small>
        </button>

        <button
          type="button"
          onClick={() => setPlan("RECOMMENDED")}
          style={{
            ...planCard,
            border:
              plan === "RECOMMENDED" ? "2px solid #0a7cff" : "1px solid #ddd",
            background: "#f8fbff",
          }}
        >
          <strong>Plan recomendado</strong>
          <div style={{ marginTop: 6 }}>${PLAN_RECOMMENDED} / 14 días</div>
          <small style={smallMuted}>Hasta 6 fotos.</small>
        </button>

        <button
          type="button"
          onClick={() => setPlan("PREMIUM")}
          style={{
            ...planCard,
            border: plan === "PREMIUM" ? "2px solid #0a7cff" : "1px solid #ddd",
            background: "#fffdf7",
          }}
        >
          <strong>Plan premium</strong>
          <div style={{ marginTop: 6 }}>${PLAN_PREMIUM} / 30 días</div>
          <small style={smallMuted}>Hasta 10 fotos.</small>
        </button>

        <button
          type="button"
          onClick={() => setUrgent((v) => !v)}
          style={{
            ...planCard,
            border: urgent ? "2px solid #e53935" : "1px solid #ddd",
            background: urgent ? "#fff3f3" : "white",
          }}
        >
          <strong>🔴 Agregar urgente</strong>
          <div style={{ marginTop: 6 }}>+ ${URGENT_EXTRA}</div>
          <small style={smallMuted}>Arriba de todo durante 9 días.</small>
        </button>
      </div>

      <div style={summaryBox}>
        <div style={{ fontWeight: 800 }}>Resumen</div>
        <div style={{ marginTop: 6 }}>
          Duración: <b>{durationDays} días</b>
        </div>
        <div style={{ marginTop: 6 }}>
          Fotos: <b>{totalPhotoCount}</b> / {maxPhotosForPlan}
        </div>
        <div style={{ marginTop: 6 }}>
          Total: <b>${totalAmount} ARS</b>
        </div>
        {urgent && (
          <div style={{ marginTop: 6, color: "#c62828", fontWeight: 700 }}>
            Incluye posición urgente por 9 días.
          </div>
        )}
      </div>

      {!canPublish && (
        <div style={errorBox}>
          Faltan datos para publicar: {validationErrors.join(", ")}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
        <button
          type="button"
          onClick={saveDraft}
          disabled={saving || uploading}
          style={primaryBtn}
        >
          {saving ? "Guardando..." : "Guardar borrador"}
        </button>

        <button
          type="button"
          onClick={continueToPayment}
          disabled={publishing || uploading}
          style={darkBtn}
        >
          {publishing ? "Preparando..." : "Continuar"}
        </button>
      </div>
    </main>
  );
}

const subtleText: React.CSSProperties = {
  marginTop: 8,
  color: "#64748B",
  lineHeight: 1.6,
};

const smallMuted: React.CSSProperties = {
  display: "block",
  marginTop: 6,
  color: "#64748B",
  lineHeight: 1.5,
};

const input: React.CSSProperties = {
  padding: 10,
  borderRadius: 6,
  border: "1px solid #ccc",
};

const backBtn: React.CSSProperties = {
  display: "inline-block",
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #ddd",
  background: "white",
  cursor: "pointer",
  fontWeight: 700,
};

const pickPhotoBtn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "none",
  background: "#111",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
};

const planCard: React.CSSProperties = {
  padding: 16,
  borderRadius: 8,
  cursor: "pointer",
  textAlign: "left",
};

const summaryBox: React.CSSProperties = {
  marginTop: 16,
  padding: 14,
  borderRadius: 10,
  background: "#f8f8f8",
  border: "1px solid #eee",
};

const primaryBtn: React.CSSProperties = {
  padding: 12,
  background: "#0a7cff",
  color: "white",
  border: "none",
  borderRadius: 8,
  fontWeight: "bold",
  cursor: "pointer",
};

const darkBtn: React.CSSProperties = {
  padding: 12,
  background: "#111",
  color: "white",
  border: "none",
  borderRadius: 8,
  fontWeight: "bold",
  cursor: "pointer",
};

const removePhotoBtn: React.CSSProperties = {
  width: "100%",
  padding: 10,
  border: "none",
  background: "#dc2626",
  color: "white",
  cursor: "pointer",
  fontWeight: 700,
};

const photoCard: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 12,
  overflow: "hidden",
  background: "white",
};

const photoImageWrap: React.CSSProperties = {
  height: 140,
  background: "#f3f3f3",
};

const photoImage: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const sectionBox: React.CSSProperties = {
  marginTop: 2,
  padding: 14,
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#fafafa",
};

const sectionMiniTitle: React.CSSProperties = {
  fontWeight: 800,
  marginBottom: 10,
  color: "#111827",
};

const radioRow: React.CSSProperties = {
  display: "flex",
  gap: 16,
  flexWrap: "wrap",
};

const radioLabel: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontWeight: 700,
};

const errorBox: React.CSSProperties = {
  marginTop: 16,
  padding: 12,
  borderRadius: 10,
  background: "#FEF2F2",
  border: "1px solid #FECACA",
  color: "#991B1B",
  fontWeight: 700,
};