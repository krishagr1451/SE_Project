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
  status: string
  createdAt: string
  driver?: {
    name: string
  }
}

export default function MyRidesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      fetchRides()
    }
  }, [user, authLoading, router])

  const fetchRides = async () => {
    try {
      const auth = localStorage.getItem('auth')
      if (!auth) return

      const { token } = JSON.parse(auth)

      const response = await fetch('http://localhost:4000/api/rides?type=myrides', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch rides')
      }

      const data = await response.json()
      setRides(data.rides || [])
    } catch (error) {
      console.error('Error fetching rides:', error)
      setRides([])
    } finally {
      setLoading(false)
    }
  }

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Rides</h1>
              <p className="mt-2 text-gray-600">View all your ride history</p>
            </div>
            <Link
              href="/rides/book"
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
            >
              Book New Ride
            </Link>
          </div>
        </motion.div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading rides...</p>
          </div>
        ) : rides.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-white rounded-lg shadow-md"
          >
            <div className="text-6xl mb-4"></div>
            <p className="text-gray-600 text-lg mb-4">No rides yet</p>
            <Link
              href="/rides/book"
              className="inline-block px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Book Your First Ride
            </Link>
          </motion.div>
        ) : (
          <div className="grid gap-6">
            {rides.map((ride, index) => (
              <motion.div
                key={ride.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/rides/${ride.id}`}>
                  <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ride.status)}`}>
                            {ride.status}
                          </span>
                          <span className="ml-3 text-sm text-gray-500">
                            {format(new Date(ride.createdAt), 'MMM dd, yyyy HH:mm')}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-start">
                            <span className="text-green-600 mr-2"> </span>
                            <div>
                              <p className="text-xs text-gray-500">Pickup</p>
                              <p className="font-medium text-gray-900">{ride.pickupLocation}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start">
                            <span className="text-red-600 mr-2"> </span>
                            <div>
                              <p className="text-xs text-gray-500">Dropoff</p>
                              <p className="font-medium text-gray-900">{ride.dropoffLocation}</p>
                            </div>
                          </div>
                        </div>

                        {ride.driver && (
                          <div className="mt-3 text-sm text-gray-600">
                            Driver: {ride.driver.name}
                          </div>
                        )}
                      </div>

                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold text-indigo-600">₹{ride.fare}</div>
                        <div className="text-xs text-gray-500 mt-1">Total Fare</div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex justify-end">
                        <span className="text-indigo-600 text-sm font-medium hover:text-indigo-700">
                          View Details →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
