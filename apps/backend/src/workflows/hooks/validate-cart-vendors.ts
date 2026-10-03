import {
  addToCartWorkflow,
  completeCartWorkflow,
} from "@medusajs/medusa/core-flows"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  assertVendorsAvailable,
  getProductIdsByVariantIds,
} from "../marketplace/order/helpers"

addToCartWorkflow.hooks.validate(async ({ input }, { container }) => {
  const variantIds = (input.items ?? [])
    .map((item) => item.variant_id)
    .filter((id): id is string => !!id)

  const productIds = await getProductIdsByVariantIds(container, variantIds)

  await assertVendorsAvailable(container, productIds)
})

completeCartWorkflow.hooks.validate(async ({ input }, { container }) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: carts } = await query.graph({
    entity: "cart",
    fields: ["id", "items.product_id"],
    filters: { id: input.id },
  })

  const productIds = [
    ...new Set(
      (carts[0]?.items ?? [])
        .map((item) => item?.product_id)
        .filter((id): id is string => !!id)
    ),
  ]

  await assertVendorsAvailable(container, productIds)
})
