import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getLocation } from "@lib/data/customer-location"
import { getRegion } from "@lib/data/regions"
import { listStoreVendorProducts, retrieveStoreVendor } from "@lib/data/vendors"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductPreview from "@modules/products/components/product-preview"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
  searchParams: Promise<{ page?: string }>
}

const PAGE_SIZE = 12

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { handle } = await props.params
  const vendor = await retrieveStoreVendor(handle, null)

  return { title: vendor?.name ?? vendor?.handle ?? "Store" }
}

export default async function StorePage(props: Props) {
  const { countryCode, handle } = await props.params
  const { page: pageParam } = await props.searchParams
  const page = Math.max(Number(pageParam) || 1, 1)

  const location = await getLocation()
  const coordinates = location
    ? { latitude: location.latitude, longitude: location.longitude }
    : null

  const [vendor, region] = await Promise.all([
    retrieveStoreVendor(handle, coordinates),
    getRegion(countryCode),
  ])

  if (!vendor || !region) {
    notFound()
  }

  const { products, count } = await listStoreVendorProducts({
    handle,
    countryCode,
    page,
  })

  const totalPages = Math.max(Math.ceil(count / PAGE_SIZE), 1)

  return (
    <div className="content-container py-6" data-testid="vendor-store-page">
      <LocalizedClientLink
        href="/stores"
        className="txt-small text-ui-fg-subtle hover:text-ui-fg-base"
      >
        All stores
      </LocalizedClientLink>
      <div className="mt-4 mb-8 flex flex-col gap-y-1">
        <h1 className="text-2xl-semi">{vendor.name ?? vendor.handle}</h1>
        {vendor.distance_km !== null && (
          <p className="text-ui-fg-subtle txt-medium">
            {vendor.distance_km} km from you
          </p>
        )}
      </div>

      {products.length === 0 ? (
        <p className="text-ui-fg-subtle txt-medium" data-testid="no-products">
          This store has no products available right now.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-6 gap-y-8 small:grid-cols-3 medium:grid-cols-4">
          {products.map((product) => (
            <li key={product.id}>
              <ProductPreview product={product} region={region} />
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-between txt-compact-small">
          <span className="text-ui-fg-subtle">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-x-4">
            {page > 1 && (
              <LocalizedClientLink href={`/stores/${handle}?page=${page - 1}`}>
                Previous
              </LocalizedClientLink>
            )}
            {page < totalPages && (
              <LocalizedClientLink href={`/stores/${handle}?page=${page + 1}`}>
                Next
              </LocalizedClientLink>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
