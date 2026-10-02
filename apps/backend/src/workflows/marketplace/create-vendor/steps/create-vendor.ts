import { 
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"
import { MARKETPLACE_MODULE } from "../../../../modules/marketplace"
import MarketplaceModuleService from "../../../../modules/marketplace/service"
import { VendorStatus } from "../../../../modules/marketplace/vendor-status"

type CreateVendorStepInput = {
  name: string
  latitude: number
  longitude: number
  handle?: string
  logo?: string
  status?: VendorStatus
  
}

const createVendorStep = createStep(
  "create-vendor",
  async (vendorData: CreateVendorStepInput, { container }) => {
    const marketplaceModuleService: MarketplaceModuleService = 
      container.resolve(MARKETPLACE_MODULE)

    const vendor = await marketplaceModuleService.createVendors(vendorData)

    return new StepResponse(vendor, vendor.id)
  },
  async (vendorId, { container }) => {
    if (!vendorId) {
      return
    }

    const marketplaceModuleService: MarketplaceModuleService = 
      container.resolve(MARKETPLACE_MODULE)

    await marketplaceModuleService.softDeleteVendors(vendorId)
  })

export default createVendorStep