export default function TerminosPage() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
      <h1 style={{ fontSize: 32, fontWeight: 900 }}>
        Términos y Condiciones
      </h1>

      <p style={{ marginTop: 10, color: "#64748B" }}>
        Última actualización: {new Date().toLocaleDateString()}
      </p>

      <div style={{ marginTop: 20, lineHeight: 1.6 }}>
        <p>
          Vendofácil es una plataforma digital que permite publicar anuncios.
          No participa en transacciones entre usuarios.
        </p>

        <h3>Responsabilidad</h3>
        <p>
          El usuario es responsable de la información publicada y de cualquier
          transacción realizada.
        </p>

        <h3>Pagos</h3>
        <p>
          Los pagos corresponden únicamente a la publicación y no son
          reembolsables.
        </p>

        <h3>Moderación</h3>
        <p>
          Nos reservamos el derecho de eliminar contenido o cuentas sin previo
          aviso.
        </p>

        <h3>Datos</h3>
        <p>
          No vendemos datos ni enviamos spam. Los datos se usan solo para el
          funcionamiento del sistema.
        </p>

        <h3>Edad</h3>
        <p>Solo mayores de 18 años pueden usar la plataforma.</p>
      </div>
    </main>
  );
}