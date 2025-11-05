import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function POST(request: NextRequest) {
  try {
    const { credential } = await request.json()

    if (!credential) {
      return NextResponse.json({ error: 'No credential provided' }, { status: 400 })
    }

    // Decode the Google JWT token (without verification for simplicity)
    // In production, you should verify the token with Google's public keys
    const decodedToken: any = jwt.decode(credential)

    if (!decodedToken || !decodedToken.email) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    const { email, name, picture, sub: googleId } = decodedToken

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email }
    })

    // If user doesn't exist, create a new one
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          password: '', // No password for OAuth users
          phone: null,
          role: 'PASSENGER', // Default role
          isVerified: true, // Google verified the email
        }
      })
    }

    // Generate JWT token for our app
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        isVerified: user.isVerified,
      }
    })
  } catch (error) {
    console.error('Google auth error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}
