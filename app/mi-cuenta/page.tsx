"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function MiCuentaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = supabaseBrowser();
        const { data } = await supabase.auth.getUser();

        if (!data?.user) {
          window.location.href = "/login?next=/mi-cuenta";
          return;
        }

        setEmail(data.user.email || "");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <main style={mainWrap}>
        <div style={container}>
          <p style={{ color: "#64748B", fontSize: 18 }}>Cargando...</p>
        </div>
      </main>
    );
  }

  return (
    <main style={mainWrap}>
      <div style={container}>
        <a href="/" style={backLink}>
          ← Volver
        </a>

        <section
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: 20,
            alignItems: "center",
          }}
        >
          <div>
            <div style={kicker}>👤 Mi cuenta</div>

            <h1 style={heroTitle}>Tu espacio personal en VendoFácil</h1>

            <p style={heroText}>
              Administra tus favoritos, alertas, publicaciones y procesos de verificación desde un solo lugar.
            </p>
          </div>

          <div style={profileCard}>
            <div style={{ fontSize: 14, color: "#64748B", fontWeight: 700 }}>
              Email de la cuenta
            </div>

            <div
              style={{
                marginTop: 8,
                fontSize: 22,
                lineHeight: 1.3,
                color: "#0F172A",
                fontWeight: 900,
                wordBreak: "break-word",
              }}
            >
              {email}
            </div>

            <div
              style={{
                marginTop: 14,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#EFF6FF",
                color: "#1D4ED8",
                border: "1px solid #BFDBFE",
                padding: "8px 12px",
                borderRadius: 999,
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              Cuenta activa
            </div>
          </div>
        </section>

        <section style={{ marginTop: 26 }}>
          <div style={sectionCard}>
            <h2 style={sectionTitle}>Acciones rápidas</h2>

            <div style={grid}>
              <ActionCard
                href="/mis-favoritos"
                icon="❤️"
                title="Mis favoritos"
                text="Revisa las publicaciones que guardaste para volver a verlas rápido."
              />

              <ActionCard
                href="/mis-alertas"
                icon="🔔"
                title="Mis alertas"
                text="Gestiona tus búsquedas guardadas y los canales por donde quieres recibir avisos."
              />

              <ActionCard
                href="/mis-notificaciones"
                icon="📩"
                title="Mis notificaciones"
                text="Consulta novedades, avisos y movimientos relacionados con tu actividad."
              />

              <ActionCard
                href="/verificacion"
                icon="✅"
                title="Solicitar verificación"
                text="Envía documentación para validar tu perfil o tu negocio y generar más confianza."
              />

              <ActionCard
                href="/publicar"
                icon="🚀"
                title="Publicar"
                text="Crea una nueva publicación en inmuebles, clasificados, trabajo o viandas."
              />
            </div>
          </div>
        </section>

        <section style={{ marginTop: 24 }}>
          <div style={sectionCard}>
            <h2 style={sectionTitle}>Gestión de publicaciones</h2>

            <div style={grid}>
              <ActionCard
                href="/mis-anuncios"
                icon="🏠"
                title="Mis inmuebles"
                text="Edita, revisa y publica tus inmuebles desde tu panel."
              />

              <ActionCard
                href="/mis-clasificados"
                icon="📦"
                title="Mis clasificados"
                text="Administra artículos, vehículos, herramientas y más."
              />

              <ActionCard
                href="/mis-empleos"
                icon="💼"
                title="Mis empleos"
                text="Controla tus publicaciones laborales, borradores y avisos activos."
              />

              <ActionCard
                href="/mis-viandas"
                icon="🍱"
                title="Mis viandas"
                text="Organiza menús, publicaciones y opciones de comida que ofreces."
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function ActionCard({
  href,
  icon,
  title,
  text,
}: {
  href: string;
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <a href={href} style={card}>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          display: "grid",
          placeItems: "center",
          background: "#FFF7ED",
          fontSize: 24,
        }}
      >
        {icon}
      </div>

      <div style={{ marginTop: 16, fontWeight: 900, fontSize: 20, color: "#0F172A" }}>
        {title}
      </div>

      <div style={{ marginTop: 8, color: "#64748B", lineHeight: 1.6, fontSize: 15 }}>
        {text}
      </div>

      <div
        style={{
          marginTop: 16,
          color: "#2563EB",
          fontWeight: 800,
        }}
      >
        Abrir →
      </div>
    </a>
  );
}

const mainWrap: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(249,115,22,0.06), transparent 24%), linear-gradient(180deg, #f8fafc 0%, #f8f7f3 100%)",
  padding: "28px 20px 44px",
  fontFamily: "system-ui",
};

const container: React.CSSProperties = {
  maxWidth: 1120,
  margin: "0 auto",
};

const backLink: React.CSSProperties = {
  textDecoration: "none",
  color: "#2563EB",
  fontWeight: 800,
};

const kicker: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: "#EFF6FF",
  color: "#1D4ED8",
  border: "1px solid #BFDBFE",
  padding: "8px 12px",
  borderRadius: 999,
  fontWeight: 800,
  fontSize: 13,
};

const heroTitle: React.CSSProperties = {
  margin: "16px 0 0",
  fontSize: 46,
  lineHeight: 1.03,
  color: "#0F172A",
  fontWeight: 950,
  letterSpacing: "-0.03em",
  maxWidth: 760,
};

const heroText: React.CSSProperties = {
  marginTop: 14,
  color: "#64748B",
  fontSize: 18,
  lineHeight: 1.7,
  maxWidth: 760,
};

const profileCard: React.CSSProperties = {
  background: "white",
  border: "1px solid #E5E7EB",
  borderRadius: 22,
  padding: 22,
  boxShadow: "0 12px 28px rgba(15,23,42,0.06)",
};

const sectionCard: React.CSSProperties = {
  background: "white",
  border: "1px solid #E5E7EB",
  borderRadius: 22,
  padding: 22,
  boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
};

const sectionTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 28,
  lineHeight: 1.1,
  color: "#0F172A",
  fontWeight: 900,
};

const grid: React.CSSProperties = {
  marginTop: 18,
  display: "grid",
  gap: 16,
  gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
};

const card: React.CSSProperties = {
  display: "block",
  textDecoration: "none",
  color: "black",
  background: "#FAFAFA",
  border: "1px solid #EAEAEA",
  borderRadius: 18,
  padding: 18,
  boxShadow: "0 8px 20px rgba(15,23,42,0.03)",
};