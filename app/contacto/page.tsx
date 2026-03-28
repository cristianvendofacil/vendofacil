export default function ContactoPage() {
  return (
    <main
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "40px 20px 60px",
        fontFamily: "system-ui",
      }}
    >
      <div
        style={{
          background: "white",
          border: "1px solid #E5E7EB",
          borderRadius: 20,
          padding: 24,
          boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 38,
            lineHeight: 1.1,
            color: "#0F172A",
            fontWeight: 900,
            letterSpacing: "-0.02em",
          }}
        >
          Contacto
        </h1>

        <p
          style={{
            marginTop: 14,
            color: "#475569",
            fontSize: 17,
            lineHeight: 1.7,
          }}
        >
          Si tenés problemas con una publicación, pagos, sugerencias de mejora o
          querés proponer nuevas categorías o localidades, podés contactarte con
          nosotros por este medio.
        </p>

        <div
          style={{
            marginTop: 24,
            display: "grid",
            gap: 16,
          }}
        >
          <div
            style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 16,
              padding: 18,
            }}
          >
            <div
              style={{
                fontWeight: 900,
                color: "#0F172A",
                fontSize: 16,
              }}
            >
              Consultas generales
            </div>

            <div
              style={{
                marginTop: 8,
                color: "#475569",
                lineHeight: 1.6,
              }}
            >
              Email: <b>contacto@vendofacil.com</b>
            </div>
          </div>

          <div
            style={{
              background: "#FFF7ED",
              border: "1px solid #FED7AA",
              borderRadius: 16,
              padding: 18,
            }}
          >
            <div
              style={{
                fontWeight: 900,
                color: "#9A3412",
                fontSize: 16,
              }}
            >
              Soporte por pagos o publicaciones
            </div>

            <div
              style={{
                marginTop: 8,
                color: "#7C2D12",
                lineHeight: 1.6,
              }}
            >
              Si tu anuncio no se publicó, tu pago no impactó o detectaste un
              error, escribinos detallando el problema y, si es posible, adjuntá
              captura de pantalla.
            </div>
          </div>

          <div
            style={{
              background: "#ECFDF5",
              border: "1px solid #A7F3D0",
              borderRadius: 16,
              padding: 18,
            }}
          >
            <div
              style={{
                fontWeight: 900,
                color: "#065F46",
                fontSize: 16,
              }}
            >
              Sugerencias
            </div>

            <div
              style={{
                marginTop: 8,
                color: "#065F46",
                lineHeight: 1.6,
              }}
            >
              También podés escribirnos para proponer nuevas secciones, mejoras
              en la plataforma o agregar localidades.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}