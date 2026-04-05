import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const itemId = String(body?.itemId || "").trim();
    const itemType = String(body?.itemType || "").trim();
    const title = String(body?.title || "Publicación").trim();
    const plan = String(body?.plan || "STANDARD").trim();
    const couponCode = String(body?.couponCode || "").trim() || null;

    const featured = body?.featured === true;
    const urgent = body?.urgent === true;
    const petrol = body?.petrol === true;
    const price = Number(body?.price || 0);

    if (!itemId && itemType !== "verification") {
  return NextResponse.json({ error: "itemId requerido" }, { status: 400 });
}

    if (!itemType) {
      return NextResponse.json({ error: "itemType requerido" }, { status: 400 });
    }

    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        { error: "El precio debe ser mayor a 0 para crear preferencia" },
        { status: 400 }
      );
    }

    const accessToken = process.env.MP_ACCESS_TOKEN;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Falta MP_ACCESS_TOKEN en .env.local" },
        { status: 500 }
      );
    }

    if (!siteUrl) {
      return NextResponse.json(
        { error: "Falta NEXT_PUBLIC_SITE_URL en .env.local" },
        { status: 500 }
      );
    }

    if (!siteUrl.startsWith("http://") && !siteUrl.startsWith("https://")) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_SITE_URL debe empezar con http:// o https://" },
        { status: 500 }
      );
    }

    const mp = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(mp);

    const externalReference = `${itemType}:${itemId}:${plan}`;

    const result = await preference.create({
      body: {
        notification_url: `${siteUrl}/api/mp/webhook`,
        items: [
          {
            id: itemId,
            title,
            quantity: 1,
            currency_id: "ARS",
            unit_price: price,
          },
        ],
        external_reference: externalReference,
        metadata: {
          itemId,
          itemType,
          plan,
          featured,
          urgent,
          petrol,
          couponCode,
        },
        back_urls: {
          success: `${siteUrl}/pago/exito?itemId=${encodeURIComponent(
            itemId
          )}&itemType=${encodeURIComponent(itemType)}&plan=${encodeURIComponent(
            plan
          )}&featured=${featured ? "1" : "0"}&urgent=${
            urgent ? "1" : "0"
          }&petrol=${petrol ? "1" : "0"}`,
          failure: `${siteUrl}/pago/fallo?itemId=${encodeURIComponent(
            itemId
          )}&itemType=${encodeURIComponent(itemType)}`,
          pending: `${siteUrl}/pago/pendiente?itemId=${encodeURIComponent(
            itemId
          )}&itemType=${encodeURIComponent(itemType)}`,
        },
        auto_return: "approved",
      },
    });
console.log("MP preference result:", {
  init_point: result.init_point,
  sandbox_init_point: result.sandbox_init_point,
  id: result.id,
});
    return NextResponse.json({
      ok: true,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
    });
  } catch (e: any) {
    console.error("MP create-preference error:", e);
    return NextResponse.json(
      { error: e?.message || "Error creando preferencia" },
      { status: 500 }
    );
  }
}