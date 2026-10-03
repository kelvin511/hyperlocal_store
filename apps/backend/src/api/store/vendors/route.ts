import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { distanceInKm, parseCoordinates } from "../../../utils/geo"

type StoreVendor = {
  id: string
  name: string | null
  handle: string
  logo: string | null
  latitude: number
  longitude: number
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100)
  const offset = Math.max(Number(req.query.offset) || 0, 0)
  const radiusKm = Number(req.query.radius_km) || null
  const origin = parseCoordinates(req.query)

  const { data } = await query.graph({
    entity: "vendor",
    fields: ["id", "name", "handle", "logo", "latitude", "longitude"],
    filters: { status: "approved" },
  })

  let vendors = (data as StoreVendor[]).map((vendor) => ({
    ...vendor,
    distance_km: origin
      ? Math.round(distanceInKm(origin, vendor) * 10) / 10
      : null,
  }))

  if (origin) {
    if (radiusKm) {
      vendors = vendors.filter(
        (vendor) => (vendor.distance_km ?? Infinity) <= radiusKm
      )
    }

    vendors.sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0))
  } else {
    vendors.sort((a, b) => (a.name ?? a.handle).localeCompare(b.name ?? b.handle))
  }

  res.json({
    vendors: vendors.slice(offset, offset + limit),
    count: vendors.length,
    limit,
    offset,
  })
}
