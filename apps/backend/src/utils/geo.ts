const EARTH_RADIUS_KM = 6371

const toRadians = (degrees: number) => (degrees * Math.PI) / 180

export const distanceInKm = (
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number }
): number => {
  const deltaLatitude = toRadians(to.latitude - from.latitude)
  const deltaLongitude = toRadians(to.longitude - from.longitude)

  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(deltaLongitude / 2) ** 2

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export const parseCoordinates = (query: {
  latitude?: unknown
  longitude?: unknown
}): { latitude: number; longitude: number } | null => {
  if (query.latitude === undefined || query.longitude === undefined) {
    return null
  }

  const latitude = Number(query.latitude)
  const longitude = Number(query.longitude)

  if (
    Number.isNaN(latitude) ||
    Number.isNaN(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    return null
  }

  return { latitude, longitude }
}
