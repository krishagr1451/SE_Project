import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Only create Supabase client if credentials are provided
export const supabase: SupabaseClient | null = 
  supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Database types based on our schema
export type Role = 'PASSENGER' | 'DRIVER' | 'ADMIN'

export interface UserProfile {
  id: string
  email: string
  name: string
  phone?: string
  role: Role
  isVerified: boolean
  licenseNumber?: string
  createdAt: string
}

export interface AuthResponse {
  user: UserProfile
  session: any
}
