import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import updateVendorStep, { UpdateVendorStepInput } from "./steps/update-vendor"

export type UpdateVendorWorkflowInput = UpdateVendorStepInput

const updateVendorWorkflow = createWorkflow(
  "update-vendor",
  function (input: UpdateVendorWorkflowInput) {
    const vendor = updateVendorStep(input)

    const { data: vendors } = useQueryGraphStep({
      entity: "vendor",
      fields: ["id", "name", "handle", "logo", "latitude", "longitude"],
      filters: {
        id: vendor.id,
      },
    })

    return new WorkflowResponse({
      vendor: vendors[0],
    })
  })

export default updateVendorWorkflow
