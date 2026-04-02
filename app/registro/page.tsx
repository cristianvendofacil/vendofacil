"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

export default function RegistroPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const register = async () => {
    try {
      setLoading(true);
      setMsg("");

      if (!accepted) {
        setMsg("Debes aceptar los Términos y Condiciones.");
        return;
      }

      const supabase = supabaseBrowser();

      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) throw error;

      setMsg("Cuenta creada correctamente. Ahora inicia sesión.");
      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (e: any) {
      setMsg(e?.message || "Error creando cuenta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        maxWidth: 480,
        margin: "0 auto",
        padding: 24,
        fontFamily: "system-ui",
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

      <h1 style={{ marginTop: 16 }}>Crear cuenta</h1>

      <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
        <input
          type="email"
          placeholder="Tu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={input}
        />

        <input
          type="password"
          placeholder="Tu contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={input}
        />

        {/* ✅ CHECKBOX NUEVO */}
        <label
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            fontSize: 14,
          }}
        >
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          />
          Acepto los{" "}
          <a
            href="/terminos"
            target="_blank"
            style={{ color: "#0a7cff", fontWeight: 700 }}
          >
            Términos y Condiciones
          </a>
        </label>

        <button
          type="button"
          onClick={register}
          disabled={loading}
          style={btn}
        >
          {loading ? "Creando..." : "Crear cuenta"}
        </button>
      </div>

      {msg && <p style={{ marginTop: 14 }}>{msg}</p>}

      <p style={{ marginTop: 18, opacity: 0.8 }}>
        ¿Ya tenés cuenta?{" "}
        <a href="/login" style={{ color: "#0a7cff", fontWeight: 700 }}>
          Ingresar
        </a>
      </p>
    </main>
  );
}

const input: React.CSSProperties = {
  padding: 12,
  borderRadius: 8,
  border: "1px solid #ccc",
};

const btn: React.CSSProperties = {
  padding: 12,
  borderRadius: 8,
  border: "none",
  background: "#0a7cff",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
};