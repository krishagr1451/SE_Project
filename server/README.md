# 🚀 Drive Hire Backend Server

A production-ready Express.js + TypeScript backend server for the Drive Hire car sharing and ride booking platform.

## ✨ Features

- **RESTful API** with Express.js
- **TypeScript** for type safety
- **JWT Authentication** with bcrypt password hashing
- **Google OAuth 2.0** integration
- **Prisma ORM** for database operations
- **Input Validation** with Zod
- **Security** with Helmet and CORS
- **Request Logging** with Morgan
- **Error Handling** with custom middleware
- **Graceful Shutdown** support

## 📦 Installation

```bash
cd server
npm install
```

## 🔧 Configuration

Create a `.env` file in the `server` directory:

```env
PORT=4000
NODE_ENV=development
DATABASE_URL="file:../prisma/dev.db"
JWT_SECRET="your-super-secret-jwt-key"
ALLOWED_ORIGINS="http://localhost:3000"
```

## 🚀 Running the Server

### Development Mode
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

## 📚 API Documentation

### Base URL
```
http://localhost:4000
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "password123",
  "phone": "+91 98765 43210",
  "role": "PASSENGER",
  "licenseNumber": "MH02 20230001234" // Optional, for drivers
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "PASSENGER",
    "phone": "+91 98765 43210",
    "isVerified": false
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Google OAuth
```http
POST /api/auth/google
Content-Type: application/json

{
  "credential": "eyJhbGciOiJSUzI1NiIs..." // Google JWT token
}
```

#### Verify Token
```http
GET /api/auth/verify
Authorization: Bearer <token>
```

---

### Car Endpoints

#### Get All Cars
```http
GET /api/cars?available=true&location=Mumbai&minPrice=1000&maxPrice=5000
```

**Response:**
```json
{
  "cars": [
    {
      "id": "clx...",
      "make": "Maruti Suzuki",
      "model": "Swift",
      "year": 2023,
      "color": "Pearl White",
      "pricePerDay": 1500,
      "location": "Andheri, Mumbai",
      "available": true,
      "owner": {
        "id": "clx...",
        "name": "Amit Patel",
        "email": "amit@example.com"
      }
    }
  ]
}
```

#### Get Single Car
```http
GET /api/cars/:id
```

#### Create Car (Authenticated)
```http
POST /api/cars
Authorization: Bearer <token>
Content-Type: application/json

{
  "make": "Hyundai",
  "model": "Creta",
  "year": 2023,
  "color": "Black",
  "pricePerDay": 2500,
  "location": "Bangalore, Karnataka",
  "licensePlate": "KA 03 AB 1234",
  "description": "Spacious SUV perfect for families"
}
```

#### Update Car (Authenticated, Owner Only)
```http
PATCH /api/cars/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "pricePerDay": 2000,
  "available": false
}
```

#### Delete Car (Authenticated, Owner Only)
```http
DELETE /api/cars/:id
Authorization: Bearer <token>
```

---

### Carpool Endpoints

#### Get All Carpools
```http
GET /api/carpool?from=Mumbai&to=Pune&date=2025-11-01
```

**Response:**
```json
{
  "carpools": [
    {
      "id": "clx...",
      "from": "Mumbai",
      "to": "Pune",
      "departureTime": "2025-11-01T08:00:00.000Z",
      "availableSeats": 3,
      "pricePerSeat": 400,
      "driver": {
        "id": "clx...",
        "name": "Amit Patel",
        "phone": "+91 98765 43212"
      }
    }
  ]
}
```

#### Get Single Carpool
```http
GET /api/carpool/:id
```

#### Create Carpool (Authenticated, Drivers Only)
```http
POST /api/carpool
Authorization: Bearer <token>
Content-Type: application/json

{
  "from": "Mumbai, Maharashtra",
  "to": "Pune, Maharashtra",
  "departureTime": "2025-11-01T08:00:00.000Z",
  "availableSeats": 3,
  "pricePerSeat": 400,
  "description": "Comfortable ride with AC"
}
```

---

### Ride Endpoints (Ola/Uber Style)

#### Get Rides
```http
GET /api/rides?type=myrides
Authorization: Bearer <token>
```

**Query Parameters:**
- `type=myrides` - Get rides as passenger
- `type=driverrides` - Get rides as driver
- `type=available` - Get available rides to accept

**Response:**
```json
{
  "rides": [
    {
      "id": "clx...",
      "pickupLocation": "Andheri, Mumbai",
      "dropoffLocation": "Bandra, Mumbai",
      "fare": 200,
      "distance": 10,
      "estimatedTime": 25,
      "status": "SEARCHING",
      "passenger": {
        "id": "clx...",
        "name": "Rajesh Kumar",
        "phone": "+91 98765 43210"
      },
      "driver": null
    }
  ]
}
```

#### Get Single Ride
```http
GET /api/rides/:id
Authorization: Bearer <token>
```

#### Book Ride
```http
POST /api/rides
Authorization: Bearer <token>
Content-Type: application/json

{
  "pickupLocation": "Andheri, Mumbai",
  "pickupLat": 19.1136,
  "pickupLng": 72.8697,
  "dropoffLocation": "Bandra, Mumbai",
  "dropoffLat": 19.0596,
  "dropoffLng": 72.8295,
  "paymentMethod": "cash"
}
```

**Response:**
```json
{
  "message": "Ride booked successfully",
  "ride": {
    "id": "clx...",
    "pickupLocation": "Andheri, Mumbai",
    "dropoffLocation": "Bandra, Mumbai",
    "fare": 200,
    "distance": 10.5,
    "estimatedTime": 26,
    "status": "SEARCHING",
    "paymentMethod": "cash"
  }
}
```

#### Update Ride Status
```http
PATCH /api/rides/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "accept" // accept, arrive, start, complete, cancel
}
```

**Actions:**
- `accept` - Driver accepts the ride
- `arrive` - Driver arrived at pickup
- `start` - Ride started
- `complete` - Ride completed
- `cancel` - Cancel ride (passenger or driver)

**Status Flow:**
```
SEARCHING → ACCEPTED → ARRIVED → IN_PROGRESS → COMPLETED
         ↓            ↓         ↓              ↓
         CANCELLED ←──────────────────────────
```

---

### Booking Endpoints

#### Get Bookings
```http
GET /api/bookings
Authorization: Bearer <token>
```

**Response:**
```json
{
  "bookings": [
    {
      "id": "clx...",
      "startDate": "2025-11-01T00:00:00.000Z",
      "endDate": "2025-11-03T00:00:00.000Z",
      "totalPrice": 4500,
      "status": "confirmed",
      "car": {
        "make": "Hyundai",
        "model": "Creta",
        "owner": {
          "name": "Amit Patel"
        }
      }
    }
  ]
}
```

#### Create Booking
```http
POST /api/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "carId": "clx...",
  "startDate": "2025-11-01T00:00:00.000Z",
  "endDate": "2025-11-03T00:00:00.000Z",
  "totalPrice": 4500
}
```

#### Update Booking Status
```http
PATCH /api/bookings/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "confirmed" // pending, confirmed, cancelled
}
```

---

### Review Endpoints

#### Create Review
```http
POST /api/reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "bookingId": "clx...",
  "carId": "clx...",
  "rating": 5,
  "comment": "Great car and excellent service!"
}
```

---

### Utility Endpoints

#### Geocode Location
```http
GET /api/geocode?query=Mumbai
```

**Response:**
```json
{
  "results": [
    {
      "display_name": "Mumbai, Maharashtra, India",
      "lat": "19.0759837",
      "lon": "72.8776559"
    }
  ]
}
```

#### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-30T12:00:00.000Z",
  "uptime": 123.456
}
```

---

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

To get a token:
1. Register a new user or login
2. Use the returned `token` in subsequent requests

---

## 📊 Database Schema

The backend uses Prisma ORM with the following models:

- **User** - User accounts (passengers/drivers/admins)
- **Car** - Listed cars for rental
- **Carpool** - Carpool/rideshare listings
- **Ride** - Instant ride bookings (Ola/Uber style)
- **Booking** - Car rental and carpool bookings
- **Review** - User reviews for cars

---

## 🛡️ Security Features

- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **JWT** - JSON Web Token authentication
- **bcrypt** - Password hashing (10 rounds)
- **Input Validation** - Zod schemas
- **Error Handling** - Custom error middleware
- **SQL Injection Protection** - Prisma ORM

---

## 🧪 Testing

Sample test credentials:

**Passenger:**
```
Email: rajesh@example.com
Password: password123
```

**Driver:**
```
Email: amit@example.com
Password: password123
```

---

## 📝 Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "details": {} // Optional, for validation errors
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `4000` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | Prisma database URL | `file:../prisma/dev.db` |
| `JWT_SECRET` | JWT signing secret | (required) |
| `ALLOWED_ORIGINS` | CORS origins | `http://localhost:3000` |

---

## 📂 Project Structure

```
server/
├── index.ts          # Main server file
├── package.json      # Dependencies
├── tsconfig.json     # TypeScript config
├── .env              # Environment variables
└── dist/             # Compiled JavaScript (after build)
```

---

## 🚦 Rate Limiting & Fare Calculation

### Fare Calculation
```
Fare = Base Fare (₹50) + (Distance in km × ₹15/km)
Estimated Time = Distance × 2.5 minutes
```

Example:
- Distance: 10 km
- Fare: ₹50 + (10 × ₹15) = ₹200
- Estimated Time: 25 minutes

---

## 🌐 CORS Configuration

By default, the server allows requests from:
- `http://localhost:3000` (Next.js dev server)
- `http://localhost:3001`

To add more origins, update the `.env` file:
```env
ALLOWED_ORIGINS="http://localhost:3000,https://yourdomain.com"
```

---

## 📱 Client Integration

### Fetching data from Next.js:

```typescript
// Login example
const response = await fetch('http://localhost:4000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
  }),
})

const data = await response.json()
const token = data.token

// Authenticated request
const carsResponse = await fetch('http://localhost:4000/api/cars', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
})
```

---

## 🔄 Graceful Shutdown

The server handles `SIGTERM` and `SIGINT` signals for graceful shutdown:

```bash
# Press Ctrl+C to stop the server
```

The server will:
1. Stop accepting new connections
2. Complete ongoing requests
3. Disconnect from database
4. Exit cleanly

---

## 🐛 Debugging

Enable detailed logging:

```env
NODE_ENV=development
```

This will show:
- Request logs (Morgan)
- Error stack traces
- Validation error details

---

## 🚀 Production Deployment

1. **Build the server:**
```bash
npm run build
```

2. **Set production environment:**
```env
NODE_ENV=production
JWT_SECRET=<generate-strong-random-string>
DATABASE_URL=<production-database-url>
```

3. **Start the server:**
```bash
npm start
```

4. **Use a process manager:**
```bash
pm2 start dist/index.js --name drivehire-backend
```

---

## ✅ Features Checklist

- [x] User authentication (JWT)
- [x] Google OAuth integration
- [x] Car CRUD operations
- [x] Carpool CRUD operations
- [x] Instant ride booking
- [x] Ride status tracking
- [x] Distance & fare calculation
- [x] Booking management
- [x] Review system
- [x] Geocoding service
- [x] Input validation
- [x] Error handling
- [x] Security headers
- [x] CORS protection
- [x] Request logging

---

## 📞 Support

For issues or questions:
- Check the error logs
- Verify environment variables
- Ensure database is accessible
- Confirm Prisma schema is up to date

---

## 📄 License

MIT

---

**Happy Coding! 🇮🇳🚗**
