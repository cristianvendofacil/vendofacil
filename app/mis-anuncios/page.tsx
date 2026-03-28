"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

type Listing = {
  id: string;
  title: string;
  town: string;
  price: number;
  currency: string;
  status: string;
  created_at: string;
  listing_type: "RENT" | "SALE";
  property_type: string | null;
  featured_until?: string | null;
};

export default function MyListingsPage() {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [items, setItems] = useState<Listing[]>([]);
  const [msg, setMsg] = useState("Cargando...");
  const [creating, setCreating] = useState(false);
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
        .from("listings")
        .select(
          "id,title,town,price,currency,status,created_at,listing_type,property_type,featured_until"
        )
        .eq("user_id", userRes.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const rows = (data ?? []) as Listing[];
      setItems(rows);
      setMsg(rows.length ? "" : "No tenés anuncios todavía.");
    } catch (e: any) {
      setMsg(e?.message || "Error cargando anuncios");
      setItems([]);
    }
  };

  const createDraft = async () => {
    try {
      setCreating(true);
      setMsg("");

      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;

      if (!userRes.user) {
        throw new Error("Debes iniciar sesión.");
      }

      const payload = {
        user_id: userRes.user.id,
        title: "Nuevo inmueble",
        town: "",
        price: 0,
        currency: "ARS",
        whatsapp: "",
        description: "",
        status: "DRAFT",
        listing_type: "RENT",
        property_type: "DEPTO",
        photo_paths: [],
      };

      const { data, error } = await supabase
        .from("listings")
        .insert(payload)
        .select("id")
        .single();

      if (error) throw error;

      if (!data?.id) {
        throw new Error("No se pudo crear el borrador.");
      }

      router.push(`/mis-anuncios/${data.id}`);
    } catch (e: any) {
      setMsg(e?.message || "Error creando anuncio");
    } finally {
      setCreating(false);
    }
  };

  const isFeatured = (x: Listing) =>
    !!x.featured_until && new Date(x.featured_until).getTime() > Date.now();

  return (
    <main
      style={{
        padding: 40,
        fontFamily: "system-ui",
        maxWidth: 980,
        margin: "0 auto",
      }}
    >
      <a
        href="/publicar"
        style={{
          display: "inline-block",
          marginBottom: 18,
          textDecoration: "none",
          color: "#0a7cff",
          fontWeight: 700,
        }}
      >
        ← Volver a publicar
      </a>

      <h1>Mis anuncios</h1>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
        <button
          type="button"
          onClick={createDraft}
          disabled={creating}
          style={{
            padding: 10,
            background: "#111",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: creating ? "not-allowed" : "pointer",
            fontWeight: 700,
          }}
        >
          {creating ? "Creando..." : "+ Crear anuncio"}
        </button>

        <a
          href="/anuncio"
          style={{
            padding: 10,
            background: "white",
            color: "#333",
            border: "1px solid #ccc",
            borderRadius: 6,
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          Ver inmuebles públicos
        </a>
      </div>

      {msg && <p style={{ marginTop: 18 }}>{msg}</p>}

      <div style={{ marginTop: 20, display: "grid", gap: 12 }}>
        {items.map((x) => {
          const featured = isFeatured(x);
          const busy = workingId === x.id;

          return (
            <div
              key={x.id}
              style={{
                border: featured ? "2px solid gold" : "1px solid #ddd",
                padding: 14,
                borderRadius: 10,
                background: "white",
              }}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ fontWeight: 800, fontSize: 18 }}>
                  {x.title || "Sin título"}
                </div>

                {featured && (
                  <div
                    style={{
                      background: "gold",
                      color: "black",
                      fontWeight: "bold",
                      padding: "4px 8px",
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  >
                    DESTACADO
                  </div>
                )}
              </div>

              <div style={{ marginTop: 6, opacity: 0.8 }}>
                {x.town || "Sin ciudad"} ·{" "}
                {x.listing_type === "RENT" ? "Alquiler" : "Venta"} ·{" "}
                {x.property_type || "Propiedad"}
              </div>

              <div style={{ marginTop: 6, fontWeight: 700 }}>
                {x.price ?? 0} {x.currency || "ARS"}
              </div>

              <div style={{ marginTop: 6 }}>
                Estado: <b>{x.status}</b>
              </div>

              <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  style={{
                    padding: 8,
                    border: "1px solid #ccc",
                    borderRadius: 6,
                    cursor: "pointer",
                    background: "white",
                  }}
                  onClick={() => router.push(`/mis-anuncios/${x.id}`)}
                  disabled={busy}
                >
                  Editar
                </button>

                {x.status === "PUBLISHED" && (
                  <a href={`/anuncio/${x.id}`} style={{ textDecoration: "none" }}>
                    <button
                      type="button"
                      style={{
                        padding: 8,
                        border: "1px solid #ccc",
                        borderRadius: 6,
                        cursor: "pointer",
                        background: "white",
                      }}
                    >
                      Ver público
                    </button>
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}