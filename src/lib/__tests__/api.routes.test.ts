import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mocks
const mockPrisma = {
  user: { findUnique: vi.fn(), create: vi.fn() },
  car: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  ride: { create: vi.fn(), findMany: vi.fn() },
  booking: { findMany: vi.fn(), create: vi.fn() },
  carpool: { findUnique: vi.fn(), update: vi.fn() },
}

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}))

const authMock = {
  signToken: vi.fn(),
  verifyToken: vi.fn(),
  getAuthFromHeader: vi.fn(),
}
vi.mock('@/lib/auth', () => authMock)

// Helpers
const jsonRequest = (url: string, method: string, body?: any, headers?: Record<string, string>) => {
  return new Request(url, {
    method,
    headers: { 'content-type': 'application/json', ...(headers || {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
}

const parseJson = async (res: Response) => ({ status: res.status, json: await res.json() })

beforeEach(() => {
  vi.clearAllMocks()
  // Reset default mocks
  authMock.signToken.mockReturnValue('test.jwt.token')
})

describe('Auth Login API', () => {
  it('400 when email or password missing', async () => {
    const mod = await import('@/app/api/auth/login/route')
    const req = jsonRequest('http://test/api/auth/login', 'POST', { email: '' })
    const res = await mod.POST(req as any)
    const out = await parseJson(res as any)
    expect(out.status).toBe(400)
    expect(out.json.error).toMatch(/Email and password/i)
  })

  it('401 for non-existent user', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null)
    const mod = await import('@/app/api/auth/login/route')
    const req = jsonRequest('http://test/api/auth/login', 'POST', { email: 'a@b.com', password: 'x' })
    const res = await mod.POST(req as any)
    const out = await parseJson(res as any)
    expect(mockPrisma.user.findUnique).toHaveBeenCalled()
    expect(out.status).toBe(401)
  })

  it('401 for wrong password', async () => {
    const bcrypt = (await import('bcrypt')).default as any
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'u1', email: 'a@b.com', password: 'hash' })
    bcrypt.compare.mockResolvedValueOnce(false)
    const mod = await import('@/app/api/auth/login/route')
    const req = jsonRequest('http://test/api/auth/login', 'POST', { email: 'a@b.com', password: 'x' })
    const res = await mod.POST(req as any)
    const out = await parseJson(res as any)
    expect(out.status).toBe(401)
  })

  it('200 success returns token and user', async () => {
    const bcrypt = (await import('bcrypt')).default as any
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'u1', email: 'a@b.com', password: 'hash' })
    bcrypt.compare.mockResolvedValueOnce(true)
    const mod = await import('@/app/api/auth/login/route')
    const req = jsonRequest('http://test/api/auth/login', 'POST', { email: 'a@b.com', password: 'x' })
    const res = await mod.POST(req as any)
    const { status, json } = await parseJson(res as any)
    expect(status).toBe(200)
    expect(json.token).toBe('test.jwt.token')
    expect(json.user.email).toBe('a@b.com')
    expect(json.user.role).toBe('PASSENGER')
    expect(json.user.isVerified).toBe(false)
  })
})

describe('Auth Verify API', () => {
  it('401 when no Authorization header', async () => {
    const mod = await import('@/app/api/auth/verify/route')
    authMock.getAuthFromHeader.mockReturnValueOnce(null)
    const req = jsonRequest('http://test/api/auth/verify', 'GET')
    const res = await mod.GET(req as any)
    const out = await parseJson(res as any)
    expect(out.status).toBe(401)
  })

  it('401 when user not found', async () => {
    const mod = await import('@/app/api/auth/verify/route')
    authMock.getAuthFromHeader.mockReturnValueOnce({ userId: 'u1' })
    mockPrisma.user.findUnique.mockResolvedValueOnce(null)
    const req = jsonRequest('http://test/api/auth/verify', 'GET', undefined, { authorization: 'Bearer x' })
    const res = await mod.GET(req as any)
    const out = await parseJson(res as any)
    expect(out.status).toBe(401)
  })

  it('200 returns user with role and verification', async () => {
    const mod = await import('@/app/api/auth/verify/route')
    authMock.getAuthFromHeader.mockReturnValueOnce({ userId: 'u2' })
    mockPrisma.user.findUnique
      .mockResolvedValueOnce({ id: 'u2', email: 'x@y.com', name: 'X', phone: '123', createdAt: new Date() })
      .mockResolvedValueOnce({ id: 'u2', role: 'DRIVER', isVerified: true })
    const req = jsonRequest('http://test/api/auth/verify', 'GET', undefined, { authorization: 'Bearer x' })
    const res = await mod.GET(req as any)
    const { status, json } = await parseJson(res as any)
    expect(status).toBe(200)
    expect(json.user.role).toBe('DRIVER')
    expect(json.user.isVerified).toBe(true)
  })
})

describe('Register API', () => {
  it('400 when user exists', async () => {
    const bcrypt = (await import('bcrypt')).default as any
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'u1' })
    const mod = await import('@/app/api/users/register/route')
    const req = jsonRequest('http://test/api/users/register', 'POST', { email: 'a@b.com', password: 'p', name: 'A', phone: '1' })
    const res = await mod.POST(req as any)
    const out = await parseJson(res as any)
    expect(out.status).toBe(400)
    expect(bcrypt.hash).not.toHaveBeenCalled()
  })

  it('201 creates user without password in response', async () => {
    const bcrypt = (await import('bcrypt')).default as any
    mockPrisma.user.findUnique.mockResolvedValueOnce(null)
    bcrypt.hash.mockResolvedValueOnce('hashed')
    mockPrisma.user.create.mockResolvedValueOnce({ id: 'u1', email: 'a@b.com', name: 'A', phone: '1' })
    const mod = await import('@/app/api/users/register/route')
    const req = jsonRequest('http://test/api/users/register', 'POST', { email: 'a@b.com', password: 'p', name: 'A', phone: '1' })
    const res = await mod.POST(req as any)
    const { status, json } = await parseJson(res as any)
    expect(status).toBe(201)
    expect(json.password).toBeUndefined()
    expect(json.email).toBe('a@b.com')
  })
})

describe('Cars API', () => {
  it('GET returns available cars', async () => {
    mockPrisma.car.findMany.mockResolvedValueOnce([{ id: 'c1', available: true }])
    const mod = await import('@/app/api/cars/route')
    const res = await mod.GET()
    const { status, json } = await parseJson(res as any)
    expect(status).toBe(200)
    expect(Array.isArray(json)).toBe(true)
    expect(json[0].id).toBe('c1')
  })

  it('POST 401 without auth', async () => {
    const mod = await import('@/app/api/cars/route')
    authMock.getAuthFromHeader.mockReturnValueOnce(null)
    const req = jsonRequest('http://test/api/cars', 'POST', { make: 'T', model: '3', year: 2020, color: 'red', pricePerDay: 1000, location: 'BLR' })
    const res = await mod.POST(req as any)
    const out = await parseJson(res as any)
    expect(out.status).toBe(401)
  })

  it('POST 403 for non-driver or unverified', async () => {
    const mod = await import('@/app/api/cars/route')
    authMock.getAuthFromHeader.mockReturnValueOnce({ userId: 'u1' })
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'u1', role: 'PASSENGER', isVerified: false })
    const req = jsonRequest('http://test/api/cars', 'POST', { make: 'T', model: '3', year: 2020, color: 'red', pricePerDay: 1000, location: 'BLR' })
    const res = await mod.POST(req as any)
    const out = await parseJson(res as any)
    expect(out.status).toBe(403)
  })

  it('POST 400 for missing fields', async () => {
    const mod = await import('@/app/api/cars/route')
    authMock.getAuthFromHeader.mockReturnValueOnce({ userId: 'u1' })
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'u1', role: 'DRIVER', isVerified: true })
    const req = jsonRequest('http://test/api/cars', 'POST', { make: 'T' })
    const res = await mod.POST(req as any)
    const out = await parseJson(res as any)
    expect(out.status).toBe(400)
  })

  it('POST 201 creates car', async () => {
    const mod = await import('@/app/api/cars/route')
    authMock.getAuthFromHeader.mockReturnValueOnce({ userId: 'u1' })
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'u1', role: 'DRIVER', isVerified: true })
    mockPrisma.car.create.mockResolvedValueOnce({ id: 'c1', make: 'T' })
    const req = jsonRequest('http://test/api/cars', 'POST', { make: 'T', model: '3', year: 2020, color: 'red', pricePerDay: 1000, location: 'BLR' })
    const res = await mod.POST(req as any)
    const { status, json } = await parseJson(res as any)
    expect(status).toBe(201)
    expect(json.id).toBe('c1')
  })
})

describe('Rides API', () => {
  it('POST 401 missing token', async () => {
    const mod = await import('@/app/api/rides/route')
    const req = jsonRequest('http://test/api/rides', 'POST', { pickupLocation: 'A' })
    const res = await mod.POST(req as any)
    const out = await parseJson(res as any)
    expect(out.status).toBe(401)
  })

  it('POST 401 invalid token', async () => {
    const mod = await import('@/app/api/rides/route')
    authMock.verifyToken.mockReturnValueOnce(null)
    const req = jsonRequest('http://test/api/rides', 'POST', { pickupLocation: 'A' }, { authorization: 'Bearer bad' })
    const res = await mod.POST(req as any)
    const out = await parseJson(res as any)
    expect(out.status).toBe(401)
  })

  it('POST 201 creates ride with fare and status', async () => {
    const mod = await import('@/app/api/rides/route')
    authMock.verifyToken.mockReturnValueOnce({ userId: 'u1' })
    mockPrisma.ride.create.mockResolvedValueOnce({ id: 'r1', fare: 100, status: 'SEARCHING', passenger: { id: 'u1' } })
    const req = jsonRequest('http://test/api/rides', 'POST', {
      pickupLocation: 'A', pickupLat: 12.9, pickupLng: 77.6,
      dropoffLocation: 'B', dropoffLat: 13.0, dropoffLng: 77.7,
    }, { authorization: 'Bearer good' })
    const res = await mod.POST(req as any)
    const { status, json } = await parseJson(res as any)
    expect(status).toBe(201)
    expect(json.status).toBe('SEARCHING')
  })

  it('GET returns available rides for driver', async () => {
    const mod = await import('@/app/api/rides/route')
    authMock.verifyToken.mockReturnValueOnce({ userId: 'd1' })
    mockPrisma.ride.findMany.mockResolvedValueOnce([{ id: 'r1', status: 'SEARCHING', driverId: null }])
    const req = new Request('http://test/api/rides?type=available', { headers: { authorization: 'Bearer x' } })
    const res = await mod.GET(req as any)
    const { status, json } = await parseJson(res as any)
    expect(status).toBe(200)
    expect(json[0].status).toBe('SEARCHING')
  })
})

describe('Bookings API', () => {
  it('GET 401 unauthorized', async () => {
    const mod = await import('@/app/api/bookings/route')
    authMock.getAuthFromHeader.mockReturnValueOnce(null)
    const req = jsonRequest('http://test/api/bookings', 'GET')
    const res = await mod.GET(req as any)
    const out = await parseJson(res as any)
    expect(out.status).toBe(401)
  })

  it('POST car booking uses hourly rate when present', async () => {
    const mod = await import('@/app/api/bookings/route')
    authMock.getAuthFromHeader.mockReturnValueOnce({ userId: 'u1' })
    mockPrisma.car.findUnique.mockResolvedValueOnce({ id: 'c1', hourlyRate: 100, pricePerDay: 1000 })
    mockPrisma.booking.create.mockResolvedValueOnce({ id: 'b1' })
    const now = new Date('2024-01-01T00:00:00Z')
    const later = new Date('2024-01-01T03:30:00Z')
    const req = jsonRequest('http://test/api/bookings', 'POST', { carId: 'c1', startDate: now, endDate: later })
    const res = await mod.POST(req as any)
    const { status } = await parseJson(res as any)
    expect(status).toBe(201)
    expect(mockPrisma.booking.create).toHaveBeenCalled()
    expect(mockPrisma.car.update).toHaveBeenCalledWith({ where: { id: 'c1' }, data: { available: false } })
  })

  it('POST car booking requires endDate', async () => {
    const mod = await import('@/app/api/bookings/route')
    authMock.getAuthFromHeader.mockReturnValueOnce({ userId: 'u1' })
    mockPrisma.car.findUnique.mockResolvedValueOnce({ id: 'c1', pricePerDay: 1000, hourlyRate: null })
    const req = jsonRequest('http://test/api/bookings', 'POST', { carId: 'c1', startDate: new Date().toISOString() })
    const res = await mod.POST(req as any)
    const out = await parseJson(res as any)
    expect(out.status).toBe(400)
  })

  it('POST car booking 404 when car not found', async () => {
    const mod = await import('@/app/api/bookings/route')
    authMock.getAuthFromHeader.mockReturnValueOnce({ userId: 'u1' })
    mockPrisma.car.findUnique.mockResolvedValueOnce(null)
    const req = jsonRequest('http://test/api/bookings', 'POST', { carId: 'missing', startDate: new Date().toISOString(), endDate: new Date().toISOString() })
    const res = await mod.POST(req as any)
    const out = await parseJson(res as any)
    expect(out.status).toBe(404)
  })

  it('POST carpool booking decrements seats', async () => {
    const mod = await import('@/app/api/bookings/route')
    authMock.getAuthFromHeader.mockReturnValueOnce({ userId: 'u1' })
    mockPrisma.carpool.findUnique.mockResolvedValueOnce({ id: 'cp1', pricePerSeat: 250 })
    mockPrisma.booking.create.mockResolvedValueOnce({ id: 'b2' })
    const req = jsonRequest('http://test/api/bookings', 'POST', { carpoolId: 'cp1', startDate: new Date().toISOString() })
    const res = await mod.POST(req as any)
    const { status } = await parseJson(res as any)
    expect(status).toBe(201)
    expect(mockPrisma.carpool.update).toHaveBeenCalledWith({ where: { id: 'cp1' }, data: { availableSeats: { decrement: 1 } } })
  })

  it('GET returns user bookings', async () => {
    const mod = await import('@/app/api/bookings/route')
    authMock.getAuthFromHeader.mockReturnValueOnce({ userId: 'u1' })
    mockPrisma.booking.findMany.mockResolvedValueOnce([{ id: 'b1' }])
    const req = jsonRequest('http://test/api/bookings', 'GET', undefined, { authorization: 'Bearer good' })
    const res = await mod.GET(req as any)
    const { status, json } = await parseJson(res as any)
    expect(status).toBe(200)
    expect(json[0].id).toBe('b1')
  })
})
