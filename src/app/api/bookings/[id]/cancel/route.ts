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
    return { userId: decoded.userId }
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

    const { id: bookingId } = await params

    // Check if booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        carpool: true,
        car: true
      }
    })

    if (!booking) {
      return NextResponse.json({ error: 'booking not found' }, { status: 404 })
    }

    // Verify the user is the one who made this booking
    if (booking.userId !== auth.userId) {
      return NextResponse.json({ 
        error: 'you can only cancel your own bookings' 
      }, { status: 403 })
    }

    // Check if booking can be cancelled (case-insensitive check)
    const upperStatus = booking.status.toUpperCase()
    if (!['PENDING', 'ACTIVE', 'CONFIRMED'].includes(upperStatus)) {
      return NextResponse.json({ 
        error: `cannot cancel booking with status: ${booking.status}` 
      }, { status: 400 })
    }

    // If it's a carpool booking, restore the seats
    if (booking.carpoolId && booking.carpool) {
      await prisma.$transaction([
        // Restore 1 seat to the carpool (each booking is for 1 seat)
        prisma.carpool.update({
          where: { id: booking.carpoolId },
          data: {
            availableSeats: {
              increment: 1
            }
          }
        }),
        // Cancel the booking
        prisma.booking.update({
          where: { id: bookingId },
          data: { status: 'CANCELLED' }
        })
      ])
    } else {
      // For car rentals, just cancel the booking
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' }
      })
    }

    console.log(`🚫 User ${auth.userId} cancelled booking ${bookingId}`)

    return NextResponse.json({ 
      message: 'booking cancelled successfully'
    })
  } catch (error) {
    console.error('Error canceling booking:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Detailed error:', errorMessage)
    return NextResponse.json({ 
      error: 'internal error', 
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined 
    }, { status: 500 })
  }
}
