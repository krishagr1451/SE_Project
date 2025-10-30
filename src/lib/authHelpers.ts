'use client'

import { supabase } from './supabase'
import { getToken } from './storage'

/**
 * Universal auth helper that works with both JWT and Supabase
 */
export async function getAuthorizationHeader(): Promise<string | null> {
  // Try Supabase first
  try {
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        return `Bearer ${session.access_token}`
      }
    }
  } catch (error) {
    console.log('Supabase not configured, falling back to JWT')
  }

  // Fall back to JWT
  const auth = getToken()
  return auth ? `Bearer ${auth.token}` : null
}

/**
 * Get current user ID (works with both systems)
 */
export async function getCurrentUserId(): Promise<string | null> {
  // Try Supabase first
  try {
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.id) {
        return session.user.id
      }
    }
  } catch (error) {
    console.log('Supabase not configured, falling back to JWT')
  }

  // Fall back to JWT
  const auth = getToken()
  return auth?.user?.id || null
}

/**
 * Check if user is authenticated (works with both systems)
 */
export async function isAuthenticated(): Promise<boolean> {
  // Try Supabase first
  try {
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) return true
    }
  } catch (error) {
    console.log('Supabase not configured, falling back to JWT')
  }

  // Fall back to JWT
  const auth = getToken()
  return !!auth
}
