'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface Ride {
  id: string
  pickupLocation: string
  dropoffLocation: string
  fare: number
  status: string
  createdAt: string
  passenger: {
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

export default function DriverDashboardPage() {
  const [rides, setRides] = useState<Ride[]>([])
  const [stats, setStats] = useState<Stats>({
    totalRides: 0,
    completedRides: 0,
    activeRides: 0,
    totalEarnings: 0,
    todayRides: 0,
    todayEarnings: 0
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'history'>('available')

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
  }, [activeTab])

  async function fetchDashboardData() {
    try {
      const auth = localStorage.getItem('auth')
      if (!auth) {
        window.location.href = '/login'
        return
      }

      const { token } = JSON.parse(auth)

      // Fetch rides based on tab
      let type = 'driverrides'
      if (activeTab === 'available') type = 'available'

      const response = await fetch(`/api/rides?type=${type}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch rides')

      const data = await response.json()
      const allRides = data.rides || []
      
      // Filter based on tab
      let filteredRides = allRides
      if (activeTab === 'active') {
        filteredRides = allRides.filter((r: Ride) => 
          ['ACCEPTED', 'ARRIVED', 'IN_PROGRESS'].includes(r.status)
        )
      } else if (activeTab === 'history') {
        filteredRides = allRides.filter((r: Ride) => 
          ['COMPLETED', 'CANCELLED'].includes(r.status)
        )
      }

      setRides(filteredRides)

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
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function acceptRide(rideId: string) {
    try {
      const auth = localStorage.getItem('auth')
      if (!auth) return

      const { token } = JSON.parse(auth)
      
      const response = await fetch(`/api/rides/${rideId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'accept' })
      })

      if (response.ok) {
        alert('Ride accepted! Passenger will be notified.')
        fetchDashboardData()
      }
    } catch (error) {
      console.error('Error accepting ride:', error)
      alert('Failed to accept ride')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🚗 Driver Dashboard</h1>
          <p className="text-gray-600">Manage your rides and earnings</p>
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
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'available'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            🔍 Available Rides
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'active'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            🚗 Active ({stats.activeRides})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            📊 History
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading rides...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && rides.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-white rounded-xl shadow-sm"
          >
            <div className="text-6xl mb-4">🚗</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No rides available</h3>
            <p className="text-gray-600">
              {activeTab === 'available' && 'Check back soon for ride requests'}
              {activeTab === 'active' && 'You have no active rides'}
              {activeTab === 'history' && 'No completed rides yet'}
            </p>
          </motion.div>
        )}

        {/* Rides List */}
        {!loading && rides.length > 0 && (
          <div className="grid gap-6">
            {rides.map((ride, index) => (
              <motion.div
                key={ride.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    {/* Route */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                        <div>
                          <p className="text-sm text-gray-500">Pickup</p>
                          <p className="font-semibold">{ride.pickupLocation}</p>
                        </div>
                      </div>
                      <div className="ml-1.5 border-l-2 border-dashed border-gray-300 h-6"></div>
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                        <div>
                          <p className="text-sm text-gray-500">Dropoff</p>
                          <p className="font-semibold">{ride.dropoffLocation}</p>
                        </div>
                      </div>
                    </div>

                    {/* Passenger Info */}
                    {ride.passenger && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-sm text-gray-600 mb-1">Passenger</p>
                        <p className="font-semibold">👤 {ride.passenger.name}</p>
                        <p className="text-sm text-gray-600">📞 {ride.passenger.phone}</p>
                      </div>
                    )}
                  </div>

                  <div className="text-right ml-4">
                    <div className="text-3xl font-bold text-purple-600 mb-2">₹{ride.fare}</div>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      ride.status === 'SEARCHING' ? 'bg-yellow-100 text-yellow-800' :
                      ride.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-800' :
                      ride.status === 'IN_PROGRESS' ? 'bg-green-100 text-green-800' :
                      ride.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {ride.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(ride.createdAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-4">
                  {ride.status === 'SEARCHING' && activeTab === 'available' && (
                    <button
                      onClick={() => acceptRide(ride.id)}
                      className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                    >
                      ✅ Accept Ride
                    </button>
                  )}
                  {['ACCEPTED', 'ARRIVED', 'IN_PROGRESS'].includes(ride.status) && (
                    <Link
                      href={`/rides/${ride.id}`}
                      className="flex-1 text-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                    >
                      🗺️ Track & Update
                    </Link>
                  )}
                  <Link
                    href={`/rides/${ride.id}`}
                    className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    View Details
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
