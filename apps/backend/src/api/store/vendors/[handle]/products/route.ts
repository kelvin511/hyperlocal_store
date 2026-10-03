import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  ProductStatus,
} from "@medusajs/framework/utils"

type VendorProduct = {
  id: string
  status: string
  created_at: string | Date
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 100)
  const offset = Math.max(Number(req.query.offset) || 0, 0)

  const { data } = await query.graph({
    entity: "vendor",
    fields: [
      "id",
      "products.id",
      "products.status",
      "products.created_at",
    ],
    filters: { handle: req.params.handle, status: "approved" },
  })

  if (!data.length) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Store not found")
  }

  const products = ((data[0].products ?? []) as VendorProduct[])
    .filter(Boolean)
    .filter((product) => product.status === ProductStatus.PUBLISHED)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

  res.json({
    product_ids: products.slice(offset, offset + limit).map((product) => product.id),
    count: products.length,
    limit,
    offset,
  })
}
