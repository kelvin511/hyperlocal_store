import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { getAuthenticatedVendorId } from "../../helpers"
import { getVendorOrder } from "../helpers"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const vendorId = await getAuthenticatedVendorId(req)

  res.json({ order: await getVendorOrder(req, vendorId, req.params.id) })
}
