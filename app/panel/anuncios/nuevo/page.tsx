"use client";

export default function Home() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <main style={{ padding: 40 }}>
      <h1>Test ENV</h1>
      <p>URL: {url ? "OK ✅" : "FALTA ❌"}</p>
      <p>KEY: {key ? "OK ✅" : "FALTA ❌"}</p>
    </main>
  );
}
