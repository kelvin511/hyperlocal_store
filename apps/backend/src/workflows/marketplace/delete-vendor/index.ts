import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import deleteVendorStep from "./steps/delete-vendor"

export type DeleteVendorWorkflowInput = {
  id: string
}

const deleteVendorWorkflow = createWorkflow(
  "delete-vendor",
  function (input: DeleteVendorWorkflowInput) {
    const id = deleteVendorStep(input.id)

    return new WorkflowResponse({ id })
  })

export default deleteVendorWorkflow
