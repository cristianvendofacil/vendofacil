import { NextResponse } from "next/server";

export async function POST() {
  console.log("WEBHOOK HIT FAST");

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true, route: "mp webhook" });
}