import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// POST /api/rides - Create a new ride request (like Ola/Uber)
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const {
      pickupLocation,
      pickupLat,
      pickupLng,
      dropoffLocation,
      dropoffLat,
      dropoffLng,
      paymentMethod = 'cash'
    } = body

    // Calculate fare based on distance (basic calculation)
    const distance = calculateDistance(pickupLat, pickupLng, dropoffLat, dropoffLng)
    const baseFare = 50 // Base fare
    const perKmRate = 15 // Rate per km
    const fare = baseFare + (distance * perKmRate)
    const estimatedTime = Math.ceil(distance / 0.5) // Assuming 30 km/h average speed

    // @ts-ignore - Prisma client regeneration needed
    const ride = await prisma.ride.create({
      data: {
        passengerId: decoded.userId,
        pickupLocation,
        pickupLat,
        pickupLng,
        dropoffLocation,
        dropoffLat,
        dropoffLng,
        fare,
        distance,
        estimatedTime,
        paymentMethod,
        status: 'SEARCHING',
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

    return NextResponse.json(ride, { status: 201 })
  } catch (error) {
    console.error('Error creating ride:', error)
    return NextResponse.json({ error: 'Failed to create ride' }, { status: 500 })
  }
}

// GET /api/rides - Get rides (for driver: available rides, for passenger: their rides)
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') // 'available', 'myrides', 'driverrides'

    let rides

    if (type === 'available') {
      // Get available rides for drivers
      // @ts-ignore
      rides = await prisma.ride.findMany({
        where: {
          status: 'SEARCHING',
          driverId: null,
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
        orderBy: {
          createdAt: 'desc',
        },
      })
    } else if (type === 'driverrides') {
      // Get rides accepted/completed by this driver
      // @ts-ignore
      rides = await prisma.ride.findMany({
        where: {
          driverId: decoded.userId,
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
        orderBy: {
          createdAt: 'desc',
        },
      })
    } else {
      // Get rides for this passenger
      // @ts-ignore
      rides = await prisma.ride.findMany({
        where: {
          passengerId: decoded.userId,
        },
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
        orderBy: {
          createdAt: 'desc',
        },
      })
    }

    return NextResponse.json(rides)
  } catch (error) {
    console.error('Error fetching rides:', error)
    return NextResponse.json({ error: 'Failed to fetch rides' }, { status: 500 })
  }
}

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  return Math.round(distance * 10) / 10 // Round to 1 decimal place
}
