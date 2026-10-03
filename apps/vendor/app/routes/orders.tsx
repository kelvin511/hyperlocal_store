import { Link } from "react-router"
import type { Route } from "./+types/orders"
import { listOrders } from "~/lib/api.server"
import { getToken, requireVendor } from "~/lib/session.server"
import { formatPrice } from "~/lib/format"
import { Button } from "~/components/ui/button"
import { Container, ContainerHeader } from "~/components/container"
import { StatusPill } from "~/components/status-pill"

const PAGE_SIZE = 10

export function meta({}: Route.MetaArgs) {
  return [{ title: "Orders" }]
}

export const handle = { title: "Orders" }

export async function loader({ request }: Route.LoaderArgs) {
  await requireVendor(request)
  const token = (await getToken(request))!
  const page = Math.max(
    Number(new URL(request.url).searchParams.get("page")) || 1,
    1,
  )
  const list = await listOrders(token, {
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  })
  return { ...list, page }
}

export default function Orders({ loaderData }: Route.ComponentProps) {
  const { orders, count, page } = loaderData
  const hasNext = page * PAGE_SIZE < count

  return (
    <Container>
      <ContainerHeader
        title="Orders"
        description="Orders that contain your products."
      />
      {orders.length === 0 ? (
        <p className="text-muted-foreground px-6 py-10 text-center text-[13px]">
          You have no orders yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="text-muted-foreground">
              <tr className="border-border border-b">
                <th className="px-6 py-2 font-medium">Order</th>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Items</th>
                <th className="px-3 py-2 font-medium">Payment</th>
                <th className="px-3 py-2 font-medium">Fulfillment</th>
                <th className="px-3 py-2 font-medium">Subtotal</th>
                <th className="px-6 py-2" />
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-3 font-medium">
                    #{order.display_id ?? order.id.slice(-6)}
                  </td>
                  <td className="px-3 py-3">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-3">
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </td>
                  <td className="px-3 py-3">
                    <StatusPill value={order.payment_status} />
                  </td>
                  <td className="px-3 py-3">
                    <StatusPill value={order.fulfillment_status} />
                  </td>
                  <td className="px-3 py-3">
                    {formatPrice(order.subtotal, order.currency_code)}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        nativeButton={false}
                        render={<Link to={`/orders/${order.id}`} />}
                      >
                        View
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {(page > 1 || hasNext) && (
        <div className="flex items-center justify-between px-6 py-3 text-[13px]">
          <span className="text-muted-foreground">
            Page {page} of {Math.ceil(count / PAGE_SIZE)}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={page <= 1}
              nativeButton={false}
              render={<Link to={`?page=${page - 1}`} />}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={!hasNext}
              nativeButton={false}
              render={<Link to={`?page=${page + 1}`} />}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </Container>
  )
}
