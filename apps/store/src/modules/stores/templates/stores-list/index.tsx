import { getLocation } from "@lib/data/customer-location"
import { listStoreVendors } from "@lib/data/vendors"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import StoreCard from "@modules/stores/components/store-card"

const RADIUS_OPTIONS = [5, 10, 25, 50]

export default async function StoresList({
  radius,
  basePath,
}: {
  radius?: string
  basePath: string
}) {
  const radiusKm = RADIUS_OPTIONS.includes(Number(radius))
    ? Number(radius)
    : undefined

  const location = await getLocation()
  const coordinates = location
    ? { latitude: location.latitude, longitude: location.longitude }
    : null

  const vendors = await listStoreVendors({ coordinates, radiusKm })

  return (
    <div className="content-container py-6" data-testid="stores-page">
      <div className="mb-8 flex flex-col gap-y-2">
        <h1 className="text-2xl-semi">
          {coordinates ? "Stores near you" : "All stores"}
        </h1>
        <p className="text-ui-fg-subtle txt-medium">
          {coordinates
            ? `Choose a store to see what it sells. Sorted by distance from ${
                location?.address ||
                `${coordinates.latitude.toFixed(3)}, ${coordinates.longitude.toFixed(3)}`
              }.`
            : "Choose a store to see what it sells. Set your location in the menu bar to see how far each store is."}
        </p>
      </div>

      {coordinates && (
        <div className="mb-8 flex flex-wrap items-center gap-2 txt-compact-small">
          <span className="text-ui-fg-subtle">Within:</span>
          {[undefined, ...RADIUS_OPTIONS].map((option) => (
            <LocalizedClientLink
              key={option ?? "any"}
              href={option ? `${basePath}?radius=${option}` : basePath}
              className={
                option === radiusKm
                  ? "rounded-full bg-ui-bg-interactive px-3 py-1 text-ui-fg-on-color"
                  : "rounded-full border border-ui-border-base px-3 py-1 hover:bg-ui-bg-subtle"
              }
            >
              {option ? `${option} km` : "Any distance"}
            </LocalizedClientLink>
          ))}
        </div>
      )}

      {vendors.length === 0 ? (
        <p className="text-ui-fg-subtle txt-medium" data-testid="no-stores">
          No stores found{radiusKm ? ` within ${radiusKm} km` : ""}.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 small:grid-cols-2 medium:grid-cols-3">
          {vendors.map((vendor) => (
            <li key={vendor.id}>
              <StoreCard vendor={vendor} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
