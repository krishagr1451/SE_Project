import { sign, verify, type SignOptions, type JwtPayload as JwtStdPayload } from 'jsonwebtoken'

const JWT_SECRET = (process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'dev-secret-change-me') as string

export interface JwtPayload {
  userId: string
  role: 'PASSENGER' | 'DRIVER' | 'ADMIN'
  email?: string
}

export function signToken(payload: JwtPayload, expiresInSeconds: number = 60 * 60 * 24) {
  const options: SignOptions = { expiresIn: expiresInSeconds }
  return sign(payload, JWT_SECRET, options)
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = verify(token, JWT_SECRET) as string | JwtStdPayload | JwtPayload
    if (typeof decoded === 'string') return null
    // decoded may be our JwtPayload shape
    const maybe = decoded as Partial<JwtPayload>
    if (maybe.userId && maybe.role) {
      return { userId: maybe.userId, role: maybe.role as JwtPayload['role'] }
    }
    return null
  } catch {
    return null
  }
}

export function getAuthFromHeader(authorization?: string | null): JwtPayload | null {
  if (!authorization) return null
  const parts = authorization.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null
  return verifyToken(parts[1])
}
