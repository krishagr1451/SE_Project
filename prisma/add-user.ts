import { PrismaClient } from './generated/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function addUser() {
  const args = process.argv.slice(2)
  
  if (args.length < 4) {
    console.log('Usage: npx tsx prisma/add-user.ts <email> <password> <name> <role> [phone] [licenseNumber]')
    console.log('Example: npx tsx prisma/add-user.ts john@example.com mypass123 "John Doe" PASSENGER "+91 99999 99999"')
    console.log('Example: npx tsx prisma/add-user.ts driver@example.com pass123 "Driver Name" DRIVER "+91 88888 88888" "DL01 20230001234"')
    process.exit(1)
  }

  const [email, password, name, role, phone, licenseNumber] = args

  // Validate role
  if (role !== 'PASSENGER' && role !== 'DRIVER' && role !== 'ADMIN') {
    console.error('❌ Invalid role. Must be PASSENGER, DRIVER, or ADMIN')
    process.exit(1)
  }

  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.error('❌ User with this email already exists')
    process.exit(1)
  }

  // Validate driver requirements
  if (role === 'DRIVER' && !licenseNumber) {
    console.error('❌ License number is required for drivers')
    console.log('Usage: npx tsx prisma/add-user.ts <email> <password> <name> DRIVER <phone> <licenseNumber>')
    process.exit(1)
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
      role,
      licenseNumber: licenseNumber || null,
      isVerified: true, // Auto-verify
    },
  })

  console.log('✅ User created successfully!')
  console.log('\n📝 User Details:')
  console.log(`   Email: ${user.email}`)
  console.log(`   Name: ${user.name}`)
  console.log(`   Role: ${user.role}`)
  console.log(`   Phone: ${user.phone || 'N/A'}`)
  if (user.role === 'DRIVER') {
    console.log(`   License: ${user.licenseNumber}`)
  }
  console.log(`   Verified: ${user.isVerified}`)
  console.log('\n🔑 You can now login with:')
  console.log(`   Email: ${email}`)
  console.log(`   Password: ${password}`)
}

addUser()
  .catch((e) => {
    console.error('❌ Error adding user:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
