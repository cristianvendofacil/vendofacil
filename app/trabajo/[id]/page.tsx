"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

const BUCKET = "listing-photos";

const PLAN_STANDARD = 4000;
const PLAN_FEATURED = 8000;
const PLAN_URGENT = 12000;
const PLAN_PETROL = 16000;
const PLAN_DURATION_LABEL = "30 días";
const MAX_PHOTOS = 10;

type LocationRow = {
  id: string;
  name: string;
  region: string;
  province: string;
  is_featured: boolean;
};

type ListingRow = {
  id: string;
  user_id: string;
  title: string | null;
  town: string | null;
  whatsapp: string | null;
  description: string | null;
  status: string | null;
  listing_type: "RENT" | "SALE" | null;
  property_type: string | null;
  price: number | null;
  currency: string | null;
  photo_paths: string[] | null;
};

type PlanType = "STANDARD" | "FEATURED" | "URGENT" | "PETROL";

export default function Page() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const itemType = "listing";

  const [msg, setMsg] = useState("Cargando...");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const [title, setTitle] = useState("");
  const [town, setTown] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [description, setDescription] = useState("");
  const [listingType, setListingType] = useState<"RENT" | "SALE">("RENT");
  const [propertyType, setPropertyType] = useState("CASA");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("ARS");

  const [plan, setPlan] = useState<PlanType>("STANDARD");
  const [locations, setLocations] = useState<LocationRow[]>([]);

  const [userId, setUserId] = useState("");
  const [photoPaths, setPhotoPaths] = useState<string[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  const validationErrors = useMemo(() => {
    const errors: string[] = [];

    if (title.trim().length < 4) errors.push("Título muy corto");
    if (town.trim().length < 2) errors.push("Localidad faltante");
    if (whatsapp.trim().length < 6) errors.push("WhatsApp inválido");
    if (description.trim().length < 20) errors.push("Descripción muy corta");
    if (price.trim().length < 1) errors.push("Falta precio");

    return errors;
  }, [title, town, whatsapp, description, price]);

  const canPublish = validationErrors.length === 0;

  const totalAmount = useMemo(() => {
    if (plan === "FEATURED") return PLAN_FEATURED;
    if (plan === "URGENT") return PLAN_URGENT;
    if (plan === "PETROL") return PLAN_PETROL;
    return PLAN_STANDARD;
  }, [plan]);

  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    try {
      setMsg("Cargando...");
      await loadLocations();
      await loadListing();
      setMsg("");
    } catch (e: any) {
      setMsg(e?.message || "Error cargando anuncio");
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

  const refreshSignedPhotoUrls = async (paths: string[]) => {
    const supabase = supabaseBrowser();

    if (!paths.length) {
      setPhotoUrls([]);
      return;
    }

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrls(paths, 60 * 60);

    if (error) throw error;

    const urls = (data ?? [])
      .map((x) => x?.signedUrl || "")
      .filter(Boolean);

    setPhotoUrls(urls);
  };

  const loadListing = async () => {
    if (!id) {
      setMsg("ID vacío.");
      return;
    }

    const supabase = supabaseBrowser();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) throw new Error("Debes iniciar sesión.");

    const currentUserId = userData.user.id;
    setUserId(currentUserId);

    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    const row = data as ListingRow;

    if (row.user_id !== currentUserId) {
      throw new Error("No tienes permiso para editar esta publicación.");
    }

    setTitle(row.title || "");
    setTown(row.town || "");
    setWhatsapp(row.whatsapp || "");
    setDescription(row.description || "");
    setListingType(row.listing_type || "RENT");
    setPropertyType(row.property_type || "CASA");
    setPrice(row.price ? String(row.price) : "");
    setCurrency(row.currency || "ARS");

    const paths = row.photo_paths || [];
    setPhotoPaths(paths);
    await refreshSignedPhotoUrls(paths);
  };

  const buildPayload = () => ({
    title: title.trim(),
    town: town.trim(),
    whatsapp: whatsapp.trim() || null,
    description: description.trim(),
    listing_type: listingType,
    property_type: propertyType,
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
        .from("listings")
        .update({
          ...buildPayload(),
          status: "DRAFT",
        })
        .eq("id", id);

      if (error) throw error;

      setMsg("Guardado ✅");
      router.push("/mis-anuncios");
    } catch (e: any) {
      setMsg(e?.message || "Error guardando");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    try {
      if (!id || !userId) return;

      const files = Array.from(e.target.files || []);
      if (!files.length) return;

      const remaining = MAX_PHOTOS - photoPaths.length;
      if (remaining <= 0) {
        setMsg(`Máximo ${MAX_PHOTOS} fotos.`);
        e.target.value = "";
        return;
      }

      const selected = files.slice(0, remaining);
      setUploadingPhotos(true);
      setMsg("");

      const supabase = supabaseBrowser();
      const uploadedPaths: string[] = [];

      for (const file of selected) {
        const safeName = file.name.replace(/\s+/g, "-");
        const path = `${userId}/${id}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}-${safeName}`;

        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, {
            upsert: false,
            contentType: file.type || "image/jpeg",
          });

        if (error) throw error;
        uploadedPaths.push(path);
      }

      const nextPaths = [...photoPaths, ...uploadedPaths];

      const { error: updateError } = await supabase
        .from("listings")
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
        .from("listings")
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
        .from("listings")
        .update({
          ...buildPayload(),
          status: "DRAFT",
        })
        .eq("id", id);

      if (error) throw error;

      const qs = new URLSearchParams({
        type: itemType,
        id,
        title: title.trim() || "Publicación",
        plan,
        amount: String(totalAmount),
        durationDays: "30",
        featured: plan === "FEATURED" ? "1" : "0",
        urgent: plan === "URGENT" ? "1" : "0",
        petrol: plan === "PETROL" ? "1" : "0",
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
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(249,115,22,0.06), transparent 24%), linear-gradient(180deg, #f8fafc 0%, #f8f7f3 100%)",
        padding: "28px 20px 44px",
        fontFamily: "system-ui",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <button type="button" onClick={() => router.push("/mis-anuncios")} style={backBtn}>
          ← Volver
        </button>

        <div style={{ marginTop: 18 }}>
          <div style={kicker}>🏠 Editar inmueble</div>

          <h1 style={pageTitle}>Configura tu publicación</h1>

          <p style={pageSubtitle}>
            Completa la información del inmueble, sube fotos y elige el plan que mejor te convenga.
          </p>
        </div>

        {msg && <p style={{ marginTop: 12 }}>{msg}</p>}

        <div style={card}>
          <SectionTitle text="Información principal" />

          <div style={fieldGrid}>
            <input
              placeholder="Título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={input}
            />

            <select
              value={listingType}
              onChange={(e) => setListingType(e.target.value as "RENT" | "SALE")}
              style={input}
            >
              <option value="RENT">Alquiler</option>
              <option value="SALE">Venta</option>
            </select>

            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              style={input}
            >
              <option value="CASA">Casa</option>
              <option value="DEPTO">Depto</option>
              <option value="TERRENO">Terreno</option>
              <option value="HABITACION">Habitación</option>
              <option value="LOCAL">Local</option>
              <option value="OFICINA">Oficina</option>
              <option value="GALPON">Galpón</option>
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

            <input
              placeholder="Precio"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))}
              style={input}
            />

            <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={input}>
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
              <option value="CZK">CZK</option>
            </select>
          </div>

          <textarea
            placeholder="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ ...input, minHeight: 140, marginTop: 12 }}
          />
        </div>

        <div style={card}>
          <SectionTitle text="Fotos" />

          <div style={{ fontSize: 14, color: "#555", marginBottom: 12 }}>
            Podés subir hasta {MAX_PHOTOS} fotos.
          </div>

          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            disabled={uploadingPhotos || photoPaths.length >= MAX_PHOTOS}
          />

          {uploadingPhotos && (
            <div style={{ marginTop: 10, fontWeight: 700 }}>Subiendo fotos...</div>
          )}

          {photoUrls.length > 0 && (
            <div
              style={{
                marginTop: 16,
                display: "grid",
                gap: 12,
                gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
              }}
            >
              {photoUrls.map((url, index) => (
                <div
                  key={`${url}-${index}`}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: 12,
                    overflow: "hidden",
                    background: "#fafafa",
                  }}
                >
                  <img
                    src={url}
                    alt={`Foto ${index + 1}`}
                    style={{
                      width: "100%",
                      height: 140,
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    style={dangerBtn}
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={card}>
          <SectionTitle text="Elegí tu plan" />

          <div style={{ display: "grid", gap: 14, marginTop: 10 }}>
            <PlanCard
              active={plan === "STANDARD"}
              onClick={() => setPlan("STANDARD")}
              title="Publicación estándar"
              price={`$${PLAN_STANDARD}`}
              desc={PLAN_DURATION_LABEL}
            />

            <PlanCard
              active={plan === "FEATURED"}
              onClick={() => setPlan("FEATURED")}
              title="⭐ Publicación destacada"
              price={`$${PLAN_FEATURED}`}
              desc={PLAN_DURATION_LABEL}
              variant="gold"
            />

            <PlanCard
              active={plan === "URGENT"}
              onClick={() => setPlan("URGENT")}
              title="🔴 Publicación urgente"
              price={`$${PLAN_URGENT}`}
              desc="Arriba de todo durante 9 días"
              variant="red"
            />

            <PlanCard
              active={plan === "PETROL"}
              onClick={() => setPlan("PETROL")}
              title="🛢 Prioridad petrolera"
              price={`$${PLAN_PETROL}`}
              desc="Máxima visibilidad en la zona energética"
              variant="orange"
            />
          </div>
        </div>

        <div style={summaryBox}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>Resumen</div>
          <div style={{ marginTop: 8 }}>
            Operación: <b>{listingType === "RENT" ? "Alquiler" : "Venta"}</b>
          </div>
          <div style={{ marginTop: 6 }}>
            Duración: <b>{PLAN_DURATION_LABEL}</b>
          </div>
          <div style={{ marginTop: 6 }}>
            Total: <b>${totalAmount} ARS</b>
          </div>

          {plan === "URGENT" && (
            <div style={{ marginTop: 6, color: "#c62828", fontWeight: 700 }}>
              Incluye posición urgente por 9 días.
            </div>
          )}

          {plan === "PETROL" && (
            <div style={{ marginTop: 6, color: "#c2410c", fontWeight: 700 }}>
              Incluye prioridad petrolera para destacarse por encima del resto.
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
          <button type="button" onClick={saveDraft} disabled={saving} style={primaryBtn}>
            {saving ? "Guardando..." : "Guardar borrador"}
          </button>

          <button type="button" onClick={continueToPayment} disabled={publishing} style={darkBtn}>
            {publishing ? "Preparando..." : "Continuar"}
          </button>
        </div>
      </div>
    </main>
  );
}

function SectionTitle({ text }: { text: string }) {
  return (
    <div style={{ fontWeight: 900, marginBottom: 10, fontSize: 18 }}>
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
  variant = "default",
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  price: string;
  desc: string;
  variant?: "default" | "gold" | "red" | "orange";
}) {
  const bg =
    variant === "gold"
      ? "#fffbe6"
      : variant === "red"
      ? "#fff3f3"
      : variant === "orange"
      ? "#fff7ed"
      : "white";

  const borderColor =
    variant === "gold"
      ? "#F59E0B"
      : variant === "red"
      ? "#DC2626"
      : variant === "orange"
      ? "#F97316"
      : "#0a7cff";

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: 16,
        borderRadius: 12,
        cursor: "pointer",
        textAlign: "left",
        border: active ? `2px solid ${borderColor}` : "1px solid #ddd",
        background: bg,
      }}
    >
      <strong>{title}</strong>
      <div style={{ marginTop: 6 }}>
        {price} / {PLAN_DURATION_LABEL}
      </div>
      <small>{desc}</small>
    </button>
  );
}

const kicker: React.CSSProperties = {
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

const pageTitle: React.CSSProperties = {
  margin: "16px 0 0",
  fontSize: 42,
  lineHeight: 1.05,
  color: "#0F172A",
  fontWeight: 950,
  letterSpacing: "-0.03em",
};

const pageSubtitle: React.CSSProperties = {
  marginTop: 12,
  color: "#64748B",
  fontSize: 18,
  lineHeight: 1.6,
};

const card: React.CSSProperties = {
  marginTop: 20,
  padding: 20,
  borderRadius: 16,
  background: "white",
  border: "1px solid #E5E7EB",
  boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
};

const fieldGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: 12,
};

const input: React.CSSProperties = {
  width: "100%",
  padding: 12,
  borderRadius: 10,
  border: "1px solid #CBD5E1",
  boxSizing: "border-box",
};

const backBtn: React.CSSProperties = {
  display: "inline-block",
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid #ddd",
  background: "white",
  cursor: "pointer",
  fontWeight: 800,
};

const summaryBox: React.CSSProperties = {
  marginTop: 20,
  padding: 18,
  borderRadius: 14,
  background: "white",
  border: "1px solid #E5E7EB",
  boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
};

const primaryBtn: React.CSSProperties = {
  padding: 12,
  background: "#0a7cff",
  color: "white",
  border: "none",
  borderRadius: 10,
  fontWeight: "bold",
  cursor: "pointer",
};

const darkBtn: React.CSSProperties = {
  padding: 12,
  background: "#111",
  color: "white",
  border: "none",
  borderRadius: 10,
  fontWeight: "bold",
  cursor: "pointer",
};

const dangerBtn: React.CSSProperties = {
  width: "100%",
  border: "none",
  background: "#b91c1c",
  color: "white",
  padding: 10,
  fontWeight: 700,
  cursor: "pointer",
};