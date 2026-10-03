import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { Modules, ProductStatus } from "@medusajs/framework/utils"
import {
  createProductsWorkflow,
  createRemoteLinkStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { MARKETPLACE_MODULE } from "../../../../modules/marketplace"
import getStoreDefaultsStep from "./steps/get-store-defaults"
import setVariantStockWorkflow from "../set-variant-stock"
import { VENDOR_PRODUCT_FIELDS } from "../vendor-product-fields"

export type CreateVendorProductWorkflowInput = {
  vendor_id: string
  title: string
  price: number
  available: boolean
  stock: number
  thumbnail?: string
}

const createVendorProductWorkflow = createWorkflow(
  "create-vendor-product",
  function (input: CreateVendorProductWorkflowInput) {
    const storeDefaults = getStoreDefaultsStep()

    const productsInput = transform({ input, storeDefaults }, ({ input, storeDefaults }) => {
      return {
        products: [
          {
            title: input.title,
            thumbnail: input.thumbnail,
            images: input.thumbnail ? [{ url: input.thumbnail }] : undefined,
            status: input.available
              ? ProductStatus.PUBLISHED
              : ProductStatus.DRAFT,
            options: [{ title: "Default", values: ["Default"] }],
            variants: [
              {
                title: "Default",
                options: { Default: "Default" },
                manage_inventory: true,
                prices: [
                  {
                    amount: input.price,
                    currency_code: storeDefaults.currency_code,
                  },
                ],
              },
            ],
            shipping_profile_id: storeDefaults.shipping_profile_id ?? undefined,
            sales_channels: storeDefaults.sales_channel_id
              ? [{ id: storeDefaults.sales_channel_id }]
              : undefined,
          },
        ],
      }
    })

    const products = createProductsWorkflow.runAsStep({
      input: productsInput,
    })

    const stockInput = transform({ input, products }, ({ input, products }) => ({
      variant_id: products[0].variants?.[0]?.id as string,
      quantity: input.stock,
    }))

    setVariantStockWorkflow.runAsStep({ input: stockInput })

    const links = transform({ input, products }, ({ input, products }) =>
      products.map((product) => ({
        [MARKETPLACE_MODULE]: { vendor_id: input.vendor_id },
        [Modules.PRODUCT]: { product_id: product.id },
      }))
    )

    createRemoteLinkStep(links)

    const productFilters = transform({ products }, ({ products }) => ({
      id: products[0].id,
    }))

    const { data: created } = useQueryGraphStep({
      entity: "product",
      fields: VENDOR_PRODUCT_FIELDS,
      filters: productFilters,
    }).config({ name: "get-created-product" })

    return new WorkflowResponse({ product: created[0] })
  })

export default createVendorProductWorkflow
