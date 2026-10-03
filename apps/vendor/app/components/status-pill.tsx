const positive = ["captured", "fulfilled", "shipped", "delivered", "completed"]
const negative = ["canceled", "cancelled", "refunded", "requires_action"]

export function StatusPill({ value }: { value: string | null }) {
  if (!value) return <span className="text-muted-foreground">-</span>

  const label = value.replace(/_/g, " ")
  const className = positive.includes(value)
    ? "bg-green-100 text-green-700"
    : negative.includes(value)
      ? "bg-red-100 text-red-700"
      : "bg-muted text-muted-foreground"

  return (
    <span className={`rounded-md px-2 py-0.5 text-xs capitalize ${className}`}>
      {label}
    </span>
  )
}
