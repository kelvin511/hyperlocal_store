import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { registerVendor } from "./helpers"

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

export type PostVendorRegisterBody = z.infer<typeof PostVendorRegisterSchema>

export const POST = async (
  req: MedusaRequest<PostVendorRegisterBody>,
  res: MedusaResponse
) => {
  const vendor = await registerVendor(req, req.validatedBody)

  res.json({ vendor })
}
