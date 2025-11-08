import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

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
  { params }: { params: { id: string } }
) {
  try {
    const auth = verifyAuth(req)
    if (!auth) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const rideId = params.id

    // Verify user is a driver
    const user = await prisma.user.findUnique({
      where: { id: auth.userId }
    })

    if (user?.role !== 'DRIVER') {
      return NextResponse.json({ error: 'only drivers can accept rides' }, { status: 403 })
    }

    // Check if ride exists and is available
    const ride = await prisma.ride.findUnique({
      where: { id: rideId }
    })

    if (!ride) {
      return NextResponse.json({ error: 'ride not found' }, { status: 404 })
    }

    if (ride.status !== 'SEARCHING') {
      return NextResponse.json({ error: 'ride already accepted or completed' }, { status: 400 })
    }

    if (ride.driverId && ride.driverId !== auth.userId) {
      return NextResponse.json({ error: 'ride already assigned to another driver' }, { status: 400 })
    }

    // Update ride with driver and change status to ACCEPTED
    const updatedRide = await prisma.ride.update({
      where: { id: rideId },
      data: {
        driverId: auth.userId,
        status: 'ACCEPTED'
      },
      include: {
        passenger: { 
          select: { 
            id: true,
            name: true, 
            email: true,
            phone: true
          } 
        },
        driver: { 
          select: { 
            id: true,
            name: true, 
            email: true, 
            phone: true 
          } 
        }
      }
    })

    // TODO: Send notification to passenger (email/push notification)
    console.log(`✅ Ride ${rideId} accepted by driver ${user.name} (${auth.userId})`)
    console.log(`📧 Notify passenger: ${updatedRide.passenger?.email}`)

    return NextResponse.json({ 
      message: 'ride accepted successfully',
      ride: updatedRide 
    })
  } catch (error) {
    console.error('Error accepting ride:', error)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
