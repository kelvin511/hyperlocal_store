import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows"
import { MARKETPLACE_MODULE } from "../../../../modules/marketplace"
import getOrderVendorIdsStep from "./steps/get-order-vendor-ids"

export type LinkOrderToVendorsWorkflowInput = {
  order_id: string
}

const linkOrderToVendorsWorkflow = createWorkflow(
  "link-order-to-vendors",
  function (input: LinkOrderToVendorsWorkflowInput) {
    const vendorIds = getOrderVendorIdsStep(input.order_id)

    const links = transform({ input, vendorIds }, ({ input, vendorIds }) =>
      vendorIds.map((vendorId) => ({
        [MARKETPLACE_MODULE]: { vendor_id: vendorId },
        [Modules.ORDER]: { order_id: input.order_id },
      }))
    )

    createRemoteLinkStep(links)

    return new WorkflowResponse({ vendor_ids: vendorIds })
  })

export default linkOrderToVendorsWorkflow
