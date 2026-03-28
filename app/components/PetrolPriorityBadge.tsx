export default function PetrolPriorityBadge({
  priority,
}: {
  priority?: boolean | null;
}) {
  if (!priority) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 10,
        left: 10,
        background: "#ff9800",
        color: "white",
        padding: "4px 8px",
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 800,
      }}
    >
      🚧 PRIORIDAD PETROLERA
    </div>
  );
}