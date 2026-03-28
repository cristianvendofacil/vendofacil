"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type PublishType = "listing" | "classified" | "job" | "meal" | "";

function normalizeType(value: string | null): PublishType {
  if (value === "listing") return "listing";
  if (value === "classified") return "classified";
  if (value === "job") return "job";
  if (value === "meal") return "meal";
  return "";
}

function getPublishPath(type: PublishType) {
  if (type === "listing") return "/mis-anuncios";
  if (type === "classified") return "/mis-clasificados";
  if (type === "job") return "/mis-empleos";
  if (type === "meal") return "/mis-viandas";
  return "";
}

function getTypeLabel(type: PublishType) {
  if (type === "listing") return "inmuebles";
  if (type === "classified") return "clasificados";
  if (type === "job") return "trabajo";
  if (type === "meal") return "viandas";
  return "publicaciones";
}

export default function PublicarPage() {
  const [requestedType, setRequestedType] = useState<PublishType>("");
  const [paramsReady, setParamsReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRequestedType(normalizeType(params.get("type")));
    setParamsReady(true);
  }, []);

  const directPath = useMemo(() => getPublishPath(requestedType), [requestedType]);
  const typeLabel = useMemo(() => getTypeLabel(requestedType), [requestedType]);

  const loginHref = useMemo(() => {
    if (!requestedType) return "/login";
    return `/login?next=${encodeURIComponent(`/publicar?type=${requestedType}`)}`;
  }, [requestedType]);

  useEffect(() => {
    if (!paramsReady) return;

    const load = async () => {
      try {
        const supabase = supabaseBrowser();
        const { data } = await supabase.auth.getUser();
        const isLogged = !!data?.user;

        setLoggedIn(isLogged);

        if (isLogged && directPath) {
          if (window.location.pathname !== directPath) {
            window.location.href = directPath;
          }
          return;
        }
      } catch {
        setLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [directPath, paramsReady]);

  if (!paramsReady || loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#F8F7F3",
          padding: "40px 20px",
          fontFamily: "system-ui",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p style={{ color: "#64748B", fontSize: 18 }}>Cargando...</p>
        </div>
      </main>
    );
  }

  if (!loggedIn) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#F8F7F3",
          padding: "40px 20px",
          fontFamily: "system-ui",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <a href="/" style={backLink}>← Volver</a>

          <div style={{ marginTop: 18 }}>
            <Tag text="🚀 Crear publicación" />

            <h1 style={title}>
              Iniciá sesión para publicar
            </h1>

            <p style={desc}>
              {requestedType
                ? `Para publicar en ${typeLabel}, primero necesitás entrar con tu cuenta.`
                : "Para crear anuncios en inmuebles, clasificados, trabajo o viandas, primero necesitás entrar con tu cuenta."}
            </p>
          </div>

          <div style={card}>
            <div style={cardTitle}>Acceso requerido</div>

            <div style={cardText}>
              Cuando inicies sesión vas a poder administrar tus anuncios y crear nuevos borradores sin errores de autenticación.
            </div>

            <div style={actions}>
              <Link href={loginHref} style={primaryBtn}>
                Ingresar
              </Link>

              <Link href="/registro" style={secondaryBtn}>
                Crear cuenta
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={main}>
      <div style={container}>
        <a href="/" style={backLink}>← Volver</a>

        <div style={{ marginTop: 18 }}>
          <Tag text="🚀 Crear publicación" />

          <h1 style={title}>
            ¿Qué querés publicar?
          </h1>

          <p style={desc}>
            Elegí la categoría para publicar en la zona energética de Vaca Muerta y alrededores.
          </p>
        </div>

        <div style={grid}>
          <PublishCard
            href="/mis-anuncios"
            icon="🏠"
            title="Inmueble"
            text="Casas, departamentos, alquileres, terrenos, locales y oficinas."
            highlighted={requestedType === "listing"}
          />

          <PublishCard
            href="/mis-clasificados"
            icon="📦"
            title="Clasificado"
            text="Vehículos, herramientas, equipos y artículos varios."
            highlighted={requestedType === "classified"}
          />

          <PublishCard
            href="/mis-empleos"
            icon="💼"
            title="Trabajo"
            text="Ofertas laborales, búsquedas y empleo en la región."
            highlighted={requestedType === "job"}
          />

          <PublishCard
            href="/mis-viandas"
            icon="🍱"
            title="Viandas"
            text="Comida casera, menú del día, delivery y catering."
            highlighted={requestedType === "meal"}
          />
        </div>
      </div>
    </main>
  );
}

function PublishCard({ href, icon, title, text, highlighted = false }: any) {
  return (
    <Link href={href} style={{
      textDecoration: "none",
      background: "white",
      borderRadius: 20,
      border: highlighted ? "2px solid #F97316" : "1px solid #E5E7EB",
      boxShadow: highlighted
        ? "0 14px 34px rgba(249,115,22,0.16)"
        : "0 10px 30px rgba(15,23,42,0.06)",
    }}>
      <div style={{
        background: highlighted
          ? "linear-gradient(135deg, #0F172A 0%, #F97316 100%)"
          : "#0F172A",
        color: "white",
        padding: 20,
      }}>
        <div style={{ fontSize: 32 }}>{icon}</div>
        <div style={{ marginTop: 12, fontSize: 24, fontWeight: 900 }}>
          {title}
        </div>
      </div>

      <div style={{ padding: 18 }}>
        <div style={{ color: "#64748B", minHeight: 70 }}>
          {text}
        </div>

        <div style={cta}>
          Continuar →
        </div>
      </div>
    </Link>
  );
}

function Tag({ text }: { text: string }) {
  return (
    <div style={{
      display: "inline-flex",
      background: "#FFF7ED",
      color: "#C2410C",
      border: "1px solid #FDBA74",
      padding: "8px 12px",
      borderRadius: 999,
      fontWeight: 800,
      fontSize: 13,
    }}>
      {text}
    </div>
  );
}

/* ===== styles ===== */

const main = {
  minHeight: "100vh",
  background: "#F8F7F3",
  padding: "40px 20px",
  fontFamily: "system-ui",
};

const container = {
  maxWidth: 1100,
  margin: "0 auto",
};

const backLink = {
  textDecoration: "none",
  color: "#2563EB",
  fontWeight: 800,
};

const title = {
  marginTop: 16,
  fontSize: 46,
  fontWeight: 900,
};

const desc = {
  marginTop: 12,
  color: "#64748B",
  fontSize: 18,
};

const grid = {
  marginTop: 28,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
  gap: 18,
};

const card = {
  marginTop: 28,
  background: "white",
  padding: 24,
  borderRadius: 20,
};

const cardTitle = {
  fontSize: 20,
  fontWeight: 900,
};

const cardText = {
  marginTop: 10,
  color: "#64748B",
};

const actions = {
  marginTop: 20,
  display: "flex",
  gap: 12,
};

const primaryBtn = {
  background: "#F97316",
  color: "white",
  padding: "12px 16px",
  borderRadius: 12,
  textDecoration: "none",
  fontWeight: 900,
};

const secondaryBtn = {
  border: "1px solid #CBD5E1",
  padding: "12px 16px",
  borderRadius: 12,
  textDecoration: "none",
  fontWeight: 800,
};

const cta = {
  marginTop: 16,
  background: "#F97316",
  color: "white",
  padding: "10px 14px",
  borderRadius: 12,
  fontWeight: 900,
  display: "inline-block",
};