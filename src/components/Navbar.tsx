'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const { user, loading, refreshUser } = useAuth()
  const router = useRouter()

  async function handleLogout() {
    localStorage.removeItem('auth')
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    await refreshUser()
    router.push('/')
    window.location.reload()
  }

  if (loading) {
    return (
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-indigo-600">Drive Hire</span>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-indigo-600">Drive Hire</span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/rides/book" className="text-gray-900 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium inline-flex items-center">
                Book Ride
              </Link>
              <Link href="/cars" className="text-gray-900 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium inline-flex items-center">
                Rent Cars
              </Link>
              <Link href="/carpool" className="text-gray-900 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium inline-flex items-center">
                Carpool
              </Link>
              {user && (
                <>
                  <Link href="/my-rides" className="text-gray-900 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium inline-flex items-center">
                    My Rides
                  </Link>
                  <Link href="/wallet" className="text-gray-900 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium inline-flex items-center">
                    Wallet
                  </Link>
                </>
              )}
              {user?.role === 'DRIVER' && (
                <>
                  <Link href="/driver-dashboard" className="text-gray-900 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium inline-flex items-center">
                    Dashboard
                  </Link>
                  <Link href="/my-cars" className="text-gray-900 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium inline-flex items-center">
                    My Cars
                  </Link>
                </>
              )}
              <Link href="/help" className="text-gray-900 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium inline-flex items-center">
                Help
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link href="/settings" className="text-gray-700 hover:text-indigo-600 transition-colors" title="Settings">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Link>
                <Link href="/profile" className="flex items-center gap-2 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden md:block">
                    <div className="text-sm font-medium text-gray-700">
                      {user.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user.role === 'DRIVER' ? '🚗 Driver' : '👤 Passenger'}
                    </div>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-900 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                  Sign In
                </Link>
                <Link href="/register" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
