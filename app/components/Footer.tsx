"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer
      style={{
        marginTop: 60,
        background: "#111",
        color: "white",
        borderTop: "1px solid #222",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "40px 20px 24px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 24,
        }}
      >
        <div>
          <div style={{ fontWeight: 900, fontSize: 22 }}>
            Portal Vaca Muerta
          </div>

          <p style={{ marginTop: 12, opacity: 0.8, lineHeight: 1.6 }}>
            Inmuebles, clasificados, trabajo y viandas/comida casera en Añelo,
            Rincón de los Sauces, Catriel, Malargüe y zonas cercanas.
          </p>

          <div style={{ marginTop: 14, opacity: 0.7, fontSize: 14 }}>
            Portal local para conectar oferta y demanda en la zona.
          </div>
        </div>

        <div>
          <div style={titleStyle}>Secciones</div>

          <div style={listStyle}>
            <Link href="/anuncio" style={linkStyle}>Inmuebles</Link>
            <Link href="/clasificados" style={linkStyle}>Clasificados</Link>
            <Link href="/trabajo" style={linkStyle}>Trabajo</Link>
            <Link href="/viandas" style={linkStyle}>Viandas</Link>
          </div>
        </div>

        <div>
          <div style={titleStyle}>Publicar</div>

          <div style={listStyle}>
            <Link href="/publicar" style={linkStyle}>Elegir tipo</Link>
            <Link href="/mis-anuncios" style={linkStyle}>Publicar inmueble</Link>
            <Link href="/mis-clasificados" style={linkStyle}>Publicar clasificado</Link>
            <Link href="/mis-empleos" style={linkStyle}>Publicar trabajo</Link>
            <Link href="/mis-viandas" style={linkStyle}>Publicar viandas</Link>
          </div>
        </div>

        <div>
          <div style={titleStyle}>Zonas</div>

          <div style={listStyle}>
            <Link href="/anuncio?town=Añelo" style={linkStyle}>Añelo</Link>
            <Link href="/anuncio?town=Rincón%20de%20los%20Sauces" style={linkStyle}>Rincón de los Sauces</Link>
            <Link href="/anuncio?town=Catriel" style={linkStyle}>Catriel</Link>
            <Link href="/anuncio?town=Malargüe" style={linkStyle}>Malargüe</Link>
            <Link href="/anuncio?town=Las%20Ovejas" style={linkStyle}>Las Ovejas</Link>
            <Link href="/anuncio?town=Chos%20Malal" style={linkStyle}>Chos Malal</Link>
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "14px 20px 24px",
          borderTop: "1px solid #222",
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          fontSize: 14,
          opacity: 0.7,
        }}
      >
        <div>© {new Date().getFullYear()} Portal Vaca Muerta</div>
        <div>Hecho para la zona de Vaca Muerta</div>
      </div>
    </footer>
  );
}

const titleStyle: React.CSSProperties = {
  fontWeight: 800,
  marginBottom: 12,
  fontSize: 16,
};

const listStyle: React.CSSProperties = {
  display: "grid",
  gap: 10,
};

const linkStyle: React.CSSProperties = {
  color: "white",
  textDecoration: "none",
  opacity: 0.82,
};