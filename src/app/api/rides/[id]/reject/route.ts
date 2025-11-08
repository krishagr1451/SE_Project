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

    // Check if ride exists
    const ride = await prisma.ride.findUnique({
      where: { id: rideId }
    })

    if (!ride) {
      return NextResponse.json({ error: 'ride not found' }, { status: 404 })
    }

    if (ride.status !== 'SEARCHING') {
      return NextResponse.json({ error: 'cannot reject ride that is not in searching status' }, { status: 400 })
    }

    // Just mark as rejected (optional: could delete or keep for records)
    // For now, we'll just remove this ride from the driver's view by not returning it
    // The ride will remain SEARCHING and available for other drivers

    console.log(`❌ Ride ${rideId} rejected by driver ${auth.userId}`)

    return NextResponse.json({ 
      message: 'ride rejected',
      rideId 
    })
  } catch (error) {
    console.error('Error rejecting ride:', error)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
