type Props = {
  isVerified?: boolean | null;
  verificationType?: string | null;
  status?: string | null;
  verifiedUntil?: string | null;
};

export default function VerificationBadge({
  isVerified,
  verificationType,
  status,
  verifiedUntil,
}: Props) {
  const active =
    !!isVerified &&
    status === "APPROVED" &&
    (!verifiedUntil || new Date(verifiedUntil).getTime() > Date.now());

  if (!active) return null;

  const label =
    verificationType === "BUSINESS"
      ? "✔ Negocio verificado"
      : "✔ Perfil verificado";

  return (
    <span
      style={{
        display: "inline-block",
        background: "#e8f4ff",
        color: "#0a5cc0",
        padding: "6px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
      }}
    >
      {label}
    </span>
  );
}