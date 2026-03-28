"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Props = {
  itemType: "listing" | "classified" | "job" | "meal";
  itemId: string;
};

export default function FavoriteButton({ itemType, itemId }: Props) {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = supabaseBrowser();

        const { data: userRes } = await supabase.auth.getUser();
        if (!userRes.user) {
          setEnabled(false);
          return;
        }

        const { data } = await supabase
          .from("favorites")
          .select("id")
          .eq("user_id", userRes.user.id)
          .eq("item_type", itemType)
          .eq("item_id", itemId)
          .maybeSingle();

        setIsSaved(!!data);
      } catch {
        setEnabled(false);
      }
    };

    load();
  }, [itemType, itemId]);

  const toggleFavorite = async () => {
    try {
      setLoading(true);
      const supabase = supabaseBrowser();

      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) {
        window.location.href = "/login";
        return;
      }

      if (isSaved) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", userRes.user.id)
          .eq("item_type", itemType)
          .eq("item_id", itemId);

        if (error) throw error;
        setIsSaved(false);
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({
            user_id: userRes.user.id,
            item_type: itemType,
            item_id: itemId,
          });

        if (error) throw error;
        setIsSaved(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!enabled) {
    return (
      <button
        type="button"
        onClick={() => (window.location.href = "/login")}
        style={btn}
      >
        ♡ Guardar
      </button>
    );
  }

  return (
    <button type="button" onClick={toggleFavorite} disabled={loading} style={btn}>
      {loading ? "..." : isSaved ? "❤️ Guardado" : "♡ Guardar"}
    </button>
  );
}

const btn: React.CSSProperties = {
  width: "100%",
  marginTop: 10,
  padding: 12,
  borderRadius: 10,
  border: "1px solid #ddd",
  background: "white",
  cursor: "pointer",
  fontWeight: 700,
};