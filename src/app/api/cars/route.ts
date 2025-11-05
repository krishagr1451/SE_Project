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
    if (!auth) {
      console.log('❌ No auth found in header')
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 })
    }

    console.log('✅ Auth found:', auth)

    // Ensure driver and verified
    const user = await prisma.user.findUnique({ where: { id: auth.userId } })
    
    if (!user) {
      console.log('❌ User not found:', auth.userId)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('✅ User found:', { id: user.id, role: (user as any)?.role, isVerified: (user as any)?.isVerified })

    const role = (user as any)?.role ?? 'PASSENGER'
    const isVerified = (user as any)?.isVerified ?? false
    
    if (role !== 'DRIVER') {
      console.log('❌ User is not a driver, role:', role)
      return NextResponse.json({ error: 'Only drivers can add cars. Please register as a driver.' }, { status: 403 })
    }
    
    if (!isVerified) {
      console.log('❌ Driver is not verified')
      return NextResponse.json({ error: 'Your driver account is not verified yet. Please wait for admin approval.' }, { status: 403 })
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
    console.log('✅ Car created:', car.id)
    return NextResponse.json(car, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating car:', error)
    return NextResponse.json({ error: 'Failed to create car' }, { status: 500 })
  }
}
