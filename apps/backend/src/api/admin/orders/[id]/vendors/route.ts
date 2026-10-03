import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { getVendorsByProductIds } from "../../../../../workflows/marketplace/order/helpers"
import { toNumber } from "../../../../../utils/numbers"

type OrderItem = {
  id: string
  title: string
  product_title?: string | null
  detail?: { quantity?: unknown } | null
  quantity?: unknown
  unit_price: number
  product_id?: string | null
}

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "currency_code",
      "items.id",
      "items.title",
      "items.product_title",
      "items.detail.quantity",
      "items.unit_price",
      "items.product_id",
    ],
    filters: { id: req.params.id },
  })

  if (!data.length) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Order not found")
  }

  const order = data[0]
  const items = (order.items ?? []).filter(Boolean) as OrderItem[]

  const productVendors = await getVendorsByProductIds(
    req.scope,
    [...new Set(items.map((item) => item.product_id).filter((id): id is string => !!id))]
  )

  const grouped = new Map<
    string,
    {
      id: string
      name: string | null
      handle: string
      status: string
      items: { id: string; title: string; quantity: number; unit_price: number }[]
      subtotal: number
    }
  >()
  let unassignedItems = 0

  for (const item of items) {
    const vendor = item.product_id ? productVendors.get(item.product_id) : undefined

    if (!vendor) {
      unassignedItems += 1
      continue
    }

    const entry = grouped.get(vendor.id) ?? {
      id: vendor.id,
      name: vendor.name,
      handle: vendor.handle,
      status: vendor.status,
      items: [],
      subtotal: 0,
    }

    const quantity = toNumber(item.detail?.quantity ?? item.quantity)

    entry.items.push({
      id: item.id,
      title: item.product_title ?? item.title,
      quantity,
      unit_price: toNumber(item.unit_price),
    })
    entry.subtotal += toNumber(item.unit_price) * quantity
    grouped.set(vendor.id, entry)
  }

  res.json({
    currency_code: order.currency_code,
    vendors: [...grouped.values()],
    unassigned_item_count: unassignedItems,
  })
}
