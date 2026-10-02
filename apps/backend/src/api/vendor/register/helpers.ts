import { MedusaRequest } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import createVendorWorkflow, {
  CreateVendorWorkflowInput,
} from "../../../workflows/marketplace/create-vendor"

type RegisterVendorData = Omit<CreateVendorWorkflowInput, "authIdentityId" | "admin"> & {
  admin: CreateVendorWorkflowInput["admin"] & { password: string }
}

export const registerVendor = async (
  req: MedusaRequest,
  vendorData: RegisterVendorData
) => {
  const authModuleService = req.scope.resolve(Modules.AUTH)

  const { success, authIdentity, error } = await authModuleService.register(
    "emailpass",
    {
      url: req.url,
      body: {
        email: vendorData.admin.email,
        password: vendorData.admin.password,
      },
      protocol: req.protocol,
    }
  )

  if (!success || !authIdentity) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      error || "Registration failed."
    )
  }

  const { result } = await createVendorWorkflow(req.scope).run({
    input: {
      name: vendorData.name,
      handle: vendorData.handle,
      logo: vendorData.logo,
      latitude: vendorData.latitude,
      longitude: vendorData.longitude,
      admin: {
        email: vendorData.admin.email,
        first_name: vendorData.admin.first_name,
        last_name: vendorData.admin.last_name,
      },
      authIdentityId: authIdentity.id,
    },
  })

  return result.vendor
}
