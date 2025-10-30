import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromHeader } from '@/lib/auth'

export async function GET() {
  try {
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
