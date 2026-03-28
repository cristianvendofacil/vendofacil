"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

const BUCKET = "classified-photos";

type Classified = {
  id: string;
  title: string;
  town: string | null;
  price: number | null;
  currency: string | null;
  status: string | null;
  created_at?: string | null;
  photo_paths?: string[] | null;
};

export default function Page() {
  const router = useRouter();
  const [items, setItems] = useState<Classified[]>([]);
  const [thumbUrlById, setThumbUrlById] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("Cargando...");
  const [creating, setCreating] = useState(false);

  const load = async () => {
    try {
      const supabase = supabaseBrowser();

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error("Debes iniciar sesión");

      const { data, error } = await supabase
        .from("classifieds")
        .select("id,title,town,price,currency,status,created_at,photo_paths")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const rows = (data ?? []) as Classified[];
      setItems(rows);

      const firstPaths = rows
        .map((x) => ({ id: x.id, path: (x.photo_paths || [])[0] }))
        .filter((x) => !!x.path) as { id: string; path: string }[];

      if (firstPaths.length > 0) {
        const { data: signed, error: signErr } = await supabase.storage
          .from(BUCKET)
          .createSignedUrls(
            firstPaths.map((x) => x.path),
            60 * 60
          );

        if (signErr) throw signErr;

        const map: Record<string, string> = {};
        firstPaths.forEach((x, i) => {
          const url = signed?.[i]?.signedUrl;
          if (url) map[x.id] = url;
        });

        setThumbUrlById(map);
      } else {
        setThumbUrlById({});
      }

      setMsg(rows.length ? "" : "No tienes clasificados todavía.");
    } catch (e: any) {
      setMsg(e?.message || "Error cargando clasificados");
      setItems([]);
      setThumbUrlById({});
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createDraft = async () => {
    try {
      setCreating(true);
      setMsg("");

      const supabase = supabaseBrowser();

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error("Debes iniciar sesión");

      const payload = {
        user_id: userData.user.id,
        title: "Nuevo clasificado",
        town: "",
        price: 0,
        currency: "ARS",
        whatsapp: "",
        description: "",
        photo_paths: [],
        status: "DRAFT",
      };

      const { data, error } = await supabase
        .from("classifieds")
        .insert(payload)
        .select("id")
        .single();

      if (error) throw error;

      router.push(`/mis-clasificados/${data.id}`);
    } catch (e: any) {
      setMsg(e?.message || "Error creando clasificado");
    } finally {
      setCreating(false);
    }
  };

  return (
    <main
      style={{
        padding: 40,
        fontFamily: "system-ui",
        maxWidth: 1000,
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

      <h1>Mis clasificados</h1>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
        <button
          type="button"
          onClick={createDraft}
          disabled={creating}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            background: "#0a7cff",
            color: "white",
            border: "none",
            fontWeight: 700,
            cursor: creating ? "not-allowed" : "pointer",
          }}
        >
          {creating ? "Creando..." : "+ Crear clasificado"}
        </button>

        <a
          href="/clasificados"
          style={{
            display: "inline-block",
            padding: "10px 14px",
            borderRadius: 8,
            background: "white",
            color: "#333",
            border: "1px solid #ddd",
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          Ver públicos
        </a>
      </div>

      {msg && <p style={{ marginTop: 18 }}>{msg}</p>}

      <div
        style={{
          display: "grid",
          gap: 14,
          marginTop: 20,
          gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
        }}
      >
        {items.map((x) => (
          <div
            key={x.id}
            style={{
              border: "1px solid #eee",
              borderRadius: 12,
              background: "white",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: 180,
                background: "#f1f1f1",
                display: "grid",
                placeItems: "center",
              }}
            >
              {thumbUrlById[x.id] ? (
                <img
                  src={thumbUrlById[x.id]}
                  alt="foto"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div style={{ opacity: 0.65 }}>Sin foto</div>
              )}
            </div>

            <div style={{ padding: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 17 }}>
                {x.title || "Sin título"}
              </div>

              <div style={{ marginTop: 6, opacity: 0.75 }}>
                {x.town || "Sin ciudad"}
              </div>

              <div style={{ marginTop: 8, fontWeight: 800, color: "#0a7cff" }}>
                {(x.price ?? 0)} {x.currency || "ARS"}
              </div>

              <div style={{ marginTop: 6, opacity: 0.75 }}>
                Estado: <b>{x.status || "DRAFT"}</b>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => router.push(`/mis-clasificados/${x.id}`)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: "#111",
                    color: "white",
                    border: "none",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Editar
                </button>

                {x.status === "PUBLISHED" && (
                  <a
                    href={`/clasificados/${x.id}`}
                    style={{
                      display: "inline-block",
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: "white",
                      color: "#333",
                      border: "1px solid #ddd",
                      textDecoration: "none",
                      fontWeight: 700,
                    }}
                  >
                    Ver público
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}