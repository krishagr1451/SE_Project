'use client'

import { supabase, Role, UserProfile } from './supabase'

// Re-export types for convenience
export type { Role, UserProfile } from './supabase'

/**
 * Register a new user with role selection
 */
export async function registerUser(
  email: string,
  password: string,
  name: string,
  phone: string,
  role: Role,
  licenseNumber?: string
) {
  try {
    if (!supabase) {
      throw new Error('Supabase is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.')
    }

    // 1. Sign up the user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone,
          role,
          licenseNumber: licenseNumber || null,
        },
      },
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('User creation failed')

    // 2. Create user profile in our database
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name,
        phone,
        role,
        isVerified: false,
        licenseNumber: role === 'DRIVER' ? licenseNumber : null,
      })
      .select()
      .single()

    if (profileError) throw profileError

    return { success: true, user: authData.user, profile: profileData }
  } catch (error: any) {
    console.error('Registration error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Login user with email and password
 */
export async function loginUser(email: string, password: string) {
  try {
    if (!supabase) {
      throw new Error('Supabase is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.')
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    if (!data.user) throw new Error('Login failed')

    // Fetch user profile with role
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError) throw profileError

    return { success: true, user: data.user, profile, session: data.session }
  } catch (error: any) {
    console.error('Login error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Logout user
 */
export async function logoutUser() {
  try {
    if (!supabase) {
      throw new Error('Supabase is not configured.')
    }

    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { success: true }
  } catch (error: any) {
    console.error('Logout error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get current user session and profile
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    if (!supabase) return null

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) return null

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (profileError) return null

    return profile as UserProfile
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
) {
  try {
    if (!supabase) {
      throw new Error('Supabase is not configured.')
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    return { success: true, profile: data }
  } catch (error: any) {
    console.error('Update profile error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Check if user has specific role
 */
export function hasRole(user: UserProfile | null, requiredRole: Role | Role[]): boolean {
  if (!user) return false
  
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(user.role)
  }
  
  return user.role === requiredRole
}

/**
 * Check if user is verified
 */
export function isVerified(user: UserProfile | null): boolean {
  return user?.isVerified === true
}

/**
 * OAuth login (Google, GitHub, etc.)
 */
export async function loginWithProvider(provider: 'google' | 'github' | 'facebook') {
  try {
    if (!supabase) {
      throw new Error('Supabase is not configured.')
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    console.error('OAuth login error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(email: string) {
  try {
    if (!supabase) {
      throw new Error('Supabase is not configured.')
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    console.error('Password reset error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Update password
 */
export async function updatePassword(newPassword: string) {
  try {
    if (!supabase) {
      throw new Error('Supabase is not configured.')
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    console.error('Update password error:', error)
    return { success: false, error: error.message }
  }
}
