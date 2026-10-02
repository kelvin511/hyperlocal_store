import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import updateVendorStatusWorkflow from "../../../../../workflows/marketplace/update-vendor-status"

export const PostVendorStatusSchema = z.strictObject({
  status: z.enum(["approved", "rejected", "disabled"]),
})

export type PostVendorStatusBody = z.infer<typeof PostVendorStatusSchema>

export const POST = async (
  req: AuthenticatedMedusaRequest<PostVendorStatusBody>,
  res: MedusaResponse
) => {
  const { result } = await updateVendorStatusWorkflow(req.scope).run({
    input: { id: req.params.id, status: req.validatedBody.status },
  })

  res.json({ vendor: result.vendor })
}
