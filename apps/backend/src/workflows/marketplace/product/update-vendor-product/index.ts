import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ProductStatus } from "@medusajs/framework/utils"
import {
  updateProductsWorkflow,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import setVariantStockWorkflow from "../set-variant-stock"
import { VENDOR_PRODUCT_FIELDS } from "../vendor-product-fields"

export type UpdateVendorProductWorkflowInput = {
  id: string
  title?: string
  thumbnail?: string | null
  available?: boolean
  price?: number
  stock?: number
  variant_id?: string
  currency_code?: string
}

const updateVendorProductWorkflow = createWorkflow(
  "update-vendor-product",
  function (input: UpdateVendorProductWorkflowInput) {
    const updateInput = transform({ input }, ({ input }) => {
      const hasPrice =
        input.price !== undefined && input.variant_id && input.currency_code

      return {
        selector: { id: input.id },
        update: {
          title: input.title,
          thumbnail: input.thumbnail,
          images:
            input.thumbnail === undefined
              ? undefined
              : input.thumbnail
                ? [{ url: input.thumbnail }]
                : [],
          status:
            input.available === undefined
              ? undefined
              : input.available
                ? ProductStatus.PUBLISHED
                : ProductStatus.DRAFT,
          variants: hasPrice
            ? [
                {
                  id: input.variant_id as string,
                  prices: [
                    {
                      amount: input.price as number,
                      currency_code: input.currency_code as string,
                    },
                  ],
                },
              ]
            : undefined,
        },
      }
    })

    updateProductsWorkflow.runAsStep({ input: updateInput })

    const stockInput = transform({ input }, ({ input }) => ({
      variant_id: input.variant_id as string,
      quantity: input.stock as number,
    }))

    when(input, (data) => data.stock !== undefined && !!data.variant_id).then(
      () => {
        setVariantStockWorkflow.runAsStep({ input: stockInput })
      }
    )

    const productFilters = transform({ input }, ({ input }) => ({
      id: input.id,
    }))

    const { data: products } = useQueryGraphStep({
      entity: "product",
      fields: VENDOR_PRODUCT_FIELDS,
      filters: productFilters,
    }).config({ name: "get-updated-product" })

    return new WorkflowResponse({ product: products[0] })
  })

export default updateVendorProductWorkflow
