import { Link } from "react-router"
import type { Route } from "./+types/orders.detail"
import { ApiError, getOrder } from "~/lib/api.server"
import { getToken, requireVendor } from "~/lib/session.server"
import { formatPrice } from "~/lib/format"
import { Button } from "~/components/ui/button"
import {
  Container,
  ContainerHeader,
  SectionRow,
} from "~/components/container"
import { StatusPill } from "~/components/status-pill"

export function meta({}: Route.MetaArgs) {
  return [{ title: "Order" }]
}

export const handle = { title: "Order" }

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireVendor(request)
  const token = (await getToken(request))!

  try {
    return { order: await getOrder(token, params.id) }
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      throw new Response("Order not found", { status: 404 })
    }
    throw e
  }
}

export default function OrderDetail({ loaderData }: Route.ComponentProps) {
  const { order } = loaderData
  const address = order.shipping_address
  const customerName = [address?.first_name, address?.last_name]
    .filter(Boolean)
    .join(" ")
  const addressLines = [
    address?.address_1,
    address?.address_2,
    [address?.city, address?.province, address?.postal_code]
      .filter(Boolean)
      .join(", "),
    address?.country_code?.toUpperCase(),
  ].filter(Boolean)

  return (
    <div className="flex flex-col gap-4">
      <Container>
        <ContainerHeader
          title={`Order #${order.display_id ?? order.id.slice(-6)}`}
          description={new Date(order.created_at).toLocaleString()}
          actions={
            <Button
              variant="outline"
              size="lg"
              nativeButton={false}
              render={<Link to="/orders" />}
            >
              Back to orders
            </Button>
          }
        />
        <dl className="divide-border divide-y">
          <SectionRow title="Status">
            <StatusPill value={order.status} />
          </SectionRow>
          <SectionRow title="Payment">
            <StatusPill value={order.payment_status} />
          </SectionRow>
          <SectionRow title="Fulfillment">
            <StatusPill value={order.fulfillment_status} />
          </SectionRow>
        </dl>
      </Container>

      <Container>
        <ContainerHeader title="Items" />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="text-muted-foreground">
              <tr className="border-border border-b">
                <th className="px-6 py-2 font-medium">Product</th>
                <th className="px-3 py-2 font-medium">Quantity</th>
                <th className="px-3 py-2 font-medium">Price</th>
                <th className="px-6 py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt=""
                          className="size-8 rounded-md border object-cover"
                        />
                      ) : (
                        <div className="bg-muted size-8 rounded-md border" />
                      )}
                      <span className="font-medium">{item.title}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">{item.quantity}</td>
                  <td className="px-3 py-3">
                    {formatPrice(item.unit_price, order.currency_code)}
                  </td>
                  <td className="px-6 py-3 text-right">
                    {formatPrice(
                      item.unit_price * item.quantity,
                      order.currency_code,
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <dl>
          <SectionRow title="Subtotal">
            {formatPrice(order.subtotal, order.currency_code)}
          </SectionRow>
        </dl>
      </Container>

      <Container>
        <ContainerHeader title="Delivery" />
        <dl className="divide-border divide-y">
          <SectionRow title="Customer">{customerName || "-"}</SectionRow>
          <SectionRow title="Email">{order.customer_email ?? "-"}</SectionRow>
          <SectionRow title="Phone">{address?.phone ?? "-"}</SectionRow>
          <SectionRow title="Address">
            {addressLines.length
              ? addressLines.map((line) => <div key={line}>{line}</div>)
              : "-"}
          </SectionRow>
        </dl>
      </Container>
    </div>
  )
}
