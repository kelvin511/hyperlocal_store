import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { getVendorsByProductIds } from "../../helpers"

const getOrderVendorIdsStep = createStep(
  "get-order-vendor-ids",
  async (orderId: string, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "items.product_id", "vendor.id"],
      filters: { id: orderId },
    })

    const order = orders[0]

    const productIds = [
      ...new Set(
        (order?.items ?? [])
          .map((item) => item?.product_id)
          .filter((id): id is string => !!id)
      ),
    ]

    const vendors = await getVendorsByProductIds(container, productIds)

    const alreadyLinked = new Set(
      ([] as { id: string }[])
        .concat((order?.vendor as { id: string } | { id: string }[]) ?? [])
        .map((vendor) => vendor.id)
    )

    const vendorIds = [
      ...new Set([...vendors.values()].map((vendor) => vendor.id)),
    ].filter((id) => !alreadyLinked.has(id))

    return new StepResponse(vendorIds)
  }
)

export default getOrderVendorIdsStep
