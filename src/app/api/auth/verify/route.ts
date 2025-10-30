import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromHeader } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromHeader(request.headers.get('authorization'))
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        createdAt: true,
      },
    })

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Attach role and isVerified via runtime fetch to avoid TS mismatch
    const full = await prisma.user.findUnique({ where: { id: auth.userId } })
    const role = (full as any)?.role ?? 'PASSENGER'
    const isVerified = (full as any)?.isVerified ?? false

    return NextResponse.json({ user: { ...user, role, isVerified } })
  } catch (error) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
