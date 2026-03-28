"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type NotificationRow = {
  id: string;
  title: string;
  message: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export default function MisNotificacionesPage() {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setMsg("");

      const supabase = supabaseBrowser();

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const user = userData?.user;

      if (!user) {
        setMsg("Tenés que iniciar sesión.");
        return;
      }

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setItems((data ?? []) as NotificationRow[]);
    } catch (e: any) {
      setMsg(e?.message || "Error cargando notificaciones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id: string) => {
    try {
      setWorking(true);
      const supabase = supabaseBrowser();

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);

      if (error) throw error;

      await load();
    } catch (e: any) {
      setMsg(e?.message || "Error marcando notificación");
    } finally {
      setWorking(false);
    }
  };

  const markAllRead = async () => {
    try {
      setWorking(true);

      const supabase = supabaseBrowser();

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const user = userData?.user;
      if (!user) return;

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;

      await load();
    } catch (e: any) {
      setMsg(e?.message || "Error marcando todo como leído");
    } finally {
      setWorking(false);
    }
  };

  const stats = useMemo(() => {
    const unread = items.filter((x) => !x.is_read).length;
    const read = items.filter((x) => x.is_read).length;

    return {
      total: items.length,
      unread,
      read,
    };
  }, [items]);

  return (
    <main className="vf-page">
      <div className="vf-container">
        <a href="/" className="vf-back">
          ← Volver
        </a>

        <section className="vf-hero">
          <div className="vf-kicker">📬 Notificaciones</div>

          <div className="vf-head-row">
            <div>
              <h1 className="vf-title">Mis notificaciones</h1>
              <p className="vf-sub">
                Revisa novedades, avisos y actividad reciente de tu cuenta.
              </p>
            </div>

            <button
              onClick={markAllRead}
              disabled={working}
              className="vf-mark-all"
            >
              {working ? "Procesando..." : "Marcar todo como leído"}
            </button>
          </div>
        </section>

        <section className="vf-stats">
          <Stat label="Total" value={stats.total} />
          <Stat label="No leídas" value={stats.unread} accent="#2563EB" />
          <Stat label="Leídas" value={stats.read} accent="#16A34A" />
        </section>

        {msg && !loading && <p className="vf-msg">{msg}</p>}
        {loading && <p className="vf-msg">Cargando...</p>}

        {!loading && items.length === 0 && !msg && (
          <div className="vf-empty">
            <div className="vf-empty-icon">📭</div>
            <h3>No tenés notificaciones todavía</h3>
            <p>
              Cuando haya novedades o actividad importante en tu cuenta, aparecerán aquí.
            </p>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="vf-grid">
            {items.map((n, index) => (
              <div
                key={n.id}
                className={`vf-card ${n.is_read ? "read" : "unread"}`}
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="vf-card-top">
                  <div className="vf-badge-row">
                    <span className={`vf-status ${n.is_read ? "read" : "unread"}`}>
                      {n.is_read ? "Leída" : "Nueva"}
                    </span>
                  </div>

                  <div className="vf-visual">
                    <span>VF</span>
                  </div>
                </div>

                <div className="vf-card-body">
                  <div className="vf-card-title">{n.title}</div>

                  {n.message && (
                    <div className="vf-card-message">
                      {n.message}
                    </div>
                  )}

                  <div className="vf-date">
                    {new Date(n.created_at).toLocaleString()}
                  </div>

                  <div className="vf-actions">
                    {n.link && (
                      <a
                        href={n.link}
                        onClick={() => {
                          if (!n.is_read) {
                            markRead(n.id);
                          }
                        }}
                        className="vf-primary-link"
                      >
                        Ver publicación
                      </a>
                    )}

                    {!n.is_read && (
                      <button
                        onClick={() => markRead(n.id)}
                        disabled={working}
                        className="vf-secondary-btn"
                      >
                        {working ? "Procesando..." : "Marcar como leído"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .vf-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(37, 99, 235, 0.06), transparent 24%),
            linear-gradient(180deg, #f8fafc 0%, #f8f7f3 100%);
          padding: 28px 0 44px;
        }

        .vf-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .vf-back {
          text-decoration: none;
          color: #2563eb;
          font-weight: 800;
        }

        .vf-hero {
          margin-top: 18px;
          animation: fadeUp 0.45s ease both;
        }

        .vf-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 800;
        }

        .vf-head-row {
          margin-top: 14px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          flex-wrap: wrap;
        }

        .vf-title {
          margin: 0;
          font-size: 46px;
          line-height: 1.02;
          color: #0f172a;
          font-weight: 950;
          letter-spacing: -0.03em;
        }

        .vf-sub {
          margin-top: 12px;
          color: #64748b;
          font-size: 18px;
          line-height: 1.7;
          max-width: 780px;
        }

        .vf-mark-all {
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid #dbeafe;
          background: white;
          color: #1d4ed8;
          cursor: pointer;
          font-weight: 800;
          white-space: nowrap;
        }

        .vf-stats {
          margin-top: 24px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 14px;
          animation: fadeUp 0.55s ease both;
        }

        .vf-msg {
          margin-top: 22px;
          color: #334155;
          font-weight: 700;
          animation: fadeUp 0.45s ease both;
        }

        .vf-empty {
          margin-top: 28px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 24px;
          padding: 30px 22px;
          text-align: center;
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
          animation: fadeUp 0.45s ease both;
        }

        .vf-empty-icon {
          font-size: 36px;
        }

        .vf-empty h3 {
          margin-top: 10px;
          font-size: 24px;
          font-weight: 900;
          color: #0f172a;
        }

        .vf-empty p {
          margin-top: 10px;
          color: #64748b;
          line-height: 1.65;
          max-width: 560px;
          margin-left: auto;
          margin-right: auto;
        }

        .vf-grid {
          margin-top: 28px;
          display: grid;
          gap: 18px;
        }

        .vf-card {
          background: white;
          border-radius: 22px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
          transition:
            transform 0.22s ease,
            box-shadow 0.22s ease,
            border-color 0.22s ease;
          animation: fadeUp 0.45s ease both;
        }

        .vf-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 18px 42px rgba(15, 23, 42, 0.09);
          border-color: #cbd5e1;
        }

        .vf-card.unread {
          border-color: #bfdbfe;
          box-shadow: 0 12px 30px rgba(37, 99, 235, 0.08);
        }

        .vf-card-top {
          padding: 14px 14px 0;
        }

        .vf-badge-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          min-height: 28px;
        }

        .vf-status {
          display: inline-flex;
          align-items: center;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.02em;
        }

        .vf-status.unread {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .vf-status.read {
          background: #f1f5f9;
          color: #475569;
        }

        .vf-visual {
          margin-top: 12px;
          height: 120px;
          border-radius: 16px;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 48%, #2563eb 100%);
          display: grid;
          place-items: center;
          position: relative;
          overflow: hidden;
        }

        .vf-visual::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            120deg,
            transparent 0%,
            rgba(255, 255, 255, 0.08) 45%,
            transparent 70%
          );
          transform: translateX(-120%);
          transition: transform 0.6s ease;
        }

        .vf-card:hover .vf-visual::after {
          transform: translateX(120%);
        }

        .vf-visual span {
          color: white;
          font-weight: 950;
          font-size: 40px;
          letter-spacing: -0.03em;
          opacity: 0.92;
        }

        .vf-card-body {
          padding: 16px;
        }

        .vf-card-title {
          font-size: 22px;
          line-height: 1.18;
          font-weight: 950;
          color: #0f172a;
        }

        .vf-card-message {
          margin-top: 10px;
          color: #475569;
          font-size: 15px;
          line-height: 1.7;
        }

        .vf-date {
          margin-top: 12px;
          font-size: 13px;
          color: #64748b;
          font-weight: 700;
        }

        .vf-actions {
          margin-top: 16px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .vf-primary-link {
          text-decoration: none;
          color: white;
          background: #2563eb;
          padding: 10px 14px;
          border-radius: 12px;
          font-weight: 800;
        }

        .vf-secondary-btn {
          padding: 10px 14px;
          border-radius: 12px;
          border: 1px solid #dbe2ea;
          background: white;
          cursor: pointer;
          font-weight: 800;
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 640px) {
          .vf-title {
            font-size: 38px;
          }

          .vf-sub {
            font-size: 17px;
          }
        }
      `}</style>
    </main>
  );
}

function Stat({
  label,
  value,
  accent = "#0F172A",
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #E5E7EB",
        borderRadius: 18,
        padding: 18,
        boxShadow: "0 8px 20px rgba(15,23,42,0.04)",
      }}
    >
      <div
        style={{
          fontSize: 14,
          color: "#64748B",
          fontWeight: 700,
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 10,
          fontSize: 32,
          fontWeight: 950,
          lineHeight: 1,
          color: accent,
        }}
      >
        {value}
      </div>
    </div>
  );
}