import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromHeader } from '@/lib/auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthFromHeader(req.headers.get('authorization'))
    if (!auth) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const { id: carpoolId } = await params

    // Check if carpool exists
    const carpool = await prisma.carpool.findUnique({
      where: { id: carpoolId },
      include: {
        bookings: {
          select: {
            id: true,
            userId: true
          }
        }
      }
    })

    if (!carpool) {
      return NextResponse.json({ error: 'carpool not found' }, { status: 404 })
    }

    // Verify the user is the driver who created this carpool
    if (carpool.driverId !== auth.userId) {
      return NextResponse.json({ 
        error: 'you can only cancel carpools you created' 
      }, { status: 403 })
    }

    // Check if carpool has already passed
    if (new Date(carpool.departureTime) < new Date()) {
      return NextResponse.json({ 
        error: 'cannot cancel carpool that has already departed' 
      }, { status: 400 })
    }

    // Delete carpool and cancel all associated bookings
    await prisma.$transaction(async (tx) => {
      // Cancel all bookings associated with this carpool
      if (carpool.bookings && carpool.bookings.length > 0) {
        await tx.booking.updateMany({
          where: { carpoolId: carpoolId },
          data: { status: 'cancelled' }
        })
      }

      // Delete the carpool
      await tx.carpool.delete({
        where: { id: carpoolId }
      })
    })

    console.log(`🚫 Driver ${auth.userId} cancelled carpool ${carpoolId} and ${carpool.bookings?.length || 0} bookings`)

    return NextResponse.json({ 
      message: 'carpool and all bookings cancelled successfully',
      bookingsCancelled: carpool.bookings?.length || 0
    })
  } catch (error) {
    console.error('Error canceling carpool:', error)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
