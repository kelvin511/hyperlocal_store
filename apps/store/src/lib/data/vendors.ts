"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { listProducts } from "./products"

export type StoreVendor = {
  id: string
  name: string | null
  handle: string
  logo: string | null
  latitude: number
  longitude: number
  distance_km: number | null
}

type Coordinates = { latitude: number; longitude: number } | null

const VENDOR_PRODUCTS_PAGE_SIZE = 12

export const listStoreVendors = async ({
  coordinates,
  radiusKm,
}: {
  coordinates: Coordinates
  radiusKm?: number
}): Promise<StoreVendor[]> => {
  return sdk.client
    .fetch<{ vendors: StoreVendor[] }>("/store/vendors", {
      method: "GET",
      query: {
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude,
        radius_km: coordinates ? radiusKm : undefined,
        limit: 100,
      },
      cache: "no-store",
    })
    .then(({ vendors }) => vendors)
    .catch(() => [])
}

export const retrieveStoreVendor = async (
  handle: string,
  coordinates: Coordinates
): Promise<StoreVendor | null> => {
  return sdk.client
    .fetch<{ vendor: StoreVendor }>(`/store/vendors/${handle}`, {
      method: "GET",
      query: {
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude,
      },
      cache: "no-store",
    })
    .then(({ vendor }) => vendor)
    .catch(() => null)
}

export const listStoreVendorProducts = async ({
  handle,
  countryCode,
  page,
}: {
  handle: string
  countryCode: string
  page: number
}): Promise<{ products: HttpTypes.StoreProduct[]; count: number }> => {
  const { product_ids, count } = await sdk.client
    .fetch<{ product_ids: string[]; count: number }>(
      `/store/vendors/${handle}/products`,
      {
        method: "GET",
        query: {
          limit: VENDOR_PRODUCTS_PAGE_SIZE,
          offset: (page - 1) * VENDOR_PRODUCTS_PAGE_SIZE,
        },
        cache: "no-store",
      }
    )
    .catch(() => ({ product_ids: [] as string[], count: 0 }))

  if (!product_ids.length) {
    return { products: [], count }
  }

  const {
    response: { products },
  } = await listProducts({
    countryCode,
    queryParams: { id: product_ids, limit: VENDOR_PRODUCTS_PAGE_SIZE },
  })

  return { products, count }
}
