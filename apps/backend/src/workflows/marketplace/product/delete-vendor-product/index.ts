import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import {
  deleteProductsWorkflow,
  dismissRemoteLinkStep,
} from "@medusajs/medusa/core-flows"
import { MARKETPLACE_MODULE } from "../../../../modules/marketplace"

export type DeleteVendorProductWorkflowInput = {
  id: string
  vendor_id: string
}

const deleteVendorProductWorkflow = createWorkflow(
  "delete-vendor-product",
  function (input: DeleteVendorProductWorkflowInput) {
    const links = transform({ input }, ({ input }) => [
      {
        [MARKETPLACE_MODULE]: { vendor_id: input.vendor_id },
        [Modules.PRODUCT]: { product_id: input.id },
      },
    ])

    dismissRemoteLinkStep(links)

    const deleteInput = transform({ input }, ({ input }) => ({
      ids: [input.id],
    }))
    deleteProductsWorkflow.runAsStep({ input: deleteInput })

    return new WorkflowResponse({ id: input.id })
  })

export default deleteVendorProductWorkflow
