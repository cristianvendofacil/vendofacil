export default function PublicarViandaPage() {
  return (
    <main style={main}>
      <a href="/publicar" style={back}>
        ← Volver
      </a>

      <h1 style={title}>Publicar vianda</h1>
      <p style={text}>
        La ruta ya quedó funcionando. Después conectamos acá el formulario real
        para menús, comida casera, delivery y viandas de la región.
      </p>

      <div style={box}>
        <div style={boxTitle}>Estado</div>
        <div style={text}>Ruta creada correctamente, sin 404.</div>
      </div>
    </main>
  );
}

const main: React.CSSProperties = {
  minHeight: "100vh",
  background: "#F8F7F3",
  padding: "32px 20px",
  fontFamily: "system-ui",
  maxWidth: 900,
  margin: "0 auto",
};

const back: React.CSSProperties = {
  textDecoration: "none",
  color: "#2563EB",
  fontWeight: 800,
};

const title: React.CSSProperties = {
  marginTop: 18,
  fontSize: 38,
  color: "#0F172A",
  fontWeight: 900,
};

const text: React.CSSProperties = {
  color: "#64748B",
  fontSize: 17,
  lineHeight: 1.6,
};

const box: React.CSSProperties = {
  marginTop: 24,
  background: "white",
  borderRadius: 18,
  border: "1px solid #E5E7EB",
  padding: 20,
};

const boxTitle: React.CSSProperties = {
  fontWeight: 900,
  fontSize: 20,
  color: "#0F172A",
  marginBottom: 10,
};