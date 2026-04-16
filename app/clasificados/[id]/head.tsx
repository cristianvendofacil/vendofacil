type Props = {
  params: {
    id: string;
  };
};

export default function Head({ params }: Props) {
  const id = params?.id || "";

  const url = `https://www.vendofacil.net/clasificados/${id}`;
  const title = "Clasificado en VendoFácil";
  const description =
    "Mira este clasificado publicado en VendoFácil, la plataforma de inmuebles, clasificados, trabajo y viandas en Vaca Muerta.";
  const image = "https://www.vendofacil.net/logo-vendofacil.png";

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="VendoFácil" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </>
  );
}