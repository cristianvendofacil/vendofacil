"use client";

import { useState } from "react";

export default function TestPagoPage() {
  const [itemType, setItemType] = useState<"listing" | "classified" | "job" | "meal">("listing");
  const [itemId, setItemId] = useState("1dff93cc-16f9-4dfb-ae55-3b4ee2dc5159");
  const [title, setTitle] = useState("Casa en Añelo");
  const [featured, setFeatured] = useState(false);
  const [coupon, setCoupon] = useState("");

  return (
    <main
      style={{
        padding: 40,
        fontFamily: "system-ui",
        maxWidth: 800,
        margin: "0 auto",
      }}
    >
      <h1>Prueba de pago real</h1>

      <div
        style={{
          marginTop: 20,
          background: "white",
          border: "1px solid #eee",
          borderRadius: 16,
          padding: 20,
          display: "grid",
          gap: 14,
        }}
      >
        <select
          value={itemType}
          onChange={(e) =>
            setItemType(e.target.value as "listing" | "classified" | "job" | "meal")
          }
          style={input}
        >
          <option value="listing">Inmueble</option>
          <option value="classified">Clasificado</option>
          <option value="job">Trabajo</option>
          <option value="meal">Vianda</option>
        </select>

        <input
          value={itemId}
          onChange={(e) => setItemId(e.target.value)}
          placeholder="ID real del registro"
          style={input}
        />

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título"
          style={input}
        />

        <input
          value={coupon}
          onChange={(e) => setCoupon(e.target.value.toUpperCase())}
          placeholder="Cupón (opcional)"
          style={input}
        />

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
          />
          Quiero destacarlo
        </label>

        <a
          href={`/pagar?itemId=${encodeURIComponent(itemId)}&itemType=${encodeURIComponent(
            itemType
          )}&title=${encodeURIComponent(title)}&featured=${
            featured ? "true" : "false"
          }&coupon=${encodeURIComponent(coupon)}`}
          style={{
            display: "inline-block",
            marginTop: 10,
            background: "#f97316",
            color: "white",
            padding: "12px 16px",
            borderRadius: 10,
            textDecoration: "none",
            fontWeight: 800,
          }}
        >
          Ir a pagar
        </a>
      </div>
    </main>
  );
}

const input: React.CSSProperties = {
  width: "100%",
  padding: 12,
  borderRadius: 10,
  border: "1px solid #ddd",
  boxSizing: "border-box",
};