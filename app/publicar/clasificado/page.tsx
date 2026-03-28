"use client";

import { useEffect } from "react";

export default function PublicarClasificadoPage() {
  useEffect(() => {
    window.location.href = "/publicar?type=classified";
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F8F7F3",
        padding: "32px 20px",
        fontFamily: "system-ui",
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      <p style={{ color: "#64748B", fontSize: 18 }}>Redirigiendo...</p>
    </main>
  );
}