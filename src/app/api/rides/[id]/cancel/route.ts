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

    const { id: rideId } = await params

    // Check if ride exists
    const ride = await prisma.ride.findUnique({
      where: { id: rideId }
    })

    if (!ride) {
      return NextResponse.json({ error: 'ride not found' }, { status: 404 })
    }

    // Verify the user is the passenger who booked this ride
    if (ride.passengerId !== auth.userId) {
      return NextResponse.json({ 
        error: 'you can only cancel your own ride requests' 
      }, { status: 403 })
    }

    // Check if ride can be cancelled by passenger
    if (!['SEARCHING', 'ACCEPTED', 'PENDING'].includes(ride.status)) {
      return NextResponse.json({ 
        error: `cannot cancel ride with status: ${ride.status}` 
      }, { status: 400 })
    }

    // Cancel the ride
    const updatedRide = await prisma.ride.update({
      where: { id: rideId },
      data: { 
        status: 'CANCELLED'
      }
    })

    console.log(`🚫 Passenger ${auth.userId} cancelled ride ${rideId}`)

    return NextResponse.json({ 
      message: 'ride cancelled successfully',
      ride: updatedRide 
    })
  } catch (error) {
    console.error('Error canceling ride:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Detailed error:', errorMessage)
    return NextResponse.json({ 
      error: 'internal error', 
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined 
    }, { status: 500 })
  }
}
