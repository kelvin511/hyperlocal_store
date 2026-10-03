import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import linkOrderToVendorsWorkflow from "../workflows/marketplace/order/link-order-to-vendors"

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  await linkOrderToVendorsWorkflow(container).run({
    input: { order_id: data.id },
  })
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
