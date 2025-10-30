# Car Share App - Full Stack Application

A complete full-stack car rental and carpooling web application built with Next.js 16, TypeScript, Prisma ORM, and SQLite.

## 🚀 Features

### Backend (API Routes)
- **Car Management API** - CRUD operations for car listings
- **Carpool Management API** - CRUD operations for carpool rides
- **Booking Management API** - Create and view bookings
- **User Management API** - User registration with bcrypt password hashing

### Frontend (Pages)
- **Home Page** - Landing page with features showcase
- **Cars Listing & Details** - Browse and book cars
- **Add Car** - List your car for rent
- **Carpools Listing & Details** - Browse and book carpool rides
- **Create Carpool** - Offer rides to others
- **My Bookings** - View all your bookings

### Database (Prisma + SQLite)
- User accounts with authentication
- Car listings with owner relationships
- Carpool rides with driver relationships
- Booking system for both cars and carpools

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

## 🚧 Future Enhancements

- [ ] NextAuth.js authentication
- [ ] Image upload for car photos
- [ ] Search & filter functionality
- [ ] Payment integration (Stripe)
- [ ] Rating & review system
- [ ] Email notifications
- [ ] Google Maps integration
- [ ] Real-time messaging

## 📄 License

MIT License - feel free to use this project for learning or building your own applications!

