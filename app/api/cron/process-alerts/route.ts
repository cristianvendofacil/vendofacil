import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

type AlertRow = {
  id: string;
  user_id: string;
  item_type: string | null;
  query: string | null;
  town: string | null;
  is_active: boolean;
  notify_in_app: boolean;
  notify_email: boolean;
  notify_whatsapp: boolean;
  whatsapp_phone: string | null;
};

type ItemRow = {
  id: string;
  title: string | null;
  town: string | null;
};

function matchesAlert(alert: AlertRow, item: ItemRow) {
  const query = (alert.query || "").trim().toLowerCase();
  const town = (alert.town || "").trim().toLowerCase();
  const title = (item.title || "").trim().toLowerCase();
  const itemTown = (item.town || "").trim().toLowerCase();

  const queryOk = !query || title.includes(query);
  const townOk = !town || itemTown === town;

  return queryOk && townOk;
}

async function processType(
  itemType: "listing" | "classified" | "job" | "meal",
  tableName: "listings" | "classifieds" | "jobs" | "meals",
  detailBasePath: string
) {
  const { data: alerts } = await supabase
    .from("saved_search_alerts")
    .select("*")
    .eq("is_active", true)
    .or(`item_type.is.null,item_type.eq.${itemType}`);

  const { data: items } = await supabase
    .from(tableName)
    .select("id,title,town")
    .eq("status", "PUBLISHED")
    .order("created_at", { ascending: false })
    .limit(50);

  const alertRows = (alerts ?? []) as AlertRow[];
  const itemRows = (items ?? []) as ItemRow[];

  for (const alert of alertRows) {
    for (const item of itemRows) {
      if (!matchesAlert(alert, item)) continue;

      const { data: existingLog } = await supabase
        .from("alert_notification_log")
        .select("id")
        .eq("alert_id", alert.id)
        .eq("item_type", itemType)
        .eq("item_id", item.id)
        .maybeSingle();

      if (existingLog) continue;

      let notificationId: string | null = null;

      if (alert.notify_in_app) {
        const { data: notification } = await supabase
          .from("notifications")
          .insert({
            user_id: alert.user_id,
            title: "Nuevo resultado para tu alerta",
            message: `${item.title || "Publicación"} en ${item.town || "sin ciudad"}`,
            link: `${detailBasePath}/${item.id}`,
          })
          .select("id")
          .single();

        notificationId = notification?.id || null;
      }

      await supabase.from("alert_notification_log").insert({
        alert_id: alert.id,
        item_type: itemType,
        item_id: item.id,
        notification_id: notificationId,
      });

      // Email y WhatsApp quedan preparados para la fase siguiente.
    }
  }
}

export async function GET() {
  try {
    await processType("listing", "listings", "/anuncio");
    await processType("classified", "classifieds", "/clasificados");
    await processType("job", "jobs", "/trabajo");
    await processType("meal", "meals", "/viandas");

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Error procesando alertas" },
      { status: 500 }
    );
  }
}