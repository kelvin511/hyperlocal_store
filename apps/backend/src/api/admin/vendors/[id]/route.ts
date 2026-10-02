import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import updateVendorWorkflow from "../../../../workflows/marketplace/update-vendor"
import deleteVendorWorkflow from "../../../../workflows/marketplace/delete-vendor"
import { PatchVendorStoreBody } from "../../../vendor/store/route"

const getVendor = async (req: AuthenticatedMedusaRequest, id: string) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
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
      "admins.id",
      "admins.email",
      "admins.first_name",
      "admins.last_name",
      "products.id",
    ],
    filters: { id },
  })

  if (!data.length) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Vendor not found")
  }

  const { products, ...vendor } = data[0]

  return { ...vendor, product_count: (products ?? []).filter(Boolean).length }
}

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  res.json({ vendor: await getVendor(req, req.params.id) })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<PatchVendorStoreBody>,
  res: MedusaResponse
) => {
  await getVendor(req, req.params.id)

  await updateVendorWorkflow(req.scope).run({
    input: { id: req.params.id, ...req.validatedBody },
  })

  res.json({ vendor: await getVendor(req, req.params.id) })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  await getVendor(req, req.params.id)

  await deleteVendorWorkflow(req.scope).run({
    input: { id: req.params.id },
  })

  res.json({ id: req.params.id, object: "vendor", deleted: true })
}
