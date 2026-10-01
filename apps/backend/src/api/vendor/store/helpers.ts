import { AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"


export const getAuthenticatedVendorId = async (
  req: AuthenticatedMedusaRequest
): Promise<string> => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: "vendor_admin",
    fields: ["id", "vendor.id"],
    filters: { id: req.auth_context.actor_id },
  })

  const vendorId = data[0]?.vendor?.id

  if (!vendorId) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Vendor not found")
  }

  return vendorId
}
