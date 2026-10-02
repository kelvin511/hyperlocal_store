import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import updateVendorProductWorkflow from "../../../../workflows/marketplace/product/update-vendor-product"
import deleteVendorProductWorkflow from "../../../../workflows/marketplace/product/delete-vendor-product"
import { getAuthenticatedVendorId } from "../../helpers"
import {
  getVendorProduct,
  serializeVendorProduct,
  toVendorProduct,
} from "../helpers"

export const PatchVendorProductSchema = z
  .strictObject({
    title: z.string().trim().min(1).optional(),
    thumbnail: z.string().url().nullable().optional(),
    price: z.number().min(0).optional(),
    available: z.boolean().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: "At least one field must be provided",
  })

type PatchVendorProductBody = z.infer<typeof PatchVendorProductSchema>

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const vendorId = await getAuthenticatedVendorId(req)
  const product = await getVendorProduct(req, vendorId, req.params.id)

  res.json({ product: serializeVendorProduct(product) })
}

export const PATCH = async (
  req: AuthenticatedMedusaRequest<PatchVendorProductBody>,
  res: MedusaResponse
) => {
  const vendorId = await getAuthenticatedVendorId(req)
  const current = await getVendorProduct(req, vendorId, req.params.id)

  const { result } = await updateVendorProductWorkflow(req.scope).run({
    input: {
      id: current.id,
      ...req.validatedBody,
      variant_id: current.variant_id ?? undefined,
      currency_code: current.currency_code ?? undefined,
    },
  })

  res.json({
    product: serializeVendorProduct(toVendorProduct(result.product)),
  })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const vendorId = await getAuthenticatedVendorId(req)
  const product = await getVendorProduct(req, vendorId, req.params.id)

  await deleteVendorProductWorkflow(req.scope).run({
    input: { id: product.id, vendor_id: vendorId },
  })

  res.json({ id: product.id, object: "product", deleted: true })
}
