import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromHeader } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')

    // If requesting "mycarpools", authentication is required
    if (type === 'mycarpools') {
      const auth = getAuthFromHeader(req.headers.get('authorization'))
      if (!auth) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
      }

      // Get only carpools created by this driver
      const carpools = await prisma.carpool.findMany({
        where: { driverId: auth.userId },
        include: {
          driver: {
            select: { id: true, name: true, email: true, phone: true }
          },
          bookings: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json(carpools)
    }

    // Public endpoint - get all available carpools
    const carpools = await prisma.carpool.findMany({
      where: {
        departureTime: { gte: new Date() },
        availableSeats: { gt: 0 },
      },
      include: { driver: { select: { name: true, email: true, phone: true } } },
      orderBy: { departureTime: 'asc' },
    })
    return NextResponse.json(carpools)
  } catch (error) {
    console.error('[Carpool API] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch carpools' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromHeader(request.headers.get('authorization'))
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { from, to, departureTime, availableSeats, pricePerSeat, description } = body

    const carpool = await prisma.carpool.create({
      data: {
        from,
        to,
        departureTime: new Date(departureTime),
        availableSeats: parseInt(availableSeats),
        pricePerSeat: parseFloat(pricePerSeat),
        description,
        driverId: auth.userId,
      },
    })
    return NextResponse.json(carpool, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create carpool' }, { status: 500 })
  }
}
