import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { signToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, phone, role, licenseNumber } = await request.json()

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
    }

    // Validate driver-specific fields
    if (role === 'DRIVER' && !licenseNumber) {
      return NextResponse.json({ error: 'License number is required for drivers' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone: phone || null,
        role: role || 'PASSENGER',
        licenseNumber: licenseNumber || null,
        isVerified: true, // Auto-verify all users (including drivers)
      },
    })

    // Generate JWT token
    const token = signToken({ userId: user.id, role: user.role as 'PASSENGER' | 'DRIVER' | 'ADMIN' })

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
      },
    })
  } catch (error) {
    console.error('[API] /api/auth/register error', error)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
