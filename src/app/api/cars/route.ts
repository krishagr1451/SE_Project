import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromHeader } from '@/lib/auth'

export async function GET() {
  try {
    const cars = await prisma.car.findMany({
      where: { available: true },
      include: { owner: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(cars)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch cars' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromHeader(request.headers.get('authorization'))
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Ensure driver and verified
    const user = await prisma.user.findUnique({ where: { id: auth.userId } })
    const role = (user as any)?.role ?? 'PASSENGER'
    const isVerified = (user as any)?.isVerified ?? false
    if (role !== 'DRIVER' || !isVerified) {
      return NextResponse.json({ error: 'Only verified drivers can add cars' }, { status: 403 })
    }

    const body = await request.json()
    const { make, model, year, color, pricePerDay, hourlyRate, location, description, imageUrl, licensePlate } = body

    if (!make || !model || !year || !color || (!pricePerDay && !hourlyRate) || !location) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const data: any = {
      make,
      model,
      year: parseInt(year),
      color,
      pricePerDay: pricePerDay ? parseFloat(pricePerDay) : 0,
      hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
      location,
      description,
      imageUrl,
      licensePlate,
      ownerId: auth.userId,
    }

    const car = await prisma.car.create({ data })
    return NextResponse.json(car, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create car' }, { status: 500 })
  }
}
