import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { distanceInKm, parseCoordinates } from "../../../../utils/geo"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: "vendor",
    fields: ["id", "name", "handle", "logo", "latitude", "longitude"],
    filters: { handle: req.params.handle, status: "approved" },
  })

  if (!data.length) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Store not found")
  }

  const vendor = data[0]
  const origin = parseCoordinates(req.query)

  res.json({
    vendor: {
      ...vendor,
      distance_km: origin
        ? Math.round(distanceInKm(origin, vendor) * 10) / 10
        : null,
    },
  })
}
