import express, { Express, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import path from 'path'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') })

// Initialize Prisma Client
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// Initialize Express app
const app: Express = express()
const PORT = process.env.PORT || 4000
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

// Types
interface AuthRequest extends Request {
  userId?: string
  userEmail?: string
  body: any
  params: any
  query: any
  headers: any
}

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
  phone: z.string().optional(),
  role: z.enum(['PASSENGER', 'DRIVER', 'ADMIN']).optional(),
  licenseNumber: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

const carSchema = z.object({
  make: z.string(),
  model: z.string(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  color: z.string(),
  pricePerDay: z.number().positive(),
  hourlyRate: z.number().positive().optional(),
  location: z.string(),
  licensePlate: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
})

const carpoolSchema = z.object({
  from: z.string(),
  to: z.string(),
  departureTime: z.string().datetime(),
  availableSeats: z.number().int().positive(),
  pricePerSeat: z.number().positive(),
  description: z.string().optional(),
})

const rideSchema = z.object({
  pickupLocation: z.string(),
  pickupLat: z.number().optional(),
  pickupLng: z.number().optional(),
  dropoffLocation: z.string(),
  dropoffLat: z.number().optional(),
  dropoffLng: z.number().optional(),
  paymentMethod: z.string().optional(),
})

// Authentication middleware
const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string }
    req.userId = decoded.userId
    req.userEmail = decoded.email
    next()
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' })
  }
}

// Error handling middleware
const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err)
  
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.issues,
    })
  }

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  })
}

// ==================== AUTH ROUTES ====================

// Register new user
app.post('/api/auth/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = registerSchema.parse(req.body)
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        password: hashedPassword,
        phone: validatedData.phone || null,
        role: validatedData.role || 'PASSENGER',
        licenseNumber: validatedData.licenseNumber || null,
        isVerified: false,
      },
    })

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        isVerified: user.isVerified,
      },
    })
  } catch (error) {
    next(error)
  }
})

// Login
app.post('/api/auth/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = loginSchema.parse(req.body)

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Check password
    const validPassword = await bcrypt.compare(validatedData.password, user.password)
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        isVerified: user.isVerified,
        licenseNumber: user.licenseNumber,
      },
    })
  } catch (error) {
    next(error)
  }
})

// Google OAuth
app.post('/api/auth/google', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { credential } = req.body

    if (!credential) {
      return res.status(400).json({ error: 'No credential provided' })
    }

    // Decode Google JWT token
    const decodedToken: any = jwt.decode(credential)

    if (!decodedToken || !decodedToken.email) {
      return res.status(400).json({ error: 'Invalid token' })
    }

    const { email, name, picture, sub: googleId } = decodedToken

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          password: '', // No password for OAuth users
          phone: null,
          role: 'PASSENGER',
          isVerified: true,
        },
      })
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      message: 'Google login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        isVerified: user.isVerified,
      },
    })
  } catch (error) {
    next(error)
  }
})

// Verify token
app.get('/api/auth/verify', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        isVerified: true,
        licenseNumber: true,
      },
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ user })
  } catch (error) {
    next(error)
  }
})

// ==================== CAR ROUTES ====================

// Get all cars
app.get('/api/cars', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { available, location, minPrice, maxPrice } = req.query

    const where: any = {}
    
    if (available === 'true') {
      where.available = true
    }
    
    if (location) {
      where.location = {
        contains: location as string,
        mode: 'insensitive',
      }
    }

    if (minPrice || maxPrice) {
      where.pricePerDay = {}
      if (minPrice) where.pricePerDay.gte = parseFloat(minPrice as string)
      if (maxPrice) where.pricePerDay.lte = parseFloat(maxPrice as string)
    }

    const cars = await prisma.car.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ cars })
  } catch (error) {
    next(error)
  }
})

// Get single car
app.get('/api/cars/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const car = await prisma.car.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            licenseNumber: true,
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    if (!car) {
      return res.status(404).json({ error: 'Car not found' })
    }

    res.json({ car })
  } catch (error) {
    next(error)
  }
})

// Create car (authenticated)
app.post('/api/cars', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = carSchema.parse(req.body)

    const car = await prisma.car.create({
      data: {
        ...validatedData,
        ownerId: req.userId!,
        status: 'AVAILABLE',
        available: true,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    res.status(201).json({
      message: 'Car added successfully',
      car,
    })
  } catch (error) {
    next(error)
  }
})

// Update car (authenticated, owner only)
app.patch('/api/cars/:id', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const car = await prisma.car.findUnique({
      where: { id },
    })

    if (!car) {
      return res.status(404).json({ error: 'Car not found' })
    }

    if (car.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to update this car' })
    }

    const validatedData = carSchema.partial().parse(req.body)

    const updatedCar = await prisma.car.update({
      where: { id },
      data: validatedData,
    })

    res.json({
      message: 'Car updated successfully',
      car: updatedCar,
    })
  } catch (error) {
    next(error)
  }
})

// Delete car (authenticated, owner only)
app.delete('/api/cars/:id', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const car = await prisma.car.findUnique({
      where: { id },
    })

    if (!car) {
      return res.status(404).json({ error: 'Car not found' })
    }

    if (car.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this car' })
    }

    await prisma.car.delete({
      where: { id },
    })

    res.json({ message: 'Car deleted successfully' })
  } catch (error) {
    next(error)
  }
})

// ==================== CARPOOL ROUTES ====================

// Get all carpools
app.get('/api/carpool', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to, date } = req.query

    const where: any = {}

    if (from) {
      where.from = {
        contains: from as string,
        mode: 'insensitive',
      }
    }

    if (to) {
      where.to = {
        contains: to as string,
        mode: 'insensitive',
      }
    }

    if (date) {
      const startDate = new Date(date as string)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 1)

      where.departureTime = {
        gte: startDate,
        lt: endDate,
      }
    }

    const carpools = await prisma.carpool.findMany({
      where,
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            licenseNumber: true,
          },
        },
      },
      orderBy: { departureTime: 'asc' },
    })

    res.json({ carpools })
  } catch (error) {
    next(error)
  }
})

// Get single carpool
app.get('/api/carpool/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const carpool = await prisma.carpool.findUnique({
      where: { id },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            licenseNumber: true,
          },
        },
        bookings: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    if (!carpool) {
      return res.status(404).json({ error: 'Carpool not found' })
    }

    res.json({ carpool })
  } catch (error) {
    next(error)
  }
})

// Create carpool (authenticated, drivers only)
app.post('/api/carpool', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    })

    if (user?.role !== 'DRIVER') {
      return res.status(403).json({ error: 'Only drivers can create carpools' })
    }

    const validatedData = carpoolSchema.parse(req.body)

    const carpool = await prisma.carpool.create({
      data: {
        ...validatedData,
        departureTime: new Date(validatedData.departureTime),
        driverId: req.userId!,
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    })

    res.status(201).json({
      message: 'Carpool created successfully',
      carpool,
    })
  } catch (error) {
    next(error)
  }
})

// ==================== RIDE ROUTES ====================

// Calculate fare based on distance
function calculateFare(distance: number): number {
  const baseFare = 50 // ₹50 base fare
  const perKmRate = 15 // ₹15 per km
  return Math.round(baseFare + (distance * perKmRate))
}

// Calculate distance using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Get rides
app.get('/api/rides', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { type } = req.query

    let where: any = {}

    if (type === 'myrides') {
      where.passengerId = req.userId
    } else if (type === 'driverrides') {
      where.driverId = req.userId
    } else if (type === 'available') {
      where.status = 'SEARCHING'
      where.driverId = null
    }

    const rides = await prisma.ride.findMany({
      where,
      include: {
        passenger: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            licenseNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ rides })
  } catch (error) {
    next(error)
  }
})

// Get single ride
app.get('/api/rides/:id', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const ride = await prisma.ride.findUnique({
      where: { id },
      include: {
        passenger: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            licenseNumber: true,
          },
        },
      },
    })

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' })
    }

    res.json({ ride })
  } catch (error) {
    next(error)
  }
})

// Create ride booking
app.post('/api/rides', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = rideSchema.parse(req.body)

    let fare = 0
    let distance = 0
    let estimatedTime = 0

    if (validatedData.pickupLat && validatedData.pickupLng &&
        validatedData.dropoffLat && validatedData.dropoffLng) {
      distance = calculateDistance(
        validatedData.pickupLat,
        validatedData.pickupLng,
        validatedData.dropoffLat,
        validatedData.dropoffLng
      )
      fare = calculateFare(distance)
      estimatedTime = Math.round(distance * 2.5) // Rough estimate: 2.5 min per km
    }

    const ride = await prisma.ride.create({
      data: {
        passengerId: req.userId!,
        pickupLocation: validatedData.pickupLocation,
        pickupLat: validatedData.pickupLat,
        pickupLng: validatedData.pickupLng,
        dropoffLocation: validatedData.dropoffLocation,
        dropoffLat: validatedData.dropoffLat,
        dropoffLng: validatedData.dropoffLng,
        fare,
        distance,
        estimatedTime,
        status: 'SEARCHING',
        paymentMethod: validatedData.paymentMethod || 'cash',
      },
      include: {
        passenger: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    })

    res.status(201).json({
      message: 'Ride booked successfully',
      ride,
    })
  } catch (error) {
    next(error)
  }
})

// Update ride status
app.patch('/api/rides/:id', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { action } = req.body

    const ride = await prisma.ride.findUnique({
      where: { id },
    })

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' })
    }

    let updateData: any = {}

    switch (action) {
      case 'accept':
        if (ride.status !== 'SEARCHING') {
          return res.status(400).json({ error: 'Ride already accepted' })
        }
        updateData = {
          driverId: req.userId,
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        }
        break

      case 'arrive':
        if (ride.driverId !== req.userId) {
          return res.status(403).json({ error: 'Unauthorized' })
        }
        if (ride.status !== 'ACCEPTED') {
          return res.status(400).json({ error: 'Invalid status transition' })
        }
        updateData = { status: 'ARRIVED' }
        break

      case 'start':
        if (ride.driverId !== req.userId) {
          return res.status(403).json({ error: 'Unauthorized' })
        }
        if (ride.status !== 'ARRIVED') {
          return res.status(400).json({ error: 'Invalid status transition' })
        }
        updateData = {
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        }
        break

      case 'complete':
        if (ride.driverId !== req.userId) {
          return res.status(403).json({ error: 'Unauthorized' })
        }
        if (ride.status !== 'IN_PROGRESS') {
          return res.status(400).json({ error: 'Invalid status transition' })
        }
        updateData = {
          status: 'COMPLETED',
          completedAt: new Date(),
        }
        break

      case 'cancel':
        if (ride.passengerId !== req.userId && ride.driverId !== req.userId) {
          return res.status(403).json({ error: 'Unauthorized' })
        }
        if (ride.status === 'COMPLETED') {
          return res.status(400).json({ error: 'Cannot cancel completed ride' })
        }
        updateData = { status: 'CANCELLED' }
        break

      default:
        return res.status(400).json({ error: 'Invalid action' })
    }

    const updatedRide = await prisma.ride.update({
      where: { id },
      data: updateData,
      include: {
        passenger: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            licenseNumber: true,
          },
        },
      },
    })

    res.json({
      message: 'Ride updated successfully',
      ride: updatedRide,
    })
  } catch (error) {
    next(error)
  }
})

// ==================== BOOKING ROUTES ====================

// Get bookings
app.get('/api/bookings', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.userId },
      include: {
        car: {
          include: {
            owner: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
        carpool: {
          include: {
            driver: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ bookings })
  } catch (error) {
    next(error)
  }
})

// Create booking
app.post('/api/bookings', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { carId, carpoolId, startDate, endDate, totalPrice } = req.body

    if (!carId && !carpoolId) {
      return res.status(400).json({ error: 'Either carId or carpoolId required' })
    }

    const booking = await prisma.booking.create({
      data: {
        userId: req.userId!,
        carId: carId || null,
        carpoolId: carpoolId || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        totalPrice,
        status: 'pending',
      },
    })

    res.status(201).json({
      message: 'Booking created successfully',
      booking,
    })
  } catch (error) {
    next(error)
  }
})

// Update booking status
app.patch('/api/bookings/:id', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const booking = await prisma.booking.findUnique({
      where: { id },
    })

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    if (booking.userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status },
    })

    res.json({
      message: 'Booking updated successfully',
      booking: updatedBooking,
    })
  } catch (error) {
    next(error)
  }
})

// ==================== REVIEW ROUTES ====================

// Create review
app.post('/api/reviews', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { bookingId, carId, rating, comment } = req.body

    if (!bookingId || !carId || !rating) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' })
    }

    const review = await prisma.review.create({
      data: {
        bookingId,
        userId: req.userId!,
        carId,
        rating,
        comment: comment || null,
      },
    })

    res.status(201).json({
      message: 'Review submitted successfully',
      review,
    })
  } catch (error) {
    next(error)
  }
})

// ==================== WALLET ROUTES ====================

// Get wallet
app.get('/api/wallet', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let wallet = await prisma.wallet.findUnique({
      where: { userId: req.userId! },
    })

    // Create wallet if it doesn't exist
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: req.userId!,
          balance: 0,
        },
      })
    }

    res.json({ wallet })
  } catch (error) {
    next(error)
  }
})

// Add money to wallet
app.post('/api/wallet/add', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { amount } = req.body

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' })
    }

    // Get or create wallet
    let wallet = await prisma.wallet.findUnique({
      where: { userId: req.userId! },
    })

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: req.userId!,
          balance: 0,
        },
      })
    }

    // Update wallet balance
    const updatedWallet = await prisma.wallet.update({
      where: { userId: req.userId! },
      data: {
        balance: wallet.balance + amount,
      },
    })

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId: req.userId!,
        amount,
        type: 'CREDIT',
        description: 'Money added to wallet',
      },
    })

    res.json({
      message: 'Money added successfully',
      wallet: updatedWallet,
    })
  } catch (error) {
    next(error)
  }
})

// Get transactions
app.get('/api/wallet/transactions', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to last 50 transactions
    })

    res.json({ transactions })
  } catch (error) {
    next(error)
  }
})

// ==================== GEOCODE ROUTE ====================

app.get('/api/geocode', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query } = req.query

    if (!query) {
      return res.status(400).json({ error: 'Query parameter required' })
    }

    // Using Nominatim (OpenStreetMap) API
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query as string)}`
    )

    const data = await response.json()

    res.json({ results: data })
  } catch (error) {
    next(error)
  }
})

// ==================== HEALTH CHECK ====================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'RideIndia Backend API',
    version: '1.0.0',
    endpoints: {
      auth: ['/api/auth/register', '/api/auth/login', '/api/auth/google', '/api/auth/verify'],
      cars: ['/api/cars', '/api/cars/:id'],
      carpool: ['/api/carpool', '/api/carpool/:id'],
      rides: ['/api/rides', '/api/rides/:id'],
      bookings: ['/api/bookings', '/api/bookings/:id'],
      reviews: ['/api/reviews'],
      geocode: ['/api/geocode'],
    },
  })
})

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' })
})

// Error handler (must be last)
app.use(errorHandler)

// Start server
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║     🇮🇳 RideIndia Backend Server         ║
╠════════════════════════════════════════════╣
║  Status: RUNNING                          ║
║  Port: ${PORT}                              ║
║  Environment: ${process.env.NODE_ENV || 'development'}              ║
║  Time: ${new Date().toLocaleString()}     ║
╚════════════════════════════════════════════╝
  `)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server gracefully...')
  server.close(() => {
    prisma.$disconnect()
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('\nSIGINT received, closing server gracefully...')
  server.close(() => {
    prisma.$disconnect()
    console.log('Server closed')
    process.exit(0)
  })
})

export default app
