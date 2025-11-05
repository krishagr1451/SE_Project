import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromHeader } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromHeader(request.headers.get('authorization'))
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { amount } = await request.json()
    const value = parseFloat(amount)
    if (!value || value <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    let wallet = await prisma.wallet.findUnique({ where: { userId: auth.userId } })
    if (!wallet) {
      wallet = await prisma.wallet.create({ data: { userId: auth.userId, balance: 0 } })
    }

    const updated = await prisma.wallet.update({
      where: { userId: auth.userId },
      data: { balance: wallet.balance + value },
    })

    await prisma.transaction.create({
      data: {
        userId: auth.userId,
        amount: value,
        type: 'CREDIT',
        description: 'Money added to wallet',
      },
    })

    return NextResponse.json({ wallet: updated })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add money' }, { status: 500 })
  }
}
