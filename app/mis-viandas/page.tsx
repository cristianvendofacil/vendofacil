"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

type Meal = {
  id: string;
  title: string;
  town: string;
  price: number;
  currency: string;
  status: string;
  created_at: string;
  published_until: string | null;
  featured_until: string | null;
  urgent_until?: string | null;
  meal_type: string;
  delivery_type: string;
  photo_paths?: string[] | null;
};

export default function MyMealsPage() {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [items, setItems] = useState<Meal[]>([]);
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
        .from("meals")
        .select(
          "id,title,town,price,currency,status,created_at,published_until,featured_until,urgent_until,meal_type,delivery_type,photo_paths"
        )
        .eq("user_id", userRes.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setItems((data ?? []) as Meal[]);
      setMsg((data ?? []).length ? "" : "No tenés publicaciones todavía.");
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
        title: "Nueva vianda / comida",
        town: "Añelo",
        description: "",
        whatsapp: "",
        price: 0,
        currency: "ARS",
        meal_type: "VIANDA",
        delivery_type: "RETIRO",
        status: "DRAFT",
        is_published: false,
        photo_paths: [],
      };

      const { data, error } = await supabase
        .from("meals")
        .insert(payload)
        .select("id")
        .single();

      if (error) throw error;

      router.push(`/mis-viandas/${data.id}`);
    } catch (e: any) {
      setMsg("Error creando borrador: " + (e?.message || ""));
    }
  };

  const remove = async (id: string) => {
    const ok = confirm("¿Eliminar esta publicación?");
    if (!ok) return;

    try {
      setWorkingId(id);
      setMsg("Eliminando...");

      const { error } = await supabase.from("meals").delete().eq("id", id);
      if (error) throw error;

      await load();
    } catch (e: any) {
      setMsg("Error eliminando: " + (e?.message || ""));
    } finally {
      setWorkingId(null);
    }
  };

  const isFeatured = (x: Meal) =>
    !!x.featured_until && new Date(x.featured_until).getTime() > Date.now();

  const isUrgent = (x: Meal) =>
    !!x.urgent_until && new Date(x.urgent_until).getTime() > Date.now();

  return (
    <main style={{ padding: 40, fontFamily: "system-ui", maxWidth: 980 }}>
      <h1>Mis viandas / comidas</h1>

      <p style={{ marginTop: 10, color: "#64748B", lineHeight: 1.6 }}>
        Todas las publicaciones de viandas son pagas y requieren al menos una
        foto antes de pasar al pago.
      </p>

      <button
        style={{
          marginTop: 10,
          padding: 10,
          background: "#111",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
        }}
        onClick={createDraft}
      >
        + Crear publicación
      </button>

      {msg && <p style={{ marginTop: 18 }}>{msg}</p>}

      <div style={{ marginTop: 20, display: "grid", gap: 12 }}>
        {items.map((x) => {
          const featured = isFeatured(x);
          const urgent = isUrgent(x);
          const busy = workingId === x.id;
          const photoCount = x.photo_paths?.length || 0;

          return (
            <div
              key={x.id}
              style={{
                border: urgent
                  ? "2px solid #dc2626"
                  : featured
                  ? "2px solid gold"
                  : "1px solid #ddd",
                padding: 14,
                borderRadius: 10,
                background: "white",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
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

                {urgent && (
                  <div
                    style={{
                      background: "#dc2626",
                      color: "white",
                      fontWeight: "bold",
                      padding: "4px 8px",
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  >
                    URGENTE
                  </div>
                )}
              </div>

              <div style={{ marginTop: 6, opacity: 0.8 }}>
                {x.town || "Sin ciudad"} · {x.meal_type} · {x.delivery_type}
              </div>

              <div style={{ marginTop: 6, fontWeight: 700 }}>
                {x.price ?? 0} {x.currency || "ARS"}
              </div>

              <div style={{ marginTop: 6 }}>
                Estado: <b>{x.status}</b>
              </div>

              <div style={{ marginTop: 6, opacity: 0.75 }}>
                Fotos: <b>{photoCount}</b>
              </div>

              <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  style={{
                    padding: 8,
                    border: "1px solid #ccc",
                    borderRadius: 6,
                    cursor: "pointer",
                    background: "white",
                  }}
                  onClick={() => router.push(`/mis-viandas/${x.id}`)}
                >
                  Editar
                </button>

                <button
                  style={{
                    padding: 8,
                    border: "1px solid #ccc",
                    borderRadius: 6,
                    cursor: "pointer",
                    background: "white",
                  }}
                  onClick={() => remove(x.id)}
                  disabled={busy}
                >
                  {busy ? "Procesando..." : "Eliminar"}
                </button>

                {x.status === "PUBLISHED" && (
                  <a href={`/viandas/${x.id}`} style={{ textDecoration: "none" }}>
                    <button
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