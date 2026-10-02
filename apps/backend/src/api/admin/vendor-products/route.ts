import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type RawProduct = {
  id: string
  title: string
  thumbnail?: string | null
  status: string
  created_at: string | Date
  variants?: {
    prices?: { amount: number; currency_code: string }[]
  }[]
  vendor?: { id: string; name: string | null; handle: string } | null
}

const PRODUCT_FIELDS = [
  "id",
  "title",
  "thumbnail",
  "status",
  "created_at",
  "variants.prices.amount",
  "variants.prices.currency_code",
]

const serialize = (
  product: RawProduct,
  vendor: RawProduct["vendor"] = product.vendor
) => {
  const price = product.variants?.[0]?.prices?.[0]

  return {
    id: product.id,
    title: product.title,
    thumbnail: product.thumbnail ?? null,
    status: product.status,
    price: price?.amount ?? null,
    currency_code: price?.currency_code ?? null,
    vendor: vendor
      ? { id: vendor.id, name: vendor.name, handle: vendor.handle }
      : null,
  }
}

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100)
  const offset = Math.max(Number(req.query.offset) || 0, 0)
  const q = typeof req.query.q === "string" ? req.query.q.trim() : ""
  const vendorId =
    typeof req.query.vendor_id === "string" ? req.query.vendor_id : ""

  if (vendorId) {
    const { data } = await query.graph({
      entity: "vendor",
      fields: [
        "id",
        "name",
        "handle",
        ...PRODUCT_FIELDS.map((field) => `products.${field}`),
      ],
      filters: { id: vendorId },
    })

    const vendor = data[0]
    const products = ((vendor?.products ?? []) as RawProduct[])
      .filter(Boolean)
      .filter((product) =>
        q ? product.title.toLowerCase().includes(q.toLowerCase()) : true
      )
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

    res.json({
      products: products
        .slice(offset, offset + limit)
        .map((product) => serialize(product, vendor)),
      count: products.length,
      limit,
      offset,
    })
    return
  }

  const { data: products, metadata } = await query.graph({
    entity: "product",
    fields: [...PRODUCT_FIELDS, "vendor.id", "vendor.name", "vendor.handle"],
    filters: q ? { title: { $ilike: `%${q}%` } } : {},
    pagination: { skip: offset, take: limit, order: { created_at: "DESC" } },
  })

  res.json({
    products: (products as RawProduct[]).map((product) => serialize(product)),
    count: metadata?.count ?? products.length,
    limit,
    offset,
  })
}
