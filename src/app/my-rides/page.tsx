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

interface Booking {
  id: string
  startDate: string
  endDate?: string
  totalPrice: number
  status: string
  carpool?: {
    from: string
    to: string
    departureTime: string
    driver: {
      name: string
    }
  }
  car?: {
    make: string
    model: string
    year: number
    licensePlate: string
    owner: {
      name: string
    }
  }
}

type TabType = 'rides' | 'carpools' | 'rentals'

export default function MyRidesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('rides')
  const [rides, setRides] = useState<Ride[]>([])
  const [carpoolBookings, setCarpoolBookings] = useState<Booking[]>([])
  const [carRentals, setCarRentals] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      fetchAllBookings()
    }
  }, [user, authLoading, router])

  const fetchAllBookings = async () => {
    try {
      const auth = localStorage.getItem('auth')
      if (!auth) return

      const { token } = JSON.parse(auth)

      // Fetch instant rides
      const ridesResponse = await fetch('/api/rides?type=myrides', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (ridesResponse.ok) {
        const ridesData = await ridesResponse.json()
        setRides(ridesData || [])
      }

      // Fetch all bookings (carpools and car rentals)
      const bookingsResponse = await fetch('/api/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json()
        
        // Separate carpool bookings and car rentals
        const carpoolOnly = bookingsData.filter((b: Booking) => b.carpool)
        const rentalOnly = bookingsData.filter((b: Booking) => b.car)
        
        setCarpoolBookings(carpoolOnly || [])
        setCarRentals(rentalOnly || [])
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
      setRides([])
      setCarpoolBookings([])
      setCarRentals([])
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

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: 'rides', label: 'Rides Booked', count: rides.length },
    { id: 'carpools', label: 'Carpools Booked', count: carpoolBookings.length },
    { id: 'rentals', label: 'Cars Rented', count: carRentals.length },
  ]

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
              <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
              <p className="mt-2 text-gray-600">View all your rides, carpools, and rentals</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/rides/book"
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                Book Ride
              </Link>
              <Link
                href="/carpool"
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                Find Carpool
              </Link>
              <Link
                href="/cars"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                Rent Car
              </Link>
            </div>
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
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
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

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading your bookings...</p>
          </div>
        ) : (
          <>
            {/* Rides Tab */}
            {activeTab === 'rides' && (
              <div className="grid gap-6">
                {rides.length === 0 ? (
                  <EmptyState
                    icon="🚗"
                    title="No rides yet"
                    description="Book your first instant ride to get started"
                    actionLabel="Book a Ride"
                    actionHref="/rides/book"
                  />
                ) : (
                  rides.map((ride, index) => (
                    <motion.div
                      key={ride.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link href={`/rides/${ride.id}`}>
                        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-indigo-500">
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

                              {ride.driver?.name && (
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
                  ))
                )}
              </div>
            )}

            {/* Carpools Tab */}
            {activeTab === 'carpools' && (
              <div className="grid gap-6">
                {carpoolBookings.length === 0 ? (
                  <EmptyState
                    icon="🚙"
                    title="No carpool bookings yet"
                    description="Share your ride and save money with carpooling"
                    actionLabel="Find Carpools"
                    actionHref="/carpool"
                  />
                ) : (
                  carpoolBookings.map((booking, index) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-green-500">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                🚗 Carpool
                              </span>
                              <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                {booking.status}
                              </span>
                              <span className="ml-3 text-sm text-gray-500">
                                {format(new Date(booking.startDate), 'MMM dd, yyyy HH:mm')}
                              </span>
                            </div>
                            
                            {booking.carpool && (
                              <div className="space-y-2 mt-3">
                                <div className="flex items-start">
                                  <span className="text-green-600 mr-2">📍</span>
                                  <div>
                                    <p className="text-xs text-gray-500">From</p>
                                    <p className="font-medium text-gray-900">{booking.carpool.from}</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-start">
                                  <span className="text-red-600 mr-2">📍</span>
                                  <div>
                                    <p className="text-xs text-gray-500">To</p>
                                    <p className="font-medium text-gray-900">{booking.carpool.to}</p>
                                  </div>
                                </div>

                                {booking.carpool.driver?.name && (
                                  <div className="mt-3 text-sm text-gray-600">
                                    Driver: {booking.carpool.driver.name}
                                  </div>
                                )}

                                <div className="text-sm text-gray-600">
                                  Departure: {format(new Date(booking.carpool.departureTime), 'MMM dd, yyyy HH:mm')}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="text-right ml-4">
                            <div className="text-2xl font-bold text-green-600">₹{booking.totalPrice}</div>
                            <div className="text-xs text-gray-500 mt-1">Total Price</div>
                          </div>
                        </div>
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
                    title="No car rentals yet"
                    description="Rent a car for your next trip or vacation"
                    actionLabel="Browse Cars"
                    actionHref="/cars"
                  />
                ) : (
                  carRentals.map((rental, index) => (
                    <motion.div
                      key={rental.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-blue-500">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                🚘 Car Rental
                              </span>
                              <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(rental.status)}`}>
                                {rental.status}
                              </span>
                            </div>
                            
                            {rental.car && (
                              <div className="space-y-2 mt-3">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-xl font-bold text-gray-900">
                                    {rental.car.make} {rental.car.model}
                                  </h3>
                                  <span className="text-sm text-gray-500">
                                    ({rental.car.year})
                                  </span>
                                </div>

                                <div className="text-sm text-gray-600">
                                  License Plate: <span className="font-medium">{rental.car.licensePlate}</span>
                                </div>

                                {rental.car.owner?.name && (
                                  <div className="text-sm text-gray-600">
                                    Owner: {rental.car.owner.name}
                                  </div>
                                )}

                                <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-200">
                                  <div>
                                    <p className="text-xs text-gray-500">Start Date</p>
                                    <p className="font-medium text-gray-900">
                                      {format(new Date(rental.startDate), 'MMM dd, yyyy')}
                                    </p>
                                  </div>
                                  {rental.endDate && (
                                    <div>
                                      <p className="text-xs text-gray-500">End Date</p>
                                      <p className="font-medium text-gray-900">
                                        {format(new Date(rental.endDate), 'MMM dd, yyyy')}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="text-right ml-4">
                            <div className="text-2xl font-bold text-blue-600">₹{rental.totalPrice}</div>
                            <div className="text-xs text-gray-500 mt-1">Total Price</div>
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
      className="text-center py-16 bg-white rounded-lg shadow-md"
    >
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6">{description}</p>
      <Link
        href={actionHref}
        className="inline-block px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
      >
        {actionLabel}
      </Link>
    </motion.div>
  )
}
