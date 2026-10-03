import { AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  ProductStatus,
} from "@medusajs/framework/utils"

type RawProduct = {
  id: string
  title: string
  thumbnail?: string | null
  status: string
  created_at: string | Date
  variants?: {
    id: string
    manage_inventory?: boolean | null
    prices?: { amount: number; currency_code: string }[]
    inventory_items?:
      | ({
          inventory?: {
            location_levels?: ({ stocked_quantity: number } | null)[] | null
          } | null
        } | null)[]
      | null
  }[]
}

export type VendorProduct = {
  id: string
  title: string
  thumbnail: string | null
  price: number | null
  currency_code: string | null
  stock: number | null
  available: boolean
  variant_id: string | null
  created_at: string
}

export const toVendorProduct = (product: RawProduct): VendorProduct => {
  const variant = product.variants?.[0]
  const price = variant?.prices?.[0]

  const stock = variant?.manage_inventory
    ? (variant.inventory_items ?? []).reduce(
        (sum, item) =>
          sum +
          (item?.inventory?.location_levels ?? []).reduce(
            (levelSum, level) => levelSum + Number(level?.stocked_quantity ?? 0),
            0
          ),
        0
      )
    : null

  return {
    id: product.id,
    title: product.title,
    thumbnail: product.thumbnail ?? null,
    price: price?.amount ?? null,
    currency_code: price?.currency_code ?? null,
    stock,
    available: product.status === ProductStatus.PUBLISHED,
    variant_id: variant?.id ?? null,
    created_at: new Date(product.created_at).toISOString(),
  }
}

export const serializeVendorProduct = ({
  variant_id: _variantId,
  ...product
}: VendorProduct) => product

export const listVendorProducts = async (
  req: AuthenticatedMedusaRequest,
  vendorId: string
): Promise<VendorProduct[]> => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: "vendor",
    fields: [
      "products.id",
      "products.title",
      "products.thumbnail",
      "products.status",
      "products.created_at",
      "products.variants.id",
      "products.variants.manage_inventory",
      "products.variants.inventory_items.inventory.location_levels.stocked_quantity",
      "products.variants.prices.amount",
      "products.variants.prices.currency_code",
    ],
    filters: { id: vendorId },
  })

  const products = (data[0]?.products ?? []) as RawProduct[]

  return products
    .filter(Boolean)
    .map(toVendorProduct)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export const getVendorProduct = async (
  req: AuthenticatedMedusaRequest,
  vendorId: string,
  productId: string
): Promise<VendorProduct> => {
  const products = await listVendorProducts(req, vendorId)
  const product = products.find((p) => p.id === productId)

  if (!product) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Product not found")
  }

  return product
}
