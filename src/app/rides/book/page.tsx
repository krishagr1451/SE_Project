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

type VehicleType = 'AUTO' | 'MINI' | 'SEDAN' | 'SUV' | 'PREMIUM'

interface VehicleOption {
  type: VehicleType
  name: string
  icon: string
  capacity: string
  baseFare: number
  perKm: number
  description: string
  eta: string
  image: string
  color: string
}

// SVG Car Icons
const CarIcon = ({ type, color }: { type: VehicleType; color: string }) => {
  if (type === 'AUTO') {
    return (
      <svg viewBox="0 0 64 64" className="w-16 h-16" fill="none">
        <circle cx="20" cy="48" r="6" fill={color} stroke="#000" strokeWidth="2"/>
        <circle cx="44" cy="48" r="6" fill={color} stroke="#000" strokeWidth="2"/>
        <path d="M14 48 L14 36 Q14 32 18 32 L24 32 L28 20 Q28 16 32 16 L40 16 Q44 16 46 20 L50 32 L56 32 Q60 32 60 36 L60 48" 
              stroke="#000" strokeWidth="2" fill={color}/>
        <rect x="18" y="24" width="28" height="12" fill="#87CEEB" stroke="#000" strokeWidth="1.5"/>
        <path d="M32 24 L32 36" stroke="#000" strokeWidth="1.5"/>
      </svg>
    )
  }
  
  if (type === 'MINI') {
    return (
      <svg viewBox="0 0 64 64" className="w-16 h-16" fill="none">
        <circle cx="18" cy="50" r="6" fill="#333" stroke="#000" strokeWidth="2"/>
        <circle cx="46" cy="50" r="6" fill="#333" stroke="#000" strokeWidth="2"/>
        <path d="M12 50 L12 38 Q12 34 16 32 L20 32 L22 26 Q22 22 26 20 L38 20 Q42 22 44 26 L46 32 L48 32 Q52 34 52 38 L52 50" 
              stroke="#000" strokeWidth="2" fill={color}/>
        <rect x="22" y="28" width="20" height="8" rx="2" fill="#87CEEB" stroke="#000" strokeWidth="1.5"/>
        <ellipse cx="16" cy="40" rx="3" ry="2" fill="#FFF59D" stroke="#000" strokeWidth="1"/>
        <ellipse cx="48" cy="40" rx="3" ry="2" fill="#FFF59D" stroke="#000" strokeWidth="1"/>
      </svg>
    )
  }
  
  if (type === 'SEDAN') {
    return (
      <svg viewBox="0 0 64 64" className="w-16 h-16" fill="none">
        <circle cx="16" cy="50" r="6" fill="#333" stroke="#000" strokeWidth="2"/>
        <circle cx="48" cy="50" r="6" fill="#333" stroke="#000" strokeWidth="2"/>
        <path d="M10 50 L10 38 Q10 34 14 32 L18 32 L22 24 Q22 18 28 16 L36 16 Q42 18 46 24 L50 32 L54 32 Q58 34 58 38 L58 50" 
              stroke="#000" strokeWidth="2" fill={color}/>
        <rect x="20" y="24" width="24" height="10" rx="2" fill="#87CEEB" stroke="#000" strokeWidth="1.5"/>
        <path d="M28 24 L28 34" stroke="#000" strokeWidth="1.5"/>
        <ellipse cx="14" cy="38" rx="3" ry="2" fill="#FFF59D" stroke="#000" strokeWidth="1"/>
        <ellipse cx="50" cy="38" rx="3" ry="2" fill="#FFF59D" stroke="#000" strokeWidth="1"/>
      </svg>
    )
  }
  
  if (type === 'SUV') {
    return (
      <svg viewBox="0 0 64 64" className="w-16 h-16" fill="none">
        <circle cx="16" cy="52" r="7" fill="#333" stroke="#000" strokeWidth="2"/>
        <circle cx="48" cy="52" r="7" fill="#333" stroke="#000" strokeWidth="2"/>
        <path d="M9 52 L9 36 Q9 30 14 28 L18 28 L20 20 Q20 14 26 12 L38 12 Q44 14 46 20 L48 28 L50 28 Q55 30 55 36 L55 52" 
              stroke="#000" strokeWidth="2" fill={color}/>
        <rect x="18" y="20" width="28" height="14" rx="2" fill="#87CEEB" stroke="#000" strokeWidth="1.5"/>
        <path d="M30 20 L30 34" stroke="#000" strokeWidth="1.5"/>
        <path d="M36 20 L36 34" stroke="#000" strokeWidth="1.5"/>
        <ellipse cx="14" cy="40" rx="3" ry="2" fill="#FFF59D" stroke="#000" strokeWidth="1"/>
        <ellipse cx="50" cy="40" rx="3" ry="2" fill="#FFF59D" stroke="#000" strokeWidth="1"/>
      </svg>
    )
  }
  
  if (type === 'PREMIUM') {
    return (
      <svg viewBox="0 0 64 64" className="w-16 h-16" fill="none">
        <circle cx="16" cy="50" r="6" fill="#333" stroke="#000" strokeWidth="2"/>
        <circle cx="48" cy="50" r="6" fill="#333" stroke="#000" strokeWidth="2"/>
        <path d="M10 50 L10 36 Q10 32 14 30 L18 30 L20 22 Q20 16 26 14 L38 14 Q44 16 46 22 L48 30 L52 30 Q56 32 56 36 L56 50" 
              stroke="#000" strokeWidth="2.5" fill={color} strokeLinecap="round"/>
        <path d="M18 22 Q18 18 22 18 L42 18 Q46 18 46 22 L48 30 L16 30 Z" fill="#87CEEB" stroke="#000" strokeWidth="1.5"/>
        <path d="M28 18 L28 30" stroke="#000" strokeWidth="1.5"/>
        <path d="M36 18 L36 30" stroke="#000" strokeWidth="1.5"/>
        <ellipse cx="14" cy="38" rx="3" ry="2" fill="#FFF59D" stroke="#000" strokeWidth="1"/>
        <ellipse cx="50" cy="38" rx="3" ry="2" fill="#FFF59D" stroke="#000" strokeWidth="1"/>
        <path d="M20 14 L22 10 L42 10 L44 14" stroke="#FFD700" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    )
  }
  
  return null
}

const vehicleOptions: VehicleOption[] = [
  {
    type: 'AUTO',
    name: 'Auto',
    icon: '',
    capacity: '3 seats',
    baseFare: 30,
    perKm: 12,
    description: 'Affordable rides',
    eta: '2 min',
    image: 'auto',
    color: '#FFD54F'
  },
  {
    type: 'MINI',
    name: 'Mini',
    icon: '',
    capacity: '4 seats',
    baseFare: 50,
    perKm: 15,
    description: 'Comfortable hatchbacks',
    eta: '3 min',
    image: 'mini',
    color: '#81C784'
  },
  {
    type: 'SEDAN',
    name: 'Sedan',
    icon: '',
    capacity: '4 seats',
    baseFare: 80,
    perKm: 20,
    description: 'Spacious sedans',
    eta: '4 min',
    image: 'sedan',
    color: '#64B5F6'
  },
  {
    type: 'SUV',
    name: 'SUV',
    icon: '',
    capacity: '6 seats',
    baseFare: 120,
    perKm: 25,
    description: 'Premium SUVs',
    eta: '5 min',
    image: 'suv',
    color: '#BA68C8'
  },
  {
    type: 'PREMIUM',
    name: 'Premium',
    icon: '',
    capacity: '4 seats',
    baseFare: 200,
    perKm: 35,
    description: 'Luxury cars',
    eta: '6 min',
    image: 'premium',
    color: '#90A4AE'
  }
]

export default function BookRidePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [step, setStep] = useState<'location' | 'vehicle'>('location')
  const [pickupLocation, setPickupLocation] = useState('')
  const [dropoffLocation, setDropoffLocation] = useState('')
  const [pickupSuggestions, setPickupSuggestions] = useState<LocationSuggestion[]>([])
  const [dropoffSuggestions, setDropoffSuggestions] = useState<LocationSuggestion[]>([])
  const [selectedPickup, setSelectedPickup] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedDropoff, setSelectedDropoff] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType | null>(null)
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
      calculateDistance()
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

  const calculateDistance = () => {
    if (!selectedPickup || !selectedDropoff) return

    const dist = getDistance(
      selectedPickup.lat,
      selectedPickup.lng,
      selectedDropoff.lat,
      selectedDropoff.lng
    )
    setDistance(dist)
  }

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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

  const calculateFare = (vehicle: VehicleOption): number => {
    if (!distance) return vehicle.baseFare
    return Math.round(vehicle.baseFare + (distance * vehicle.perKm))
  }

  const handleContinueToVehicleSelection = () => {
    if (!selectedPickup || !selectedDropoff) {
      setError('Please select both pickup and dropoff locations')
      return
    }
    setError('')
    setStep('vehicle')
  }

  const handleBookRide = async (vehicleType: VehicleType) => {
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
          vehicleType,
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
  alert('Ride booked successfully!')
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
          <h1 className="text-3xl font-bold text-gray-900">Book a Ride</h1>
          <p className="mt-2 text-gray-600">
            {step === 'location' ? 'Enter your pickup and drop-off locations' : 'Choose your ride'}
          </p>
          
            {/* Car Preview Banner - Only show on location step */}
            {step === 'location' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-4 p-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <p className="text-sm font-semibold">Multiple vehicle options available</p>
                    <p className="text-xs opacity-90 mt-1">Auto • Mini • Sedan • SUV • Premium</p>
                  </div>
                  <div className="flex space-x-2">
                    {vehicleOptions.slice(0, 3).map((vehicle, idx) => (
                      <motion.div
                        key={vehicle.type}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + idx * 0.1 }}
                        className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-2"
                      >
                        <div className="w-12 h-12">
                          <CarIcon type={vehicle.type} color="white" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
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
                Pickup Location
              </label>
              <input
                type="text"
                value={pickupLocation}
                onChange={(e) => {
                  setPickupLocation(e.target.value)
                  searchLocation(e.target.value, 'pickup')
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-500"
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
                      {suggestion.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dropoff Location */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dropoff Location
              </label>
              <input
                type="text"
                value={dropoffLocation}
                onChange={(e) => {
                  setDropoffLocation(e.target.value)
                  searchLocation(e.target.value, 'dropoff')
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-500"
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
                      {suggestion.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Distance display */}
            {distance && step === 'location' && (
              <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Estimated Distance:</span>
                  <span className="text-2xl font-bold text-indigo-600">{distance} km</span>
                </div>
              </div>
            )}

            {/* Step 1: Continue to Vehicle Selection Button */}
            {step === 'location' && (
              <motion.button
                onClick={handleContinueToVehicleSelection}
                disabled={!selectedPickup || !selectedDropoff}
                className="w-full py-4 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                whileHover={{ scale: !selectedPickup || !selectedDropoff ? 1 : 1.02 }}
                whileTap={{ scale: !selectedPickup || !selectedDropoff ? 1 : 0.98 }}
              >
                Continue to Vehicle Selection →
              </motion.button>
            )}

            {/* Step 2: Vehicle Selection Cards */}
            {step === 'vehicle' && (
              <div className="space-y-4">
                <button
                  onClick={() => setStep('location')}
                  className="flex items-center text-indigo-600 hover:text-indigo-700 font-medium mb-4"
                >
                  ← Back to locations
                </button>

                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">From</p>
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">{pickupLocation}</p>
                  <p className="text-xs text-gray-500 mt-2">To</p>
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">{dropoffLocation}</p>
                  {distance && <p className="text-xs text-gray-500 mt-2">Distance: <span className="font-semibold">{distance} km</span></p>}
                </div>

                  {/* Vehicle Type Preview Banner */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-xl border border-indigo-100">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Available Vehicles</h4>
                    <div className="grid grid-cols-5 gap-2">
                      {vehicleOptions.map((vehicle) => (
                        <div key={vehicle.type} className="flex flex-col items-center">
                          <div className="bg-white rounded-lg p-2 shadow-sm">
                            <CarIcon type={vehicle.type} color={vehicle.color} />
                          </div>
                          <p className="text-xs font-medium text-gray-700 mt-1">{vehicle.name}</p>
                          <p className="text-xs text-gray-500">₹{vehicle.baseFare}+</p>
                        </div>
                      ))}
                    </div>
                  </div>

                <h3 className="text-lg font-bold text-gray-900 mb-3">Choose a ride</h3>

                {vehicleOptions.map((vehicle) => {
                  const fare = calculateFare(vehicle)
                  return (
                    <motion.button
                      key={vehicle.type}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleBookRide(vehicle.type)}
                      disabled={loading}
                        className={`w-full bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md p-5 hover:shadow-xl transition-all border-2 ${
                          selectedVehicle === vehicle.type 
                            ? 'border-indigo-500 ring-2 ring-indigo-200' 
                            : 'border-transparent hover:border-indigo-300'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {/* Car Image */}
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 shadow-sm">
                              <CarIcon type={vehicle.type} color={vehicle.color} />
                            </div>
                          
                            {/* Vehicle Info */}
                          <div className="text-left">
                            <div className="flex items-center space-x-2">
                                <h4 className="text-lg font-bold text-gray-900">{vehicle.name}</h4>
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                                  {vehicle.eta}
                                </span>
                            </div>
                              <p className="text-sm text-gray-600 mt-1">
                                <span className="font-medium">{vehicle.capacity}</span> • {vehicle.description}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                Base: ₹{vehicle.baseFare} + ₹{vehicle.perKm}/km
                              </p>
                          </div>
                        </div>
                        
                          {/* Fare */}
                        <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900">₹{fare}</p>
                            <p className="text-xs text-gray-500 mt-1">Total fare</p>
                        </div>
                      </div>
                    </motion.button>
                  )
                })}

                {loading && (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <p className="mt-2 text-sm text-gray-600">Booking your ride...</p>
                  </div>
                )}
              </div>
            )}
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
