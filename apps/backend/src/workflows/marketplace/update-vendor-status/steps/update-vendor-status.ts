import { MedusaError } from "@medusajs/framework/utils"
import {
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"
import { MARKETPLACE_MODULE } from "../../../../modules/marketplace"
import MarketplaceModuleService from "../../../../modules/marketplace/service"
import {
  VENDOR_STATUS_TRANSITIONS,
  VendorStatus,
} from "../../../../modules/marketplace/vendor-status"

export type UpdateVendorStatusStepInput = {
  id: string
  status: VendorStatus
}

const updateVendorStatusStep = createStep(
  "update-vendor-status",
  async (input: UpdateVendorStatusStepInput, { container }) => {
    const marketplaceModuleService: MarketplaceModuleService =
      container.resolve(MARKETPLACE_MODULE)

    const vendor = await marketplaceModuleService.retrieveVendor(input.id)
    const currentStatus = vendor.status as VendorStatus

    if (!VENDOR_STATUS_TRANSITIONS[currentStatus].includes(input.status)) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `A ${currentStatus} vendor cannot be changed to ${input.status}`
      )
    }

    const updated = await marketplaceModuleService.updateVendors({
      id: input.id,
      status: input.status,
    })

    return new StepResponse(updated, {
      id: input.id,
      status: currentStatus,
    })
  },
  async (previous, { container }) => {
    if (!previous) {
      return
    }

    const marketplaceModuleService: MarketplaceModuleService =
      container.resolve(MARKETPLACE_MODULE)

    await marketplaceModuleService.updateVendors(previous)
  })

export default updateVendorStatusStep
