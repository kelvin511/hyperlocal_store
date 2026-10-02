export function formatPrice(amount: number | null, currencyCode: string | null) {
  if (amount === null) return "-"
  if (!currencyCode) return String(amount)

  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: currencyCode,
    }).format(amount)
  } catch {
    return `${amount} ${currencyCode.toUpperCase()}`
  }
}
