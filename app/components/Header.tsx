"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const [q, setQ] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    router.push(`/buscar?q=${encodeURIComponent(query)}`);
  };

  return (
    <header
      style={{
        width: "100%",
        background: "white",
        borderBottom: "1px solid #eee",
        position: "sticky",
        top: 0,
        zIndex: 1000,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/"
          style={{
            fontWeight: 900,
            fontSize: 20,
            textDecoration: "none",
            color: "#0a7cff",
            whiteSpace: "nowrap",
          }}
        >
          Portal Vaca Muerta
        </Link>

        <form
          onSubmit={submit}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flex: 1,
            minWidth: 220,
            maxWidth: 420,
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar en todo el portal..."
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #ddd",
              fontSize: 14,
            }}
          />
          <button
            type="submit"
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "none",
              background: "#0a7cff",
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Buscar
          </button>
        </form>

        <nav
          style={{
            display: "flex",
            gap: 14,
            alignItems: "center",
            fontSize: 15,
            flexWrap: "wrap",
          }}
        >
          <Link href="/" style={link}>Inicio</Link>
          <Link href="/anuncio" style={link}>Inmuebles</Link>
          <Link href="/clasificados" style={link}>Clasificados</Link>
          <Link href="/trabajo" style={link}>Trabajo</Link>
          <Link href="/viandas" style={link}>Viandas</Link>

          <Link
            href="/publicar"
            style={{
              ...link,
              fontWeight: 700,
            }}
          >
            Publicar
          </Link>

          <Link
            href="/mis-anuncios"
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: "#0a7cff",
              color: "white",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Mis anuncios
          </Link>
        </nav>
      </div>
    </header>
  );
}

const link: React.CSSProperties = {
  textDecoration: "none",
  color: "#333",
};