import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import updateVendorStatusStep, {
  UpdateVendorStatusStepInput,
} from "./steps/update-vendor-status"

export type UpdateVendorStatusWorkflowInput = UpdateVendorStatusStepInput

const updateVendorStatusWorkflow = createWorkflow(
  "update-vendor-status",
  function (input: UpdateVendorStatusWorkflowInput) {
    const vendor = updateVendorStatusStep(input)

    return new WorkflowResponse({ vendor })
  })

export default updateVendorStatusWorkflow
