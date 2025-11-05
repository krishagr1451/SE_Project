import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, phone, role, licenseNumber } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        phone: phone || null,
        role: (role as any) || 'PASSENGER',
        licenseNumber: licenseNumber || null,
        isVerified: role === 'DRIVER' ? true : true,
      },
    })

    const token = signToken({ userId: user.id, role: (user as any).role ?? 'PASSENGER', email: user.email })

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: (user as any).role ?? 'PASSENGER',
        isVerified: (user as any).isVerified ?? false,
        licenseNumber: user.licenseNumber || undefined,
      },
    }, { status: 201 })
  } catch (error: any) {
    // Surface a clearer error in logs and (in non-production) the response
    console.error('Registration error:', error?.message || error)
    const message = process.env.NODE_ENV === 'production'
      ? 'Registration failed'
      : `Registration failed: ${error?.message || 'Unknown error'}`
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
