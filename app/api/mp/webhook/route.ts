import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();

    console.log("WEBHOOK TEST HIT", {
      url: req.url,
      body: bodyText,
    });

    return NextResponse.json({ ok: true, test: true });
  } catch (e: any) {
    console.error("WEBHOOK TEST ERROR:", e);
    return NextResponse.json(
      { error: e?.message || "Webhook test error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, route: "mp webhook" });
}