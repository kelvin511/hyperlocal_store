import { StoreVendor } from "@lib/data/vendors"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const StoreCard = ({ vendor }: { vendor: StoreVendor }) => {
  const name = vendor.name ?? vendor.handle

  return (
    <LocalizedClientLink
      href={`/stores/${vendor.handle}`}
      className="flex items-center gap-x-4 rounded-rounded border border-ui-border-base p-4 transition-colors hover:bg-ui-bg-subtle"
      data-testid="store-card"
    >
      {vendor.logo ? (
        <img
          src={vendor.logo}
          alt=""
          className="size-12 rounded-full object-cover"
        />
      ) : (
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-ui-bg-component text-large-semi uppercase">
          {name.charAt(0)}
        </div>
      )}
      <div className="flex min-w-0 flex-col">
        <span className="txt-medium-plus truncate">{name}</span>
        <span className="txt-small text-ui-fg-subtle">
          {vendor.distance_km !== null
            ? `${vendor.distance_km} km away`
            : "View store"}
        </span>
      </div>
    </LocalizedClientLink>
  )
}

export default StoreCard
