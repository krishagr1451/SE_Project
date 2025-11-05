'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getAuthHeader } from '@/lib/storage'

interface Car {
  id: string
  make: string
  model: string
  year: number
  color: string
  pricePerDay: number
  hourlyRate?: number
  location: string
  description?: string
  imageUrl?: string
  owner: {
    name: string
    email: string
    phone?: string
  }
}

interface Review {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  user: { name: string }
}

export default function CarDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [car, setCar] = useState<Car | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [booking, setBooking] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchCar(params.id as string)
      fetchReviews(params.id as string)
    }
  }, [params.id])

  const fetchCar = async (id: string) => {
    try {
      const response = await fetch(`/api/cars/${id}`)
      const data = await response.json()
      setCar(data)
    } catch (error) {
      console.error('Failed to fetch car:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async (id: string) => {
    try {
      const response = await fetch(`/api/reviews?carId=${id}`)
      const data = await response.json()
      setReviews(data.items || [])
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
    }
  }

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!car || !startDate || !endDate) return

    setBooking(true)
    try {
      const authHeader = getAuthHeader()
      if (!authHeader) {
        alert('Please log in to make a booking.')
        router.push('/login')
        return
      }

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          carId: car.id,
          startDate,
          endDate,
        }),
      })

      if (response.ok) {
        alert('Booking successful!')
        router.push('/my-bookings')
      } else {
        const data = await response.json()
        alert(data.error || 'Booking failed. Please try again.')
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

  if (!car) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Car not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <img
            src={car.imageUrl || '/cars/placeholder.svg'}
            alt={`${car.make} ${car.model}`}
            className="w-full h-96 object-cover"
          />
          
          <div className="p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {car.make} {car.model} ({car.year})
            </h1>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">Color</p>
                <p className="text-lg font-semibold">{car.color}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="text-lg font-semibold">{car.location}</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-3xl font-bold text-indigo-600">
                {car.hourlyRate ? (
                  <>
                    ${car.hourlyRate} <span className="text-lg text-gray-600">per hour</span>
                    {car.pricePerDay > 0 && (
                      <span className="text-xl text-gray-500 ml-4">
                        or ${car.pricePerDay}/day
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    ${car.pricePerDay} <span className="text-lg text-gray-600">per day</span>
                  </>
                )}
              </p>
            </div>

            {avgRating && (
              <div className="mb-6 flex items-center space-x-2">
                <span className="text-2xl font-bold text-yellow-500">★ {avgRating}</span>
                <span className="text-gray-600">({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
              </div>
            )}

            {car.description && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Description</h2>
                <p className="text-gray-700">{car.description}</p>
              </div>
            )}

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Owner Information</h2>
              <p className="text-gray-700">Name: {car.owner.name}</p>
              <p className="text-gray-700">Email: {car.owner.email}</p>
              {car.owner.phone && (
                <p className="text-gray-700">Phone: {car.owner.phone}</p>
              )}
            </div>

            <form onSubmit={handleBooking} className="border-t pt-6">
              <h2 className="text-2xl font-semibold mb-4">Book This Car</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    min={startDate || new Date().toISOString().split('T')[0]}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={booking || !startDate || !endDate}
                className="w-full rounded-md bg-indigo-600 px-4 py-3 text-lg font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {booking ? 'Booking...' : 'Book Now'}
              </button>
            </form>

            {reviews.length > 0 && (
              <div className="border-t pt-6 mt-6">
                <h2 className="text-2xl font-semibold mb-4">Reviews</h2>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="p-4 bg-gray-50 rounded">
                      <div className="flex items-center mb-2">
                        <span className="text-yellow-500 font-bold">★ {review.rating}</span>
                        <span className="ml-3 text-gray-700 font-medium">{review.user.name}</span>
                        <span className="ml-auto text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {review.comment && <p className="text-gray-700">{review.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
