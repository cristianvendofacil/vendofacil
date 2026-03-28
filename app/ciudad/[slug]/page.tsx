"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Item = {
  id: string;
  title: string | null;
  town: string | null;
  description: string | null;
  price?: number | null;
  currency?: string | null;
  featured_until?: string | null;
};

function slugify(v: string) {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function Card({
  item,
  href,
  featured,
}: {
  item: Item;
  href: string;
  featured?: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        border: featured ? "2px solid #ffb300" : "1px solid #eee",
        borderRadius: 12,
        padding: 14,
        textDecoration: "none",
        color: "black",
        background: "white",
      }}
    >
      {featured && (
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: "#ff9800",
            marginBottom: 6,
          }}
        >
          ⭐ DESTACADO
        </div>
      )}

      <div style={{ fontWeight: 800 }}>
        {item.title || "Sin título"}
      </div>

      <div style={{ opacity: 0.7 }}>
        📍 {item.town}
      </div>

      {item.price && (
        <div
          style={{
            marginTop: 8,
            fontWeight: 900,
            color: "#0a7cff",
          }}
        >
          {item.price} {item.currency}
        </div>
      )}

      {item.description && (
        <div style={{ marginTop: 6 }}>
          {item.description.slice(0, 80)}...
        </div>
      )}
    </Link>
  );
}

export default function CityPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [city, setCity] = useState("");

  const [featured, setFeatured] = useState<Item[]>([]);
  const [listings, setListings] = useState<Item[]>([]);
  const [classifieds, setClassifieds] = useState<Item[]>([]);
  const [jobs, setJobs] = useState<Item[]>([]);
  const [meals, setMeals] = useState<Item[]>([]);

  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const supabase = supabaseBrowser();

    const { data: locs } = await supabase
      .from("locations")
      .select("name");

    const found = locs?.find(
      (x) => slugify(x.name) === slug
    );

    if (!found) return;

    const cityName = found.name;
    setCity(cityName);

    const now = new Date().toISOString();

    const { data: f } = await supabase
      .from("listings")
      .select("*")
      .eq("town", cityName)
      .gt("featured_until", now)
      .limit(6);

    const { data: l } = await supabase
      .from("listings")
      .select("*")
      .eq("status", "PUBLISHED")
      .eq("town", cityName);

    const { data: c } = await supabase
      .from("classifieds")
      .select("*")
      .eq("town", cityName);

    const { data: j } = await supabase
      .from("jobs")
      .select("*")
      .eq("town", cityName);

    const { data: m } = await supabase
      .from("meals")
      .select("*")
      .eq("town", cityName);

    setFeatured(f ?? []);
    setListings(l ?? []);
    setClassifieds(c ?? []);
    setJobs(j ?? []);
    setMeals(m ?? []);
  };

  const grid = {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: 14,
  };

  const buttonStyle = (active: boolean) => ({
    padding: "8px 14px",
    borderRadius: 8,
    border: "1px solid #ddd",
    background: active ? "#0a7cff" : "white",
    color: active ? "white" : "black",
    cursor: "pointer",
    fontWeight: 700,
  });

  return (
    <main
      style={{
        maxWidth: 1200,
        margin: "auto",
        padding: 20,
        fontFamily: "system-ui",
      }}
    >
      <Link href="/">← Volver</Link>

      <h1 style={{ marginTop: 20 }}>{city}</h1>

      {featured.length > 0 && (
        <>
          <h2 style={{ marginTop: 30 }}>
            ⭐ Destacados
          </h2>

          <div style={grid}>
            {featured.map((x) => (
              <Card
                key={x.id}
                item={x}
                href={`/anuncio/${x.id}`}
                featured
              />
            ))}
          </div>
        </>
      )}

      {/* FILTROS */}

      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 40,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => setFilter("ALL")}
          style={buttonStyle(filter === "ALL")}
        >
          Todos
        </button>

        <button
          onClick={() => setFilter("LISTINGS")}
          style={buttonStyle(filter === "LISTINGS")}
        >
          Inmuebles
        </button>

        <button
          onClick={() => setFilter("CLASSIFIEDS")}
          style={buttonStyle(filter === "CLASSIFIEDS")}
        >
          Clasificados
        </button>

        <button
          onClick={() => setFilter("JOBS")}
          style={buttonStyle(filter === "JOBS")}
        >
          Trabajo
        </button>

        <button
          onClick={() => setFilter("MEALS")}
          style={buttonStyle(filter === "MEALS")}
        >
          Viandas
        </button>
      </div>

      {/* RESULTADOS */}

      {(filter === "ALL" || filter === "LISTINGS") && (
        <>
          <h2 style={{ marginTop: 30 }}>
            🏠 Inmuebles ({listings.length})
          </h2>

          <div style={grid}>
            {listings.map((x) => (
              <Card
                key={x.id}
                item={x}
                href={`/anuncio/${x.id}`}
              />
            ))}
          </div>
        </>
      )}

      {(filter === "ALL" || filter === "CLASSIFIEDS") && (
        <>
          <h2 style={{ marginTop: 30 }}>
            📦 Clasificados ({classifieds.length})
          </h2>

          <div style={grid}>
            {classifieds.map((x) => (
              <Card
                key={x.id}
                item={x}
                href={`/clasificados/${x.id}`}
              />
            ))}
          </div>
        </>
      )}

      {(filter === "ALL" || filter === "JOBS") && (
        <>
          <h2 style={{ marginTop: 30 }}>
            💼 Trabajo ({jobs.length})
          </h2>

          <div style={grid}>
            {jobs.map((x) => (
              <Card
                key={x.id}
                item={x}
                href={`/trabajo/${x.id}`}
              />
            ))}
          </div>
        </>
      )}

      {(filter === "ALL" || filter === "MEALS") && (
        <>
          <h2 style={{ marginTop: 30 }}>
            🍲 Viandas ({meals.length})
          </h2>

          <div style={grid}>
            {meals.map((x) => (
              <Card
                key={x.id}
                item={x}
                href={`/viandas/${x.id}`}
              />
            ))}
          </div>
        </>
      )}
    </main>
  );
}