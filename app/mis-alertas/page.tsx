"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type AlertRow = {
  id: string;
  item_type: string | null;
  query: string | null;
  town: string | null;
  is_active: boolean;
  notify_in_app: boolean;
  notify_email: boolean;
  notify_whatsapp: boolean;
  whatsapp_phone: string | null;
  created_at: string;
};

export default function MisAlertasPage() {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setMsg("");

      const supabase = supabaseBrowser();

      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) {
        setMsg("Tenés que iniciar sesión.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("saved_search_alerts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setAlerts((data ?? []) as AlertRow[]);
    } catch (e: any) {
      setMsg(e?.message || "Error cargando alertas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleActive = async (id: string, active: boolean) => {
    try {
      setWorkingId(id);
      const supabase = supabaseBrowser();

      const { error } = await supabase
        .from("saved_search_alerts")
        .update({ is_active: !active })
        .eq("id", id);

      if (error) throw error;

      await load();
    } catch (e: any) {
      setMsg(e?.message || "Error actualizando alerta");
    } finally {
      setWorkingId("");
    }
  };

  const toggleChannel = async (
    id: string,
    field: "notify_in_app" | "notify_email" | "notify_whatsapp",
    value: boolean
  ) => {
    try {
      setWorkingId(id);
      const supabase = supabaseBrowser();

      const { error } = await supabase
        .from("saved_search_alerts")
        .update({ [field]: !value })
        .eq("id", id);

      if (error) throw error;

      await load();
    } catch (e: any) {
      setMsg(e?.message || "Error actualizando canal");
    } finally {
      setWorkingId("");
    }
  };

  // 🔥 AQUÍ ESTÁ EL CAMBIO IMPORTANTE
  const updateWhatsappPhone = async (id: string, phone: string) => {
    try {
      setWorkingId(id);

      const supabase = supabaseBrowser();

      const cleanPhone = phone.replace(/[^\d]/g, "");

      const { error } = await supabase
        .from("saved_search_alerts")
        .update({ whatsapp_phone: cleanPhone })
        .eq("id", id);

      if (error) throw error;

      await load();
    } catch (e: any) {
      setMsg(e?.message || "Error actualizando WhatsApp");
    } finally {
      setWorkingId("");
    }
  };

  const remove = async (id: string) => {
    const ok = window.confirm("¿Eliminar esta alerta?");
    if (!ok) return;

    try {
      setWorkingId(id);

      const supabase = supabaseBrowser();

      const { error } = await supabase
        .from("saved_search_alerts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await load();
    } catch (e: any) {
      setMsg(e?.message || "Error eliminando alerta");
    } finally {
      setWorkingId("");
    }
  };

  const stats = useMemo(() => {
    return {
      total: alerts.length,
      activas: alerts.filter((x) => x.is_active).length,
      whatsapp: alerts.filter((x) => x.notify_whatsapp).length,
    };
  }, [alerts]);

  return (
    <main className="vf-page">
      <div className="vf-container">
        <a href="/" className="vf-back">← Volver</a>

        <h1 className="vf-title">🔔 Mis alertas</h1>

        <p className="vf-sub">
          Gestiona tus búsquedas guardadas y cómo quieres recibir notificaciones.
        </p>

        <div className="vf-stats">
          <Stat label="Total" value={stats.total} />
          <Stat label="Activas" value={stats.activas} />
          <Stat label="WhatsApp" value={stats.whatsapp} />
        </div>

        {msg && !loading && <p className="vf-msg">{msg}</p>}
        {loading && <p className="vf-msg">Cargando...</p>}

        {!loading && alerts.length === 0 && (
          <div className="vf-empty">
            <div>🔔</div>
            <h3>No tienes alertas</h3>
            <p>Guarda una búsqueda y aparecerá aquí.</p>
          </div>
        )}

        <div className="vf-grid">
          {alerts.map((a) => (
            <div key={a.id} className="vf-card">

              <div className="vf-card-title">
                {a.query || "Búsqueda sin texto"}
              </div>

              <div className="vf-card-sub">
                📍 {a.town || "Todas las ciudades"}
              </div>

              <div className="vf-card-type">
                Tipo: {labelType(a.item_type)}
              </div>

              <div className="vf-channels">
                <button
                  onClick={() => toggleChannel(a.id, "notify_in_app", a.notify_in_app)}
                  className={chip(a.notify_in_app)}
                >
                  Web
                </button>

                <button
                  onClick={() => toggleChannel(a.id, "notify_email", a.notify_email)}
                  className={chip(a.notify_email)}
                >
                  Email
                </button>

                <button
                  onClick={() => toggleChannel(a.id, "notify_whatsapp", a.notify_whatsapp)}
                  className={chip(a.notify_whatsapp)}
                >
                  WhatsApp
                </button>
              </div>

              {a.notify_whatsapp && (
                <div className="vf-wa">
                  <input
                    placeholder="Ej: 5492991234567 (sin + ni espacios)"
                    defaultValue={a.whatsapp_phone || ""}
                    onBlur={(e) => updateWhatsappPhone(a.id, e.target.value)}
                  />

                  <div className="vf-wa-help">
                    Escribe con código de país, sin +, sin espacios ni guiones.
                  </div>
                </div>
              )}

              <div className="vf-actions">
                <button
                  onClick={() => toggleActive(a.id, a.is_active)}
                  className={a.is_active ? "vf-on" : "vf-off"}
                >
                  {a.is_active ? "Activa" : "Desactivada"}
                </button>

                <button
                  onClick={() => remove(a.id)}
                  className="vf-delete"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .vf-page {
          background: #f8f7f3;
          min-height: 100vh;
          padding: 30px 0;
        }

        .vf-container {
          max-width: 1000px;
          margin: auto;
          padding: 0 20px;
        }

        .vf-back {
          color: #2563eb;
          font-weight: bold;
          text-decoration: none;
        }

        .vf-title {
          margin-top: 10px;
          font-size: 40px;
          font-weight: 900;
        }

        .vf-sub {
          color: #666;
          margin-top: 6px;
        }

        .vf-stats {
          margin-top: 20px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 10px;
        }

        .vf-grid {
          margin-top: 20px;
          display: grid;
          gap: 14px;
        }

        .vf-card {
          background: white;
          border-radius: 16px;
          padding: 16px;
          border: 1px solid #eee;
          transition: 0.2s;
        }

        .vf-card:hover {
          transform: translateY(-4px);
        }

        .vf-card-title {
          font-weight: 900;
          font-size: 18px;
        }

        .vf-card-sub {
          margin-top: 4px;
          color: #666;
        }

        .vf-card-type {
          margin-top: 6px;
          font-size: 14px;
          color: #555;
          font-weight: 700;
        }

        .vf-channels {
          margin-top: 10px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .vf-chip {
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid #ddd;
          background: #f5f5f5;
          font-weight: 700;
          cursor: pointer;
        }

        .vf-chip-on {
          background: #e3f2fd;
          border-color: #90caf9;
        }

        .vf-wa input {
          margin-top: 10px;
          width: 100%;
          padding: 8px;
          border-radius: 8px;
          border: 1px solid #ddd;
        }

        .vf-wa-help {
          margin-top: 6px;
          font-size: 12px;
          color: #666;
        }

        .vf-actions {
          margin-top: 12px;
          display: flex;
          gap: 8px;
        }

        .vf-on {
          background: #16a34a;
          color: white;
          border: none;
          padding: 8px;
          border-radius: 8px;
        }

        .vf-off {
          background: #aaa;
          color: white;
          border: none;
          padding: 8px;
          border-radius: 8px;
        }

        .vf-delete {
          background: #fee2e2;
          color: #b91c1c;
          border: none;
          padding: 8px;
          border-radius: 8px;
        }

        .vf-empty {
          margin-top: 30px;
          text-align: center;
        }
      `}</style>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{
      background: "white",
      padding: 12,
      borderRadius: 12,
      border: "1px solid #eee"
    }}>
      <div style={{ fontSize: 12 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 900 }}>{value}</div>
    </div>
  );
}

function chip(active: boolean): string {
  return active ? "vf-chip vf-chip-on" : "vf-chip";
}

function labelType(value: string | null): string {
  if (value === "listing") return "Inmuebles";
  if (value === "classified") return "Clasificados";
  if (value === "job") return "Trabajo";
  if (value === "meal") return "Viandas";
  return "Todos";
}