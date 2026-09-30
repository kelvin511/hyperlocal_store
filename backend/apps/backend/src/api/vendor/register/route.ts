import {
    MedusaRequest,
    MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"
import createVendorWorkflow, {
    CreateVendorWorkflowInput,
} from "../../../workflows/marketplace/create-vendor"

export const PostVendorRegisterSchema = z.strictObject({
    name: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    handle: z.string().optional(),
    logo: z.string().optional(),
    admin: z.strictObject({
        email: z.string(),
        password: z.string(),
        first_name: z.string().optional(),
        last_name: z.string().optional(),
    }),
})

type RequestBody = z.infer<typeof PostVendorRegisterSchema>

export const POST = async (
    req: MedusaRequest<RequestBody>,
    res: MedusaResponse
) => {
    const authModuleService = req.scope.resolve("auth")

    const vendorData = req.validatedBody

  
    const {
        success,
        authIdentity,
        error,
    } = await authModuleService.register("vendor", {
        url: req.url,
        body: {
            email: vendorData.admin.email,
            password: vendorData.admin.password,
        },
        protocol: req.protocol,
    })

    if (!success || !authIdentity) {
        throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            error || "Registration failed."
        )
    }

    const { result } = await createVendorWorkflow(req.scope)
        .run({
            input: {
                name: vendorData.name,
                handle: vendorData.handle,
                logo: vendorData.logo,
                admin: {
                    email: vendorData.admin.email,
                    first_name: vendorData.admin.first_name,
                    last_name: vendorData.admin.last_name,
                },
                authIdentityId: authIdentity.id,
            } as CreateVendorWorkflowInput,
        })

    res.json({
        vendor: result.vendor,
    })
}