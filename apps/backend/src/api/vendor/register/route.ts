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
    name: z.string().trim().min(1),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    handle: z
        .string()
        .trim()
        .min(1)
        .regex(
            /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
            "handle must be lowercase alphanumeric characters separated by hyphens"
        ),
    logo: z.string().url().optional(),
    admin: z.strictObject({
        email: z.string().trim().email(),
        password: z.string().min(8),
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
    } = await authModuleService.register("emailpass", {
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
                latitude: vendorData.latitude,
                longitude: vendorData.longitude,
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