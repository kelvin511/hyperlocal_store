import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

const getStoreDefaultsStep = createStep(
  "get-store-defaults",
  async (_: void, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const { data } = await query.graph({
      entity: "store",
      fields: [
        "default_sales_channel_id",
        "supported_currencies.currency_code",
        "supported_currencies.is_default",
      ],
    })

    const store = data[0]
    const currencies = store?.supported_currencies ?? []
    const currencyCode = (
      currencies.find((currency) => currency?.is_default) ?? currencies[0]
    )?.currency_code

    if (!currencyCode) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "The store has no supported currency configured"
      )
    }

    const { data: shippingProfiles } = await query.graph({
      entity: "shipping_profile",
      fields: ["id"],
      filters: { type: "default" },
    })

    return new StepResponse({
      currency_code: currencyCode,
      sales_channel_id: store?.default_sales_channel_id ?? null,
      shipping_profile_id: shippingProfiles[0]?.id ?? null,
    })
  }
)

export default getStoreDefaultsStep
