"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Listing = {
  id: string;
  title: string;
  town: string;
  price: number;
  currency: string;
  petrol_priority: boolean | null;
  petrol_priority_until: string | null;
  urgent_until: string | null;
  featured_until: string | null;
  created_at: string;
  status?: string;
};

type LocationOption = {
  name: string;
  region: string;
  province: string;
  is_featured: boolean;
};

const FALLBACK_LOCATIONS: LocationOption[] = [
  { name: "Añelo", region: "Vaca Muerta", province: "Neuquén", is_featured: true },
  { name: "Rincón de los Sauces", region: "Vaca Muerta", province: "Neuquén", is_featured: true },
  { name: "San Patricio del Chañar", region: "Vaca Muerta", province: "Neuquén", is_featured: true },
  { name: "Neuquén", region: "Alto Valle", province: "Neuquén", is_featured: true },
  { name: "Cipolletti", region: "Alto Valle", province: "Río Negro", is_featured: true },
  { name: "Catriel", region: "Río Negro Norte", province: "Río Negro", is_featured: true },
  { name: "Malargüe", region: "Sur Mendoza", province: "Mendoza", is_featured: true },
  { name: "Chos Malal", region: "Norte Neuquino", province: "Neuquén", is_featured: true },
];

export default function HomePage() {
  const [petrol, setPetrol] = useState<Listing[]>([]);
  const [urgent, setUrgent] = useState<Listing[]>([]);
  const [featured, setFeatured] = useState<Listing[]>([]);
  const [latest, setLatest] = useState<Listing[]>([]);

  const [locations, setLocations] = useState<LocationOption[]>(FALLBACK_LOCATIONS);
  const [searchText, setSearchText] = useState("");
  const [searchTown, setSearchTown] = useState("");
  const [searchType, setSearchType] = useState("listing");
  const [userCity, setUserCity] = useState("");
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = supabaseBrowser();

        const [{ data: listingsData, error: listingsError }, { data: locationsData, error: locationsError }] =
          await Promise.all([
            supabase
              .from("listings")
              .select(
                "id,title,town,price,currency,petrol_priority,petrol_priority_until,urgent_until,featured_until,created_at,status"
              )
              .eq("status", "PUBLISHED")
              .order("created_at", { ascending: false })
              .limit(40),

            supabase
              .from("locations")
              .select("name,region,province,is_featured")
              .order("is_featured", { ascending: false })
              .order("region", { ascending: true })
              .order("name", { ascending: true }),
          ]);

        if (!listingsError) {
          const rows = (listingsData ?? []) as Listing[];
          const now = new Date();

          const petrolItems = rows.filter((x) => {
            const hasBool = x.petrol_priority === true;
            const hasFutureDate =
              !!x.petrol_priority_until &&
              new Date(x.petrol_priority_until).getTime() > now.getTime();

            return hasBool || hasFutureDate;
          });

          const urgentItems = rows.filter(
            (x) =>
              !!x.urgent_until &&
              new Date(x.urgent_until).getTime() > now.getTime()
          );

          const featuredItems = rows.filter(
            (x) =>
              !!x.featured_until &&
              new Date(x.featured_until).getTime() > now.getTime()
          );

          setPetrol(petrolItems.slice(0, 4));
          setUrgent(urgentItems.slice(0, 4));
          setFeatured(featuredItems.slice(0, 4));
          setLatest(rows.slice(0, 4));
        }

        if (!locationsError && locationsData && locationsData.length > 0) {
          const uniqueSorted = dedupeLocations(locationsData as LocationOption[]);
          setLocations(uniqueSorted);
        }
      } catch {
        // fallback silencioso
      }
    };

    void load();
  }, []);

  const allTowns = useMemo(() => {
    return dedupeLocations(locations);
  }, [locations]);

  const featuredTowns = useMemo(
    () => allTowns.filter((x) => x.is_featured).slice(0, 10),
    [allTowns]
  );

  const searchHref = useMemo(() => {
    const qs = new URLSearchParams();

    if (searchText.trim()) qs.set("q", searchText.trim());
    if (searchTown.trim()) qs.set("town", searchTown.trim());
    if (searchType.trim()) qs.set("type", searchType.trim());

    return `/buscar?${qs.toString()}`;
  }, [searchText, searchTown, searchType]);

  const detectNearestTown = () => {
    if (!navigator.geolocation) return;

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );

          const data = await response.json();
          const text =
            data?.address?.city ||
            data?.address?.town ||
            data?.address?.village ||
            data?.address?.state ||
            "";

          setUserCity(text);

          const normalized = text.toLowerCase().trim();

          const match = allTowns.find((loc) =>
            normalized.includes(loc.name.toLowerCase())
          );

          if (match) {
            setSearchTown(match.name);
          }
        } catch {
          // silencioso
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
      }
    );
  };

  return (
    <main className="vf-home-page">
      <Hero
        searchText={searchText}
        setSearchText={setSearchText}
        searchTown={searchTown}
        setSearchTown={setSearchTown}
        searchType={searchType}
        setSearchType={setSearchType}
        searchHref={searchHref}
        allTowns={allTowns}
        featuredTowns={featuredTowns}
        userCity={userCity}
        locating={locating}
        onDetectLocation={detectNearestTown}
      />

      <QuickCategories />

      <Section
        title="🛢 Prioridad petrolera"
        subtitle="Lo más visible para la actividad energética"
        items={petrol}
        href="/anuncio"
      />
      <Section
        title="🔴 Urgentes"
        subtitle="Publicaciones con necesidad de resolución inmediata"
        items={urgent}
        href="/anuncio"
      />
      <Section
        title="⭐ Destacados"
        subtitle="Avisos con mejor exposición y presencia"
        items={featured}
        href="/anuncio"
      />
      <Section
        title="🆕 Últimos anuncios"
        subtitle="Lo más reciente publicado en la plataforma"
        items={latest}
        href="/anuncio"
      />
    </main>
  );
}

function dedupeLocations(rows: LocationOption[]): LocationOption[] {
  const map = new Map<string, LocationOption>();

  for (const row of rows) {
    const key = String(row.name || "").trim().toLowerCase();
    if (!key) continue;

    if (!map.has(key)) {
      map.set(key, {
        name: row.name,
        region: row.region || "",
        province: row.province || "",
        is_featured: !!row.is_featured,
      });
      continue;
    }

    const existing = map.get(key)!;

    if (!existing.is_featured && row.is_featured) {
      map.set(key, {
        name: row.name,
        region: row.region || "",
        province: row.province || "",
        is_featured: true,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.is_featured !== b.is_featured) {
      return a.is_featured ? -1 : 1;
    }

    const regionCompare = (a.region || "").localeCompare(b.region || "", "es", {
      sensitivity: "base",
    });
    if (regionCompare !== 0) return regionCompare;

    return (a.name || "").localeCompare(b.name || "", "es", {
      sensitivity: "base",
    });
  });
}

function Hero({
  searchText,
  setSearchText,
  searchTown,
  setSearchTown,
  searchType,
  setSearchType,
  searchHref,
  allTowns,
  featuredTowns,
  userCity,
  locating,
  onDetectLocation,
}: {
  searchText: string;
  setSearchText: (v: string) => void;
  searchTown: string;
  setSearchTown: (v: string) => void;
  searchType: string;
  setSearchType: (v: string) => void;
  searchHref: string;
  allTowns: LocationOption[];
  featuredTowns: LocationOption[];
  userCity: string;
  locating: boolean;
  onDetectLocation: () => void;
}) {
  return (
    <section className="vf-home-hero">
      <div className="vf-container vf-home-hero-inner">
        <div className="vf-home-hero-copy">
          <div className="vf-hero-kicker">
            Portal de oportunidades en la zona energética
          </div>

          <h1>
            Todo lo que necesitás en{" "}
            <span className="vf-hero-accent">Vaca Muerta y alrededores</span>
          </h1>

          <p>
            Inmuebles, trabajo, clasificados y viandas en una plataforma pensada
            para la dinámica real de Añelo, Rincón de los Sauces, Neuquén,
            Catriel, Malargüe y toda la región.
          </p>

          <div className="vf-hero-actions">
            <Link href="/publicar" className="vf-btn-primary">
              Publicar anuncio
            </Link>

            <Link href="/anuncio" className="vf-btn-outline-dark">
              Explorar inmuebles
            </Link>
          </div>
        </div>

        <div className="vf-home-search-card">
          <div className="vf-home-search-title">Buscar más rápido</div>
          <div className="vf-home-search-subtitle">
            Encuentra oportunidades por categoría, localidad o palabra clave.
          </div>

          <div className="vf-home-location-row">
            <button
              type="button"
              onClick={onDetectLocation}
              className="vf-location-btn"
            >
              {locating ? "Detectando ubicación..." : "Usar mi ubicación"}
            </button>

            {userCity && (
              <div className="vf-location-text">
                Ubicación detectada: <b>{userCity}</b>
              </div>
            )}
          </div>

          <div className="vf-home-search-grid">
            <div className="vf-field-block vf-field-full">
              <label className="vf-field-label">¿Qué estás buscando?</label>
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Ej: casa, camioneta, cocinero, viandas..."
                className="vf-input"
              />
            </div>

            <div className="vf-field-block">
              <label className="vf-field-label">Categoría</label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="vf-input"
              >
                <option value="listing">Inmuebles</option>
                <option value="classified">Clasificados</option>
                <option value="job">Trabajo</option>
                <option value="meal">Viandas</option>
              </select>
            </div>

            <div className="vf-field-block">
              <label className="vf-field-label">Localidad</label>
              <select
                value={searchTown}
                onChange={(e) => setSearchTown(e.target.value)}
                className="vf-input"
              >
                <option value="">Todas las localidades</option>
                {allTowns.map((loc) => (
                  <option key={`${loc.name}-${loc.region}-${loc.province}`} value={loc.name}>
                    {loc.name}
                    {loc.region ? ` — ${loc.region}` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="vf-home-search-actions">
            <Link href={searchHref} className="vf-btn-primary vf-home-search-button">
              Buscar ahora
            </Link>
          </div>

          <div className="vf-town-pills">
            {featuredTowns.map((town) => (
              <button
                key={town.name}
                type="button"
                onClick={() => setSearchTown(town.name)}
                className={`vf-town-pill ${searchTown === town.name ? "vf-town-pill-active" : ""}`}
              >
                {town.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function QuickCategories() {
  return (
    <section className="vf-container vf-home-categories">
      <div className="vf-category-grid">
        <Link href="/anuncio" className="vf-category-card">
          <div className="vf-category-icon">🏠</div>
          <div className="vf-category-title">Inmuebles</div>
          <div className="vf-category-text">
            Casas, alquileres, habitaciones, terrenos y oportunidades habitacionales.
          </div>
        </Link>

        <Link href="/trabajo" className="vf-category-card">
          <div className="vf-category-icon">👷</div>
          <div className="vf-category-title">Trabajo</div>
          <div className="vf-category-text">
            Ofertas y búsquedas laborales en toda la zona energética.
          </div>
        </Link>

        <Link href="/clasificados" className="vf-category-card">
          <div className="vf-category-icon">🛻</div>
          <div className="vf-category-title">Clasificados</div>
          <div className="vf-category-text">
            Vehículos, herramientas, tecnología, muebles y más.
          </div>
        </Link>

        <Link href="/viandas" className="vf-category-card">
          <div className="vf-category-icon">🍱</div>
          <div className="vf-category-title">Viandas</div>
          <div className="vf-category-text">
            Comida casera, delivery y opciones diarias para trabajadores.
          </div>
        </Link>
      </div>
    </section>
  );
}

function Section({
  title,
  subtitle,
  items,
  href,
}: {
  title: string;
  subtitle: string;
  items: Listing[];
  href: string;
}) {
  if (!items.length) return null;

  return (
    <section className="vf-container vf-home-section">
      <div className="vf-section-head">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        <Link href={href} className="vf-section-link">
          Ver más
        </Link>
      </div>

      <div className="vf-home-grid">
        {items.map((x) => (
          <ListingCard key={x.id} item={x} />
        ))}
      </div>
    </section>
  );
}

function ListingCard({ item }: { item: Listing }) {
  const isPetrol =
    !!item.petrol_priority ||
    (!!item.petrol_priority_until &&
      new Date(item.petrol_priority_until).getTime() > Date.now());

  const isUrgent =
    !!item.urgent_until && new Date(item.urgent_until).getTime() > Date.now();

  const isFeatured =
    !!item.featured_until && new Date(item.featured_until).getTime() > Date.now();

  return (
    <Link href={`/anuncio/${item.id}`} className="vf-home-listing-card">
      <div className="vf-home-listing-top">
        <div className="vf-home-listing-badges">
          {isPetrol && <span className="badge badge-petrol">PRIORIDAD</span>}
          {!isPetrol && isUrgent && <span className="badge badge-urgent">URGENTE</span>}
          {!isPetrol && !isUrgent && isFeatured && (
            <span className="badge badge-featured">DESTACADO</span>
          )}
        </div>

        <div className="vf-home-listing-image">
          <span>VF</span>
        </div>
      </div>

      <div className="vf-home-listing-body">
        <h3>{item.title || "Sin título"}</h3>
        <div className="vf-home-listing-town">📍 {item.town || "Sin ciudad"}</div>
        <div className="vf-home-listing-price">
          {item.price} {item.currency}
        </div>
      </div>
    </Link>
  );
}