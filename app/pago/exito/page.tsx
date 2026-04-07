"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

function resolveTable(itemType: string) {
  if (itemType === "classified") return "classifieds";
  if (itemType === "job") return "jobs";
  if (itemType === "meal") return "meals";
  if (itemType === "verification") return "verification_requests";
  return "listings";
}

export default function Page() {
  const params = useSearchParams();
  const [msg, setMsg] = useState("Procesando pago...");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        const itemId = String(params.get("itemId") || "").trim();
        const itemType = String(params.get("itemType") || "").trim();
        const plan = String(params.get("plan") || "").trim();
        const featured = params.get("featured") === "1";
        const urgent = params.get("urgent") === "1";
        const petrol = params.get("petrol") === "1";

        if (!itemId || !itemType) {
          setMsg("Faltan datos para confirmar la publicación.");
          return;
        }

        const supabase = supabaseBrowser();
        const table = resolveTable(itemType);

        const publishedUntil = new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString();

        const updateData: any = {
          status: "PUBLISHED",
          published_until: publishedUntil,
        };

        if (table === "listings") {
          updateData.is_published = true;
        }

        if (table === "verification_requests") {
          updateData.status = "PENDING_REVIEW";
          updateData.payment_status = "APPROVED";
          updateData.paid_at = new Date().toISOString();
        }

        if (featured) {
          updateData.featured_until = publishedUntil;
        }

        if (urgent) {
          updateData.urgent_until = publishedUntil;
        }

        if (petrol) {
          updateData.petrol_priority = true;
          updateData.petrol_priority_until = publishedUntil;
        }

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
        setMsg(e?.message || "El pago fue aprobado, pero no se pudo confirmar la publicación.");
      }
    };

    run();
  }, [params]);

  const itemType = String(params.get("itemType") || "").trim();

  const backHref =
    itemType === "classified"
      ? "/mis-clasificados"
      : itemType === "job"
      ? "/mis-empleos"
      : itemType === "meal"
      ? "/mis-viandas"
      : itemType === "verification"
      ? "/verificacion"
      : "/mis-anuncios";

  return (
    <main style={{ padding: 40, fontFamily: "system-ui", maxWidth: 900 }}>
      <h1>Pago aprobado ✅</h1>
      <p>{msg}</p>

      <a href={backHref}>
        {done ? "Ir a tu panel →" : "Volver →"}
      </a>
    </main>
  );
}