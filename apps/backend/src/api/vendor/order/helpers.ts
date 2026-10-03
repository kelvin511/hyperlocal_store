import { AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

type RawItem = {
  id: string
  title: string
  product_title?: string | null
  thumbnail?: string | null
  quantity: number
  unit_price: number
  product_id?: string | null
}

type RawOrder = {
  id: string
  display_id?: number | string | null
  status: string
  email?: string | null
  currency_code: string
  created_at: string | Date
  payment_status?: string | null
  fulfillment_status?: string | null
  items?: RawItem[]
  shipping_address?: {
    first_name?: string | null
    last_name?: string | null
    phone?: string | null
    address_1?: string | null
    address_2?: string | null
    city?: string | null
    province?: string | null
    postal_code?: string | null
    country_code?: string | null
  } | null
}

const ORDER_FIELDS = [
  "id",
  "display_id",
  "status",
  "email",
  "currency_code",
  "created_at",
  "payment_status",
  "fulfillment_status",
  "items.id",
  "items.title",
  "items.product_title",
  "items.thumbnail",
  "items.quantity",
  "items.unit_price",
  "items.product_id",
  "shipping_address.first_name",
  "shipping_address.last_name",
  "shipping_address.phone",
  "shipping_address.address_1",
  "shipping_address.address_2",
  "shipping_address.city",
  "shipping_address.province",
  "shipping_address.postal_code",
  "shipping_address.country_code",
]

const toVendorOrder = (order: RawOrder, vendorProductIds: Set<string>) => {
  const items = (order.items ?? [])
    .filter((item) => item.product_id && vendorProductIds.has(item.product_id))
    .map((item) => ({
      id: item.id,
      title: item.product_title ?? item.title,
      thumbnail: item.thumbnail ?? null,
      quantity: item.quantity,
      unit_price: Number(item.unit_price),
    }))

  return {
    id: order.id,
    display_id: order.display_id ?? null,
    status: order.status,
    payment_status: order.payment_status ?? null,
    fulfillment_status: order.fulfillment_status ?? null,
    currency_code: order.currency_code,
    created_at: new Date(order.created_at).toISOString(),
    customer_email: order.email ?? null,
    shipping_address: order.shipping_address ?? null,
    items,
    subtotal: items.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    ),
  }
}

const getVendorOrderScope = async (
  req: AuthenticatedMedusaRequest,
  vendorId: string
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: "vendor",
    fields: ["id", "orders.id", "products.id"],
    filters: { id: vendorId },
  })

  const vendor = data[0]

  return {
    orderIds: ((vendor?.orders ?? []) as { id: string }[])
      .filter(Boolean)
      .map((order) => order.id),
    productIds: new Set(
      ((vendor?.products ?? []) as { id: string }[])
        .filter(Boolean)
        .map((product) => product.id)
    ),
  }
}

export const listVendorOrders = async (
  req: AuthenticatedMedusaRequest,
  vendorId: string,
  { limit, offset }: { limit: number; offset: number }
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { orderIds, productIds } = await getVendorOrderScope(req, vendorId)

  if (!orderIds.length) {
    return { orders: [], count: 0 }
  }

  const { data, metadata } = await query.graph({
    entity: "order",
    fields: ORDER_FIELDS,
    filters: { id: orderIds },
    pagination: { skip: offset, take: limit, order: { created_at: "DESC" } },
  })

  return {
    orders: (data as RawOrder[]).map((order) => toVendorOrder(order, productIds)),
    count: metadata?.count ?? orderIds.length,
  }
}

export const getVendorOrder = async (
  req: AuthenticatedMedusaRequest,
  vendorId: string,
  orderId: string
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { orderIds, productIds } = await getVendorOrderScope(req, vendorId)

  if (!orderIds.includes(orderId)) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Order not found")
  }

  const { data } = await query.graph({
    entity: "order",
    fields: ORDER_FIELDS,
    filters: { id: orderId },
  })

  if (!data.length) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Order not found")
  }

  return toVendorOrder(data[0] as RawOrder, productIds)
}
