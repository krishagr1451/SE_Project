import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET /api/rides/[id] - Get ride details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // @ts-ignore
    const ride = await prisma.ride.findUnique({
      where: { id },
      include: {
        passenger: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            licenseNumber: true,
          },
        },
      },
    })

    if (!ride) {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 })
    }

    return NextResponse.json(ride)
  } catch (error) {
    console.error('Error fetching ride:', error)
    return NextResponse.json({ error: 'Failed to fetch ride' }, { status: 500 })
  }
}

// PATCH /api/rides/[id] - Update ride status (accept, start, complete, cancel)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body // 'accept', 'arrive', 'start', 'complete', 'cancel'

    // @ts-ignore
    const ride = await prisma.ride.findUnique({
      where: { id },
    })

    if (!ride) {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 })
    }

    let updateData: any = {}

    switch (action) {
      case 'accept':
        if (ride.status !== 'SEARCHING') {
          return NextResponse.json({ error: 'Ride already accepted' }, { status: 400 })
        }
        updateData = {
          driverId: decoded.userId,
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        }
        break

      case 'arrive':
        if (ride.driverId !== decoded.userId) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }
        if (ride.status !== 'ACCEPTED') {
          return NextResponse.json({ error: 'Invalid status transition' }, { status: 400 })
        }
        updateData = {
          status: 'ARRIVED',
        }
        break

      case 'start':
        if (ride.driverId !== decoded.userId) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }
        if (ride.status !== 'ARRIVED' && ride.status !== 'ACCEPTED') {
          return NextResponse.json({ error: 'Invalid status transition' }, { status: 400 })
        }
        updateData = {
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        }
        break

      case 'complete':
        if (ride.driverId !== decoded.userId) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }
        if (ride.status !== 'IN_PROGRESS') {
          return NextResponse.json({ error: 'Invalid status transition' }, { status: 400 })
        }
        updateData = {
          status: 'COMPLETED',
          completedAt: new Date(),
        }
        break

      case 'cancel':
        if (ride.passengerId !== decoded.userId && ride.driverId !== decoded.userId) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }
        if (ride.status === 'COMPLETED') {
          return NextResponse.json({ error: 'Cannot cancel completed ride' }, { status: 400 })
        }
        updateData = {
          status: 'CANCELLED',
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // @ts-ignore
    const updatedRide = await prisma.ride.update({
      where: { id },
      data: updateData,
      include: {
        passenger: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            licenseNumber: true,
          },
        },
      },
    })

    return NextResponse.json(updatedRide)
  } catch (error) {
    console.error('Error updating ride:', error)
    return NextResponse.json({ error: 'Failed to update ride' }, { status: 500 })
  }
}
