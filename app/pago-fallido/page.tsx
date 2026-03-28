type SearchParams = {
  itemType?: string;
  itemId?: string;
  status?: string;
  collection_status?: string;
  payment_id?: string;
};

function getBackHref(itemType?: string, itemId?: string) {
  if (!itemId) return "/";
  if (itemType === "classified") return `/mis-clasificados/${itemId}`;
  if (itemType === "job") return `/mis-empleos/${itemId}`;
  if (itemType === "meal") return `/mis-viandas/${itemId}`;
  return `/mis-anuncios/${itemId}`;
}

function getListHref(itemType?: string) {
  if (itemType === "classified") return "/mis-clasificados";
  if (itemType === "job") return "/mis-empleos";
  if (itemType === "meal") return "/mis-viandas";
  return "/mis-anuncios";
}

export default async function PagoFallidoPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const itemType = params.itemType || "";
  const itemId = params.itemId || "";
  const status = params.collection_status || params.status || "rejected";
  const paymentId = params.payment_id || "";

  const editHref = getBackHref(itemType, itemId);
  const listHref = getListHref(itemType);

  return (
    <main
      style={{
        padding: 40,
        fontFamily: "system-ui",
        maxWidth: 760,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          padding: 24,
        }}
      >
        <h1>❌ PAGO FALLIDO NUEVO TEST</h1>

        <p style={{ marginTop: 12, lineHeight: 1.7 }}>
          MercadoPago no confirmó el pago. Puedes revisar los datos e intentarlo nuevamente.
        </p>

        <div
          style={{
            marginTop: 18,
            padding: 16,
            borderRadius: 12,
            background: "#fff7f7",
            border: "1px solid #fee2e2",
          }}
        >
          <div>
            <b>Estado:</b> {status}
          </div>

          {paymentId && (
            <div style={{ marginTop: 6 }}>
              <b>Pago:</b> {paymentId}
            </div>
          )}

          {itemId && (
            <div style={{ marginTop: 6 }}>
              <b>ID publicación:</b> {itemId}
            </div>
          )}
        </div>

        <p style={{ marginTop: 16, fontWeight: 700 }}>TEST NUEVO</p>

        <div style={{ marginTop: 22, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a
            href={editHref}
            style={{
              background: "#111",
              color: "white",
              textDecoration: "none",
              padding: "12px 16px",
              borderRadius: 10,
              fontWeight: 800,
            }}
          >
            Volver a editar
          </a>

          <a
            href={listHref}
            style={{
              background: "white",
              color: "#2563eb",
              textDecoration: "none",
              padding: "12px 16px",
              borderRadius: 10,
              border: "1px solid #dbeafe",
              fontWeight: 800,
            }}
          >
            Ir a mis publicaciones
          </a>
        </div>
      </div>
    </main>
  );
}