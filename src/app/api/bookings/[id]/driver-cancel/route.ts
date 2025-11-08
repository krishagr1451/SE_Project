import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

function verifyAuth(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any
    return { userId: decoded.userId, role: decoded.role }
  } catch (error) {
    return null
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = verifyAuth(req)
    if (!auth) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    // Only drivers can cancel bookings from driver dashboard
    if (auth.role !== 'DRIVER') {
      return NextResponse.json({ 
        error: 'only drivers can cancel rental bookings' 
      }, { status: 403 })
    }

    const { id: bookingId } = await params

    // Check if booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        car: {
          include: {
            owner: true
          }
        },
        user: true
      }
    })

    if (!booking) {
      return NextResponse.json({ error: 'booking not found' }, { status: 404 })
    }

    // Verify the driver is the car owner
    if (!booking.car || booking.car.ownerId !== auth.userId) {
      return NextResponse.json({ 
        error: 'you can only cancel bookings for your own cars' 
      }, { status: 403 })
    }

    // Check if booking can be cancelled (case-insensitive check)
    const upperStatus = booking.status.toUpperCase()
    if (!['PENDING', 'ACTIVE', 'CONFIRMED'].includes(upperStatus)) {
      return NextResponse.json({ 
        error: `cannot cancel booking with status: ${booking.status}` 
      }, { status: 400 })
    }

    // Cancel the car rental booking
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' }
    })

    console.log(`🚫 Driver ${auth.userId} cancelled car rental booking ${bookingId} for user ${booking.user.name}`)

    return NextResponse.json({ 
      message: 'car rental booking cancelled successfully',
      booking: {
        id: booking.id,
        status: 'CANCELLED'
      }
    })
  } catch (error) {
    console.error('Error canceling car rental booking:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Detailed error:', errorMessage)
    return NextResponse.json({ 
      error: 'internal error', 
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined 
    }, { status: 500 })
  }
}
