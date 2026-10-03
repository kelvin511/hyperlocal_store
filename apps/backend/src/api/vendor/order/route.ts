import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { getAuthenticatedVendorId } from "../helpers"
import { listVendorOrders } from "./helpers"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const vendorId = await getAuthenticatedVendorId(req)

  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100)
  const offset = Math.max(Number(req.query.offset) || 0, 0)

  const { orders, count } = await listVendorOrders(req, vendorId, {
    limit,
    offset,
  })

  res.json({ orders, count, limit, offset })
}
