import type { Metadata } from "next";

type Props = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

type ClassifiedMetaRow = {
  id: string;
  title: string | null;
  description: string | null;
  status: string | null;
  photo_paths: string[] | null;
};

async function getClassified(id: string): Promise<ClassifiedMetaRow | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!supabaseUrl || !supabaseAnonKey || !id) return null;

  const url =
    `${supabaseUrl}/rest/v1/classifieds` +
    `?select=id,title,description,status,photo_paths` +
    `&id=eq.${encodeURIComponent(id)}` +
    `&status=eq.PUBLISHED` +
    `&limit=1`;

  const res = await fetch(url, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    next: { revalidate: 60 },
  });

  if (!res.ok) return null;

  const rows = (await res.json()) as ClassifiedMetaRow[];
  return rows?.[0] ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const item = await getClassified(id);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  const title = item?.title
    ? `${item.title} | VendoFácil`
    : "Clasificado | VendoFácil";

  const description = item?.description
    ? String(item.description).slice(0, 160)
    : "Mira este clasificado publicado en VendoFácil.";

  const url = `https://www.vendofacil.net/clasificados/${id}`;

  const firstPhotoPath =
    item?.photo_paths &&
    Array.isArray(item.photo_paths) &&
    item.photo_paths.length > 0
      ? item.photo_paths[0]
      : null;

  const image =
    firstPhotoPath && supabaseUrl
      ? `${supabaseUrl}/storage/v1/object/public/classified-photos/${firstPhotoPath}`
      : "https://www.vendofacil.net/logo-vendofacil.png";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "VendoFácil",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: "es_AR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function ClassifiedDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}