'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface Ride {
  id: string
  pickupLocation: string
  dropoffLocation: string
  fare: number
  distance: number
  estimatedTime: number
  status: string
  paymentMethod: string
  createdAt: string
  passenger: {
    name: string
    phone: string
  }
  driver?: {
    name: string
    phone: string
    licenseNumber: string
  }
}

export default function RideDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [ride, setRide] = useState<Ride | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      fetchRide()
      // Poll for updates every 5 seconds
      const interval = setInterval(fetchRide, 5000)
      return () => clearInterval(interval)
    }
  }, [user, authLoading])

  const fetchRide = async () => {
    try {
      const auth = localStorage.getItem('auth')
      if (!auth) return

      const { token } = JSON.parse(auth)

      const response = await fetch(`/api/rides/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch ride')
      }

      const data = await response.json()
      setRide(data)
    } catch (error) {
      console.error('Error fetching ride:', error)
      setError('Failed to load ride details')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelRide = async () => {
    if (!confirm('Are you sure you want to cancel this ride?')) return

    setActionLoading(true)
    try {
      const auth = localStorage.getItem('auth')
      if (!auth) return

      const { token } = JSON.parse(auth)

      const response = await fetch(`/api/rides/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'cancel' }),
      })

      if (!response.ok) {
        throw new Error('Failed to cancel ride')
      }

      await fetchRide()
    } catch (error) {
      console.error('Error cancelling ride:', error)
      setError('Failed to cancel ride')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateStatus = async (action: string) => {
    setActionLoading(true)
    try {
      const auth = localStorage.getItem('auth')
      if (!auth) return

      const { token } = JSON.parse(auth)

      const response = await fetch(`/api/rides/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${action} ride`)
      }

      await fetchRide()
      
      if (action === 'complete') {
        alert('Ride completed successfully! Payment has been processed.')
      }
    } catch (error) {
      console.error(`Error ${action}ing ride:`, error)
      setError(`Failed to ${action} ride`)
    } finally {
      setActionLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!ride) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Ride not found</p>
          <Link href="/rides/book" className="mt-4 text-indigo-600 hover:text-indigo-700">
            Book a new ride
          </Link>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SEARCHING': return 'bg-yellow-100 text-yellow-800'
      case 'ACCEPTED': return 'bg-blue-100 text-blue-800'
      case 'ARRIVED': return 'bg-green-100 text-green-800'
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800'
      case 'COMPLETED': return 'bg-gray-100 text-gray-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SEARCHING': return 'Searching for a driver...'
      case 'ACCEPTED': return 'Driver accepted your ride'
      case 'ARRIVED': return 'Driver has arrived'
      case 'IN_PROGRESS': return 'Ride in progress'
      case 'COMPLETED': return 'Ride completed'
      case 'CANCELLED': return 'Ride cancelled'
      default: return status
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/my-rides" className="text-indigo-600 hover:text-indigo-700 mb-4 inline-block">
            ← Back to My Rides
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Ride Details</h1>
        </motion.div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Status</h2>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(ride.status)}`}>
                  {getStatusText(ride.status)}
                </span>
              </div>

              {ride.status === 'SEARCHING' && (
                <div className="text-center py-8">
                  <div className="inline-block animate-pulse">
                      <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white text-2xl mb-4 mx-auto">
                        <svg className="w-8 h-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M8 4a4 4 0 104 4 4 4 0 00-4-4zm-6 8a6 6 0 1110.89 3.476l3.817 3.816a1 1 0 11-1.414 1.415l-3.816-3.818A6 6 0 012 12z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  <p className="text-gray-600">Looking for nearby drivers...</p>
                  <p className="text-sm text-gray-500 mt-2">This usually takes 1-2 minutes</p>
                </div>
              )}
            </motion.div>

            {/* Trip Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <h2 className="text-xl font-semibold mb-4">Trip Details</h2>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-3">
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M10 2a6 6 0 00-6 6c0 4 6 10 6 10s6-6 6-10a6 6 0 00-6-6z"/></svg>
                    </div>
                  <div>
                    <p className="text-sm text-gray-500">Pickup</p>
                    <p className="font-medium">{ride.pickupLocation}</p>
                  </div>
                </div>

                <div className="ml-4 border-l-2 border-gray-200 h-8"></div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 mr-3">
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M5 3l10 10-2 2L3 5V3h2z"/></svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Dropoff</p>
                    <p className="font-medium">{ride.dropoffLocation}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Distance</p>
                  <p className="text-lg font-semibold">{ride.distance} km</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estimated Time</p>
                  <p className="text-lg font-semibold">{ride.estimatedTime} min</p>
                </div>
              </div>
            </motion.div>

            {/* Driver Details */}
            {ride.driver && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <h2 className="text-xl font-semibold mb-4">Driver Details</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{ride.driver.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{ride.driver.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">License Number</p>
                    <p className="font-medium">{ride.driver.licenseNumber || 'N/A'}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Fare Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg shadow-md p-6 text-white"
            >
              <h3 className="text-lg font-semibold mb-2">Total Fare</h3>
              <p className="text-4xl font-bold">₹{ride.fare}</p>
              <p className="text-sm mt-2 opacity-90">Payment: {ride.paymentMethod}</p>
            </motion.div>

            {/* Actions */}
            {ride.status !== 'COMPLETED' && ride.status !== 'CANCELLED' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <h3 className="text-lg font-semibold mb-4">Actions</h3>
                <div className="space-y-3">
                  {/* Driver Actions */}
                  {user?.role === 'DRIVER' && (
                    <>
                      {ride.status === 'ACCEPTED' && (
                        <button
                          onClick={() => handleUpdateStatus('arrive')}
                          disabled={actionLoading}
                          className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-semibold"
                        >
                          {actionLoading ? 'Updating...' : '📍 Mark as Arrived'}
                        </button>
                      )}
                      {ride.status === 'ARRIVED' && (
                        <button
                          onClick={() => handleUpdateStatus('start')}
                          disabled={actionLoading}
                          className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-semibold"
                        >
                          {actionLoading ? 'Starting...' : '🚗 Start Ride'}
                        </button>
                      )}
                      {ride.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleUpdateStatus('complete')}
                          disabled={actionLoading}
                          className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors font-semibold"
                        >
                          {actionLoading ? 'Completing...' : '✅ Complete Ride'}
                        </button>
                      )}
                    </>
                  )}
                  
                  {/* Cancel Button (for both passenger and driver) */}
                  {ride.status !== 'IN_PROGRESS' && (
                    <button
                      onClick={handleCancelRide}
                      disabled={actionLoading}
                      className="w-full py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-semibold"
                    >
                      {actionLoading ? 'Cancelling...' : '❌ Cancel Ride'}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
