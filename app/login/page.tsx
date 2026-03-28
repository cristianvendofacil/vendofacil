"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [nextUrl, setNextUrl] = useState("/");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNextUrl(params.get("next") || "/");
  }, []);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setMsg("");

      const supabase = supabaseBrowser();

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      window.location.href = nextUrl;
    } catch (e: any) {
      setMsg(e?.message || "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        maxWidth: 460,
        margin: "0 auto",
        padding: 40,
        fontFamily: "system-ui",
      }}
    >
      <a
        href="/"
        style={{
          textDecoration: "none",
          color: "#2563eb",
          fontWeight: 700,
        }}
      >
        ← Volver
      </a>

      <h1 style={{ marginTop: 20 }}>Ingresar</h1>

      <form
        onSubmit={login}
        style={{
          marginTop: 20,
          background: "white",
          border: "1px solid #eee",
          borderRadius: 16,
          padding: 20,
        }}
      >
        <label style={{ display: "block", fontWeight: 700 }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
          required
        />

        <label style={{ display: "block", marginTop: 16, fontWeight: 700 }}>
          Contraseña
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
          required
        />

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "Ingresando..." : "Ingresar"}
        </button>

        {msg && (
          <div style={{ marginTop: 14, color: "#c62828", fontWeight: 700 }}>
            {msg}
          </div>
        )}
      </form>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 8,
  padding: 12,
  borderRadius: 10,
  border: "1px solid #ddd",
  boxSizing: "border-box",
};

const buttonStyle: React.CSSProperties = {
  marginTop: 20,
  width: "100%",
  padding: 14,
  border: "none",
  borderRadius: 10,
  background: "#2563eb",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
};