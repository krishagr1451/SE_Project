'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { format } from 'date-fns'

interface Ride {
  id: string
  pickupLocation: string
  dropoffLocation: string
  fare: number
  status: string
  createdAt: string
  passenger?: {
    name: string
    phone: string
  }
}

interface Carpool {
  id: string
  from: string
  to: string
  departureTime: string
  pricePerSeat: number
  availableSeats: number
  totalSeats?: number
  bookings?: Array<{
    id: string
    user: {
      name: string
    }
  }>
}

interface CarRental {
  id: string
  startDate: string
  endDate: string
  totalPrice: number
  status: string
  car: {
    make: string
    model: string
    year: number
    licensePlate: string
  }
  user: {
    name: string
    phone: string
  }
}

interface Stats {
  totalRides: number
  completedRides: number
  activeRides: number
  totalEarnings: number
  todayRides: number
  todayEarnings: number
}

type TabType = 'requests' | 'rides' | 'carpools' | 'rentals'

export default function DriverDashboardPage() {
  const [rideRequests, setRideRequests] = useState<Ride[]>([])
  const [rides, setRides] = useState<Ride[]>([])
  const [carpools, setCarpools] = useState<Carpool[]>([])
  const [carRentals, setCarRentals] = useState<CarRental[]>([])
  const [stats, setStats] = useState<Stats>({
    totalRides: 0,
    completedRides: 0,
    activeRides: 0,
    totalEarnings: 0,
    todayRides: 0,
    todayEarnings: 0
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('requests')
  const [canceling, setCanceling] = useState<string | null>(null)
  const [accepting, setAccepting] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<string | null>(null)

  useEffect(() => {
    const authData = localStorage.getItem('auth')
    if (authData) {
      const user = JSON.parse(authData).user
      if (user.role !== 'DRIVER') {
        window.location.href = '/'
        return
      }
    }
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      const auth = localStorage.getItem('auth')
      if (!auth) {
        window.location.href = '/login'
        return
      }

      const { token } = JSON.parse(auth)

      // Fetch incoming ride requests (NEW)
      const requestsResponse = await fetch('/api/rides?type=available', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json()
        setRideRequests(requestsData.rides || [])
      }

      // Fetch instant rides given by driver
      const ridesResponse = await fetch('/api/rides?type=driverrides', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (ridesResponse.ok) {
        const data = await ridesResponse.json()
        const allRides = data.rides || []
        setRides(allRides)

        // Calculate stats
        const completed = allRides.filter((r: Ride) => r.status === 'COMPLETED')
        const active = allRides.filter((r: Ride) => 
          ['ACCEPTED', 'ARRIVED', 'IN_PROGRESS'].includes(r.status)
        )
        const today = new Date().toDateString()
        const todayRides = completed.filter((r: Ride) => 
          new Date(r.createdAt).toDateString() === today
        )

        setStats({
          totalRides: allRides.length,
          completedRides: completed.length,
          activeRides: active.length,
          totalEarnings: completed.reduce((sum: number, r: Ride) => sum + r.fare, 0),
          todayRides: todayRides.length,
          todayEarnings: todayRides.reduce((sum: number, r: Ride) => sum + r.fare, 0)
        })
      }

      // Fetch carpools hosted by driver
      const carpoolsResponse = await fetch('/api/carpool?type=mycarpools', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (carpoolsResponse.ok) {
        const carpoolsData = await carpoolsResponse.json()
        setCarpools(carpoolsData || [])
      }

      // Fetch car rentals (cars rented out by this driver/owner)
      // Assuming there's an API endpoint for this
      const rentalsResponse = await fetch('/api/bookings?type=owner', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (rentalsResponse.ok) {
        const rentalsData = await rentalsResponse.json()
        setCarRentals(rentalsData || [])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function acceptRide(rideId: string) {
    setAccepting(rideId)
    try {
      const auth = localStorage.getItem('auth')
      if (!auth) return

      const { token } = JSON.parse(auth)

      const response = await fetch(`/api/rides/${rideId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        alert('✅ Ride accepted! Passenger will be notified.')
        fetchDashboardData() // Refresh data
      } else {
        const error = await response.json()
        alert(`Failed to accept ride: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error accepting ride:', error)
      alert('Failed to accept ride. Please try again.')
    } finally {
      setAccepting(null)
    }
  }

  async function rejectRide(rideId: string) {
    setRejecting(rideId)
    try {
      const auth = localStorage.getItem('auth')
      if (!auth) return

      const { token } = JSON.parse(auth)

      const response = await fetch(`/api/rides/${rideId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        alert('Ride rejected')
        fetchDashboardData() // Refresh data
      } else {
        const error = await response.json()
        alert(`Failed to reject ride: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error rejecting ride:', error)
      alert('Failed to reject ride. Please try again.')
    } finally {
      setRejecting(null)
    }
  }

  async function cancelRide(rideId: string) {
    if (!confirm('Are you sure you want to cancel this ride? The passenger will be notified.')) {
      return
    }

    setCanceling(rideId)
    try {
      const auth = localStorage.getItem('auth')
      if (!auth) return

      const { token } = JSON.parse(auth)

      const response = await fetch(`/api/rides/${rideId}/driver-cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        alert('✅ Ride cancelled successfully')
        fetchDashboardData() // Refresh data
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to cancel ride')
      }
    } catch (error) {
      console.error('Error canceling ride:', error)
      alert('An error occurred while canceling the ride')
    } finally {
      setCanceling(null)
    }
  }

  async function cancelCarpool(carpoolId: string) {
    if (!confirm('Are you sure you want to cancel this carpool? All passengers will be notified.')) {
      return
    }

    setCanceling(carpoolId)
    try {
      const auth = localStorage.getItem('auth')
      if (!auth) return

      const { token } = JSON.parse(auth)

      const response = await fetch(`/api/carpool/${carpoolId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        alert('✅ Carpool cancelled successfully')
        fetchDashboardData() // Refresh data
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to cancel carpool')
      }
    } catch (error) {
      console.error('Error canceling carpool:', error)
      alert('An error occurred while canceling the carpool')
    } finally {
      setCanceling(null)
    }
  }

  async function cancelRental(rentalId: string) {
    if (!confirm('Are you sure you want to cancel this car rental? The renter will be notified.')) {
      return
    }

    setCanceling(rentalId)
    try {
      const auth = localStorage.getItem('auth')
      if (!auth) return

      const { token } = JSON.parse(auth)

      const response = await fetch(`/api/bookings/${rentalId}/driver-cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        alert('✅ Car rental cancelled successfully')
        fetchDashboardData() // Refresh data
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to cancel rental')
      }
    } catch (error) {
      console.error('Error canceling rental:', error)
      alert('An error occurred while canceling the rental')
    } finally {
      setCanceling(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SEARCHING': return 'bg-yellow-100 text-yellow-800'
      case 'ACCEPTED': return 'bg-blue-100 text-blue-800'
      case 'ARRIVED': return 'bg-green-100 text-green-800'
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800'
      case 'COMPLETED': return 'bg-gray-100 text-gray-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const canCancel = (status: string) => {
    return ['ACCEPTED', 'PENDING', 'ACTIVE'].includes(status)
  }

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: 'requests', label: '🔔 Ride Requests', count: rideRequests.length },
    { id: 'rides', label: 'Rides Given', count: rides.length },
    { id: 'carpools', label: 'Carpools Hosted', count: carpools.length },
    { id: 'rentals', label: 'Cars Rented Out', count: carRentals.length },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">🚗 Driver Dashboard</h1>
              <p className="text-gray-600">Manage your rides, carpools, and rentals</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/carpool/create"
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                Create Carpool
              </Link>
              <Link
                href="/cars/add"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                Add Car
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8"
        >
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-2xl mb-1">📊</div>
            <div className="text-2xl font-bold text-blue-600">{stats.totalRides}</div>
            <div className="text-xs text-gray-600">Total Rides</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-2xl mb-1">✅</div>
            <div className="text-2xl font-bold text-green-600">{stats.completedRides}</div>
            <div className="text-xs text-gray-600">Completed</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-2xl mb-1">🚕</div>
            <div className="text-2xl font-bold text-orange-600">{stats.activeRides}</div>
            <div className="text-xs text-gray-600">Active</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-2xl mb-1">💰</div>
            <div className="text-2xl font-bold text-purple-600">₹{stats.totalEarnings.toLocaleString()}</div>
            <div className="text-xs text-gray-600">Total Earnings</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-2xl mb-1">📅</div>
            <div className="text-2xl font-bold text-indigo-600">{stats.todayRides}</div>
            <div className="text-xs text-gray-600">Today&apos;s Rides</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-2xl mb-1">💵</div>
            <div className="text-2xl font-bold text-pink-600">₹{stats.todayEarnings}</div>
            <div className="text-xs text-gray-600">Today&apos;s Earnings</div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="mb-6 bg-white rounded-lg shadow-md p-1">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  activeTab === tab.id
                    ? 'bg-white/20'
                    : 'bg-gray-200'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your dashboard...</p>
          </div>
        )}

        {/* Tab Content */}
        {!loading && (
          <>
            {/* Ride Requests Tab */}
            {activeTab === 'requests' && (
              <div className="grid gap-6">
                {rideRequests.length === 0 ? (
                  <EmptyState
                    icon="🔍"
                    title="No ride requests"
                    description="When passengers book rides, they'll appear here for you to accept"
                    actionLabel="Refresh Dashboard"
                    actionHref="/driver-dashboard"
                  />
                ) : (
                  rideRequests.map((ride, index) => (
                    <motion.div
                      key={ride.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 border-yellow-500">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 animate-pulse">
                                🔔 NEW REQUEST
                              </span>
                              <span className="ml-3 text-sm text-gray-500">
                                {format(new Date(ride.createdAt), 'HH:mm')}
                              </span>
                            </div>

                            <div className="space-y-2 mt-3">
                              <div className="flex items-start">
                                <span className="text-green-600 mr-2">📍</span>
                                <div>
                                  <p className="text-xs text-gray-500">Pickup</p>
                                  <p className="font-medium text-gray-900">{ride.pickupLocation}</p>
                                </div>
                              </div>
                              <div className="flex items-start">
                                <span className="text-red-600 mr-2">📍</span>
                                <div>
                                  <p className="text-xs text-gray-500">Dropoff</p>
                                  <p className="font-medium text-gray-900">{ride.dropoffLocation}</p>
                                </div>
                              </div>
                            </div>

                            {ride.passenger && (
                              <div className="mt-3 bg-white rounded-lg p-3 border border-gray-200">
                                <p className="text-xs text-gray-500 mb-1">Passenger</p>
                                <p className="font-semibold text-sm">👤 {ride.passenger.name}</p>
                                {ride.passenger.phone && (
                                  <p className="text-sm text-gray-600">📞 {ride.passenger.phone}</p>
                                )}
                              </div>
                            )}

                            <div className="mt-4 flex gap-3">
                              <button
                                onClick={() => acceptRide(ride.id)}
                                disabled={accepting === ride.id || rejecting === ride.id}
                                className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-lg rounded-xl hover:shadow-xl hover:scale-105 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all shadow-lg"
                              >
                                {accepting === ride.id ? (
                                  <span className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Accepting...
                                  </span>
                                ) : (
                                  '✓ Accept Ride'
                                )}
                              </button>
                              <button
                                onClick={() => rejectRide(ride.id)}
                                disabled={accepting === ride.id || rejecting === ride.id}
                                className="px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold text-lg rounded-xl hover:shadow-xl hover:scale-105 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all shadow-lg"
                              >
                                {rejecting === ride.id ? (
                                  <span className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Rejecting...
                                  </span>
                                ) : (
                                  '✗ Reject'
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="text-right ml-4">
                            <div className="text-3xl font-bold text-orange-600">₹{ride.fare}</div>
                            <div className="text-xs text-gray-500 mt-1">Potential Earnings</div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {/* Rides Tab */}
            {activeTab === 'rides' && (
              <div className="grid gap-6">
                {rides.length === 0 ? (
                  <EmptyState
                    icon="🚗"
                    title="No rides given yet"
                    description="Start accepting ride requests to see them here"
                    actionLabel="View Available Rides"
                    actionHref="/dashboard"
                  />
                ) : (
                  rides.map((ride, index) => (
                    <motion.div
                      key={ride.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border-l-4 border-purple-500">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ride.status)}`}>
                                {ride.status}
                              </span>
                              <span className="ml-3 text-sm text-gray-500">
                                {format(new Date(ride.createdAt), 'MMM dd, yyyy HH:mm')}
                              </span>
                            </div>

                            <div className="space-y-2 mt-3">
                              <div className="flex items-start">
                                <span className="text-green-600 mr-2">📍</span>
                                <div>
                                  <p className="text-xs text-gray-500">Pickup</p>
                                  <p className="font-medium text-gray-900">{ride.pickupLocation}</p>
                                </div>
                              </div>
                              <div className="flex items-start">
                                <span className="text-red-600 mr-2">📍</span>
                                <div>
                                  <p className="text-xs text-gray-500">Dropoff</p>
                                  <p className="font-medium text-gray-900">{ride.dropoffLocation}</p>
                                </div>
                              </div>
                            </div>

                            {ride.passenger && (
                              <div className="mt-3 bg-blue-50 rounded-lg p-3">
                                <p className="text-xs text-gray-500 mb-1">Passenger</p>
                                <p className="font-semibold text-sm">👤 {ride.passenger.name}</p>
                                <p className="text-sm text-gray-600">📞 {ride.passenger.phone}</p>
                              </div>
                            )}
                          </div>

                          <div className="text-right ml-4">
                            <div className="text-3xl font-bold text-purple-600">₹{ride.fare}</div>
                            <div className="text-xs text-gray-500 mt-1">Earnings</div>
                          </div>
                        </div>

                        {canCancel(ride.status) && (
                          <div className="pt-4 border-t border-gray-200 mt-4">
                            <button
                              onClick={() => cancelRide(ride.id)}
                              disabled={canceling === ride.id}
                              className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-xl hover:shadow-xl hover:scale-105 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all shadow-lg"
                            >
                              {canceling === ride.id ? (
                                <span className="flex items-center justify-center gap-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  Canceling...
                                </span>
                              ) : (
                                '✕ Cancel This Ride'
                              )}
                            </button>
                          </div>
                        )}

                        {ride.status === 'CANCELLED' && (
                          <div className="pt-4 border-t border-gray-100 flex justify-end">
                            <span className="text-sm text-red-600 font-medium">
                              Cancelled
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {/* Carpools Tab */}
            {activeTab === 'carpools' && (
              <div className="grid gap-6">
                {carpools.length === 0 ? (
                  <EmptyState
                    icon="🚙"
                    title="No carpools hosted yet"
                    description="Create a carpool and start sharing rides"
                    actionLabel="Create Carpool"
                    actionHref="/carpool/create"
                  />
                ) : (
                  carpools.map((carpool, index) => (
                    <motion.div
                      key={carpool.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border-l-4 border-green-500">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                🚗 Carpool
                              </span>
                            </div>

                            <div className="space-y-2 mt-3">
                              <div className="flex items-start">
                                <span className="text-green-600 mr-2">📍</span>
                                <div>
                                  <p className="text-xs text-gray-500">From</p>
                                  <p className="font-medium text-gray-900">{carpool.from}</p>
                                </div>
                              </div>
                              <div className="flex items-start">
                                <span className="text-red-600 mr-2">📍</span>
                                <div>
                                  <p className="text-xs text-gray-500">To</p>
                                  <p className="font-medium text-gray-900">{carpool.to}</p>
                                </div>
                              </div>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-3">
                              <div className="bg-white rounded-lg p-2">
                                <p className="text-xs text-gray-500">Departure</p>
                                <p className="font-medium text-sm">
                                  {format(new Date(carpool.departureTime), 'MMM dd, HH:mm')}
                                </p>
                              </div>
                              <div className="bg-white rounded-lg p-2">
                                <p className="text-xs text-gray-500">Seats</p>
                                <p className="font-medium text-sm">
                                  {carpool.availableSeats} / {carpool.totalSeats} available
                                </p>
                              </div>
                            </div>

                            {carpool.bookings && carpool.bookings.length > 0 && (
                              <div className="mt-3 bg-white rounded-lg p-3">
                                <p className="text-xs text-gray-500 mb-1">Passengers ({carpool.bookings.length})</p>
                                <div className="flex flex-wrap gap-2">
                                  {carpool.bookings.map((booking) => (
                                    <span key={booking.id} className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                      👤 {booking.user.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="text-right ml-4">
                            <div className="text-3xl font-bold text-green-600">₹{carpool.pricePerSeat}</div>
                            <div className="text-xs text-gray-500 mt-1">Per Seat</div>
                          </div>
                        </div>

                        {/* Show cancel button if departure is in the future */}
                        {new Date(carpool.departureTime) > new Date() && (
                          <div className="pt-4 border-t border-green-200 mt-4">
                            <button
                              onClick={() => cancelCarpool(carpool.id)}
                              disabled={canceling === carpool.id}
                              className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-xl hover:shadow-xl hover:scale-105 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all shadow-lg"
                            >
                              {canceling === carpool.id ? (
                                <span className="flex items-center justify-center gap-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  Canceling...
                                </span>
                              ) : (
                                '✕ Cancel This Carpool'
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {/* Rentals Tab */}
            {activeTab === 'rentals' && (
              <div className="grid gap-6">
                {carRentals.length === 0 ? (
                  <EmptyState
                    icon="🚘"
                    title="No cars rented out yet"
                    description="List your car for rental and start earning"
                    actionLabel="Add Your Car"
                    actionHref="/cars/add"
                  />
                ) : (
                  carRentals.map((rental, index) => (
                    <motion.div
                      key={rental.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border-l-4 border-blue-500">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                🚘 Car Rental
                              </span>
                              <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(rental.status)}`}>
                                {rental.status}
                              </span>
                            </div>

                            <div className="mt-3">
                              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                {rental.car.make} {rental.car.model}
                                <span className="text-sm text-gray-500">({rental.car.year})</span>
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                License: <span className="font-medium">{rental.car.licensePlate}</span>
                              </p>
                            </div>

                            <div className="mt-3 bg-white rounded-lg p-3">
                              <p className="text-xs text-gray-500 mb-1">Renter</p>
                              <p className="font-semibold text-sm">👤 {rental.user.name}</p>
                              <p className="text-sm text-gray-600">📞 {rental.user.phone}</p>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-3">
                              <div className="bg-white rounded-lg p-2">
                                <p className="text-xs text-gray-500">Start Date</p>
                                <p className="font-medium text-sm">
                                  {format(new Date(rental.startDate), 'MMM dd, yyyy')}
                                </p>
                              </div>
                              <div className="bg-white rounded-lg p-2">
                                <p className="text-xs text-gray-500">End Date</p>
                                <p className="font-medium text-sm">
                                  {format(new Date(rental.endDate), 'MMM dd, yyyy')}
                                </p>
                              </div>
                            </div>

                            {/* Cancel Button for Active/Pending Rentals */}
                            {['PENDING', 'ACTIVE'].includes(rental.status) && (
                              <div className="mt-4">
                                <button
                                  onClick={() => cancelRental(rental.id)}
                                  disabled={canceling === rental.id}
                                  className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all font-bold text-sm"
                                >
                                  {canceling === rental.id ? (
                                    <span className="flex items-center justify-center">
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                      Canceling...
                                    </span>
                                  ) : (
                                    '✕ Cancel This Rental'
                                  )}
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="text-right ml-4">
                            <div className="text-3xl font-bold text-blue-600">₹{rental.totalPrice}</div>
                            <div className="text-xs text-gray-500 mt-1">Total Earnings</div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Empty State Component
function EmptyState({ 
  icon, 
  title, 
  description, 
  actionLabel, 
  actionHref 
}: { 
  icon: string
  title: string
  description: string
  actionLabel: string
  actionHref: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center py-16 bg-white rounded-xl shadow-sm"
    >
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6">{description}</p>
      <Link
        href={actionHref}
        className="inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
      >
        {actionLabel}
      </Link>
    </motion.div>
  )
}
