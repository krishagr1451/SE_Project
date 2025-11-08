# Car Share App - Full Stack Application

A complete full-stack car rental and carpooling web application built with Next.js 16, TypeScript, Prisma ORM, and SQLite.

## 🚀 Features

### Backend (API Routes)
- **Ride Booking API** - Real-time ride booking with JWT authentication
- **Vehicle Type Selection** - Multiple vehicle categories (Auto, Mini, Sedan, SUV, Premium)
- **Dynamic Fare Calculation** - Distance-based pricing per vehicle type
- **Car Management API** - CRUD operations for car listings
- **Carpool Management API** - CRUD operations for carpool rides
- **User Authentication** - JWT tokens with bcrypt password hashing

### Frontend (Pages)
- **🚗 Uber-Style Ride Booking** - Two-step booking flow with custom car illustrations
   - Step 1: Location Selection (pickup & dropoff with map)
   - Step 2: Vehicle Selection with 5 car types:
      - **Auto** 🛺 - ₹30 base + ₹12/km (3 seats, 2 min ETA)
      - **Mini** 🚗 - ₹50 base + ₹15/km (4 seats, 3 min ETA)
      - **Sedan** 🚙 - ₹80 base + ₹20/km (4 seats, 4 min ETA)
      - **SUV** 🚐 - ₹120 base + ₹25/km (6 seats, 5 min ETA)
      - **Premium** 🚘 - ₹200 base + ₹35/km (4 seats, 6 min ETA)
- **Custom SVG Car Illustrations** - Unique colored vehicle icons for each type
- **Real-time Fare Calculator** - Live price updates based on distance
- **Interactive Map** - Leaflet integration for route visualization
- **Home Page** - Landing page with features showcase
- **Cars & Carpool** - Browse and book cars/carpools
- **My Bookings** - View all your bookings

### Database (Prisma + SQLite)
- **Users** - Accounts with JWT authentication
- **Rides** - Pickup/dropoff locations, vehicle type, fare tracking
- **Vehicle Types** - Enum-based categorization (AUTO, MINI, SEDAN, SUV, PREMIUM)
- **Car Listings** - Traditional car rental with owner relationships
- **Carpools** - Ride-sharing with driver relationships
- **Bookings** - Unified booking system

## 📦 Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma ORM
- **Authentication**: bcrypt for password hashing
- **Date Handling**: date-fns

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+ installed
- npm package manager

### Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Database**
   ```bash
   # Generate Prisma Client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate dev --name init
   
   # Seed the database with sample data
   npm run db:seed
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Open in Browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📝 Sample Data

The database includes:
- **3 Users**: john@example.com, jane@example.com, demo@example.com (password: `password123`)
- **5 Cars**: Toyota Camry, Honda Civic, Tesla Model 3, Ford F-150, BMW X5
- **3 Carpools**: NY to Boston, LA to San Diego, Chicago to Detroit

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:seed` - Seed database with sample data
- `npx prisma studio` - Open Prisma Studio (database GUI at http://localhost:5555)

## 📁 Project Structure

```
car-share-app/
├── prisma/
│   ├── schema.prisma          # Database schema (User, Car, Carpool, Booking)
│   ├── seed.ts                # Sample data generator
│   └── dev.db                 # SQLite database file
├── src/
│   ├── app/
│   │   ├── api/               # Backend API routes
│   │   │   ├── cars/          # GET, POST /api/cars & /api/cars/[id]
│   │   │   ├── carpool/       # GET, POST /api/carpool & /api/carpool/[id]
│   │   │   ├── bookings/      # GET, POST /api/bookings
│   │   │   └── users/         # POST /api/users/register
│   │   ├── cars/              # Car rental pages
│   │   ├── carpool/           # Carpool pages
│   │   ├── my-bookings/       # User bookings page
│   │   └── page.tsx           # Home page
│   ├── components/
│   │   └── Navbar.tsx         # Navigation bar
│   └── lib/
│       └── prisma.ts          # Prisma client singleton
└── .env                       # DATABASE_URL configuration
```

## 🎯 API Endpoints

### Cars
- `GET /api/cars` - List all available cars
- `POST /api/cars` - Create new car listing
- `GET /api/cars/[id]` - Get car details
- `PUT /api/cars/[id]` - Update car
- `DELETE /api/cars/[id]` - Delete car

### Carpool
- `GET /api/carpool` - List upcoming carpools
- `POST /api/carpool` - Create new carpool
- `GET /api/carpool/[id]` - Get carpool details
- `PUT /api/carpool/[id]` - Update carpool
- `DELETE /api/carpool/[id]` - Delete carpool

### Bookings
- `GET /api/bookings?userId=xxx` - Get user bookings
- `POST /api/bookings` - Create booking

### Users
- `POST /api/users/register` - Register new user

## 🗄️ Database Management

View and manage your database with Prisma Studio:
```bash
npx prisma studio
```

Reset database:
```bash
npx prisma migrate reset
```

## � Deployment to Vercel

### Prerequisites
1. **Switch from SQLite to PostgreSQL** (required for Vercel)
2. Get a PostgreSQL database (see options below)

### Database Options

**Option 1: Vercel Postgres (Recommended)**
1. Go to Vercel Dashboard → Your Project
2. Navigate to **Storage** tab
3. Create new **Postgres** database
4. DATABASE_URL will be auto-populated

**Option 2: Free External Databases**
- **Neon** (https://neon.tech) - Free PostgreSQL with generous limits
- **Supabase** (https://supabase.com) - Free tier includes PostgreSQL
- **Railway** (https://railway.app) - $5 credit/month free

### Deployment Steps

1. **Update Environment Variables in Vercel**
   ```
   Go to: Project Settings → Environment Variables
   Add:
   - JWT_SECRET=your-secret-here
   - DATABASE_URL=postgresql://user:pass@host:5432/db
   ```

2. **Run Database Migrations**
   ```bash
   # From your local machine with production DATABASE_URL
   npx prisma migrate deploy
   
   # Or seed with sample data
   npm run db:seed
   ```

3. **Push to GitHub/Git**
   ```bash
   git add .
   git commit -m "Update for Vercel deployment"
   git push origin main
   ```

4. **Vercel Auto-Deploys**
   - Vercel detects changes and rebuilds
   - Prisma client generates during build
   - App goes live automatically

### Troubleshooting

**Issue: "Registration Failed"**
- ✅ Check environment variables are set in Vercel
- ✅ Verify DATABASE_URL is PostgreSQL (not SQLite)
- ✅ Run `prisma migrate deploy` on production database
- ✅ Check Vercel build logs for errors

**Issue: "Prisma Client Not Found"**
- Add `"postinstall": "prisma generate"` to package.json scripts
- Vercel will generate client during build

**Issue: Database Connection Error**
- Verify DATABASE_URL format: `postgresql://user:password@host:5432/dbname`
- Check database is accessible from Vercel (most cloud DBs allow external connections)

## �🚧 Future Enhancements

- [ ] NextAuth.js authentication
- [ ] Image upload for car photos
- [ ] Search & filter functionality
- [ ] Payment integration (Stripe/Razorpay)
- [ ] Rating & review system
- [ ] Email notifications
- [ ] Google Maps integration
- [ ] Real-time messaging
- [ ] Redis caching for better performance

## 📄 License

MIT License - feel free to use this project for learning or building your own applications!

