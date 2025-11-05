'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

interface User {
  id: string
  email: string
  name: string
  phone: string
  role: 'PASSENGER' | 'DRIVER' | 'ADMIN'
  isVerified: boolean
  licenseNumber?: string
  createdAt: string
}

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

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    licenseNumber: ''
  })
  const [saving, setSaving] = useState(false)
  const [rideHistory, setRideHistory] = useState<Ride[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchRideHistory() {
    setLoadingHistory(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:4000/api/rides?type=myrides', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setRideHistory(data.rides || [])
      }
    } catch (error) {
      console.error('Error fetching ride history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  function toggleHistory() {
    if (!showHistory && rideHistory.length === 0) {
      fetchRideHistory()
    }
    setShowHistory(!showHistory)
  }

  async function fetchProfile() {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('http://localhost:4000/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        router.push('/login')
        return
      }

      const data = await response.json()
      setUser(data.user)
      setFormData({
        name: data.user.name,
        phone: data.user.phone || '',
        licenseNumber: data.user.licenseNumber || ''
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      // Note: Update endpoint would need to be created in backend
      // For now, we'll just update localStorage
      const authData = localStorage.getItem('auth')
      if (authData) {
        const parsed = JSON.parse(authData)
        parsed.user = { ...parsed.user, ...formData }
        localStorage.setItem('auth', JSON.stringify(parsed))
      }
      
      setUser(prev => prev ? { ...prev, ...formData } : null)
      setEditing(false)
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('auth')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50">
        <Navbar />
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your account settings</p>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden"
        >
          {/* Header Section with Avatar */}
          <div className="bg-gradient-to-r from-indigo-600 to-pink-600 px-8 py-12 text-white">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl font-bold text-indigo-600">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-2">{user.name}</h2>
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                    {user.role}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    user.isVerified
                      ? 'bg-green-500/20'
                      : 'bg-yellow-500/20'
                  }`}>
                    {user.isVerified ? '✅ Verified' : '⏳ Pending Verification'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-8">
            {editing ? (
              // Edit Mode
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {user.role === 'DRIVER' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      License Number
                    </label>
                    <input
                      type="text"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false)
                      setFormData({
                        name: user.name,
                        phone: user.phone || '',
                        licenseNumber: user.licenseNumber || ''
                      })
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Email</label>
                    <p className="text-lg text-gray-900 font-medium">{user.email}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Phone</label>
                    <p className="text-lg text-gray-900 font-medium">{user.phone || 'Not provided'}</p>
                  </div>

                  {user.role === 'DRIVER' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-2">License Number</label>
                      <p className="text-lg text-gray-900 font-medium">{user.licenseNumber || 'Not provided'}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Member Since</label>
                    <p className="text-lg text-gray-900 font-medium">
                      {new Date(user.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                  <button
                    onClick={() => setEditing(true)}
                    className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
                  >
                    Edit Profile
                  </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Ride History Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-8 bg-white rounded-xl shadow-lg overflow-hidden"
        >
            <button
            onClick={toggleHistory}
            className="w-full px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold flex items-center justify-between hover:from-orange-600 hover:to-pink-600 transition-colors"
          >
            <span className="text-lg">Ride History</span>
            <span className="text-2xl">{showHistory ? '▼' : '▶'}</span>
          </button>

          {showHistory && (
            <div className="p-6">
              {loadingHistory ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading history...</p>
                </div>
              ) : rideHistory.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2"></div>
                  <p className="text-gray-600">No ride history yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {rideHistory.slice(0, 5).map((ride) => (
                    <div key={ride.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            <p className="text-sm font-medium text-gray-900">{ride.pickupLocation}</p>
                          </div>
                          <div className="ml-4 border-l-2 border-dashed border-gray-300 h-4"></div>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            <p className="text-sm font-medium text-gray-900">{ride.dropoffLocation}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-orange-600">₹{ride.fare}</p>
                          <p className={`text-xs px-2 py-1 rounded-full ${
                            ride.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            ride.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {ride.status}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
                        <span>{new Date(ride.createdAt).toLocaleDateString('en-IN')}</span>
                        {ride.driver && <span>👤 {ride.driver.name}</span>}
                      </div>
                    </div>
                  ))}
                  {rideHistory.length > 5 && (
                    <Link href="/my-rides" className="block text-center text-orange-600 hover:text-orange-700 font-medium mt-4">
                      View All {rideHistory.length} Rides →
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <Link
            href="/my-rides"
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="text-3xl mb-3"></div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">My Rides</h3>
            <p className="text-gray-600">View and track your rides</p>
          </Link>

          <Link
            href="/my-cars"
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="text-3xl mb-3">🚗</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">My Cars</h3>
            <p className="text-gray-600">Manage your listed cars</p>
          </Link>

          <Link
            href="/carpool"
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="text-3xl mb-3">🚙</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Carpools</h3>
            <p className="text-gray-600">Find and join carpools</p>
          </Link>

          <Link
            href="/bookings"
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="text-3xl mb-3">📋</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">My Bookings</h3>
            <p className="text-gray-600">View carpool bookings</p>
          </Link>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-white rounded-xl shadow-sm p-6 border-2 border-red-200"
        >
          <h3 className="text-xl font-bold text-red-600 mb-4">⚠️ Danger Zone</h3>
          <div className="space-y-4">
            <button
              onClick={handleLogout}
              className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
            >
              Logout
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
