import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import setVariantStockStep, {
  SetVariantStockStepInput,
} from "./steps/set-variant-stock"

export type SetVariantStockWorkflowInput = SetVariantStockStepInput

const setVariantStockWorkflow = createWorkflow(
  "set-variant-stock",
  function (input: SetVariantStockWorkflowInput) {
    const result = setVariantStockStep(input)

    return new WorkflowResponse(result)
  })

export default setVariantStockWorkflow
