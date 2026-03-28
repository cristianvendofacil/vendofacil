"use client";

import Link from "next/link";
import VerifiedBadge from "./VerifiedBadge";

type Props = {
  id: string;
  title: string;
  price: number | null;
  town: string | null;
  photo_url: string | null;
  verified?: boolean | null;
};

export default function ListingCard({
  id,
  title,
  price,
  town,
  photo_url,
  verified,
}: Props) {
  return (
    <Link
      href={`/anuncio/${id}`}
      style={{
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div
        style={{
          border: "1px solid #eee",
          borderRadius: 10,
          overflow: "hidden",
          background: "white",
        }}
      >
        <div
          style={{
            height: 180,
            background: "#f5f5f5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {photo_url ? (
            <img
              src={photo_url}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <span>sin foto</span>
          )}
        </div>

        <div style={{ padding: 12 }}>
          <div
            style={{
              fontWeight: 800,
              marginBottom: 6,
            }}
          >
            {title}
          </div>

          <VerifiedBadge verified={verified} />

          <div
            style={{
              marginTop: 6,
              color: "#666",
              fontSize: 14,
            }}
          >
            {town}
          </div>

          {price && (
            <div
              style={{
                marginTop: 8,
                fontWeight: 900,
                fontSize: 18,
              }}
            >
              ${price}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}