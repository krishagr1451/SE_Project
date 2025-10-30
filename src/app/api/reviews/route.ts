import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromHeader } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const carId = searchParams.get('carId')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = Math.min(50, parseInt(searchParams.get('pageSize') || '10'))

    if (!carId) return NextResponse.json({ error: 'carId required' }, { status: 400 })

    const db: any = prisma as any
    const [items, total] = await Promise.all([
      db.review.findMany({
        where: { carId },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.review.count({ where: { carId } }),
    ])

    return NextResponse.json({ items, total, page, pageSize })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromHeader(request.headers.get('authorization'))
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { bookingId, rating, comment } = await request.json()
    if (!bookingId || !rating) return NextResponse.json({ error: 'bookingId and rating are required' }, { status: 400 })

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    if (booking.userId !== auth.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (!booking.carId) return NextResponse.json({ error: 'Only car bookings can be reviewed' }, { status: 400 })

    const safeRating = Math.max(1, Math.min(5, Number(rating)))

    const db: any = prisma as any
    const review = await db.review.create({
      data: {
        bookingId: booking.id,
        userId: auth.userId,
        carId: booking.carId,
        rating: safeRating,
        comment: comment || null,
      } as any,
    })

    return NextResponse.json(review, { status: 201 })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'You have already reviewed this booking' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
  }
}
