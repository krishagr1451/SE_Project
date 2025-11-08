import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromHeader } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromHeader(request.headers.get('authorization'))
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    let bookings

    if (type === 'owner') {
      // Get bookings for cars owned by the current user (driver view)
      bookings = await prisma.booking.findMany({
        where: {
          car: {
            ownerId: auth.userId
          }
        },
        include: {
          car: {
            include: {
              owner: {
                select: { id: true, name: true, email: true, phone: true }
              }
            }
          },
          carpool: {
            include: {
              driver: {
                select: { id: true, name: true, email: true }
              }
            }
          },
          user: {
            select: { id: true, name: true, email: true, phone: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    } else {
      // Get bookings made by the current user (passenger/renter view)
      bookings = await prisma.booking.findMany({
        where: { userId: auth.userId },
        include: {
          car: {
            include: {
              owner: {
                select: { id: true, name: true, email: true, phone: true }
              }
            }
          },
          carpool: {
            include: {
              driver: {
                select: { id: true, name: true, email: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
      })
    }

    return NextResponse.json(bookings)
  } catch (error) {
    console.error('[Bookings API] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromHeader(request.headers.get('authorization'))
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { carId, carpoolId, startDate, endDate } = body

    if (!carId && !carpoolId) {
      return NextResponse.json({ error: 'carId or carpoolId is required' }, { status: 400 })
    }

    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : null

    let totalPrice = 0

    if (carId) {
      const car = await prisma.car.findUnique({ where: { id: carId } })
      if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 })
      if (!end) return NextResponse.json({ error: 'endDate required for car bookings' }, { status: 400 })

      const ms = end.getTime() - start.getTime()
      const hourlyRate = (car as any).hourlyRate as number | null
      const pricePerDay = (car as any).pricePerDay as number
      if (hourlyRate && hourlyRate > 0) {
        const hours = Math.max(1, Math.ceil(ms / (1000 * 60 * 60)))
        totalPrice = hours * hourlyRate
      } else {
        const days = Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)))
        totalPrice = days * pricePerDay
      }
    }

    if (carpoolId) {
      const carpool = await prisma.carpool.findUnique({ where: { id: carpoolId } })
      if (!carpool) return NextResponse.json({ error: 'Carpool not found' }, { status: 404 })
      totalPrice = (carpool as any).pricePerSeat as number
    }

    const booking = await prisma.booking.create({
      data: {
        userId: auth.userId,
        carId: carId || null,
        carpoolId: carpoolId || null,
        startDate: start,
        endDate: end,
        totalPrice,
        status: 'pending',
      },
    })

    if (carpoolId) {
      await prisma.carpool.update({
        where: { id: carpoolId },
        data: { availableSeats: { decrement: 1 } },
      })
    }

    if (carId) {
      await prisma.car.update({
        where: { id: carId },
        data: { available: false },
      })
    }

    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
  }
}
