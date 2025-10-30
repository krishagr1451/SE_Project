import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const carpool = await prisma.carpool.findUnique({
      where: { id },
      include: { driver: { select: { name: true, email: true, phone: true } } },
    })
    
    if (!carpool) {
      return NextResponse.json({ error: 'Carpool not found' }, { status: 404 })
    }
    
    return NextResponse.json(carpool)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch carpool' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const carpool = await prisma.carpool.update({
      where: { id },
      data: body,
    })
    return NextResponse.json(carpool)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update carpool' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.carpool.delete({
      where: { id },
    })
    return NextResponse.json({ message: 'Carpool deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete carpool' }, { status: 500 })
  }
}
