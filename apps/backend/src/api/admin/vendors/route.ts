import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { VENDOR_STATUSES } from "../../../modules/marketplace/vendor-status"
import { registerVendor } from "../../vendor/register/helpers"
import { PostVendorRegisterBody } from "../../vendor/register/route"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100)
  const offset = Math.max(Number(req.query.offset) || 0, 0)
  const q = typeof req.query.q === "string" ? req.query.q.trim() : ""
  const status = VENDOR_STATUSES.find((value) => value === req.query.status)

  const { data: vendors, metadata } = await query.graph({
    entity: "vendor",
    fields: [
      "id",
      "name",
      "handle",
      "logo",
      "latitude",
      "longitude",
      "status",
      "created_at",
    ],
    filters: {
      ...(status ? { status } : {}),
      ...(q
        ? {
            $or: [
              { name: { $ilike: `%${q}%` } },
              { handle: { $ilike: `%${q}%` } },
            ],
          }
        : {}),
    },
    pagination: { skip: offset, take: limit, order: { created_at: "DESC" } },
  })

  res.json({ vendors, count: metadata?.count ?? vendors.length, limit, offset })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<PostVendorRegisterBody>,
  res: MedusaResponse
) => {
  const vendor = await registerVendor(req, req.validatedBody, "approved")

  res.status(201).json({ vendor })
}
