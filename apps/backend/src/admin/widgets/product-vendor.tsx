import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { HttpTypes } from "@medusajs/framework/types"
import { Container, Heading, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { sdk } from "../lib/client"
import { VendorSummary } from "../lib/types"

const ProductVendorWidget = ({
  data: product,
}: {
  data: HttpTypes.AdminProduct
}) => {
  const { data, isLoading } = useQuery({
    queryKey: ["product-vendor", product.id],
    queryFn: () =>
      sdk.client.fetch<{ vendor: VendorSummary | null }>(
        `/admin/products/${product.id}/vendor`
      ),
  })

  const vendor = data?.vendor

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Vendor</Heading>
      </div>
      <div className="px-6 py-4">
        {isLoading ? (
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Loading...
          </Text>
        ) : vendor ? (
          <Link
            to={`/vendors/${vendor.id}`}
            className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
          >
            <Text size="small" leading="compact" weight="plus">
              {vendor.name ?? vendor.handle}
            </Text>
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              {vendor.handle}
            </Text>
          </Link>
        ) : (
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            This product is not linked to a vendor.
          </Text>
        )}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details",
})

export default ProductVendorWidget
