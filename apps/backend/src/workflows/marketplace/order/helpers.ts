import { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

export type ProductVendor = {
  id: string
  name: string | null
  handle: string
  status: string
}

export const getVendorsByProductIds = async (
  container: MedusaContainer,
  productIds: string[]
): Promise<Map<string, ProductVendor>> => {
  const vendors = new Map<string, ProductVendor>()

  if (!productIds.length) {
    return vendors
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "vendor.id", "vendor.name", "vendor.handle", "vendor.status"],
    filters: { id: productIds },
  })

  for (const product of products) {
    if (product.vendor) {
      vendors.set(product.id, product.vendor as ProductVendor)
    }
  }

  return vendors
}

export const getProductIdsByVariantIds = async (
  container: MedusaContainer,
  variantIds: string[]
): Promise<string[]> => {
  if (!variantIds.length) {
    return []
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: variants } = await query.graph({
    entity: "variant",
    fields: ["id", "product_id"],
    filters: { id: variantIds },
  })

  return [...new Set(variants.map((variant) => variant.product_id as string))]
}

export const assertVendorsAvailable = async (
  container: MedusaContainer,
  productIds: string[]
) => {
  const vendors = await getVendorsByProductIds(container, productIds)

  for (const vendor of vendors.values()) {
    if (vendor.status !== "approved") {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Products from ${vendor.name ?? "this vendor"} are currently unavailable`
      )
    }
  }
}
