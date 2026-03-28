import { NextResponse } from "next/server";

type PlanType = "STANDARD" | "FEATURED" | "URGENT" | "PETROL";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const title = String(body?.title || "Publicación");
    const price = Number(body?.price || 0);
    const itemId = String(body?.itemId || "");
    const itemType = String(body?.itemType || "");
    const featured = body?.featured === true;
    const urgent = body?.urgent === true;
    const petrol = body?.petrol === true;
    const couponId = body?.couponId || null;
    const plan = String(body?.plan || "STANDARD").toUpperCase() as PlanType;

    if (!itemId || !itemType || !price) {
      return NextResponse.json(
        { error: "Faltan datos para crear la preferencia" },
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const qs = new URLSearchParams({
      itemType,
      itemId,
      title,
      plan,
      featured: featured ? "1" : "0",
      urgent: urgent ? "1" : "0",
      petrol: petrol ? "1" : "0",
    });

    const preference = {
      items: [
        {
          title,
          quantity: 1,
          currency_id: "ARS",
          unit_price: Number(price),
        },
      ],
      external_reference: `${itemType}:${itemId}`,
      metadata: {
        itemId,
        itemType,
        featured,
        urgent,
        petrol,
        plan,
        couponId,
      },
      back_urls: {
        success: `${baseUrl}/pago-exitoso?${qs.toString()}`,
        failure: `${baseUrl}/pago-fallido?${qs.toString()}`,
        pending: `${baseUrl}/pago-pendiente?${qs.toString()}`,
      },
      auto_return: "approved",
      notification_url: `${baseUrl}/api/mercadopago/webhook`,
    };

    const res = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preference),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        {
          error: data?.message || "Error creando preferencia en MercadoPago",
          mp: data,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Error interno creando preferencia" },
      { status: 500 }
    );
  }
}