type SearchParams = {
  itemType?: string;
  itemId?: string;
  title?: string;
  payment_id?: string;
  status?: string;
  collection_status?: string;
  merchant_order_id?: string;
  external_reference?: string;
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

export default async function PagoExitosoPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const itemType = params.itemType || "";
  const itemId = params.itemId || "";
  const paymentId = params.payment_id || "";
  const collectionStatus = params.collection_status || params.status || "approved";

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
        <h1>✅ Pago realizado con éxito</h1>

        <p style={{ marginTop: 12, lineHeight: 1.7 }}>
          MercadoPago informó que el pago fue aprobado. La publicación se activará
          automáticamente cuando la confirmación termine de procesarse.
        </p>

        <div
          style={{
            marginTop: 18,
            padding: 16,
            borderRadius: 12,
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
          }}
        >
          <div>
            <b>Estado:</b> {collectionStatus}
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

        <div style={{ marginTop: 22, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a
            href={listHref}
            style={{
              background: "#111",
              color: "white",
              textDecoration: "none",
              padding: "12px 16px",
              borderRadius: 10,
              fontWeight: 800,
            }}
          >
            Ir a mis publicaciones
          </a>

          <a
            href={editHref}
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
            Volver a la publicación
          </a>
        </div>
      </div>
    </main>
  );
}