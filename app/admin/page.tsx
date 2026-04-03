"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

const BUCKET = "verification-files";

type VerificationItem = {
  id: string;
  user_id: string;
  verification_type: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  notes: string | null;
  document_front_path: string | null;
  document_back_path: string | null;
  service_photo_path: string | null;
  status: string;
  is_verified?: boolean | null;
  verified_until?: string | null;
  created_at: string;
};

type ListingItem = {
  id: string;
  title: string | null;
  town: string | null;
  status: string | null;
  urgent_until?: string | null;
  featured_until?: string | null;
  petrol_priority?: boolean | null;
  created_at?: string | null;
};

type ClassifiedItem = {
  id: string;
  title: string | null;
  town: string | null;
  status: string | null;
  urgent_until?: string | null;
  featured_until?: string | null;
  petrol_priority?: boolean | null;
  created_at?: string | null;
};

type JobItem = {
  id: string;
  title: string | null;
  town: string | null;
  status: string | null;
  urgent_until?: string | null;
  featured_until?: string | null;
  petrol_priority?: boolean | null;
  created_at?: string | null;
};

type MealItem = {
  id: string;
  title: string | null;
  town: string | null;
  status: string | null;
  urgent_until?: string | null;
  featured_until?: string | null;
  petrol_priority?: boolean | null;
  created_at?: string | null;
};

type PricingRule = {
  id: string;
  item_type: string;
  plan_code: string;
  title: string;
  price_ars: number;
  is_active: boolean;
};

type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percent" | "fixed" | "free";
  discount_value: number;
  item_type: string | null;
  plan_code: string | null;
  max_uses: number | null;
  used_count: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
};

type LocationRow = {
  id: string;
  name: string;
  region: string | null;
  province: string | null;
  is_featured: boolean | null;
};
type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  reason: string;
  message: string;
  created_at: string;
};

type AdminFilter = "ALL" | "URGENT" | "FEATURED" | "PUBLISHED" | "DRAFT" | "PETROL";
type AdminSection =
  | "dashboard"
  | "posts"
  | "pricing"
  | "coupons"
  | "locations"
  | "verifications"
  | "messages";

function getAdminEmails() {
  return (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
}

function getAdminPin() {
  return (process.env.NEXT_PUBLIC_ADMIN_PIN || "").trim();
}

export default function AdminPage() {
  const [msg, setMsg] = useState("Cargando...");
  const [email, setEmail] = useState("");
  const [workingId, setWorkingId] = useState("");
  const [activeFilter, setActiveFilter] = useState<AdminFilter>("ALL");
  const [section, setSection] = useState<AdminSection>("dashboard");

  const [isAllowed, setIsAllowed] = useState(false);
  const [checkedAccess, setCheckedAccess] = useState(false);

  const [pinInput, setPinInput] = useState("");
  const [pinUnlocked, setPinUnlocked] = useState(false);
  const [pinError, setPinError] = useState("");

  const [verifications, setVerifications] = useState<VerificationItem[]>([]);
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [classifieds, setClassifieds] = useState<ClassifiedItem[]>([]);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [meals, setMeals] = useState<MealItem[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);

  const [newCoupon, setNewCoupon] = useState({
    code: "",
    description: "",
    discount_type: "percent",
    discount_value: "10",
    item_type: "",
    plan_code: "",
    max_uses: "",
    valid_until: "",
    is_active: true,
  });

  const [newLocation, setNewLocation] = useState({
    name: "",
    region: "",
    province: "",
    is_featured: false,
  });

  const adminEmails = useMemo(() => getAdminEmails(), []);
  const adminPin = useMemo(() => getAdminPin(), []);

  const checkAccess = async () => {
    const supabase = supabaseBrowser();
    const { data: userRes, error: userErr } = await supabase.auth.getUser();

    if (userErr) throw userErr;
    if (!userRes.user) throw new Error("Debes iniciar sesión.");

    const currentEmail = (userRes.user.email || "").toLowerCase().trim();
    setEmail(currentEmail);

    const allowed = adminEmails.includes(currentEmail);
    setIsAllowed(allowed);
    setCheckedAccess(true);

    if (!allowed) {
      throw new Error("Acceso denegado. Tu cuenta no tiene permisos de administrador.");
    }
  };

  const load = async () => {
    try {
      setMsg("Cargando...");
      await checkAccess();

    const supabase = supabaseBrowser();

      const [
      verRes,
      lRes,
      cRes,
      jRes,
      mRes,
      pricingRes,
      couponsRes,
      locationsRes,
      contactRes,
     ] = await Promise.all([
          supabase
            .from("verification_requests")
            .select(
              "id,user_id,verification_type,full_name,phone,email,city,notes,document_front_path,document_back_path,service_photo_path,status,is_verified,verified_until,created_at"
            )
            .order("created_at", { ascending: false })
            .limit(50),

          supabase
            .from("listings")
            .select(
              "id,title,town,status,urgent_until,featured_until,petrol_priority,created_at"
            )
            .order("created_at", { ascending: false })
            .limit(50),

          supabase
            .from("classifieds")
            .select(
              "id,title,town,status,urgent_until,featured_until,petrol_priority,created_at"
            )
            .order("created_at", { ascending: false })
            .limit(50),

          supabase
            .from("jobs")
            .select(
              "id,title,town,status,urgent_until,featured_until,petrol_priority,created_at"
            )
            .order("created_at", { ascending: false })
            .limit(50),

          supabase
            .from("meals")
            .select(
              "id,title,town,status,urgent_until,featured_until,petrol_priority,created_at"
            )
            .order("created_at", { ascending: false })
            .limit(50),

          supabase
            .from("pricing_rules")
            .select("id,item_type,plan_code,title,price_ars,is_active")
            .order("item_type", { ascending: true })
            .order("plan_code", { ascending: true }),

          supabase
            .from("coupons")
            .select(
              "id,code,description,discount_type,discount_value,item_type,plan_code,max_uses,used_count,valid_from,valid_until,is_active"
            )
            .order("created_at", { ascending: false }),

          supabase
            .from("locations")
            .select("id,name,region,province,is_featured")
            .order("is_featured", { ascending: false })
            .order("region", { ascending: true })
            .order("name", { ascending: true }),
            supabase
            .from("contact_messages")
            .select("id,name,email,phone,reason,message,created_at")
            .order("created_at", { ascending: false })
            .limit(100),
        ]);

      if (verRes.error) throw verRes.error;
      if (lRes.error) throw lRes.error;
      if (cRes.error) throw cRes.error;
      if (jRes.error) throw jRes.error;
      if (mRes.error) throw mRes.error;
      if (pricingRes.error) throw pricingRes.error;
      if (couponsRes.error) throw couponsRes.error;
      if (locationsRes.error) throw locationsRes.error;
      if (contactRes.error) throw contactRes.error;

      setVerifications((verRes.data ?? []) as VerificationItem[]);
      setListings((lRes.data ?? []) as ListingItem[]);
      setClassifieds((cRes.data ?? []) as ClassifiedItem[]);
      setJobs((jRes.data ?? []) as JobItem[]);
      setMeals((mRes.data ?? []) as MealItem[]);
      setPricingRules((pricingRes.data ?? []) as PricingRule[]);
      setCoupons((couponsRes.data ?? []) as Coupon[]);
      setLocations((locationsRes.data ?? []) as LocationRow[]);
      setContactMessages((contactRes.data ?? []) as ContactMessage[]);

      setMsg("");
    } catch (e: any) {
      setMsg(e?.message || "Error cargando admin");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const unlockAdmin = () => {
    if (!adminPin) {
      setPinUnlocked(true);
      setPinError("");
      return;
    }

    if (pinInput.trim() === adminPin) {
      setPinUnlocked(true);
      setPinError("");
      return;
    }

    setPinError("PIN incorrecto.");
  };

  const approveVerification = async (id: string) => {
    try {
      setWorkingId(id);
      const supabase = supabaseBrowser();

      const { data: request, error: fetchError } = await supabase
        .from("verification_requests")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      const until = new Date();
      until.setFullYear(until.getFullYear() + 1);

      const { error } = await supabase
        .from("verification_requests")
        .update({
          status: "APPROVED",
          is_verified: true,
          verified_until: until.toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      const { error: syncError } = await supabase
        .from("user_verifications")
        .upsert(
          {
            user_id: request.user_id,
            is_verified: true,
            verification_type: request.verification_type,
            verified_until: until.toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (syncError) throw syncError;

      await load();
    } catch (e: any) {
      setMsg(e?.message || "Error aprobando verificación");
    } finally {
      setWorkingId("");
    }
  };

  const rejectVerification = async (id: string) => {
    try {
      setWorkingId(id);
      const supabase = supabaseBrowser();

      const { error } = await supabase
        .from("verification_requests")
        .update({
          status: "REJECTED",
          is_verified: false,
        })
        .eq("id", id);

      if (error) throw error;
      await load();
    } catch (e: any) {
      setMsg(e?.message || "Error rechazando verificación");
    } finally {
      setWorkingId("");
    }
  };

  const togglePetrolPriority = async (
    table: "listings" | "classifieds" | "jobs" | "meals",
    id: string,
    currentValue: boolean | null | undefined
  ) => {
    try {
      setWorkingId(id);
      const supabase = supabaseBrowser();

      const { error } = await supabase
        .from(table)
        .update({
          petrol_priority: !currentValue,
        } as any)
        .eq("id", id);

      if (error) throw error;
      await load();
    } catch (e: any) {
      setMsg(e?.message || "Error actualizando prioridad petrolera");
    } finally {
      setWorkingId("");
    }
  };

  const unpublishItem = async (
    table: "listings" | "classifieds" | "jobs" | "meals",
    id: string
  ) => {
    try {
      setWorkingId(id);
      const supabase = supabaseBrowser();

      const { error } = await supabase
        .from(table)
        .update({
          status: "DRAFT",
          urgent_until: null,
          featured_until: null,
          featured: false,
        } as any)
        .eq("id", id);

      if (error) throw error;
      await load();
    } catch (e: any) {
      setMsg(e?.message || "Error despublicando");
    } finally {
      setWorkingId("");
    }
  };

  const deleteItem = async (
    table: "listings" | "classifieds" | "jobs" | "meals",
    id: string
  ) => {
    try {
      const ok = window.confirm("¿Seguro que quieres eliminar esta publicación?");
      if (!ok) return;

      setWorkingId(id);
      const supabase = supabaseBrowser();

      const { error } = await supabase.from(table).delete().eq("id", id);

      if (error) throw error;
      await load();
    } catch (e: any) {
      setMsg(e?.message || "Error eliminando");
    } finally {
      setWorkingId("");
    }
  };

  const updatePrice = async (id: string, price: number, is_active: boolean) => {
    try {
      setWorkingId(id);
      const supabase = supabaseBrowser();

      const { error } = await supabase
        .from("pricing_rules")
        .update({
          price_ars: price,
          is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
      await load();
    } catch (e: any) {
      setMsg(e?.message || "Error actualizando precio");
    } finally {
      setWorkingId("");
    }
  };

  const createCoupon = async () => {
    try {
      setMsg("");
      const supabase = supabaseBrowser();

      const code = newCoupon.code.trim().toUpperCase();
      const description = newCoupon.description.trim() || null;
      const discountType = newCoupon.discount_type as "percent" | "fixed" | "free";

      const discountValue =
        discountType === "free" ? 0 : Number(newCoupon.discount_value || 0);

      const itemType = newCoupon.item_type || null;
      const planCode = newCoupon.plan_code || null;
      const maxUses = newCoupon.max_uses ? Number(newCoupon.max_uses) : null;

      if (!code) {
        setMsg("El código del cupón es obligatorio.");
        return;
      }

      if (!/^[A-Z0-9_-]+$/.test(code)) {
        setMsg("El código solo puede tener letras, números, guion o guion bajo.");
        return;
      }

      if (
        discountType !== "free" &&
        (!Number.isFinite(discountValue) || discountValue <= 0)
      ) {
        setMsg("El valor del descuento debe ser mayor a 0.");
        return;
      }

      if (discountType === "percent" && discountValue > 100) {
        setMsg("El descuento porcentual no puede ser mayor a 100.");
        return;
      }

      if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses <= 0)) {
        setMsg("Máximo usos debe ser un número entero mayor a 0.");
        return;
      }

      const exists = coupons.some((c) => c.code.trim().toUpperCase() === code);

      if (exists) {
        setMsg("Ya existe un cupón con ese código.");
        return;
      }

      const payload = {
        code,
        description,
        discount_type: discountType,
        discount_value: discountValue,
        item_type: itemType,
        plan_code: planCode,
        max_uses: maxUses,
        used_count: 0,
        valid_from: new Date().toISOString(),
        valid_until: newCoupon.valid_until
          ? new Date(newCoupon.valid_until).toISOString()
          : null,
        is_active: newCoupon.is_active,
      };

      const { error } = await supabase.from("coupons").insert([payload]);

      if (error) throw error;

      setNewCoupon({
        code: "",
        description: "",
        discount_type: "percent",
        discount_value: "10",
        item_type: "",
        plan_code: "",
        max_uses: "",
        valid_until: "",
        is_active: true,
      });

      setMsg("Cupón creado correctamente.");
      await load();
    } catch (e: any) {
      setMsg(e?.message || "Error creando cupón");
    }
  };

  const toggleCoupon = async (id: string, isActive: boolean) => {
    try {
      setWorkingId(id);
      const supabase = supabaseBrowser();

      const { error } = await supabase
        .from("coupons")
        .update({
          is_active: !isActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
      await load();
    } catch (e: any) {
      setMsg(e?.message || "Error actualizando cupón");
    } finally {
      setWorkingId("");
    }
  };

  const createLocation = async () => {
    try {
      setMsg("");

      const name = newLocation.name.trim();
      const region = newLocation.region.trim();
      const province = newLocation.province.trim();

      if (!name) {
        setMsg("La ciudad es obligatoria.");
        return;
      }

      const supabase = supabaseBrowser();

      const exists = locations.some(
        (x) => x.name.trim().toLowerCase() === name.toLowerCase()
      );

      if (exists) {
        setMsg("Esa ciudad ya existe.");
        return;
      }

      const { error } = await supabase.from("locations").insert([
        {
          name,
          region: region || null,
          province: province || null,
          is_featured: newLocation.is_featured,
        },
      ]);

      if (error) throw error;

      setNewLocation({
        name: "",
        region: "",
        province: "",
        is_featured: false,
      });

      await load();
      setMsg("Ciudad creada correctamente.");
    } catch (e: any) {
      setMsg(e?.message || "Error creando ciudad");
    }
  };

  const toggleLocationFeatured = async (
    id: string,
    currentValue: boolean | null
  ) => {
    try {
      setWorkingId(id);
      const supabase = supabaseBrowser();

      const { error } = await supabase
        .from("locations")
        .update({
          is_featured: !currentValue,
        })
        .eq("id", id);

      if (error) throw error;
      await load();
    } catch (e: any) {
      setMsg(e?.message || "Error actualizando ciudad");
    } finally {
      setWorkingId("");
    }
  };

  const pendingVerifications = verifications.filter((x) => x.status === "PENDING");

  const filterItems = <
    T extends {
      urgent_until?: string | null;
      featured_until?: string | null;
      petrol_priority?: boolean | null;
      status?: string | null;
    }
  >(
    rows: T[]
  ) => {
    return rows.filter((x) => {
      const isUrgent =
        !!x.urgent_until && new Date(x.urgent_until).getTime() > Date.now();

      const isFeatured =
        !!x.featured_until && new Date(x.featured_until).getTime() > Date.now();

      const isPetrol = !!x.petrol_priority;

      if (activeFilter === "ALL") return true;
      if (activeFilter === "URGENT") return isUrgent;
      if (activeFilter === "FEATURED") return isFeatured;
      if (activeFilter === "PETROL") return isPetrol;
      if (activeFilter === "PUBLISHED") return x.status === "PUBLISHED";
      if (activeFilter === "DRAFT") return x.status === "DRAFT";
      return true;
    });
  };

  const filteredListings = useMemo(() => filterItems(listings), [listings, activeFilter]);
  const filteredClassifieds = useMemo(() => filterItems(classifieds), [
    classifieds,
    activeFilter,
  ]);
  const filteredJobs = useMemo(() => filterItems(jobs), [jobs, activeFilter]);
  const filteredMeals = useMemo(() => filterItems(meals), [meals, activeFilter]);

  const dashboardStats = useMemo(
    () => ({
      listings: listings.length,
      classifieds: classifieds.length,
      jobs: jobs.length,
      meals: meals.length,
      coupons: coupons.length,
      locations: locations.length,
      pendingVerifications: pendingVerifications.length,
      petrolPosts:
        listings.filter((x) => x.petrol_priority).length +
        classifieds.filter((x) => x.petrol_priority).length +
        jobs.filter((x) => x.petrol_priority).length +
        meals.filter((x) => x.petrol_priority).length,
    }),
    [listings, classifieds, jobs, meals, coupons, locations, pendingVerifications]
  );

  if (checkedAccess && !isAllowed) {
    return (
      <main style={mainStyle}>
        <a href="/" style={backLink}>
          ← Volver
        </a>
        <h1 style={{ marginTop: 16 }}>Acceso denegado</h1>
        <p>Tu cuenta no tiene permisos para entrar al panel admin.</p>
        <p style={{ opacity: 0.75 }}>
          Cuenta actual: <b>{email}</b>
        </p>
      </main>
    );
  }

  if (checkedAccess && isAllowed && !pinUnlocked) {
    return (
      <main style={{ ...mainStyle, maxWidth: 520 }}>
        <a href="/" style={backLink}>
          ← Volver
        </a>
        <h1 style={{ marginTop: 16 }}>Ingreso admin</h1>
        <p style={{ opacity: 0.78 }}>
          Cuenta autorizada: <b>{email}</b>
        </p>

        <div style={box}>
          <div style={{ fontWeight: 800, marginBottom: 10 }}>
            Introducí tu PIN de administrador
          </div>

          <input
            type="password"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            placeholder="PIN admin"
            style={input}
          />

          {pinError && (
            <div style={{ marginTop: 10, color: "#c62828", fontWeight: 700 }}>
              {pinError}
            </div>
          )}

          <button type="button" onClick={unlockAdmin} style={darkBtn}>
            Entrar al admin
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={mainStyle}>
      <a href="/" style={backLink}>
        ← Volver
      </a>

      <h1 style={{ marginTop: 16 }}>Panel admin</h1>
      <p style={{ opacity: 0.75 }}>
        Sesión actual: <b>{email || "sin email"}</b>
      </p>

      {msg && <p style={{ marginTop: 16 }}>{msg}</p>}

      <div style={tabsWrap}>
        <Tab
          label="Dashboard"
          active={section === "dashboard"}
          onClick={() => setSection("dashboard")}
        />
        <Tab
          label="Publicaciones"
          active={section === "posts"}
          onClick={() => setSection("posts")}
        />
        <Tab
          label="Precios"
          active={section === "pricing"}
          onClick={() => setSection("pricing")}
        />
        <Tab
          label="Cupones"
          active={section === "coupons"}
          onClick={() => setSection("coupons")}
        />
        <Tab
          label="Ciudades"
          active={section === "locations"}
          onClick={() => setSection("locations")}
        />
        <Tab
          label="Verificaciones"
          active={section === "verifications"}
          onClick={() => setSection("verifications")}
        />
        <Tab
          label="Mensajes"
          active={section === "messages"}
          onClick={() => setSection("messages")}
/>
      </div>

      {section === "dashboard" && (
        <section style={{ marginTop: 28 }}>
          <h2 style={{ marginBottom: 14 }}>Resumen</h2>
          <div style={grid}>
            <StatCard label="Inmuebles" value={dashboardStats.listings} />
            <StatCard label="Clasificados" value={dashboardStats.classifieds} />
            <StatCard label="Trabajos" value={dashboardStats.jobs} />
            <StatCard label="Viandas" value={dashboardStats.meals} />
            <StatCard label="Cupones" value={dashboardStats.coupons} />
            <StatCard label="Ciudades" value={dashboardStats.locations} />
            <StatCard
              label="Verificaciones pendientes"
              value={dashboardStats.pendingVerifications}
              accent="orange"
            />
            <StatCard
              label="Publicaciones petroleras"
              value={dashboardStats.petrolPosts}
              accent="dark"
            />
          </div>
        </section>
      )}

      {section === "locations" && (
        <section style={{ marginTop: 34 }}>
          <h2>Ciudades</h2>

          <div style={box}>
            <div style={formGrid}>
              <input
                value={newLocation.name}
                onChange={(e) =>
                  setNewLocation((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Ciudad, ej: Zapala"
                style={input}
              />

              <input
                value={newLocation.region}
                onChange={(e) =>
                  setNewLocation((p) => ({ ...p, region: e.target.value }))
                }
                placeholder="Región, ej: Centro Neuquino"
                style={input}
              />

              <input
                value={newLocation.province}
                onChange={(e) =>
                  setNewLocation((p) => ({ ...p, province: e.target.value }))
                }
                placeholder="Provincia, ej: Neuquén"
                style={input}
              />
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 14,
              }}
            >
              <input
                type="checkbox"
                checked={newLocation.is_featured}
                onChange={(e) =>
                  setNewLocation((p) => ({
                    ...p,
                    is_featured: e.target.checked,
                  }))
                }
              />
              Mostrar como ciudad destacada
            </label>

            <button
              type="button"
              onClick={createLocation}
              style={{ ...darkBtn, marginTop: 16 }}
            >
              Agregar ciudad
            </button>
          </div>

          <div style={{ ...grid, marginTop: 16 }}>
            {locations.map((loc) => (
              <div key={loc.id} style={box}>
                <div style={{ fontWeight: 900, fontSize: 18 }}>{loc.name}</div>

                <div style={{ marginTop: 8, opacity: 0.82 }}>
                  <b>Región:</b> {loc.region || "-"}
                </div>

                <div style={{ marginTop: 4, opacity: 0.82 }}>
                  <b>Provincia:</b> {loc.province || "-"}
                </div>

                <div style={{ marginTop: 10 }}>
                  <span style={loc.is_featured ? greenBadge : softBadge}>
                    {loc.is_featured ? "DESTACADA" : "NORMAL"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => toggleLocationFeatured(loc.id, loc.is_featured)}
                  disabled={workingId === loc.id}
                  style={{ ...darkBtn, marginTop: 16 }}
                >
                  {workingId === loc.id
                    ? "Procesando..."
                    : loc.is_featured
                    ? "Quitar destacada"
                    : "Marcar destacada"}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {section === "verifications" && (
        <section style={{ marginTop: 34 }}>
          <h2>Verificaciones pendientes</h2>
          <div style={grid}>
            {pendingVerifications.length > 0 ? (
              pendingVerifications.map((item) => (
                <VerificationCard
                  key={item.id}
                  item={item}
                  onApprove={() => approveVerification(item.id)}
                  onReject={() => rejectVerification(item.id)}
                  busy={workingId === item.id}
                />
              ))
            ) : (
              <div style={box}>No hay verificaciones pendientes.</div>
            )}
          </div>
        </section>
      )}

      {section === "posts" && (
        <>
          <section style={{ marginTop: 26 }}>
            <h2 style={{ marginBottom: 12 }}>Filtro rápido</h2>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <FilterBtn
                label="Todos"
                active={activeFilter === "ALL"}
                onClick={() => setActiveFilter("ALL")}
              />
              <FilterBtn
                label="Urgentes"
                active={activeFilter === "URGENT"}
                onClick={() => setActiveFilter("URGENT")}
              />
              <FilterBtn
                label="Destacados"
                active={activeFilter === "FEATURED"}
                onClick={() => setActiveFilter("FEATURED")}
              />
              <FilterBtn
                label="🚧 Petrolera"
                active={activeFilter === "PETROL"}
                onClick={() => setActiveFilter("PETROL")}
              />
              <FilterBtn
                label="Publicados"
                active={activeFilter === "PUBLISHED"}
                onClick={() => setActiveFilter("PUBLISHED")}
              />
              <FilterBtn
                label="Borradores"
                active={activeFilter === "DRAFT"}
                onClick={() => setActiveFilter("DRAFT")}
              />
            </div>
          </section>

          <Section title="Inmuebles">
            {filteredListings.length > 0 ? (
              filteredListings.map((item) => (
                <AdminItemCard
                  key={item.id}
                  title={item.title}
                  town={item.town}
                  status={item.status}
                  href={`/anuncio/${item.id}`}
                  urgentUntil={item.urgent_until}
                  featuredUntil={item.featured_until}
                  petrolPriority={item.petrol_priority}
                  onTogglePetrol={() =>
                    togglePetrolPriority("listings", item.id, item.petrol_priority)
                  }
                  onUnpublish={() => unpublishItem("listings", item.id)}
                  onDelete={() => deleteItem("listings", item.id)}
                  busy={workingId === item.id}
                />
              ))
            ) : (
              <div style={box}>No hay inmuebles para este filtro.</div>
            )}
          </Section>

          <Section title="Clasificados">
            {filteredClassifieds.length > 0 ? (
              filteredClassifieds.map((item) => (
                <AdminItemCard
                  key={item.id}
                  title={item.title}
                  town={item.town}
                  status={item.status}
                  href={`/clasificados/${item.id}`}
                  urgentUntil={item.urgent_until}
                  featuredUntil={item.featured_until}
                  petrolPriority={item.petrol_priority}
                  onTogglePetrol={() =>
                    togglePetrolPriority("classifieds", item.id, item.petrol_priority)
                  }
                  onUnpublish={() => unpublishItem("classifieds", item.id)}
                  onDelete={() => deleteItem("classifieds", item.id)}
                  busy={workingId === item.id}
                />
              ))
            ) : (
              <div style={box}>No hay clasificados para este filtro.</div>
            )}
          </Section>

          <Section title="Trabajos">
            {filteredJobs.length > 0 ? (
              filteredJobs.map((item) => (
                <AdminItemCard
                  key={item.id}
                  title={item.title}
                  town={item.town}
                  status={item.status}
                  href={`/trabajo/${item.id}`}
                  urgentUntil={item.urgent_until}
                  featuredUntil={item.featured_until}
                  petrolPriority={item.petrol_priority}
                  onTogglePetrol={() =>
                    togglePetrolPriority("jobs", item.id, item.petrol_priority)
                  }
                  onUnpublish={() => unpublishItem("jobs", item.id)}
                  onDelete={() => deleteItem("jobs", item.id)}
                  busy={workingId === item.id}
                />
              ))
            ) : (
              <div style={box}>No hay trabajos para este filtro.</div>
            )}
          </Section>

          <Section title="Viandas">
            {filteredMeals.length > 0 ? (
              filteredMeals.map((item) => (
                <AdminItemCard
                  key={item.id}
                  title={item.title}
                  town={item.town}
                  status={item.status}
                  href={`/viandas/${item.id}`}
                  urgentUntil={item.urgent_until}
                  featuredUntil={item.featured_until}
                  petrolPriority={item.petrol_priority}
                  onTogglePetrol={() =>
                    togglePetrolPriority("meals", item.id, item.petrol_priority)
                  }
                  onUnpublish={() => unpublishItem("meals", item.id)}
                  onDelete={() => deleteItem("meals", item.id)}
                  busy={workingId === item.id}
                />
              ))
            ) : (
              <div style={box}>No hay viandas para este filtro.</div>
            )}
          </Section>
        </>
      )}

      {section === "pricing" && (
        <section style={{ marginTop: 40 }}>
          <h2>Precios</h2>
          <div style={grid}>
            {pricingRules.map((rule) => (
              <PricingCard
                key={rule.id}
                rule={rule}
                busy={workingId === rule.id}
                onSave={updatePrice}
              />
            ))}
          </div>
        </section>
      )}

      {section === "coupons" && (
        <>
          <section style={{ marginTop: 40 }}>
            <h2>Crear cupón</h2>

            <div style={box}>
              <div style={formGrid}>
                <input
                  value={newCoupon.code}
                  onChange={(e) =>
                    setNewCoupon((p) => ({ ...p, code: e.target.value }))
                  }
                  placeholder="Código, ej: VACA10"
                  style={input}
                />

                <input
                  value={newCoupon.description}
                  onChange={(e) =>
                    setNewCoupon((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder="Descripción"
                  style={input}
                />

                <select
                  value={newCoupon.discount_type}
                  onChange={(e) =>
                    setNewCoupon((p) => ({
                      ...p,
                      discount_type: e.target.value,
                    }))
                  }
                  style={input}
                >
                  <option value="percent">Porcentaje</option>
                  <option value="fixed">Monto fijo</option>
                  <option value="free">Gratis</option>
                </select>

                <input
                  value={newCoupon.discount_value}
                  onChange={(e) =>
                    setNewCoupon((p) => ({
                      ...p,
                      discount_value: e.target.value,
                    }))
                  }
                  placeholder="Valor descuento"
                  style={input}
                  disabled={newCoupon.discount_type === "free"}
                />

                <select
                  value={newCoupon.item_type}
                  onChange={(e) =>
                    setNewCoupon((p) => ({ ...p, item_type: e.target.value }))
                  }
                  style={input}
                >
                  <option value="">Todas las secciones</option>
                  <option value="listing">Inmuebles</option>
                  <option value="classified">Clasificados</option>
                  <option value="job">Trabajo</option>
                  <option value="meal">Viandas</option>
                </select>

                <select
                  value={newCoupon.plan_code}
                  onChange={(e) =>
                    setNewCoupon((p) => ({ ...p, plan_code: e.target.value }))
                  }
                  style={input}
                >
                  <option value="">Todos los planes</option>
                  <option value="STANDARD">Standard</option>
                  <option value="FEATURED">Destacado</option>
                  <option value="URGENT">Urgente</option>
                  <option value="PETROL">Petrolera</option>
                </select>

                <input
                  value={newCoupon.max_uses}
                  onChange={(e) =>
                    setNewCoupon((p) => ({ ...p, max_uses: e.target.value }))
                  }
                  placeholder="Máximo usos"
                  style={input}
                />

                <input
                  type="datetime-local"
                  value={newCoupon.valid_until}
                  onChange={(e) =>
                    setNewCoupon((p) => ({
                      ...p,
                      valid_until: e.target.value,
                    }))
                  }
                  style={input}
                />
              </div>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 16,
                }}
              >
                <input
                  type="checkbox"
                  checked={newCoupon.is_active}
                  onChange={(e) =>
                    setNewCoupon((p) => ({
                      ...p,
                      is_active: e.target.checked,
                    }))
                  }
                />
                Cupón activo
              </label>

              <button
                type="button"
                onClick={createCoupon}
                style={{ ...darkBtn, marginTop: 16 }}
              >
                Crear cupón
              </button>
            </div>
          </section>

          <section style={{ marginTop: 40 }}>
            <h2>Cupones</h2>

            <div style={grid}>
              {coupons.map((coupon) => (
                <div key={coupon.id} style={box}>
                  <div style={{ fontWeight: 900, fontSize: 20 }}>{coupon.code}</div>

                  <div style={{ marginTop: 8, opacity: 0.8 }}>
                    {coupon.description || "Sin descripción"}
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <b>Tipo:</b> {coupon.discount_type}
                  </div>

                  <div style={{ marginTop: 4 }}>
                    <b>Valor:</b>{" "}
                    {coupon.discount_type === "free"
                      ? "Gratis"
                      : coupon.discount_value}
                  </div>

                  <div style={{ marginTop: 4 }}>
                    <b>Sección:</b> {coupon.item_type || "Todas"}
                  </div>

                  <div style={{ marginTop: 4 }}>
                    <b>Plan:</b> {coupon.plan_code || "Todos"}
                  </div>

                  <div style={{ marginTop: 4 }}>
                    <b>Usos:</b> {coupon.used_count} / {coupon.max_uses ?? "∞"}
                  </div>

                  <div style={{ marginTop: 4 }}>
                    <b>Vence:</b>{" "}
                    {coupon.valid_until
                      ? new Date(coupon.valid_until).toLocaleString()
                      : "Sin vencimiento"}
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <span style={coupon.is_active ? greenBadge : redBadge}>
                      {coupon.is_active ? "ACTIVO" : "INACTIVO"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleCoupon(coupon.id, coupon.is_active)}
                    disabled={workingId === coupon.id}
                    style={{ ...darkBtn, marginTop: 16 }}
                  >
                    {workingId === coupon.id
                      ? "Procesando..."
                      : coupon.is_active
                      ? "Desactivar"
                      : "Activar"}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
      {section === "messages" && (
  <section style={{ marginTop: 40 }}>
    <h2>Mensajes de contacto</h2>

    <div style={grid}>
      {contactMessages.length > 0 ? (
        contactMessages.map((item) => (
          <div key={item.id} style={box}>
            <div style={{ fontWeight: 900, fontSize: 18 }}>
              {item.name || "Sin nombre"}
            </div>

            <div style={{ marginTop: 8 }}>
              <b>Email:</b> {item.email}
            </div>

            <div style={{ marginTop: 4 }}>
              <b>Teléfono:</b> {item.phone || "-"}
            </div>

            <div style={{ marginTop: 4 }}>
              <b>Motivo:</b> {item.reason}
            </div>

            <div style={{ marginTop: 10 }}>
              <b>Mensaje:</b>
              <div
                style={{
                  marginTop: 6,
                  whiteSpace: "pre-wrap",
                  opacity: 0.88,
                  lineHeight: 1.5,
                }}
              >
                {item.message}
              </div>
            </div>

            <div style={{ marginTop: 12, opacity: 0.7, fontSize: 13 }}>
              {new Date(item.created_at).toLocaleString()}
            </div>
            <a
              href={`mailto:${item.email}?subject=Respuesta%20a%20tu%20consulta&body=Hola%20${encodeURIComponent(
              item.name || ""
              )},%0D%0A%0D%0A`}
              style={{
              display: "inline-block",
              marginTop: 12,
              color: "#0a7cff",
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            Responder
          </a>
          </div>
        ))
      ) : (
        <div style={box}>No hay mensajes todavía.</div>
      )}
    </div>
  </section>
)}
    </main>
  );
}

function VerificationCard({
  item,
  onApprove,
  onReject,
  busy,
}: {
  item: VerificationItem;
  onApprove: () => void;
  onReject: () => void;
  busy: boolean;
}) {
  const [frontUrl, setFrontUrl] = useState("");
  const [backUrl, setBackUrl] = useState("");
  const [serviceUrl, setServiceUrl] = useState("");

  useEffect(() => {
    const loadImages = async () => {
      const supabase = supabaseBrowser();

      if (item.document_front_path) {
        const { data } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(item.document_front_path, 3600);
        setFrontUrl(data?.signedUrl || "");
      }

      if (item.document_back_path) {
        const { data } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(item.document_back_path, 3600);
        setBackUrl(data?.signedUrl || "");
      }

      if (item.service_photo_path) {
        const { data } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(item.service_photo_path, 3600);
        setServiceUrl(data?.signedUrl || "");
      }
    };

    void loadImages();
  }, [item.document_front_path, item.document_back_path, item.service_photo_path]);

  return (
    <div style={box}>
      <div style={{ fontWeight: 900, fontSize: 18 }}>
        {item.verification_type === "BUSINESS"
          ? "Negocio verificado"
          : "Perfil verificado"}
      </div>

      <div style={{ marginTop: 8 }}>
        <b>Nombre:</b> {item.full_name || "-"}
      </div>
      <div style={{ marginTop: 4 }}>
        <b>Teléfono:</b> {item.phone || "-"}
      </div>
      <div style={{ marginTop: 4 }}>
        <b>Email:</b> {item.email || "-"}
      </div>
      <div style={{ marginTop: 4 }}>
        <b>Ciudad:</b> {item.city || "-"}
      </div>

      {item.notes && (
        <div style={{ marginTop: 10 }}>
          <b>Notas:</b>
          <div style={{ marginTop: 4, opacity: 0.8 }}>{item.notes}</div>
        </div>
      )}

      <div style={imageGrid}>
        {frontUrl ? (
          <img src={frontUrl} alt="DNI frente" style={previewImg} />
        ) : (
          <div style={emptyImg}>DNI frente</div>
        )}
        {backUrl ? (
          <img src={backUrl} alt="DNI dorso" style={previewImg} />
        ) : (
          <div style={emptyImg}>DNI dorso</div>
        )}
        {serviceUrl ? (
          <img src={serviceUrl} alt="Servicio" style={previewImg} />
        ) : (
          <div style={emptyImg}>Servicio</div>
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        <span style={softBadge}>{item.status}</span>
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={onApprove} disabled={busy} style={approveBtn}>
          {busy ? "Procesando..." : "Aprobar"}
        </button>
        <button type="button" onClick={onReject} disabled={busy} style={rejectBtn}>
          {busy ? "Procesando..." : "Rechazar"}
        </button>
      </div>
    </div>
  );
}

function FilterBtn({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "10px 14px",
        borderRadius: 999,
        border: active ? "2px solid #0a7cff" : "1px solid #ddd",
        background: active ? "#eef6ff" : "white",
        color: active ? "#0a5cc0" : "#333",
        fontWeight: 800,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginTop: 34 }}>
      <h2 style={{ marginBottom: 14 }}>{title}</h2>
      <div
        style={{
          display: "grid",
          gap: 14,
          gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
        }}
      >
        {children}
      </div>
    </section>
  );
}

function AdminItemCard({
  title,
  town,
  status,
  href,
  urgentUntil,
  featuredUntil,
  petrolPriority,
  onTogglePetrol,
  onUnpublish,
  onDelete,
  busy,
}: {
  title: string | null;
  town: string | null;
  status: string | null;
  href: string;
  urgentUntil?: string | null;
  featuredUntil?: string | null;
  petrolPriority?: boolean | null;
  onTogglePetrol: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  const isUrgent =
    !!urgentUntil && new Date(urgentUntil).getTime() > Date.now();

  const isFeatured =
    !!featuredUntil && new Date(featuredUntil).getTime() > Date.now();

  const isPetrol = !!petrolPriority;

  return (
    <div style={box}>
      <a
        href={href}
        style={{
          textDecoration: "none",
          color: "black",
          display: "block",
        }}
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          {isPetrol && <span style={petrolBadge}>🚧 PETROLERA</span>}
          {isUrgent && <span style={urgentBadge}>URGENTE</span>}
          {isFeatured && <span style={featuredBadge}>DESTACADO</span>}
          <span style={softBadge}>{status || "SIN ESTADO"}</span>
        </div>

        <div style={{ fontWeight: 800 }}>{title || "Sin título"}</div>
        <div style={{ marginTop: 6, opacity: 0.75 }}>📍 {town || "Sin ciudad"}</div>
      </a>

      <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={onTogglePetrol}
          disabled={busy}
          style={petrolBtn}
        >
          {busy ? "Procesando..." : isPetrol ? "Quitar petrolera" : "Marcar petrolera"}
        </button>

        <button
          type="button"
          onClick={onUnpublish}
          disabled={busy}
          style={grayBtn}
        >
          {busy ? "Procesando..." : "Despublicar"}
        </button>

        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          style={rejectBtn}
        >
          {busy ? "Procesando..." : "Eliminar"}
        </button>
      </div>
    </div>
  );
}

function PricingCard({
  rule,
  busy,
  onSave,
}: {
  rule: PricingRule;
  busy: boolean;
  onSave: (id: string, price: number, is_active: boolean) => Promise<void>;
}) {
  const [price, setPrice] = useState(String(rule.price_ars));
  const [isActive, setIsActive] = useState(rule.is_active);

  useEffect(() => {
    setPrice(String(rule.price_ars));
    setIsActive(rule.is_active);
  }, [rule.price_ars, rule.is_active]);

  return (
    <div style={box}>
      <div style={{ fontWeight: 900, fontSize: 18 }}>{rule.title}</div>

      <div style={{ marginTop: 6, opacity: 0.75 }}>
        {rule.item_type} / {rule.plan_code}
      </div>

      <input
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        style={{ ...input, marginTop: 16 }}
      />

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 12,
        }}
      >
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        Activo
      </label>

      <button
        type="button"
        onClick={() => {
          const parsed = Number(price);
          if (isNaN(parsed) || parsed < 0) {
            alert("Precio inválido");
            return;
          }
          onSave(rule.id, parsed, isActive);
        }}
        disabled={busy}
        style={{ ...darkBtn, marginTop: 16 }}
      >
        {busy ? "Guardando..." : "Guardar"}
      </button>
    </div>
  );
}

function Tab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} style={tabStyle(active)}>
      {label}
    </button>
  );
}

function StatCard({
  label,
  value,
  accent = "default",
}: {
  label: string;
  value: number;
  accent?: "default" | "orange" | "dark";
}) {
  const accentStyle =
    accent === "orange"
      ? {
          background: "#FFF7ED",
          border: "1px solid #FDBA74",
          color: "#9A3412",
        }
      : accent === "dark"
      ? {
          background: "#111827",
          border: "1px solid #111827",
          color: "white",
        }
      : {
          background: "white",
          border: "1px solid #eee",
          color: "#0F172A",
        };

  return (
    <div
      style={{
        ...statCard,
        ...accentStyle,
      }}
    >
      <div style={{ fontSize: 13, opacity: 0.82, fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>{value}</div>
    </div>
  );
}

const mainStyle: React.CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: 24,
  fontFamily: "system-ui",
};

const backLink: React.CSSProperties = {
  textDecoration: "none",
  color: "#0a7cff",
  fontWeight: 700,
};

const box: React.CSSProperties = {
  background: "white",
  border: "1px solid #eee",
  borderRadius: 14,
  padding: 16,
};

const grid: React.CSSProperties = {
  display: "grid",
  gap: 16,
  gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
};

const formGrid: React.CSSProperties = {
  display: "grid",
  gap: 12,
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
};

const imageGrid: React.CSSProperties = {
  marginTop: 14,
  display: "grid",
  gap: 8,
  gridTemplateColumns: "repeat(3,1fr)",
};

const previewImg: React.CSSProperties = {
  width: "100%",
  height: 120,
  objectFit: "cover",
  borderRadius: 10,
  border: "1px solid #eee",
};

const emptyImg: React.CSSProperties = {
  width: "100%",
  height: 120,
  display: "grid",
  placeItems: "center",
  borderRadius: 10,
  border: "1px dashed #ccc",
  color: "#777",
  fontSize: 13,
};

const input: React.CSSProperties = {
  width: "100%",
  padding: 12,
  borderRadius: 10,
  border: "1px solid #ddd",
  boxSizing: "border-box",
};

const darkBtn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "none",
  background: "#111",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
};

const approveBtn: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "none",
  background: "#2e7d32",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
};

const rejectBtn: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "none",
  background: "#c62828",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
};

const grayBtn: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #ccc",
  background: "white",
  color: "#333",
  fontWeight: 800,
  cursor: "pointer",
};

const petrolBtn: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "none",
  background: "#ff9800",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
};

const petrolBadge: React.CSSProperties = {
  background: "#ff9800",
  color: "white",
  fontWeight: 900,
  fontSize: 12,
  padding: "4px 8px",
  borderRadius: 999,
};

const urgentBadge: React.CSSProperties = {
  background: "#e53935",
  color: "white",
  fontWeight: 800,
  fontSize: 12,
  padding: "4px 8px",
  borderRadius: 999,
};

const featuredBadge: React.CSSProperties = {
  background: "#ffecb3",
  color: "#8a5a00",
  fontWeight: 800,
  fontSize: 12,
  padding: "4px 8px",
  borderRadius: 999,
};

const softBadge: React.CSSProperties = {
  background: "#f3f3f3",
  color: "#555",
  fontWeight: 700,
  fontSize: 12,
  padding: "4px 8px",
  borderRadius: 999,
};

const greenBadge: React.CSSProperties = {
  background: "#e8f5e9",
  color: "#2e7d32",
  fontWeight: 800,
  fontSize: 12,
  padding: "5px 8px",
  borderRadius: 999,
};

const redBadge: React.CSSProperties = {
  background: "#ffebee",
  color: "#c62828",
  fontWeight: 800,
  fontSize: 12,
  padding: "5px 8px",
  borderRadius: 999,
};

const tabsWrap: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginTop: 22,
};

const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: "10px 14px",
  borderRadius: 10,
  border: active ? "2px solid #111" : "1px solid #ddd",
  background: active ? "#111" : "white",
  color: active ? "white" : "#333",
  fontWeight: 800,
  cursor: "pointer",
});

const statCard: React.CSSProperties = {
  borderRadius: 14,
  padding: 16,
};