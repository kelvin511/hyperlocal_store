import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"
import updateVendorWorkflow from "../../../workflows/marketplace/update-vendor"
import deleteVendorWorkflow from "../../../workflows/marketplace/delete-vendor"
import { getAuthenticatedVendorId } from "../helpers"

export const PatchVendorStoreSchema = z
  .strictObject({
    name: z.string().trim().min(1).optional(),
    handle: z
      .string()
      .trim()
      .min(1)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "handle must be lowercase alphanumeric characters separated by hyphens"
      )
      .optional(),
    logo: z.string().url().nullable().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: "At least one field must be provided",
  })

type PatchVendorStoreBody = z.infer<typeof PatchVendorStoreSchema>

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const vendorId = await getAuthenticatedVendorId(req)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: "vendor",
    fields: ["id", "name", "handle", "logo", "latitude", "longitude"],
    filters: { id: vendorId },
  })

  if (!data.length) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Vendor not found")
  }

  res.json({ vendor: data[0] })
}

export const PATCH = async (
  req: AuthenticatedMedusaRequest<PatchVendorStoreBody>,
  res: MedusaResponse
) => {
  const vendorId = await getAuthenticatedVendorId(req)

  const { result } = await updateVendorWorkflow(req.scope).run({
    input: { id: vendorId, ...req.validatedBody },
  })

  res.json({ vendor: result.vendor })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const vendorId = await getAuthenticatedVendorId(req)

  await deleteVendorWorkflow(req.scope).run({
    input: { id: vendorId },
  })

  res.json({ id: vendorId, object: "vendor", deleted: true })
}
