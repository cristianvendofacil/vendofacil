"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import NotificationsBell from "./NotificationsBell";

function getAdminEmails() {
  return (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
}

export default function Navbar() {
  const [user, setUser] = useState<any>(null);

  const adminEmails = useMemo(() => getAdminEmails(), []);
  const currentEmail = (user?.email || "").toLowerCase().trim();
  const isAdmin = !!currentEmail && adminEmails.includes(currentEmail);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = supabaseBrowser();
        const { data } = await supabase.auth.getUser();
        setUser(data?.user ?? null);
      } catch {
        setUser(null);
      }
    };

    load();
  }, []);

  const logout = async () => {
    try {
      const supabase = supabaseBrowser();
      await supabase.auth.signOut();
    } finally {
      window.location.href = "/";
    }
  };

  return (
    <header className="vf-navbar">
      <div className="vf-container vf-navbar-inner">
        <Link href="/" className="vf-logo">
          <img
            src="/logo-vendofacil.png"
            alt="Logo VendoFácil"
            className="vf-logo-image"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <span className="vf-logo-text">
            Vendo<span className="vf-logo-accent">Fácil</span>
          </span>
        </Link>

        <nav className="vf-nav-links">
          <Link href="/anuncio">Inmuebles</Link>
          <Link href="/clasificados">Clasificados</Link>
          <Link href="/trabajo">Trabajo</Link>
          <Link href="/viandas">Viandas</Link>
        </nav>

        <div className="vf-nav-actions">
          <Link href="/publicar" className="vf-btn-primary vf-nav-publish">
            Publicar
          </Link>

          {user ? (
            <>
              <NotificationsBell />

              <Link href="/mi-cuenta" className="vf-nav-link-light">
                Mi cuenta
              </Link>

              <Link href="/mis-favoritos" className="vf-nav-link-light">
                Favoritos
              </Link>

              <Link href="/mis-alertas" className="vf-nav-link-light">
                Alertas
              </Link>

              {isAdmin && (
                <Link href="/admin" className="vf-nav-link-light">
                  Admin
                </Link>
              )}

              <button type="button" onClick={logout} className="vf-btn-dark">
                Salir
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="vf-nav-link-light">
                Ingresar
              </Link>

              <Link href="/registro" className="vf-btn-outline-light">
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}