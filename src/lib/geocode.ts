export interface GeoPoint {
  lat: number
  lng: number
}

export function streetFromNominatim(address: Record<string, string> | undefined): string | null {
  if (!address) return null
  const street = address.road || address.pedestrian || address.footway || address.residential || address.cycleway
  const trimmed = street?.trim()
  return trimmed ? trimmed : null
}

export function streetFromPhoton(properties: Record<string, unknown> | undefined): string | null {
  if (!properties) return null
  const street = properties.street
  if (typeof street === 'string' && street.trim()) return street.trim()
  const name = properties.name
  if (typeof name === 'string' && properties.osm_key === 'highway' && name.trim()) return name.trim()
  return null
}

export function pointFromPhoton(feature: { geometry?: { coordinates?: number[] } } | undefined): GeoPoint | null {
  const coordinates = feature?.geometry?.coordinates
  if (!coordinates || coordinates.length < 2) return null
  const [lng, lat] = coordinates
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

export function nearbySamplePoints(lat: number, lng: number): GeoPoint[] {
  const latitudeOffset = 0.00045
  const longitudeOffset = 0.00045 / Math.max(Math.cos((lat * Math.PI) / 180), 0.2)
  return [
    { lat, lng },
    { lat: lat + latitudeOffset, lng },
    { lat, lng: lng + longitudeOffset },
  ]
}
