'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { format } from 'date-fns'

interface Carpool {
  id: string
  from: string
  to: string
  departureTime: string
  availableSeats: number
  pricePerSeat: number
  description?: string
  driver: {
    name: string
    email: string
  }
}

export default function CarpoolPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [carpools, setCarpools] = useState<Carpool[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      fetchCarpools()
    }
  }, [user, authLoading, router])

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

  const fetchCarpools = async () => {
    try {
      const response = await fetch('/api/carpool')
      const data = await response.json()
      setCarpools(data || [])
    } catch (error) {
      console.error('Failed to fetch carpools:', error)
      setCarpools([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading carpools...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Available Carpools</h1>
          <Link
            href="/carpool/create"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            Offer a Ride
          </Link>
        </div>

        {carpools.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No carpools available at the moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {carpools.map((carpool) => (
              <div
                key={carpool.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">From</p>
                        <p className="text-lg font-semibold">{carpool.from}</p>
                      </div>
                      <div className="text-gray-400">→</div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">To</p>
                        <p className="text-lg font-semibold">{carpool.to}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      Departure: {format(new Date(carpool.departureTime), 'MMM dd, yyyy • h:mm a')}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Driver: {carpool.driver.name}
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-gray-600">Available Seats</p>
                    <p className="text-2xl font-bold text-indigo-600">{carpool.availableSeats}</p>
                  </div>

                  <div className="text-center md:text-right">
                    <p className="text-2xl font-bold text-gray-900 mb-3">
                      ${carpool.pricePerSeat}
                      <span className="text-sm text-gray-600 font-normal">/seat</span>
                    </p>
                    <Link
                      href={`/carpool/${carpool.id}`}
                      className="inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                    >
                      View Details
                    </Link>
                  </div>
                </div>

                {carpool.description && (
                  <p className="mt-4 text-sm text-gray-600 border-t pt-4">
                    {carpool.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
