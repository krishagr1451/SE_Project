import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromHeader } from '@/lib/auth'

// GET /api/wallet - returns the user's wallet, creating one if missing
export async function GET(request: NextRequest) {
	try {
		const auth = getAuthFromHeader(request.headers.get('authorization'))
		if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

		// Check if user exists
		const user = await prisma.user.findUnique({ where: { id: auth.userId } })
		if (!user) {
			console.error('User not found for wallet:', auth.userId)
			return NextResponse.json({ 
				error: 'User not found. Please log out and log back in.' 
			}, { status: 404 })
		}

		let wallet = await prisma.wallet.findUnique({ where: { userId: auth.userId } })
		if (!wallet) {
			wallet = await prisma.wallet.create({ data: { userId: auth.userId, balance: 0 } })
		}

		return NextResponse.json({ wallet })
	} catch (error) {
		console.error('Error in wallet API:', error)
		return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 })
	}
}

