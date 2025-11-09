'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface UserProfile {
  id: string
  email: string
  name: string
  phone?: string
  role: 'PASSENGER' | 'DRIVER' | 'ADMIN'
  isVerified: boolean
  licenseNumber?: string
  createdAt: string
  image?: string
}

interface AuthContextType {
  user: UserProfile | null
  loading: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    // First check NextAuth session (Google OAuth)
    if (session?.user) {
      setUser(session.user as UserProfile)
      setLoading(false)
      return
    }

    // Fallback to JWT auth from localStorage
    const authData = localStorage.getItem('auth')
    
    if (authData) {
      try {
        const { user: userData } = JSON.parse(authData)
        setUser(userData)
      } catch (error) {
        console.error('Failed to parse auth data:', error)
        localStorage.removeItem('auth')
        setUser(null)
      }
    } else {
      setUser(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    // Update user when session changes
    if (status !== 'loading') {
      refreshUser()
    } else {
      setLoading(true)
    }
  }, [session, status])

  useEffect(() => {
    // Initial load from localStorage
    // use an async IIFE and guard mounted state to avoid setting state after unmount
    let mounted = true
    ;(async () => {
      await refreshUser()
      if (mounted) setLoading(false)
    })()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
