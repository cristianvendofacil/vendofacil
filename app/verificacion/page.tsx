"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

const BUCKET = "verification-files";
const PERSON_PRICE = 3000;
const BUSINESS_PRICE = 5000;
const DURATION_DAYS = 365;

type LocationRow = {
  id: string;
  name: string;
  region: string | null;
  province: string | null;
  is_featured: boolean | null;
};

export default function Page() {
  const router = useRouter();

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [verificationType, setVerificationType] = useState<"PERSON" | "BUSINESS">("PERSON");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [notes, setNotes] = useState("");

  const [locations, setLocations] = useState<LocationRow[]>([]);

  const [userId, setUserId] = useState("");
  const [documentFrontPath, setDocumentFrontPath] = useState<string | null>(null);
  const [documentBackPath, setDocumentBackPath] = useState<string | null>(null);
  const [servicePhotoPath, setServicePhotoPath] = useState<string | null>(null);

  const amount = useMemo(() => {
    return verificationType === "BUSINESS" ? BUSINESS_PRICE : PERSON_PRICE;
  }, [verificationType]);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = supabaseBrowser();

        const [{ data: userRes, error: userErr }, { data: locationRes }] = await Promise.all([
          supabase.auth.getUser(),
          supabase
            .from("locations")
            .select("id,name,region,province,is_featured")
            .order("is_featured", { ascending: false })
            .order("region", { ascending: true })
            .order("name", { ascending: true }),
        ]);

        if (userErr) throw userErr;
        if (!userRes.user) {
          window.location.href = "/login?next=/verificacion";
          return;
        }

        setUserId(userRes.user.id);
        setEmail(userRes.user.email || "");

        if (locationRes) {
          setLocations((locationRes ?? []) as LocationRow[]);
        }
      } catch (e: any) {
        setMsg(e?.message || "Error cargando verificación");
      }
    };

    load();
  }, []);

  const uploadSingleFile = async (file: File, typeFolder: string) => {
    const supabase = supabaseBrowser();

    if (!userId) {
      throw new Error("Debes iniciar sesión.");
    }

    const safeName = file.name.replace(/\s+/g, "-");
    const path = `${userId}/${typeFolder}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}-${safeName}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      upsert: false,
      contentType: file.type || "image/jpeg",
    });

    if (error) throw error;

    return path;
  };

  const handleFileChange =
    (
      kind: "front" | "back" | "service",
      setter: (value: string | null) => void
    ) =>
    async (e: ChangeEvent<HTMLInputElement>) => {
      try {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setMsg("");

        const folder =
          kind === "front"
            ? "document-front"
            : kind === "back"
            ? "document-back"
            : "service-proof";

        const uploadedPath = await uploadSingleFile(file, folder);
        setter(uploadedPath);

        setMsg("Archivo subido correctamente.");
      } catch (err: any) {
        setMsg(err?.message || "Error subiendo archivo");
      } finally {
        setUploading(false);
      }
    };

  const saveAndContinue = async () => {
    try {
      setLoading(true);
      setMsg("");

      const supabase = supabaseBrowser();

      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      if (!userRes.user) throw new Error("Debes iniciar sesión.");

      if (!fullName.trim()) {
        throw new Error("Completa nombre y apellido.");
      }

      if (!phone.trim()) {
        throw new Error("Completa teléfono.");
      }

      if (!email.trim()) {
        throw new Error("Completa email.");
      }

      if (!city.trim()) {
        throw new Error("Completa ciudad.");
      }

      if (verificationType === "PERSON" && !documentNumber.trim()) {
        throw new Error("Completa número de documento.");
      }

      if (verificationType === "BUSINESS" && !businessName.trim()) {
        throw new Error("Completa nombre del negocio.");
      }

      if (verificationType === "BUSINESS" && !taxId.trim()) {
        throw new Error("Completa CUIT / IČ / dato fiscal.");
      }

      if (!documentFrontPath) {
        throw new Error("Sube el frente del documento.");
      }

      if (!documentBackPath) {
        throw new Error("Sube el dorso del documento.");
      }

      if (!servicePhotoPath) {
        throw new Error(
          verificationType === "BUSINESS"
            ? "Sube una prueba del negocio o servicio."
            : "Sube una prueba adicional, por ejemplo servicio o comprobante."
        );
      }

      const composedNotes =
        verificationType === "BUSINESS"
          ? [
              notes.trim() ? notes.trim() : null,
              `Negocio: ${businessName.trim()}`,
              `Dato fiscal: ${taxId.trim()}`,
            ]
              .filter(Boolean)
              .join(" | ")
          : [
              notes.trim() ? notes.trim() : null,
              `Documento: ${documentNumber.trim()}`,
            ]
              .filter(Boolean)
              .join(" | ");

      const payload = {
        user_id: userRes.user.id,
        verification_type: verificationType,
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        city: city.trim(),
        notes: composedNotes || null,
        document_front_path: documentFrontPath,
        document_back_path: documentBackPath,
        service_photo_path: servicePhotoPath,
        status: "PENDING",
        is_verified: false,
      };

      const { error } = await supabase
        .from("verification_requests")
        .upsert(payload, { onConflict: "user_id" });

      if (error) throw error;

      router.push(
        `/pagar?type=verification&plan=${verificationType}&amount=${amount}&durationDays=${DURATION_DAYS}`
      );
    } catch (e: any) {
      setMsg(e?.message || "Error preparando verificación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        padding: 40,
        maxWidth: 860,
        margin: "0 auto",
        fontFamily: "system-ui",
      }}
    >
      <a
        href="/"
        style={{
          textDecoration: "none",
          color: "#0a7cff",
          fontWeight: "bold",
        }}
      >
        ← Volver
      </a>

      <h1 style={{ marginTop: 20 }}>Solicitar perfil verificado</h1>

      <p style={{ opacity: 0.75, lineHeight: 1.6 }}>
        La verificación mejora la confianza en tus publicaciones. El sello se activa
        después de la revisión manual.
      </p>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}

      <h2 style={{ marginTop: 24 }}>Elegí el tipo</h2>

      <div style={{ display: "grid", gap: 14, marginTop: 10 }}>
        <button
          type="button"
          onClick={() => setVerificationType("PERSON")}
          style={{
            ...planCard,
            border: verificationType === "PERSON" ? "2px solid #0a7cff" : "1px solid #ddd",
            background: "white",
          }}
        >
          <strong>Perfil verificado</strong>
          <div style={{ marginTop: 6 }}>${PERSON_PRICE} / 12 meses</div>
          <small>Ideal para particulares.</small>
        </button>

        <button
          type="button"
          onClick={() => setVerificationType("BUSINESS")}
          style={{
            ...planCard,
            border: verificationType === "BUSINESS" ? "2px solid gold" : "1px solid #ddd",
            background: "#fffbe6",
          }}
        >
          <strong>Negocio verificado</strong>
          <div style={{ marginTop: 6 }}>${BUSINESS_PRICE} / 12 meses</div>
          <small>Ideal para comercios, empleadores o servicios.</small>
        </button>
      </div>

      <div style={{ display: "grid", gap: 12, marginTop: 24 }}>
        <input
          placeholder="Nombre y apellido"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          style={input}
        />

        <input
          placeholder="Teléfono / WhatsApp"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={input}
        />

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={input}
        />

        <select value={city} onChange={(e) => setCity(e.target.value)} style={input}>
          <option value="">Elegí ciudad</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.name}>
              {loc.name}
              {loc.region ? ` — ${loc.region}` : ""}
            </option>
          ))}
        </select>

        {verificationType === "PERSON" && (
          <input
            placeholder="Número de documento"
            value={documentNumber}
            onChange={(e) => setDocumentNumber(e.target.value)}
            style={input}
          />
        )}

        {verificationType === "BUSINESS" && (
          <>
            <input
              placeholder="Nombre del negocio"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              style={input}
            />

            <input
              placeholder="CUIT / IČ / dato fiscal"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              style={input}
            />
          </>
        )}

        <textarea
          placeholder={
            verificationType === "BUSINESS"
              ? "Notas adicionales sobre el negocio, servicio o actividad"
              : "Notas adicionales"
          }
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{ ...input, minHeight: 110 }}
        />
      </div>

      <h2 style={{ marginTop: 28 }}>Documentación</h2>

      <div
        style={{
          marginTop: 10,
          padding: 16,
          borderRadius: 10,
          background: "#f8f8f8",
          border: "1px solid #eee",
          display: "grid",
          gap: 14,
        }}
      >
        <div>
          <div style={uploadLabel}>Foto frente del documento</div>
          <input type="file" accept="image/*" onChange={handleFileChange("front", setDocumentFrontPath)} />
          {documentFrontPath && <div style={uploadOk}>Archivo cargado ✅</div>}
        </div>

        <div>
          <div style={uploadLabel}>Foto dorso del documento</div>
          <input type="file" accept="image/*" onChange={handleFileChange("back", setDocumentBackPath)} />
          {documentBackPath && <div style={uploadOk}>Archivo cargado ✅</div>}
        </div>

        <div>
          <div style={uploadLabel}>
            {verificationType === "BUSINESS"
              ? "Prueba del negocio / servicio / constancia"
              : "Servicio / comprobante / prueba adicional"}
          </div>
          <input type="file" accept="image/*" onChange={handleFileChange("service", setServicePhotoPath)} />
          {servicePhotoPath && <div style={uploadOk}>Archivo cargado ✅</div>}
        </div>

        {uploading && (
          <div style={{ fontWeight: 700 }}>
            Subiendo archivo...
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 18,
          padding: 14,
          borderRadius: 10,
          background: "#f8f8f8",
          border: "1px solid #eee",
        }}
      >
        <div style={{ fontWeight: 800 }}>Resumen</div>
        <div style={{ marginTop: 6 }}>
          Tipo: <b>{verificationType === "PERSON" ? "Perfil verificado" : "Negocio verificado"}</b>
        </div>
        <div style={{ marginTop: 6 }}>
          Duración: <b>12 meses</b>
        </div>
        <div style={{ marginTop: 6 }}>
          Total: <b>${amount} ARS</b>
        </div>
        <div style={{ marginTop: 6, opacity: 0.75, fontSize: 14 }}>
          ¿Tenés cupón? Lo vas a poder aplicar en el pago.
        </div>
      </div>

      <button
        type="button"
        onClick={saveAndContinue}
        disabled={loading || uploading}
        style={primaryBtn}
      >
        {loading ? "Preparando..." : "Continuar al pago"}
      </button>
    </main>
  );
}

const input: React.CSSProperties = {
  padding: 10,
  borderRadius: 6,
  border: "1px solid #ccc",
};

const planCard: React.CSSProperties = {
  padding: 16,
  borderRadius: 8,
  cursor: "pointer",
  textAlign: "left",
};

const primaryBtn: React.CSSProperties = {
  marginTop: 20,
  padding: 12,
  background: "#0a7cff",
  color: "white",
  border: "none",
  borderRadius: 8,
  fontWeight: "bold",
  cursor: "pointer",
};

const uploadLabel: React.CSSProperties = {
  fontWeight: 700,
  marginBottom: 8,
};

const uploadOk: React.CSSProperties = {
  marginTop: 8,
  color: "#166534",
  fontWeight: 700,
  fontSize: 14,
};