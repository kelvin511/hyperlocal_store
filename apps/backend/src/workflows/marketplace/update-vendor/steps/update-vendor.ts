import {
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"
import { MARKETPLACE_MODULE } from "../../../../modules/marketplace"
import MarketplaceModuleService from "../../../../modules/marketplace/service"

export type UpdateVendorStepInput = {
  id: string
  name?: string
  handle?: string
  logo?: string | null
  latitude?: number
  longitude?: number
}

const updateVendorStep = createStep(
  "update-vendor",
  async (vendorData: UpdateVendorStepInput, { container }) => {
    const marketplaceModuleService: MarketplaceModuleService =
      container.resolve(MARKETPLACE_MODULE)

    const previousVendor = await marketplaceModuleService.retrieveVendor(
      vendorData.id
    )
    const vendor = await marketplaceModuleService.updateVendors(vendorData)

    return new StepResponse(vendor, {
      id: previousVendor.id,
      name: previousVendor.name,
      handle: previousVendor.handle,
      logo: previousVendor.logo,
      latitude: previousVendor.latitude,
      longitude: previousVendor.longitude,
    })
  },
  async (previousVendor, { container }) => {
    if (!previousVendor) {
      return
    }

    const marketplaceModuleService: MarketplaceModuleService =
      container.resolve(MARKETPLACE_MODULE)

    await marketplaceModuleService.updateVendors(previousVendor)
  })

export default updateVendorStep
