'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface Booking {
  id: string
  carpoolId: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  seatsBooked: number
  totalPrice: number
  createdAt: string
  carpool: {
    id: string
    from: string
    to: string
    departureTime: string
    pricePerSeat: number
    availableSeats: number
    driver: {
      name: string
      phone: string
    }
  }
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all')

  useEffect(() => {
    fetchBookings()
  }, [])

  async function fetchBookings() {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        window.location.href = '/login'
        return
      }

      const response = await fetch('/api/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch bookings')

      const data = await response.json()
      setBookings(data.bookings || [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  async function cancelBooking(bookingId: string) {
    if (!confirm('Are you sure you want to cancel this booking?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'CANCELLED' })
      })

      if (response.ok) {
        fetchBookings() // Refresh the list
        alert('Booking cancelled successfully')
      }
    } catch (error) {
      console.error('Error cancelling booking:', error)
      alert('Failed to cancel booking')
    }
  }

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'upcoming') {
      return ['PENDING', 'CONFIRMED'].includes(booking.status)
    } else if (filter === 'completed') {
      return ['COMPLETED', 'CANCELLED'].includes(booking.status)
    }
    return true
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      case 'COMPLETED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return '⏳'
      case 'CONFIRMED': return '✅'
      case 'CANCELLED': return '❌'
      case 'COMPLETED': return '🏁'
      default: return '📋'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📋 My Bookings</h1>
          <p className="text-gray-600">View and manage your carpool bookings</p>
        </motion.div>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-green-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            All ({bookings.length})
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'upcoming'
                ? 'bg-green-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Upcoming ({bookings.filter(b => ['PENDING', 'CONFIRMED'].includes(b.status)).length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'completed'
                ? 'bg-green-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Past ({bookings.filter(b => ['COMPLETED', 'CANCELLED'].includes(b.status)).length})
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your bookings...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredBookings.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-white rounded-xl shadow-sm"
          >
            <div className="text-6xl mb-4">🚙</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600 mb-6">Join a carpool to get started!</p>
            <Link
              href="/carpool"
              className="inline-flex items-center px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors"
            >
              🚗 Browse Carpools
            </Link>
          </motion.div>
        )}

        {/* Bookings List */}
        {!loading && filteredBookings.length > 0 && (
          <div className="grid gap-6">
            {filteredBookings.map((booking, index) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{getStatusIcon(booking.status)}</div>
                    <div>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                      <p className="text-sm text-gray-500 mt-1">
                        Booked on {new Date(booking.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">₹{booking.totalPrice}</div>
                    <div className="text-sm text-gray-500">{booking.seatsBooked} seat{booking.seatsBooked > 1 ? 's' : ''}</div>
                  </div>
                </div>

                {/* Carpool Details */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">From</p>
                        <p className="font-medium text-gray-900">{booking.carpool.from}</p>
                      </div>
                    </div>
                    <div className="ml-1.5 border-l-2 border-dashed border-gray-300 h-6"></div>
                    <div className="flex items-start gap-3">
                      <div className="mt-1 w-3 h-3 bg-red-500 rounded-full flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">To</p>
                        <p className="font-medium text-gray-900">{booking.carpool.to}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Departure</p>
                        <p className="font-medium text-gray-900">
                          {new Date(booking.carpool.departureTime).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Price per seat</p>
                        <p className="font-medium text-gray-900">₹{booking.carpool.pricePerSeat}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Driver Info */}
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600 mb-2">Driver Details</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">👤 {booking.carpool.driver.name}</p>
                      <p className="text-sm text-gray-600">📞 {booking.carpool.driver.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Link
                    href={`/carpool/${booking.carpoolId}`}
                    className="flex-1 text-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                  >
                    View Carpool
                  </Link>
                  {booking.status === 'PENDING' || booking.status === 'CONFIRMED' ? (
                    <button
                      onClick={() => cancelBooking(booking.id)}
                      className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                    >
                      ❌ Cancel
                    </button>
                  ) : null}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl p-6 text-white"
        >
          <h3 className="text-xl font-bold mb-4">Looking for more rides?</h3>
          <div className="flex gap-4">
            <Link
              href="/carpool"
              className="px-6 py-3 bg-white text-green-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
            >
              🚗 Browse Carpools
            </Link>
            <Link
              href="/rides/instant"
              className="px-6 py-3 bg-white text-teal-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
            >
              📍 Book Instant Ride
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
