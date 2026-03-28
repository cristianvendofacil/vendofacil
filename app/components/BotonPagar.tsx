"use client";

type Props = {
  title: string;
  price: number;
  itemType: string;
  itemId: string;
  plan?: string;
  durationDays?: number;
  featured?: boolean;
  urgent?: boolean;
};

export default function BotonPagar({
  title,
  price,
  itemType,
  itemId,
  plan,
  durationDays,
  featured,
  urgent,
}: Props) {
  const pagar = async () => {
    try {
      const res = await fetch("/api/mercadopago/create-preference", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          price,
          itemType,
          itemId,
          plan,
          durationDays,
          featured: featured ? 1 : 0,
          urgent: urgent ? 1 : 0,
        }),
      });

      const data = await res.json();

      if (!data) {
        alert("Error creando pago");
        return;
      }

      const url = data.sandbox_init_point || data.init_point;

      if (!url) {
        alert("No se pudo generar el link de pago");
        return;
      }

      window.location.href = url;
    } catch (e) {
      alert("Error conectando con MercadoPago");
    }
  };

  return (
    <button
      onClick={pagar}
      style={{
        background: "#009ee3",
        color: "white",
        border: "none",
        padding: "14px 22px",
        borderRadius: "8px",
        fontSize: "16px",
        fontWeight: "bold",
        cursor: "pointer",
      }}
    >
      Pagar con MercadoPago
    </button>
  );
}