import { PrismaClient } from './generated/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed with Indian data...')

  // Clear existing data in correct order (respect foreign keys)
  await prisma.review.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.ride.deleteMany()
  await prisma.carpool.deleteMany()
  await prisma.car.deleteMany()
  await prisma.wallet.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.user.deleteMany()

  console.log('🗑️  Cleared existing data')

  // Create sample users
  const hashedPassword = await bcrypt.hash('password123', 10)

  const passenger1 = await prisma.user.create({
    data: {
      email: 'rajesh@example.com',
      name: 'Rajesh Kumar',
      password: hashedPassword,
      phone: '+91 98765 43210',
      role: 'PASSENGER',
      isVerified: true,
    },
  })

  const passenger2 = await prisma.user.create({
    data: {
      email: 'priya@example.com',
      name: 'Priya Sharma',
      password: hashedPassword,
      phone: '+91 98765 43211',
      role: 'PASSENGER',
      isVerified: true,
    },
  })

  const driver1 = await prisma.user.create({
    data: {
      email: 'amit@example.com',
      name: 'Amit Patel',
      password: hashedPassword,
      phone: '+91 98765 43212',
      role: 'DRIVER',
      isVerified: true,
      licenseNumber: 'MH02 20230001234',
    },
  })

  const driver2 = await prisma.user.create({
    data: {
      email: 'vikram@example.com',
      name: 'Vikram Singh',
      password: hashedPassword,
      phone: '+91 98765 43213',
      role: 'DRIVER',
      isVerified: true,
      licenseNumber: 'DL07 20230005678',
    },
  })

  const driver3 = await prisma.user.create({
    data: {
      email: 'sanjay@example.com',
      name: 'Sanjay Reddy',
      password: hashedPassword,
      phone: '+91 98765 43214',
      role: 'DRIVER',
      isVerified: true,
      licenseNumber: 'KA03 20230009876',
    },
  })

  console.log('✅ Users created')

  // Create sample cars with Indian models
  await prisma.car.create({
    data: {
      make: 'Maruti Suzuki',
      model: 'Swift',
      year: 2023,
      color: 'Pearl White',
      pricePerDay: 1500,
      hourlyRate: 100,
      location: 'Andheri, Mumbai, Maharashtra',
      licensePlate: 'MH 02 AB 1234',
      status: 'AVAILABLE',
      description: 'Well-maintained Maruti Swift with excellent mileage. Perfect for city drives.',
      available: true,
      ownerId: driver1.id,
    },
  })

  await prisma.car.create({
    data: {
      make: 'Hyundai',
      model: 'Creta',
      year: 2022,
      color: 'Phantom Black',
      pricePerDay: 2500,
      hourlyRate: 180,
      location: 'Koramangala, Bangalore, Karnataka',
      licensePlate: 'KA 03 CD 5678',
      status: 'AVAILABLE',
      description: 'Spacious SUV ideal for family trips. AC, music system, and comfortable seating.',
      available: true,
      ownerId: driver3.id,
    },
  })

  await prisma.car.create({
    data: {
      make: 'Tata',
      model: 'Nexon EV',
      year: 2023,
      color: 'Foliage Green',
      pricePerDay: 2000,
      hourlyRate: 150,
      location: 'Connaught Place, New Delhi, Delhi',
      licensePlate: 'DL 07 EF 9012',
      status: 'AVAILABLE',
      description: 'Brand new Tata Nexon EV. Eco-friendly electric car with great features.',
      available: true,
      ownerId: driver2.id,
    },
  })

  await prisma.car.create({
    data: {
      make: 'Honda',
      model: 'City',
      year: 2021,
      color: 'Radiant Red',
      pricePerDay: 1800,
      hourlyRate: 120,
      location: 'Bandra, Mumbai, Maharashtra',
      licensePlate: 'MH 01 GH 3456',
      status: 'AVAILABLE',
      description: 'Honda City with smooth drive and excellent comfort. Great for long drives.',
      available: true,
      ownerId: driver1.id,
    },
  })

  await prisma.car.create({
    data: {
      make: 'Mahindra',
      model: 'XUV700',
      year: 2023,
      color: 'Dazzling Silver',
      pricePerDay: 3500,
      hourlyRate: 250,
      location: 'Whitefield, Bangalore, Karnataka',
      licensePlate: 'KA 05 IJ 7890',
      status: 'AVAILABLE',
      description: 'Premium SUV with advanced safety features. Perfect for highway trips.',
      available: true,
      ownerId: driver3.id,
    },
  })

  console.log('✅ Cars created')

  // Create sample carpools
  await prisma.carpool.create({
    data: {
      from: 'Andheri, Mumbai, Maharashtra',
      to: 'Pune, Maharashtra',
      departureTime: new Date('2025-11-01T08:00:00'),
      availableSeats: 3,
      pricePerSeat: 400,
      description: 'Daily commute from Mumbai to Pune. Comfortable ride with AC.',
      driverId: driver1.id,
    },
  })

  await prisma.carpool.create({
    data: {
      from: 'Sector 18, Noida, Uttar Pradesh',
      to: 'Connaught Place, New Delhi, Delhi',
      departureTime: new Date('2025-11-01T09:00:00'),
      availableSeats: 2,
      pricePerSeat: 150,
      description: 'Morning commute to Delhi. Quick and affordable ride.',
      driverId: driver2.id,
    },
  })

  await prisma.carpool.create({
    data: {
      from: 'Electronic City, Bangalore, Karnataka',
      to: 'MG Road, Bangalore, Karnataka',
      departureTime: new Date('2025-11-01T08:30:00'),
      availableSeats: 4,
      pricePerSeat: 100,
      description: 'Office commute within Bangalore. Save money and avoid traffic.',
      driverId: driver3.id,
    },
  })

  await prisma.carpool.create({
    data: {
      from: 'Mumbai, Maharashtra',
      to: 'Goa, Goa',
      departureTime: new Date('2025-11-05T06:00:00'),
      availableSeats: 3,
      pricePerSeat: 1200,
      description: 'Weekend trip to Goa! Share the ride and have fun. Music and good vibes.',
      driverId: driver1.id,
    },
  })

  console.log('✅ Carpools created')

  console.log('🎉 Seed completed successfully!')
  console.log('\n📝 Sample Credentials (Password: password123):')
  console.log('\nPassengers:')
  console.log('  📧 rajesh@example.com - Rajesh Kumar')
  console.log('  📧 priya@example.com - Priya Sharma')
  console.log('\nDrivers:')
  console.log('  🚗 amit@example.com - Amit Patel (Mumbai)')
  console.log('  🚗 vikram@example.com - Vikram Singh (Delhi)')
  console.log('  🚗 sanjay@example.com - Sanjay Reddy (Bangalore)')
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
