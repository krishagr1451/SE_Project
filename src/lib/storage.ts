export interface AuthToken {
  token: string
  user: {
    id: string
    email: string
    name: string
    phone: string | null
    role: 'PASSENGER' | 'DRIVER' | 'ADMIN'
    isVerified: boolean
  }
}

const TOKEN_KEY = 'auth' // Changed from 'car_share_token' to match LoginForm

export function saveToken(data: AuthToken): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(data))
  }
}

export function getToken(): AuthToken | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(TOKEN_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export function clearToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export function getAuthHeader(): string | null {
  const auth = getToken()
  return auth ? `Bearer ${auth.token}` : null
}
