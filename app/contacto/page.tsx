"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function ContactoPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("Consulta general");
  const [message, setMessage] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    try {
      setLoading(true);
      setMsg("");

      if (!name.trim()) {
        setMsg("Completa tu nombre.");
        return;
      }

      if (!email.trim()) {
        setMsg("Completa tu email.");
        return;
      }

      if (!message.trim()) {
        setMsg("Escribe un mensaje.");
        return;
      }

      const supabase = supabaseBrowser();

      const { error } = await supabase.from("contact_messages").insert({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        reason: reason.trim(),
        message: message.trim(),
      });

      if (error) throw error;

      setMsg("Mensaje enviado correctamente ✅");
      setName("");
      setEmail("");
      setPhone("");
      setReason("Consulta general");
      setMessage("");
    } catch (e: any) {
      setMsg(e?.message || "Error enviando mensaje");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F8F7F3",
        padding: "40px 20px",
        fontFamily: "system-ui",
      }}
    >
      <div
        style={{
          maxWidth: 760,
          margin: "0 auto",
        }}
      >
        <a
          href="/"
          style={{
            textDecoration: "none",
            color: "#0a7cff",
            fontWeight: 700,
          }}
        >
          ← Volver
        </a>

        <div style={{ marginTop: 18 }}>
          <div
            style={{
              display: "inline-flex",
              background: "#FFF7ED",
              color: "#C2410C",
              border: "1px solid #FDBA74",
              padding: "8px 12px",
              borderRadius: 999,
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            ✉️ Contacto
          </div>

          <h1
            style={{
              marginTop: 16,
              fontSize: 42,
              fontWeight: 900,
              color: "#0F172A",
            }}
          >
            Envíanos tu mensaje
          </h1>

          <p
            style={{
              marginTop: 12,
              color: "#64748B",
              fontSize: 18,
              lineHeight: 1.6,
              maxWidth: 640,
            }}
          >
            Si tienes una consulta, un problema con una publicación, dudas sobre
            pagos o quieres reportar contenido, puedes escribirnos desde aquí.
          </p>
        </div>

        <div
          style={{
            marginTop: 28,
            background: "white",
            border: "1px solid #E5E7EB",
            borderRadius: 20,
            padding: 24,
            boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
          }}
        >
          <div
            style={{
              display: "grid",
              gap: 14,
              gridTemplateColumns: "1fr 1fr",
            }}
          >
            <div style={{ display: "grid", gap: 8 }}>
              <label style={label}>Nombre</label>
              <input
                type="text"
                placeholder="Tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={input}
              />
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <label style={label}>Email</label>
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={input}
              />
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <label style={label}>Motivo</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={input}
              >
                <option>Consulta general</option>
                <option>Problema con una publicación</option>
                <option>Reportar usuario o contenido</option>
                <option>Ayuda con pagos</option>
                <option>Sugerencia</option>
                <option>Publicidad / alianza</option>
                <option>Otro</option>
              </select>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <label style={label}>Teléfono (opcional)</label>
              <input
                type="text"
                placeholder="Tu teléfono"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={input}
              />
            </div>

            <div
              style={{
                display: "grid",
                gap: 8,
                gridColumn: "1 / -1",
              }}
            >
              <label style={label}>Mensaje</label>
              <textarea
                placeholder="Escribe tu mensaje"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{
                  ...input,
                  minHeight: 140,
                  resize: "vertical",
                }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={send}
            disabled={loading}
            style={{
              marginTop: 18,
              padding: "12px 16px",
              borderRadius: 12,
              border: "none",
              background: "#0a7cff",
              color: "white",
              fontWeight: 800,
              cursor: "pointer",
              minWidth: 180,
            }}
          >
            {loading ? "Enviando..." : "Enviar mensaje"}
          </button>

          {msg && (
            <p
              style={{
                marginTop: 14,
                color: msg.includes("✅") ? "#166534" : "#334155",
                fontWeight: 700,
              }}
            >
              {msg}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

const label: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 800,
  color: "#334155",
};

const input: React.CSSProperties = {
  padding: 12,
  borderRadius: 10,
  border: "1px solid #CBD5E1",
  background: "white",
  fontSize: 15,
  color: "#0F172A",
  width: "100%",
  boxSizing: "border-box",
};