'use client'

import React from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

// Fix default icon paths for Leaflet in Next.js
// `leaflet` expects URLs for the default icon. Importing the images ensures
// the bundler will give us the correct paths in production.
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
})

export interface MarkerItem {
  id: string
  lat: number
  lng: number
  title?: string
  description?: string
  href?: string
}

export default function Map({
  markers,
  center = { lat: 20.5937, lng: 78.9629 }, // Center of India
  zoom = 5, // Show India by default
}: {
  markers: MarkerItem[]
  center?: { lat: number; lng: number }
  zoom?: number
}) {
  const mapCenter = markers && markers.length > 0 ? { lat: markers[0].lat, lng: markers[0].lng } : center
  const mapZoom = markers && markers.length > 0 ? 13 : zoom // Closer zoom for city-level view

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden shadow-md">
      <MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={mapZoom} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]}>
            <Popup>
              <div>
                <strong>{m.title}</strong>
                {m.description && <div className="text-sm">{m.description}</div>}
                {m.href && (
                  <div className="mt-1">
                    <a href={m.href} className="text-indigo-600 underline">
                      View
                    </a>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
