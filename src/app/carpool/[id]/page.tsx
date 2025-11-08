'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
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
    phone?: string
  }
}

export default function CarpoolDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [carpool, setCarpool] = useState<Carpool | null>(null)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [seats, setSeats] = useState(1)

  useEffect(() => {
    if (params.id) {
      fetchCarpool(params.id as string)
    }
  }, [params.id])

  const fetchCarpool = async (id: string) => {
    try {
      const response = await fetch(`/api/carpool/${id}`)
      const data = await response.json()
      setCarpool(data)
    } catch (error) {
      console.error('Failed to fetch carpool:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!carpool || !user) {
      alert('Please login to book a carpool')
      router.push('/login')
      return
    }

    setBooking(true)
    try {
      // Get auth token from localStorage
      const authData = localStorage.getItem('auth')
      if (!authData) {
        alert('Please login to continue')
        router.push('/login')
        return
      }

      const { token } = JSON.parse(authData)

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          carpoolId: carpool.id,
          startDate: carpool.departureTime,
          // Note: totalPrice is calculated on the server based on pricePerSeat
        }),
      })

      if (response.ok) {
        alert('Booking successful!')
        router.push('/bookings')
      } else {
        const error = await response.json()
        console.error('Booking failed:', error)
        alert(error.error || 'Booking failed. Please try again.')
      }
    } catch (error) {
      console.error('Booking error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setBooking(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!carpool) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carpool not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Carpool Details</h1>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">From</p>
                <p className="text-2xl font-semibold text-gray-900">{carpool.from}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">To</p>
                <p className="text-2xl font-semibold text-gray-900">{carpool.to}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Departure Time</p>
              <p className="text-xl font-semibold text-gray-900">
                {format(new Date(carpool.departureTime), 'MMMM dd, yyyy • h:mm a')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Available Seats</p>
                <p className="text-2xl font-bold text-indigo-600">{carpool.availableSeats}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Price per Seat</p>
                <p className="text-2xl font-bold text-gray-900">${carpool.pricePerSeat}</p>
              </div>
            </div>

            {carpool.description && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Description</p>
                <p className="text-gray-700">{carpool.description}</p>
              </div>
            )}

            <div className="p-4 bg-gray-50 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Driver Information</h2>
              <p className="text-gray-700">Name: {carpool.driver.name}</p>
              <p className="text-gray-700">Email: {carpool.driver.email}</p>
              {carpool.driver.phone && (
                <p className="text-gray-700">Phone: {carpool.driver.phone}</p>
              )}
            </div>

            <form onSubmit={handleBooking} className="border-t pt-6">
              <h2 className="text-xl font-semibold mb-4">Book Seats</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Seats
                </label>
                <select
                  value={seats}
                  onChange={(e) => setSeats(parseInt(e.target.value))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                >
                  {Array.from({ length: carpool.availableSeats }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>
                      {num} seat{num > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total Price:</span>
                  <span className="text-2xl font-bold text-indigo-600">
                    ${(seats * carpool.pricePerSeat).toFixed(2)}
                  </span>
                </div>
              </div>
              {!user ? (
                <div className="space-y-3">
                  <p className="text-center text-amber-600 font-medium">
                    Please login to book this carpool
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push('/login')}
                    className="w-full rounded-md bg-green-600 px-4 py-3 text-lg font-semibold text-white shadow-sm hover:bg-green-500"
                  >
                    Login to Book
                  </button>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={booking || carpool.availableSeats === 0}
                  className="w-full rounded-md bg-indigo-600 px-4 py-3 text-lg font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {booking ? 'Booking...' : carpool.availableSeats === 0 ? 'No Seats Available' : 'Book Now'}
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
