'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'

const LeafletMap = dynamic(() => import('@/components/Map'), { ssr: false })

interface LocationSuggestion {
  display_name: string
  lat: string
  lon: string
}

export default function BookRidePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [pickupLocation, setPickupLocation] = useState('')
  const [dropoffLocation, setDropoffLocation] = useState('')
  const [pickupSuggestions, setPickupSuggestions] = useState<LocationSuggestion[]>([])
  const [dropoffSuggestions, setDropoffSuggestions] = useState<LocationSuggestion[]>([])
  const [selectedPickup, setSelectedPickup] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedDropoff, setSelectedDropoff] = useState<{ lat: number; lng: number } | null>(null)
  const [fare, setFare] = useState<number | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (selectedPickup && selectedDropoff) {
      calculateFare()
    }
  }, [selectedPickup, selectedDropoff])

  const searchLocation = async (query: string, type: 'pickup' | 'dropoff') => {
    if (query.length < 3) {
      if (type === 'pickup') setPickupSuggestions([])
      else setDropoffSuggestions([])
      return
    }

    try {
      const response = await fetch(`/api/geocode?address=${encodeURIComponent(query)}&autocomplete=true`)
      const data = await response.json()
      
      if (type === 'pickup') {
        setPickupSuggestions(data.slice(0, 5))
      } else {
        setDropoffSuggestions(data.slice(0, 5))
      }
    } catch (error) {
      console.error('Error searching location:', error)
    }
  }

  const selectLocation = (location: LocationSuggestion, type: 'pickup' | 'dropoff') => {
    if (type === 'pickup') {
      setPickupLocation(location.display_name)
      setSelectedPickup({ lat: parseFloat(location.lat), lng: parseFloat(location.lon) })
      setPickupSuggestions([])
    } else {
      setDropoffLocation(location.display_name)
      setSelectedDropoff({ lat: parseFloat(location.lat), lng: parseFloat(location.lon) })
      setDropoffSuggestions([])
    }
  }

  const calculateFare = () => {
    if (!selectedPickup || !selectedDropoff) return

    const dist = calculateDistance(
      selectedPickup.lat,
      selectedPickup.lng,
      selectedDropoff.lat,
      selectedDropoff.lng
    )
    const baseFare = 50
    const perKmRate = 15
    const calculatedFare = baseFare + (dist * perKmRate)
    
    setDistance(dist)
    setFare(Math.round(calculatedFare))
  }

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return Math.round(R * c * 10) / 10
  }

  const handleBookRide = async () => {
    if (!selectedPickup || !selectedDropoff) {
      setError('Please select both pickup and dropoff locations')
      return
    }

    setLoading(true)
    setError('')

    try {
      const auth = localStorage.getItem('auth')
      const token = localStorage.getItem('token')
      
      if (!auth && !token) {
        setError('Please login to book a ride')
        setTimeout(() => router.push('/login'), 2000)
        return
      }

      const authToken = token || (auth ? JSON.parse(auth).token : null)

      // Call backend server directly instead of Next.js API route
      const response = await fetch('http://localhost:4000/api/rides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          pickupLocation,
          pickupLat: selectedPickup.lat,
          pickupLng: selectedPickup.lng,
          dropoffLocation,
          dropoffLat: selectedDropoff.lat,
          dropoffLng: selectedDropoff.lng,
          paymentMethod: 'cash',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 401) {
          setError('Session expired. Please login again.')
          setTimeout(() => router.push('/login'), 2000)
          return
        }
        throw new Error(errorData.error || 'Failed to book ride')
      }

      const ride = await response.json()
      alert('Ride booked successfully! 🚗')
      router.push(`/my-rides`)
    } catch (error) {
      console.error('Error booking ride:', error)
      setError(error instanceof Error ? error.message : 'Failed to book ride. Please try again.')
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

  const markers = []
  if (selectedPickup) {
    markers.push({
      id: 'pickup',
      lat: selectedPickup.lat,
      lng: selectedPickup.lng,
      popup: `Pickup: ${pickupLocation}`,
    })
  }
  if (selectedDropoff) {
    markers.push({
      id: 'dropoff',
      lat: selectedDropoff.lat,
      lng: selectedDropoff.lng,
      popup: `Dropoff: ${dropoffLocation}`,
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900">🚗 Book a Ride</h1>
          <p className="mt-2 text-gray-600">Get a ride to your destination</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Booking Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-xl font-semibold mb-4">Where to?</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg">
                {error}
              </div>
            )}

            {/* Pickup Location */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📍 Pickup Location
              </label>
              <input
                type="text"
                value={pickupLocation}
                onChange={(e) => {
                  setPickupLocation(e.target.value)
                  searchLocation(e.target.value, 'pickup')
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., MG Road, Bangalore or Mumbai Airport"
              />
              
              {/* Quick location suggestions */}
              {!pickupLocation && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setPickupLocation('MG Road, Bangalore, India')
                      searchLocation('MG Road, Bangalore, India', 'pickup')
                    }}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full"
                  >
                    MG Road, Bangalore
                  </button>
                  <button
                    onClick={() => {
                      setPickupLocation('Connaught Place, Delhi, India')
                      searchLocation('Connaught Place, Delhi, India', 'pickup')
                    }}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full"
                  >
                    Connaught Place, Delhi
                  </button>
                  <button
                    onClick={() => {
                      setPickupLocation('Marine Drive, Mumbai, India')
                      searchLocation('Marine Drive, Mumbai, India', 'pickup')
                    }}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full"
                  >
                    Marine Drive, Mumbai
                  </button>
                </div>
              )}
              
              {pickupSuggestions.length > 0 && (
                <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10 relative">
                  {pickupSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => selectLocation(suggestion, 'pickup')}
                      className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-sm border-b border-gray-100 last:border-b-0"
                    >
                      📍 {suggestion.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dropoff Location */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📌 Dropoff Location
              </label>
              <input
                type="text"
                value={dropoffLocation}
                onChange={(e) => {
                  setDropoffLocation(e.target.value)
                  searchLocation(e.target.value, 'dropoff')
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., Koramangala, Bangalore or Delhi Airport"
              />
              
              {/* Quick location suggestions */}
              {!dropoffLocation && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setDropoffLocation('Koramangala, Bangalore, India')
                      searchLocation('Koramangala, Bangalore, India', 'dropoff')
                    }}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full"
                  >
                    Koramangala, Bangalore
                  </button>
                  <button
                    onClick={() => {
                      setDropoffLocation('Aerocity, Delhi, India')
                      searchLocation('Aerocity, Delhi, India', 'dropoff')
                    }}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full"
                  >
                    Aerocity, Delhi
                  </button>
                  <button
                    onClick={() => {
                      setDropoffLocation('Bandra, Mumbai, India')
                      searchLocation('Bandra, Mumbai, India', 'dropoff')
                    }}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full"
                  >
                    Bandra, Mumbai
                  </button>
                </div>
              )}
              
              {dropoffSuggestions.length > 0 && (
                <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10 relative">
                  {dropoffSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => selectLocation(suggestion, 'dropoff')}
                      className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-sm border-b border-gray-100 last:border-b-0"
                    >
                      📌 {suggestion.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fare Estimate */}
            {fare && distance && (
              <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700">Distance:</span>
                  <span className="font-semibold">{distance} km</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Estimated Fare:</span>
                  <span className="text-2xl font-bold text-indigo-600">₹{fare}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Base fare: ₹50 + ₹15/km</p>
              </div>
            )}

            {/* Book Button */}
            <motion.button
              onClick={handleBookRide}
              disabled={loading || !selectedPickup || !selectedDropoff}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              whileHover={{ scale: loading || !selectedPickup || !selectedDropoff ? 1 : 1.02 }}
              whileTap={{ scale: loading || !selectedPickup || !selectedDropoff ? 1 : 0.98 }}
            >
              {loading ? 'Booking...' : 'Book Ride Now'}
            </motion.button>
          </motion.div>

          {/* Map */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-lg shadow-md overflow-hidden"
            style={{ height: '600px' }}
          >
            <LeafletMap markers={markers} />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
