"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function NotificationsBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = supabaseBrowser();

        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;

        if (!user) return;

        const { count } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false);

        setCount(count || 0);
      } catch {}
    };

    load();
  }, []);

  return (
    <a
      href="/mis-notificaciones"
      style={{
        position: "relative",
        textDecoration: "none",
        color: "#333",
        fontWeight: 800,
        padding: "8px 10px",
      }}
    >
      🔔
      {count > 0 && (
        <span
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            minWidth: 18,
            height: 18,
            borderRadius: 999,
            background: "#e53935",
            color: "white",
            fontSize: 11,
            display: "grid",
            placeItems: "center",
            padding: "0 4px",
          }}
        >
          {count}
        </span>
      )}
    </a>
  );
}