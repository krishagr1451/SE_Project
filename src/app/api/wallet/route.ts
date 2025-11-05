import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromHeader } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromHeader(request.headers.get('authorization'))
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let wallet = await prisma.wallet.findUnique({ where: { userId: auth.userId } })
    if (!wallet) {
      wallet = await prisma.wallet.create({ data: { userId: auth.userId, balance: 0 } })
    }

    return NextResponse.json({ wallet })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 })
  }
}
