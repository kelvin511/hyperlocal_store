import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { updateCustomersWorkflow } from "@medusajs/medusa/core-flows"

export type CustomerLocation = {
  latitude: number
  longitude: number
  address?: string
  updated_at: string
}

export type UpdateCustomerLocationWorkflowInput = {
  customer_id: string
  location: Omit<CustomerLocation, "updated_at"> | null
}

const updateCustomerLocationWorkflow = createWorkflow(
  "update-customer-location",
  function (input: UpdateCustomerLocationWorkflowInput) {
    const updateInput = transform({ input }, ({ input }) => ({
      selector: { id: input.customer_id },
      update: {
        metadata: {
          location: input.location
            ? { ...input.location, updated_at: new Date().toISOString() }
            : "",
        },
      },
    }))

    const customers = updateCustomersWorkflow.runAsStep({ input: updateInput })

    return new WorkflowResponse({ customers })
  })

export default updateCustomerLocationWorkflow
