"use client";

import { useState } from "react";

type Props = {
  title: string;
  price: number;
  itemType: "listing" | "classified" | "job" | "meal";
  itemId: string;
  featured?: boolean;
  urgent?: boolean;
  petrol?: boolean;
  plan?: "STANDARD" | "FEATURED" | "URGENT" | "PETROL";
};

export default function BotonMercadoPago({
  title,
  price,
  itemType,
  itemId,
  featured = false,
  urgent = false,
  petrol = false,
  plan = "STANDARD",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const iniciarPago = async () => {
    try {
      setLoading(true);
      setMsg("");

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
          featured,
          urgent,
          petrol,
          plan,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Error creando preferencia");
      }

      const pagoUrl = data?.sandbox_init_point || data?.init_point;

      if (!pagoUrl) {
        throw new Error("MercadoPago no devolvió URL de pago");
      }

      window.location.href = pagoUrl;
    } catch (e: any) {
      setMsg(e?.message || "Error iniciando pago");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 16 }}>
      <button
        type="button"
        onClick={iniciarPago}
        disabled={loading}
        style={{
          background: "#009ee3",
          color: "white",
          border: "none",
          padding: "14px 22px",
          borderRadius: 10,
          fontSize: 16,
          fontWeight: 800,
          cursor: "pointer",
        }}
      >
        {loading ? "Redirigiendo..." : "Pagar con MercadoPago"}
      </button>

      {msg && (
        <div
          style={{
            marginTop: 10,
            color: "#c62828",
            fontWeight: 700,
          }}
        >
          {msg}
        </div>
      )}
    </div>
  );
}