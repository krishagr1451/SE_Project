'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { MarkerItem } from '@/components/Map'

const LeafletMap = dynamic(() => import('@/components/Map'), { ssr: false })

interface Car {
  id: string
  make: string
  model: string
  year: number
  color: string
  pricePerDay: number
  location: string
  description?: string
  imageUrl?: string
  owner: {
    name: string
    email: string
  }
}

export default function CarsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [cars, setCars] = useState<Car[]>([])
  const [loading, setLoading] = useState(true)
  const [markers, setMarkers] = useState<MarkerItem[]>([])
  const [geoLoading, setGeoLoading] = useState(true)

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    if (user) {
      fetchCars()
    }
  }, [user, authLoading, router])

  // Geocode locations (server-side proxy to Nominatim)
  useEffect(() => {
    if (!cars || cars.length === 0) {
      setMarkers([])
      setGeoLoading(false)
      return
    }

    let mounted = true
    const geocodeAll = async () => {
      setGeoLoading(true)
      try {
        // de-duplicate by location string
        const unique = Array.from(new Map(cars.map((c) => [c.location, c])).values())
        const promises = unique.map(async (car) => {
          try {
            const res = await fetch(`/api/geocode?address=${encodeURIComponent(car.location)}`)
            if (!res.ok) return null
            const json = await res.json()
            if (!json || typeof json.lat !== 'number') return null
            return {
              id: car.id,
              lat: json.lat,
              lng: json.lng,
              title: `${car.make} ${car.model}`,
              description: car.location,
              href: `/cars/${car.id}`,
            } as MarkerItem
          } catch (e) {
            return null
          }
        })

        const results = await Promise.all(promises)
        const valid = results.filter((r): r is MarkerItem => r !== null)
        if (mounted) {
          setMarkers(valid)
        }
      } catch (e) {
        console.error('Geocoding failed', e)
      } finally {
        if (mounted) setGeoLoading(false)
      }
    }

    geocodeAll()

    return () => {
      mounted = false
    }
  }, [cars])

  // Show loading state
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const fetchCars = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/cars')
      const data = await response.json()
      setCars(data.cars || [])
    } catch (error) {
      console.error('Failed to fetch cars:', error)
      setCars([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading cars...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Available Cars for Rent</h1>
          <Link
            href="/cars/add"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            List Your Car
          </Link>
        </div>

        {/* Map showing car locations */}
        <div className="mb-8">
          {geoLoading ? (
            <div className="h-96 flex items-center justify-center bg-white rounded-lg shadow-md">Geocoding locations...</div>
          ) : markers.length > 0 ? (
            <LeafletMap markers={markers} />
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500">No location data available for cars.</div>
          )}
        </div>

        {cars.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No cars available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cars.map((car) => (
              <div
                key={car.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <img
                  src={car.imageUrl || '/cars/placeholder.svg'}
                  alt={`${car.make} ${car.model}`}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {car.make} {car.model} ({car.year})
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Color: {car.color} • Location: {car.location}
                  </p>
                  <p className="text-2xl font-bold text-indigo-600 mb-4">
                    ${car.pricePerDay}/day
                  </p>
                  {car.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {car.description}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mb-4">
                    Owner: {car.owner.name}
                  </p>
                  <Link
                    href={`/cars/${car.id}`}
                    className="block w-full text-center rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                  >
                    View Details & Book
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
