export const toNumber = (value: unknown): number => {
  if (typeof value === "number") {
    return value
  }

  if (value && typeof value === "object") {
    const numeric = (value as { numeric?: unknown }).numeric

    if (typeof numeric === "number") {
      return numeric
    }

    return Number(JSON.parse(JSON.stringify(value)))
  }

  return Number(value)
}
