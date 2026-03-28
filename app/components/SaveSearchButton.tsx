"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Props = {
  query?: string;
  itemType?: string;
  town?: string;
};

export default function SaveSearchButton({
  query = "",
  itemType = "",
  town = "",
}: Props) {
  const [msg, setMsg] = useState("");

  const saveAlert = async () => {
    try {
      setMsg("");
      const supabase = supabaseBrowser();

      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) {
        window.location.href = "/login";
        return;
      }

      const { error } = await supabase.from("saved_searches").insert({
        user_id: userRes.user.id,
        query: query || null,
        item_type: itemType || null,
        town: town || null,
      });

      if (error) throw error;

      setMsg("Alerta guardada ✅");
    } catch (e: any) {
      setMsg(e?.message || "Error guardando alerta");
    }
  };

  return (
    <div style={{ marginTop: 10 }}>
      <button
        type="button"
        onClick={saveAlert}
        style={{
          padding: "10px 14px",
          borderRadius: 8,
          border: "1px solid #ddd",
          background: "white",
          cursor: "pointer",
          fontWeight: 700,
        }}
      >
        🔔 Guardar alerta
      </button>

      {msg && (
        <div style={{ marginTop: 8, fontSize: 14, opacity: 0.8 }}>
          {msg}
        </div>
      )}
    </div>
  );
}