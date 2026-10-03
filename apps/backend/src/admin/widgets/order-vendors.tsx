import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { HttpTypes } from "@medusajs/framework/types"
import { Container, Heading, StatusBadge, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { sdk } from "../lib/client"
import { OrderVendorsResponse } from "../lib/types"
import { VENDOR_STATUS_COLORS, VENDOR_STATUS_LABELS } from "../lib/vendor-status"

const OrderVendorsWidget = ({ data: order }: { data: HttpTypes.AdminOrder }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["order-vendors", order.id],
    queryFn: () =>
      sdk.client.fetch<OrderVendorsResponse>(`/admin/orders/${order.id}/vendors`),
  })

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Vendors</Heading>
      </div>
      {isLoading && (
        <div className="px-6 py-4">
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Loading...
          </Text>
        </div>
      )}
      {data && data.vendors.length === 0 && (
        <div className="px-6 py-4">
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            No vendor is linked to this order.
          </Text>
        </div>
      )}
      {data?.vendors.map((vendor) => (
        <div key={vendor.id} className="flex flex-col gap-y-2 px-6 py-4">
          <div className="flex items-center justify-between gap-x-2">
            <Link
              to={`/vendors/${vendor.id}`}
              className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
            >
              <Text size="small" leading="compact" weight="plus">
                {vendor.name ?? vendor.handle}
              </Text>
            </Link>
            <StatusBadge
              color={
                VENDOR_STATUS_COLORS[
                  vendor.status as keyof typeof VENDOR_STATUS_COLORS
                ] ?? "grey"
              }
            >
              {VENDOR_STATUS_LABELS[
                vendor.status as keyof typeof VENDOR_STATUS_LABELS
              ] ?? vendor.status}
            </StatusBadge>
          </div>
          {vendor.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <Text size="small" leading="compact" className="text-ui-fg-subtle">
                {item.quantity} x {item.title}
              </Text>
              <Text size="small" leading="compact" className="text-ui-fg-subtle">
                {item.unit_price * item.quantity}
              </Text>
            </div>
          ))}
          <div className="flex items-center justify-between">
            <Text size="small" leading="compact" weight="plus">
              Subtotal
            </Text>
            <Text size="small" leading="compact" weight="plus">
              {vendor.subtotal} {data.currency_code.toUpperCase()}
            </Text>
          </div>
        </div>
      ))}
      {data && data.unassigned_item_count > 0 && (
        <div className="px-6 py-4">
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {data.unassigned_item_count} item(s) are not linked to a vendor.
          </Text>
        </div>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side",
})

export default OrderVendorsWidget
