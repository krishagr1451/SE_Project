'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { getAuthHeader } from '@/lib/storage'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Booking {
  id: string
  startDate: string
  endDate?: string
  totalPrice: number
  status: string
  car?: {
    make: string
    model: string
    year: number
  }
  carpool?: {
    from: string
    to: string
    departureTime: string
  }
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      const authHeader = getAuthHeader()
      if (!authHeader) {
        router.push('/login')
        return
      }

      const response = await fetch('http://localhost:4000/api/bookings', {
        headers: { Authorization: authHeader },
      })
      const data = await response.json()
      setBookings(data.bookings || [])
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading bookings...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Bookings</h1>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">You don&apos;t have any bookings yet.</p>
            <div className="flex justify-center gap-4">
              <Link
                href="/cars"
                className="rounded-md bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Browse Cars
              </Link>
              <Link
                href="/carpool"
                className="rounded-md bg-gray-200 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
              >
                Find Carpools
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    {booking.car && (
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          🚗 Car Rental
                        </h3>
                        <p className="text-lg text-gray-700 mt-1">
                          {booking.car.make} {booking.car.model} ({booking.car.year})
                        </p>
                      </div>
                    )}
                    {booking.carpool && (
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          🚙 Carpool
                        </h3>
                        <p className="text-lg text-gray-700 mt-1">
                          {booking.carpool.from} → {booking.carpool.to}
                        </p>
                      </div>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                      booking.status
                    )}`}
                  >
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Start Date</p>
                    <p className="font-semibold">
                      {format(new Date(booking.startDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  {booking.endDate && (
                    <div>
                      <p className="text-gray-600">End Date</p>
                      <p className="font-semibold">
                        {format(new Date(booking.endDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-600">Total Price</p>
                    <p className="font-semibold text-indigo-600 text-lg">
                      ${booking.totalPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
