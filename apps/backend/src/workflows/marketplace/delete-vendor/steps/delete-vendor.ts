import {
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"
import { MARKETPLACE_MODULE } from "../../../../modules/marketplace"
import MarketplaceModuleService from "../../../../modules/marketplace/service"

const deleteVendorStep = createStep(
  "delete-vendor",
  async (vendorId: string, { container }) => {
    const marketplaceModuleService: MarketplaceModuleService =
      container.resolve(MARKETPLACE_MODULE)

    const vendorAdmins = await marketplaceModuleService.listVendorAdmins(
      { vendor_id: vendorId },
      { select: ["id"] }
    )
    const vendorAdminIds = vendorAdmins.map((vendorAdmin) => vendorAdmin.id)

    await marketplaceModuleService.softDeleteVendorAdmins(vendorAdminIds)
    await marketplaceModuleService.softDeleteVendors(vendorId)

    return new StepResponse(vendorId, { vendorId, vendorAdminIds })
  },
  async (deleted, { container }) => {
    if (!deleted) {
      return
    }

    const marketplaceModuleService: MarketplaceModuleService =
      container.resolve(MARKETPLACE_MODULE)

    await marketplaceModuleService.restoreVendors(deleted.vendorId)
    await marketplaceModuleService.restoreVendorAdmins(deleted.vendorAdminIds)
  })

export default deleteVendorStep
