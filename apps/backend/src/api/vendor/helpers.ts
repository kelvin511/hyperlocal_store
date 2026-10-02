import { AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

export const getAuthenticatedVendorId = async (
  req: AuthenticatedMedusaRequest
): Promise<string> => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: "vendor_admin",
    fields: ["id", "vendor.id", "vendor.status"],
    filters: { id: req.auth_context.actor_id },
  })

  const vendor = data[0]?.vendor

  if (!vendor?.id) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Vendor not found")
  }

  if (vendor.status !== "approved") {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      `Your vendor account is ${vendor.status}`
    )
  }

  return vendor.id
}
