"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function Page() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [town, setTown] = useState("");
  const [price, setPrice] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [description, setDescription] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const create = async () => {
    try {
      setSaving(true);
      setMsg("");

      const supabase = supabaseBrowser();

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error("Debes iniciar sesión");

      const payload = {
        user_id: userData.user.id,
        title: title.trim(),
        town: town.trim(),
        price: Number(price || 0),
        whatsapp: whatsapp.trim() || null,
        description: description.trim(),
        currency: "ARS",
        status: "DRAFT",
      };

      const { error } = await supabase.from("classifieds").insert(payload);
      if (error) throw error;

      router.push("/mis-clasificados");
    } catch (e: any) {
      setMsg(e?.message || "Error creando clasificado");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main
      style={{
        padding: 40,
        fontFamily: "system-ui",
        maxWidth: 700,
        margin: "0 auto",
      }}
    >
      <a
        href="/"
        style={{
          display: "inline-block",
          marginBottom: 20,
          textDecoration: "none",
          color: "#0a7cff",
          fontWeight: 700,
        }}
      >
        ← Volver
      </a>

      <h1>Publicar clasificado</h1>

      {msg && <p style={{ color: "#b00020" }}>{msg}</p>}

      <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
        <input
          placeholder="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ padding: 12 }}
        />

        <input
          placeholder="Ciudad"
          value={town}
          onChange={(e) => setTown(e.target.value)}
          style={{ padding: 12 }}
        />

        <input
          placeholder="Precio"
          value={price}
          onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))}
          style={{ padding: 12 }}
        />

        <input
          placeholder="WhatsApp"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          style={{ padding: 12 }}
        />

        <textarea
          placeholder="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ padding: 12, minHeight: 140 }}
        />

        <button
          type="button"
          onClick={create}
          disabled={saving}
          style={{
            padding: 14,
            background: saving ? "#9ec5ff" : "#0a7cff",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Creando..." : "Crear clasificado"}
        </button>
      </div>
    </main>
  );
}