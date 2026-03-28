"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function SaveSearchAlert({
  itemType,
  query,
  town,
}: {
  itemType: string;
  query: string;
  town: string;
}) {
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const [notifyInApp, setNotifyInApp] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState("");

  const save = async () => {
    try {
      setLoading(true);
      setMsg("");

      const supabase = supabaseBrowser();
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError) throw userError;

      const user = userData?.user;

      if (!user) {
        setMsg("Tenés que iniciar sesión para guardar alertas.");
        return;
      }

      if (!notifyInApp && !notifyEmail && !notifyWhatsapp) {
        setMsg("Elegí al menos un canal de alerta.");
        return;
      }

      if (notifyWhatsapp && !whatsappPhone.trim()) {
        setMsg("Completa tu número de WhatsApp.");
        return;
      }

      const res = await fetch("/api/alerts/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          itemType,
          query,
          town,
          notifyInApp,
          notifyEmail,
          notifyWhatsapp,
          whatsappPhone: whatsappPhone.trim(),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setMsg(json?.error || "Error guardando alerta.");
        return;
      }

      setMsg("🔔 Alerta guardada correctamente.");
      setOpen(false);
    } catch (e: any) {
      setMsg(e?.message || "Error guardando alerta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 0 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 12,
          border: open ? "1px solid #cbd5e1" : "1px solid #dbeafe",
          background: open ? "white" : "#eff6ff",
          color: open ? "#0f172a" : "#1d4ed8",
          cursor: "pointer",
          fontWeight: 800,
          boxShadow: open ? "none" : "0 8px 18px rgba(37,99,235,0.08)",
        }}
      >
        {open ? "Cerrar alerta" : "🔔 Guardar alerta"}
      </button>

      {open && (
        <div
          style={{
            marginTop: 12,
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 16,
            boxShadow: "0 10px 24px rgba(15,23,42,0.05)",
          }}
        >
          <div
            style={{
              fontWeight: 900,
              marginBottom: 6,
              color: "#0f172a",
              fontSize: 16,
            }}
          >
            Recibir alertas para esta búsqueda
          </div>

          <div
            style={{
              color: "#64748b",
              fontSize: 14,
              lineHeight: 1.6,
              marginBottom: 12,
            }}
          >
            Guarda esta búsqueda y te avisamos cuando aparezcan publicaciones nuevas que coincidan.
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 8,
              color: "#334155",
              fontWeight: 700,
            }}
          >
            <input
              type="checkbox"
              checked={notifyInApp}
              onChange={(e) => setNotifyInApp(e.target.checked)}
            />
            En la web
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 8,
              color: "#334155",
              fontWeight: 700,
            }}
          >
            <input
              type="checkbox"
              checked={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.checked)}
            />
            Email
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 8,
              color: "#334155",
              fontWeight: 700,
            }}
          >
            <input
              type="checkbox"
              checked={notifyWhatsapp}
              onChange={(e) => setNotifyWhatsapp(e.target.checked)}
            />
            WhatsApp
          </label>

          {notifyWhatsapp && (
            <input
              value={whatsappPhone}
              onChange={(e) => setWhatsappPhone(e.target.value)}
              placeholder="Tu número de WhatsApp"
              style={{
                width: "100%",
                marginTop: 12,
                padding: 12,
                borderRadius: 12,
                border: "1px solid #dbe2ea",
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          )}

          <button
            type="button"
            onClick={save}
            disabled={loading}
            style={{
              marginTop: 14,
              width: "100%",
              padding: "12px 14px",
              borderRadius: 12,
              border: "none",
              background: "#111",
              color: "white",
              cursor: "pointer",
              fontWeight: 900,
            }}
          >
            {loading ? "Guardando..." : "Guardar alerta"}
          </button>
        </div>
      )}

      {msg && (
        <div
          style={{
            marginTop: 8,
            fontSize: 13,
            color: msg.includes("correctamente") ? "#166534" : "#475569",
            fontWeight: 700,
            lineHeight: 1.5,
          }}
        >
          {msg}
        </div>
      )}
    </div>
  );
}