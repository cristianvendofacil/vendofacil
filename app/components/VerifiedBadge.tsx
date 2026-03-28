export default function VerifiedBadge({
  verified,
}: {
  verified?: boolean | null;
}) {
  if (!verified) return null;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "#e8f5e9",
        color: "#2e7d32",
        padding: "4px 8px",
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      ✔ Perfil verificado
    </span>
  );
}