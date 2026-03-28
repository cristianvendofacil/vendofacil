import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";

export const metadata: Metadata = {
  title: "VendoFácil",
  description: "Inmuebles, clasificados, trabajo y viandas en Vaca Muerta",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          background: "#f5f7fa",
        }}
      >
        <Navbar />

        <main style={{ minHeight: "100vh" }}>{children}</main>

        {/* 🔥 FOOTER NUEVO */}
        <footer
          style={{
            marginTop: 40,
            padding: "30px 20px",
            background: "#0F172A",
            color: "#E2E8F0",
          }}
        >
          <div
            style={{
              maxWidth: 1240,
              margin: "0 auto",
              display: "flex",
              flexWrap: "wrap",
              gap: 20,
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontWeight: 900, fontSize: 18 }}>
                VendoFácil
              </div>
              <div style={{ marginTop: 8, fontSize: 14, color: "#94A3B8" }}>
                Clasificados en la zona de Vaca Muerta
              </div>
            </div>

            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              <a href="/contacto" style={{ color: "#E2E8F0" }}>
                Contacto
              </a>
              <a href="/terminos" style={{ color: "#E2E8F0" }}>
                Términos
              </a>
              <a href="/privacidad" style={{ color: "#E2E8F0" }}>
                Privacidad
              </a>
            </div>
          </div>

          <div
            style={{
              marginTop: 20,
              textAlign: "center",
              fontSize: 12,
              color: "#64748B",
            }}
          >
            © {new Date().getFullYear()} VendoFácil
          </div>
        </footer>
      </body>
    </html>
  );
}