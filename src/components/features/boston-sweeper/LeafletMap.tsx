'use client'

import { useEffect } from 'react'
import { CircleMarker, MapContainer, Polyline, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

interface LeafletMapProps {
  coords: { lat: number, lng: number }[]
}

function FitToStreet({ coords }: LeafletMapProps) {
  const map = useMap()

  useEffect(() => {
    if (coords.length === 0) return
    if (coords.length === 1) {
      map.setView([coords[0].lat, coords[0].lng], 17)
      return
    }
    const bounds = coords.map((point) => [point.lat, point.lng] as [number, number])
    map.fitBounds(bounds, { padding: [28, 28] })
  }, [coords, map])

  return null
}

export function LeafletMap({ coords }: LeafletMapProps) {
  const center = coords[0] ?? { lat: 42.3601, lng: -71.0589 }

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={16}
      className="h-full w-full"
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitToStreet coords={coords} />
      {coords.map((point, index) => (
        <CircleMarker
          key={`${point.lat}-${point.lng}-${index}`}
          center={[point.lat, point.lng]}
          radius={7}
          pathOptions={{ color: '#007AFF', fillColor: '#007AFF', fillOpacity: 0.95, weight: 2 }}
        />
      ))}
      {coords.length > 1 ? (
        <Polyline
          positions={coords.map((point) => [point.lat, point.lng] as [number, number])}
          pathOptions={{ color: '#007AFF', weight: 5, opacity: 0.85 }}
        />
      ) : null}
    </MapContainer>
  )
}
