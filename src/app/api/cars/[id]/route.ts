import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromHeader } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const car = await prisma.car.findUnique({
      where: { id },
      include: { owner: { select: { name: true, email: true, phone: true } } },
    })
    
    if (!car) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 })
    }
    
    return NextResponse.json(car)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch car' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = getAuthFromHeader(request.headers.get('authorization'))
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const existing = await prisma.car.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Car not found' }, { status: 404 })

    const isOwner = existing.ownerId === auth.userId
    const isAdmin = auth.role === 'ADMIN'
    if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const car = await prisma.car.update({
      where: { id },
      data: body,
    })
    return NextResponse.json(car)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update car' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = getAuthFromHeader(request.headers.get('authorization'))
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const existing = await prisma.car.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Car not found' }, { status: 404 })

    const isOwner = existing.ownerId === auth.userId
    const isAdmin = auth.role === 'ADMIN'
    if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await prisma.car.delete({ where: { id } })
    return NextResponse.json({ message: 'Car deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete car' }, { status: 500 })
  }
}
