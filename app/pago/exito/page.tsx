"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

function resolveTable(itemType: string) {
  if (itemType === "classified") return "classifieds";
  if (itemType === "job") return "jobs";
  if (itemType === "meal") return "meals";
  if (itemType === "verification") return "verification_requests";
  return "listings";
}

export default function Page() {
  const [msg, setMsg] = useState("Procesando pago...");
  const [done, setDone] = useState(false);
  const [backHref, setBackHref] = useState("/");

  useEffect(() => {
    const run = async () => {
      try {
        const params = new URLSearchParams(window.location.search);

        const itemId = String(params.get("itemId") || "").trim();
        const itemType = String(params.get("itemType") || "").trim();

        if (!itemId || !itemType) {
          setMsg("Faltan datos para confirmar la publicación.");
          return;
        }

        const nextBackHref =
          itemType === "classified"
            ? "/mis-clasificados"
            : itemType === "job"
            ? "/mis-empleos"
            : itemType === "meal"
            ? "/mis-viandas"
            : itemType === "verification"
            ? "/verificacion"
            : "/mis-anuncios";

        setBackHref(nextBackHref);

        const supabase = supabaseBrowser();
        const table = resolveTable(itemType);

        const updateData: any =
          table === "verification_requests"
            ? { status: "PENDING_REVIEW" }
            : { status: "PUBLISHED" };

        let res = await supabase
          .from(table)
          .update(updateData)
          .eq("id", itemId)
          .select("id,status")
          .single();

        if (res.error && table !== "verification_requests") {
          const fallback = await supabase
            .from(table)
            .update(updateData)
            .eq("listing_id", itemId)
            .select("id,status")
            .single();

          if (fallback.error) {
            throw fallback.error;
          }
        } else if (res.error) {
          throw res.error;
        }

        setDone(true);

        if (itemType === "classified") {
          setMsg("Pago aprobado y clasificado publicado correctamente.");
          return;
        }

        if (itemType === "job") {
          setMsg("Pago aprobado y aviso de trabajo publicado correctamente.");
          return;
        }

        if (itemType === "meal") {
          setMsg("Pago aprobado y vianda publicada correctamente.");
          return;
        }

        if (itemType === "verification") {
          setMsg("Pago aprobado y solicitud enviada a revisión.");
          return;
        }

        setMsg("Pago aprobado y anuncio publicado correctamente.");
      } catch (e: any) {
        console.error("PAGO EXITO UPDATE ERROR:", e);
        setMsg(
          e?.message ||
            "El pago fue aprobado, pero no se pudo confirmar la publicación."
        );
      }
    };

    run();
  }, []);

  return (
    <main style={{ padding: 40, fontFamily: "system-ui", maxWidth: 900 }}>
      <h1>Pago aprobado ✅</h1>
      <p>{msg}</p>
      <a href={backHref}>{done ? "Ir a tu panel →" : "Volver →"}</a>
    </main>
  );
}