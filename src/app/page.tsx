'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'DRIVER') {
        router.replace('/driver-dashboard')
      }
      // For passengers, show them the options instead of auto-redirecting
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show landing page only for non-authenticated users
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6">
                Welcome to <span className="text-indigo-600">Drive Hire</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Your trusted ride-sharing platform connecting passengers and drivers across India 🇮🇳
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  Get Started - Sign Up
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-8 py-4 border-2 border-indigo-600 text-lg font-medium rounded-lg text-indigo-600 bg-white hover:bg-indigo-50 transition-all transform hover:scale-105 shadow-lg"
                >
                  Sign In
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="grid md:grid-cols-3 gap-8"
          >
            {/* Feature 1 */}
            <div className="bg-white rounded-xl shadow-xl p-8 hover:shadow-2xl transition-shadow">
              <div className="text-4xl mb-4">🚗</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Book Instant Rides</h3>
              <p className="text-gray-600">
                Get rides instantly at affordable prices. Travel comfortably across cities with verified drivers.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-xl shadow-xl p-8 hover:shadow-2xl transition-shadow">
              <div className="text-4xl mb-4">🚙</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Rent Premium Cars</h3>
              <p className="text-gray-600">
                Choose from a wide range of cars for hourly or daily rentals. Drive yourself or with a driver.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-xl shadow-xl p-8 hover:shadow-2xl transition-shadow">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Share Carpools</h3>
              <p className="text-gray-600">
                Save money by sharing rides with others going your way. Eco-friendly and budget-friendly.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Stats Section */}
        <div className="bg-indigo-600 text-white py-16 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="grid md:grid-cols-4 gap-8 text-center"
            >
              <div>
                <div className="text-4xl font-bold mb-2">10K+</div>
                <div className="text-indigo-200">Happy Riders</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">500+</div>
                <div className="text-indigo-200">Verified Drivers</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">50+</div>
                <div className="text-indigo-200">Cities Covered</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">4.8★</div>
                <div className="text-indigo-200">Average Rating</div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of riders and drivers using Drive Hire every day
            </p>
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-10 py-4 border border-transparent text-xl font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-all transform hover:scale-105 shadow-xl"
            >
              Sign Up Now - It's Free!
            </Link>
          </motion.div>
        </div>
      </div>
    )
  }

  // Passenger Dashboard - Show options to choose
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Welcome back, {user.name}! 👋
          </h1>
          <p className="text-xl text-gray-600">
            Choose a service to get started
          </p>
        </motion.div>

        {/* Service Options */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Book a Ride */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <Link href="/rides/book">
              <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all transform hover:scale-105 cursor-pointer border-2 border-transparent hover:border-indigo-500">
                <div className="text-6xl mb-6 text-center">🚗</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Book a Ride</h2>
                <p className="text-gray-600 text-center mb-6">
                  Get instant rides with verified drivers. Safe, fast, and affordable.
                </p>
                <div className="bg-indigo-50 rounded-lg p-4">
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>✓ Real-time tracking</li>
                    <li>✓ Multiple vehicle types</li>
                    <li>✓ Transparent pricing</li>
                  </ul>
                </div>
                <div className="mt-6 text-center">
                  <span className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                    Book Now →
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Rent a Car */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Link href="/cars">
              <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all transform hover:scale-105 cursor-pointer border-2 border-transparent hover:border-green-500">
                <div className="text-6xl mb-6 text-center">🚙</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Rent a Car</h2>
                <p className="text-gray-600 text-center mb-6">
                  Browse premium cars for hourly or daily rentals. Drive yourself.
                </p>
                <div className="bg-green-50 rounded-lg p-4">
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>✓ Wide selection of cars</li>
                    <li>✓ Hourly/Daily rates</li>
                    <li>✓ Easy booking process</li>
                  </ul>
                </div>
                <div className="mt-6 text-center">
                  <span className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors">
                    Browse Cars →
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Join Carpool */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Link href="/carpool">
              <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all transform hover:scale-105 cursor-pointer border-2 border-transparent hover:border-purple-500">
                <div className="text-6xl mb-6 text-center">👥</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Join Carpool</h2>
                <p className="text-gray-600 text-center mb-6">
                  Share rides with others. Save money and help the environment.
                </p>
                <div className="bg-purple-50 rounded-lg p-4">
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>✓ Eco-friendly travel</li>
                    <li>✓ Cost-effective rides</li>
                    <li>✓ Meet new people</li>
                  </ul>
                </div>
                <div className="mt-6 text-center">
                  <span className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors">
                    Find Carpools →
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-16 bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Your Activity</h3>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-indigo-600 mb-2">0</div>
              <div className="text-gray-600">Total Rides</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">₹0</div>
              <div className="text-gray-600">Money Saved</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">0</div>
              <div className="text-gray-600">Carpools</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
