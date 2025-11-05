import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromHeader } from '@/lib/auth'

// GET /api/wallet/transactions - returns recent transactions
export async function GET(request: NextRequest) {
	try {
		const auth = getAuthFromHeader(request.headers.get('authorization'))
		if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

		const transactions = await prisma.transaction.findMany({
			where: { userId: auth.userId },
			orderBy: { createdAt: 'desc' },
			take: 50,
		})

		return NextResponse.json({ transactions })
	} catch (error) {
		return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
	}
}

