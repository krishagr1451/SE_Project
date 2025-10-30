'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import type { Role } from '@/lib/supabase'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireRole?: Role | Role[]
  requireVerified?: boolean
  redirectTo?: string
}

export default function ProtectedRoute({
  children,
  requireAuth = true,
  requireRole,
  requireVerified = false,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    // Check if authentication is required
    if (requireAuth && !user) {
      router.push(redirectTo)
      return
    }

    // Check if specific role is required
    if (requireRole && user) {
      const roles = Array.isArray(requireRole) ? requireRole : [requireRole]
      if (!roles.includes(user.role)) {
        router.push('/')
        return
      }
    }

    // Check if verification is required
    if (requireVerified && user && !user.isVerified) {
      router.push('/verification-required')
      return
    }
  }, [user, loading, router, requireAuth, requireRole, requireVerified, redirectTo])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If authentication is required but user is not logged in, show nothing (will redirect)
  if (requireAuth && !user) {
    return null
  }

  // If role is required but user doesn't have it, show nothing (will redirect)
  if (requireRole && user) {
    const roles = Array.isArray(requireRole) ? requireRole : [requireRole]
    if (!roles.includes(user.role)) {
      return null
    }
  }

  // If verification is required but user is not verified, show nothing (will redirect)
  if (requireVerified && user && !user.isVerified) {
    return null
  }

  return <>{children}</>
}
