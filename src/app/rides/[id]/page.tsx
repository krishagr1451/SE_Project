'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { format } from 'date-fns'

interface Ride {
  id: string
  pickupLocation: string
  dropoffLocation: string
  fare: number
  distance?: number
  estimatedTime?: number
  status: string
  paymentMethod?: string
  createdAt: string
  updatedAt?: string
  passenger: {
    id: string
    name: string
    phone?: string
    email?: string
  }
  driver?: {
    id: string
    name: string
    phone?: string
    email?: string
    licenseNumber?: string
  }
}

export default function RideDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [ride, setRide] = useState<Ride | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const [rideId, setRideId] = useState<string | null>(null)

  useEffect(() => {
    params.then(p => setRideId(p.id))
  }, [params])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user && rideId) {
      fetchRide()
      // Poll for updates every 5 seconds
      const interval = setInterval(fetchRide, 5000)
      return () => clearInterval(interval)
    }
  }, [user, authLoading, rideId, router])

  const fetchRide = async () => {
    if (!rideId) return
    
    try {
      const auth = localStorage.getItem('auth')
      if (!auth) return

      const { token } = JSON.parse(auth)

      const response = await fetch(`/api/rides/${rideId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch ride')
      }

      const data = await response.json()
      setRide(data)
      setError('')
    } catch (error) {
      console.error('Error fetching ride:', error)
      setError('Failed to load ride details')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelRide = async () => {
    if (!ride || !rideId) return
    if (!confirm('Are you sure you want to cancel this ride?')) return

    setCanceling(true)
    try {
      const auth = localStorage.getItem('auth')
      if (!auth) return

      const { token } = JSON.parse(auth)

      // Use appropriate cancel endpoint based on user role
      const endpoint = user?.role === 'DRIVER' 
        ? `/api/rides/${rideId}/driver-cancel`
        : `/api/rides/${rideId}/cancel`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        alert('✅ Ride cancelled successfully')
        await fetchRide()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to cancel ride')
      }
    } catch (error) {
      console.error('Error cancelling ride:', error)
      setError(error instanceof Error ? error.message : 'Failed to cancel ride')
    } finally {
      setCanceling(false)
    }
  }

  const handleUpdateStatus = async (action: string) => {
    if (!rideId) return
    
    setActionLoading(true)
    try {
      const auth = localStorage.getItem('auth')
      if (!auth) return

      const { token } = JSON.parse(auth)

      const response = await fetch(`/api/rides/${rideId}`, {
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
        alert('🎉 Ride completed successfully! Payment has been processed.')
      }
    } catch (error) {
      console.error(`Error ${action}ing ride:`, error)
      setError(`Failed to ${action} ride`)
    } finally {
      setActionLoading(false)
    }
  }

  const canCancelRide = (status: string) => {
    return ['SEARCHING', 'ACCEPTED', 'PENDING'].includes(status)
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

  if (error && !ride) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md"
        >
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ride Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link 
            href="/my-rides" 
            className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
          >
            ← Back to My Rides
          </Link>
        </motion.div>
      </div>
    )
  }

  if (!ride) {
    return null
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link 
            href="/my-rides" 
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-4 font-medium transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to My Rides
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Ride Details</h1>
              <p className="text-gray-600">Booking ID: {ride.id.substring(0, 8)}...</p>
            </div>
            <div className={`px-6 py-3 rounded-xl font-bold text-lg shadow-lg ${getStatusColor(ride.status)}`}>
              {ride.status}
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg"
          >
            <div className="flex items-center">
              <span className="text-2xl mr-3">⚠️</span>
              <span className="font-medium">{error}</span>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Banner */}
            {ride.status === 'SEARCHING' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl shadow-lg p-6 text-white"
              >
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mr-4"></div>
                  <div>
                    <h3 className="text-xl font-bold">🔍 Finding Your Driver...</h3>
                    <p className="text-sm opacity-90 mt-1">This usually takes 1-2 minutes</p>
                  </div>
                </div>
              </motion.div>
            )}

            {ride.status === 'ACCEPTED' && ride.driver && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white"
              >
                <div className="flex items-center">
                  <div className="text-4xl mr-4">✅</div>
                  <div>
                    <h3 className="text-xl font-bold">Driver Assigned!</h3>
                    <p className="text-sm opacity-90 mt-1">{ride.driver.name} is on the way</p>
                  </div>
                </div>
              </motion.div>
            )}

            {ride.status === 'IN_PROGRESS' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white"
              >
                <div className="flex items-center">
                  <div className="text-4xl mr-4 animate-bounce">🚗</div>
                  <div>
                    <h3 className="text-xl font-bold">Ride in Progress</h3>
                    <p className="text-sm opacity-90 mt-1">Have a safe journey!</p>
                  </div>
                </div>
              </motion.div>
            )}

            {ride.status === 'COMPLETED' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white"
              >
                <div className="flex items-center">
                  <div className="text-4xl mr-4">🎉</div>
                  <div>
                    <h3 className="text-xl font-bold">Ride Completed!</h3>
                    <p className="text-sm opacity-90 mt-1">Thank you for riding with us</p>
                  </div>
                </div>
              </motion.div>
            )}

            {ride.status === 'CANCELLED' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white"
              >
                <div className="flex items-center">
                  <div className="text-4xl mr-4">❌</div>
                  <div>
                    <h3 className="text-xl font-bold">Ride Cancelled</h3>
                    <p className="text-sm opacity-90 mt-1">This ride has been cancelled</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Trip Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-lg p-8 border border-gray-100"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-3xl mr-3">📍</span>
                Trip Details
              </h2>
              
              <div className="space-y-6">
                {/* Pickup */}
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center text-white text-xl mr-4 shadow-lg">
                    🟢
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Pickup Location</p>
                    <p className="font-semibold text-gray-900 text-lg mt-1">{ride.pickupLocation}</p>
                  </div>
                </div>

                {/* Connection Line */}
                <div className="ml-6 border-l-4 border-dashed border-gray-300 h-12"></div>

                {/* Dropoff */}
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-red-400 to-rose-500 rounded-xl flex items-center justify-center text-white text-xl mr-4 shadow-lg">
                    🔴
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Dropoff Location</p>
                    <p className="font-semibold text-gray-900 text-lg mt-1">{ride.dropoffLocation}</p>
                  </div>
                </div>
              </div>

              {/* Trip Stats */}
              {(ride.distance || ride.estimatedTime) && (
                <div className="mt-8 pt-6 border-t border-gray-200 grid grid-cols-2 gap-4">
                  {ride.distance && (
                    <div className="bg-indigo-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-indigo-600 font-medium mb-1">Distance</p>
                      <p className="text-3xl font-bold text-indigo-900">{ride.distance}</p>
                      <p className="text-xs text-indigo-600 mt-1">kilometers</p>
                    </div>
                  )}
                  {ride.estimatedTime && (
                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-purple-600 font-medium mb-1">Est. Time</p>
                      <p className="text-3xl font-bold text-purple-900">{ride.estimatedTime}</p>
                      <p className="text-xs text-purple-600 mt-1">minutes</p>
                    </div>
                  )}
                </div>
              )}

              {/* Booking Time */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Booked on {format(new Date(ride.createdAt), 'MMM dd, yyyy • hh:mm a')}</span>
                </div>
              </div>
            </motion.div>

            {/* Passenger Details (for drivers) */}
            {user?.role === 'DRIVER' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-lg p-8 border border-gray-100"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="text-3xl mr-3">👤</span>
                  Passenger Details
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4">
                      {ride.passenger.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-bold text-gray-900 text-lg">{ride.passenger.name}</p>
                    </div>
                  </div>
                  {ride.passenger.phone && (
                    <div className="flex items-center p-4 bg-green-50 rounded-lg">
                      <span className="text-2xl mr-4">📞</span>
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <a href={`tel:${ride.passenger.phone}`} className="font-bold text-green-700 text-lg hover:underline">
                          {ride.passenger.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {ride.passenger.email && (
                    <div className="flex items-center p-4 bg-purple-50 rounded-lg">
                      <span className="text-2xl mr-4">✉️</span>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <a href={`mailto:${ride.passenger.email}`} className="font-bold text-purple-700 hover:underline">
                          {ride.passenger.email}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Driver Details (for passengers) */}
            {user?.role !== 'DRIVER' && ride.driver && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-lg p-8 border border-gray-100"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="text-3xl mr-3">🚗</span>
                  Driver Details
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center p-4 bg-indigo-50 rounded-lg">
                    <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4">
                      {ride.driver.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Driver Name</p>
                      <p className="font-bold text-gray-900 text-lg">{ride.driver.name}</p>
                    </div>
                  </div>
                  {ride.driver.phone && (
                    <div className="flex items-center p-4 bg-green-50 rounded-lg">
                      <span className="text-2xl mr-4">📞</span>
                      <div>
                        <p className="text-sm text-gray-600">Contact</p>
                        <a href={`tel:${ride.driver.phone}`} className="font-bold text-green-700 text-lg hover:underline">
                          {ride.driver.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {ride.driver.licenseNumber && (
                    <div className="flex items-center p-4 bg-yellow-50 rounded-lg">
                      <span className="text-2xl mr-4">🪪</span>
                      <div>
                        <p className="text-sm text-gray-600">License Number</p>
                        <p className="font-bold text-gray-900">{ride.driver.licenseNumber}</p>
                      </div>
                    </div>
                  )}
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
              className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-xl shadow-2xl p-8 text-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
              
              <div className="relative z-10">
                <div className="flex items-center mb-3">
                  <span className="text-3xl mr-3">💰</span>
                  <h3 className="text-xl font-bold">Total Fare</h3>
                </div>
                <div className="mb-4">
                  <p className="text-6xl font-black tracking-tight">₹{ride.fare}</p>
                </div>
                {ride.paymentMethod && (
                  <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span className="text-sm font-medium opacity-95">{ride.paymentMethod}</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Actions */}
            {ride.status !== 'COMPLETED' && ride.status !== 'CANCELLED' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="text-2xl mr-3">⚡</span>
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  {/* Driver Actions */}
                  {user?.role === 'DRIVER' && (
                    <>
                      {ride.status === 'ACCEPTED' && (
                        <button
                          onClick={() => handleUpdateStatus('arrive')}
                          disabled={actionLoading}
                          className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all font-bold text-lg"
                        >
                          {actionLoading ? (
                            <span className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                              Updating...
                            </span>
                          ) : (
                            '📍 Mark as Arrived'
                          )}
                        </button>
                      )}
                      {ride.status === 'ARRIVED' && (
                        <button
                          onClick={() => handleUpdateStatus('start')}
                          disabled={actionLoading}
                          className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all font-bold text-lg"
                        >
                          {actionLoading ? (
                            <span className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                              Starting...
                            </span>
                          ) : (
                            '🚗 Start Ride'
                          )}
                        </button>
                      )}
                      {ride.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleUpdateStatus('complete')}
                          disabled={actionLoading}
                          className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all font-bold text-lg"
                        >
                          {actionLoading ? (
                            <span className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                              Completing...
                            </span>
                          ) : (
                            '✅ Complete Ride'
                          )}
                        </button>
                      )}
                    </>
                  )}
                  
                  {/* Cancel Button (for both passenger and driver) */}
                  {canCancelRide(ride.status) && (
                    <button
                      onClick={handleCancelRide}
                      disabled={canceling}
                      className="w-full py-4 px-6 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all font-bold text-lg"
                    >
                      {canceling ? (
                        <span className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Canceling...
                        </span>
                      ) : (
                        '✕ Cancel Ride'
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Ride Completed or Cancelled Info */}
            {(ride.status === 'COMPLETED' || ride.status === 'CANCELLED') && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
              >
                <div className="text-center">
                  <div className="text-6xl mb-4">
                    {ride.status === 'COMPLETED' ? '🎉' : '❌'}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {ride.status === 'COMPLETED' ? 'Ride Completed!' : 'Ride Cancelled'}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {ride.status === 'COMPLETED' 
                      ? 'Thank you for choosing us!' 
                      : 'This ride has been cancelled'}
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
