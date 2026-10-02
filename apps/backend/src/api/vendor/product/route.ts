import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import createVendorProductWorkflow from "../../../workflows/marketplace/product/create-vendor-product"
import { getAuthenticatedVendorId } from "../helpers"
import {
  listVendorProducts,
  serializeVendorProduct,
  toVendorProduct,
} from "./helpers"

export const PostVendorProductSchema = z.strictObject({
  title: z.string().trim().min(1),
  thumbnail: z.string().url().optional(),
  price: z.number().min(0),
  available: z.boolean().default(true),
})

type PostVendorProductBody = z.infer<typeof PostVendorProductSchema>

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const vendorId = await getAuthenticatedVendorId(req)
  const products = await listVendorProducts(req, vendorId)

  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100)
  const offset = Math.max(Number(req.query.offset) || 0, 0)

  res.json({
    products: products.slice(offset, offset + limit).map(serializeVendorProduct),
    count: products.length,
    limit,
    offset,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<PostVendorProductBody>,
  res: MedusaResponse
) => {
  const vendorId = await getAuthenticatedVendorId(req)

  const { result } = await createVendorProductWorkflow(req.scope).run({
    input: { vendor_id: vendorId, ...req.validatedBody },
  })

  res.status(201).json({
    product: serializeVendorProduct(toVendorProduct(result.product)),
  })
}
