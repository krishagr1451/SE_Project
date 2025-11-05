'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

interface Car {
  id: string
  make: string
  model: string
  year: number
  licensePlate: string
  color: string
  seats: number
  pricePerDay: number
  available: boolean
  image?: string
  features?: string[]
  ownerId?: string
}

export default function MyCarsPage() {
  const router = useRouter()
  const [cars, setCars] = useState<Car[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const authData = localStorage.getItem('auth')
    if (authData) {
      try {
        const parsed = JSON.parse(authData)
        setUser(parsed.user)
      } catch (err) {
        console.warn('Invalid auth in localStorage')
      }
    }

    fetchMyCars()
  }, [])

  async function fetchMyCars() {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const res = await fetch('http://localhost:4000/api/cars', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) throw new Error('Failed to fetch cars')
      const data = await res.json()

      // Filter cars for current user if ownerId is provided by API
      const userId = user?.id || (JSON.parse(localStorage.getItem('auth') || '{}')?.user?.id)
      const list = Array.isArray(data.cars) ? data.cars : data
      const myCars = userId ? list.filter((c: any) => c.ownerId === userId) : list
      setCars(myCars)
    } catch (error) {
      console.error('Error fetching cars:', error)
    } finally {
      setLoading(false)
    }
  }

  async function toggleAvailability(carId: string, currentStatus: boolean) {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const res = await fetch(`http://localhost:4000/api/cars/${carId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ available: !currentStatus })
      })

      if (res.ok) fetchMyCars()
    } catch (err) {
      console.error('Error updating availability', err)
    }
  }

  async function deleteCar(carId: string) {
    if (!confirm('Are you sure you want to delete this car?')) return
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const res = await fetch(`http://localhost:4000/api/cars/${carId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) fetchMyCars()
    } catch (err) {
      console.error('Error deleting car', err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Cars</h1>
            <p className="text-gray-600">Manage vehicles you have listed for rent</p>
          </div>

          <Link href="/cars/add" className="px-5 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700">
            Add New Car
          </Link>
        </motion.div>

        {user && user.role !== 'DRIVER' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">You need to be registered as a driver to list cars. Please update your profile or contact support.</p>
          </motion.div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
            <p className="mt-4 text-gray-600">Loading your cars...</p>
          </div>
        ) : cars.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 bg-white rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No cars listed yet</h3>
            <p className="text-gray-600 mb-6">Start earning by listing your car.</p>
            <Link href="/cars/add" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
              Add Your First Car
            </Link>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cars.map((car, idx) => (
                <motion.div key={car.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }} className="bg-white rounded-xl shadow-sm hover:shadow-lg overflow-hidden">
                  <div className="h-44 bg-gray-100 flex items-center justify-center">
                    {car.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={car.image} alt={`${car.make} ${car.model}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-gray-400">No image</div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{car.make} {car.model}</h3>
                        <p className="text-sm text-gray-600">{car.year} • {car.color}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${car.available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                        {car.available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">License Plate</span>
                        <span className="font-medium">{car.licensePlate || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Seats</span>
                        <span className="font-medium">{car.seats}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Price per day</span>
                        <span className="text-xl font-bold text-blue-600">₹{car.pricePerDay}</span>
                      </div>
                    </div>

                    {car.features && car.features.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Features:</p>
                        <div className="flex flex-wrap gap-2">
                          {car.features.slice(0, 3).map((f, i) => (
                            <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">{f}</span>
                          ))}
                          {car.features.length > 3 && <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">+{car.features.length - 3} more</span>}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <button onClick={() => toggleAvailability(car.id, car.available)} className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${car.available ? 'bg-yellow-500 text-white hover:bg-yellow-600' : 'bg-green-500 text-white hover:bg-green-600'}`}>
                        {car.available ? 'Mark Unavailable' : 'Mark Available'}
                      </button>

                      <div className="flex gap-2">
                        <Link href={`/cars/${car.id}/edit`} className="flex-1 text-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium">Edit</Link>
                        <button onClick={() => deleteCar(car.id)} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium">Delete</button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-3xl font-bold text-blue-600 mb-2">{cars.length}</div>
                <div className="text-gray-600">Total Cars</div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-3xl font-bold text-green-600 mb-2">{cars.filter(c => c.available).length}</div>
                <div className="text-gray-600">Available</div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-3xl font-bold text-purple-600 mb-2">₹{cars.reduce((sum, c) => sum + (c.pricePerDay || 0), 0).toLocaleString()}</div>
                <div className="text-gray-600">Total Daily Rate</div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}
