import type { ProductInput } from "./api.server"

type ParsedProductForm =
  | { error: string; input?: undefined }
  | { error?: undefined; input: ProductInput }

export function parseProductForm(form: FormData): ParsedProductForm {
  const title = String(form.get("title") ?? "").trim()
  const thumbnail = String(form.get("thumbnail") ?? "").trim()
  const priceValue = String(form.get("price") ?? "").trim()
  const price = Number(priceValue)
  const stockValue = String(form.get("stock") ?? "").trim()
  const stock = Number(stockValue)

  if (!title) return { error: "Title is required." }
  if (!priceValue || Number.isNaN(price) || price < 0) {
    return { error: "Price must be a number of 0 or more." }
  }

  if (!stockValue || !Number.isInteger(stock) || stock < 0) {
    return { error: "Stock must be a whole number of 0 or more." }
  }

  return {
    input: {
      title,
      thumbnail: thumbnail || null,
      price,
      stock,
      available: form.get("available") === "true",
    },
  }
}
