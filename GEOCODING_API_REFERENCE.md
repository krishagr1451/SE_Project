# Geocoding API - Complete Reference

## 🎯 Overview

Your `/api/geocode` endpoint now supports:
1. **Forward Geocoding** (GET): Address → Coordinates
2. **Reverse Geocoding** (POST): Coordinates → Address
3. **Geofencing**: India-only restriction
4. **Type Safety**: Full TypeScript interfaces

---

## 📡 API Endpoints

### 1. Forward Geocoding (GET)

**Convert address to coordinates**

```bash
# Single result
GET /api/geocode?address=Connaught+Place+Delhi

Response:
{
  "lat": 28.6328,
  "lng": 77.2197,
  "address": "Connaught Place, New Delhi, Delhi, India"
}

# Autocomplete (multiple suggestions)
GET /api/geocode?address=Delhi&autocomplete=true

Response:
[
  {
    "display_name": "New Delhi, Delhi, India",
    "lat": 28.6139,
    "lng": 77.2090,
    "type": "city",
    "importance": 0.87
  },
  ...
]
```

### 2. Reverse Geocoding (POST) ⭐ NEW

**Convert coordinates to address**

```bash
POST /api/geocode
Content-Type: application/json

{
  "lat": 28.6139,
  "lng": 77.2090
}

Response:
{
  "address": "Rashtrapati Bhavan, New Delhi, Delhi 110004, India",
  "formatted_address": "Rashtrapati Bhavan, New Delhi, Delhi 110004, India",
  "city": "New Delhi",
  "state": "Delhi",
  "country": "India",
  "postcode": "110004"
}
```

**Error Cases:**

```bash
# Missing parameters
POST /api/geocode
{}

Response (400):
{
  "error": "lat and lng are required"
}

# Invalid coordinates
POST /api/geocode
{ "lat": 100, "lng": 200 }

Response (400):
{
  "error": "invalid coordinates range (lat: -90 to 90, lng: -180 to 180)"
}

# Outside India (Geofencing) ⭐ NEW
POST /api/geocode
{ "lat": 40.7128, "lng": -74.0060 }  # New York

Response (400):
{
  "error": "Location must be within India",
  "message": "This service is only available for locations within India",
  "coordinates": { "lat": 40.7128, "lng": -74.006 }
}
```

---

## 🛡️ Geofencing ⭐ NEW

All geocoding results are validated to be within India:

**India Bounding Box:**
- Latitude: 6.5° to 35.5° (Kanyakumari to Kashmir)
- Longitude: 68.0° to 97.5° (Gujarat to Arunachal Pradesh)

**Examples:**

✅ **Allowed:**
- Mumbai: (19.0760, 72.8777)
- Bangalore: (12.9716, 77.5946)
- Kolkata: (22.5726, 88.3639)

❌ **Blocked:**
- New York: (40.7128, -74.0060)
- London: (51.5074, -0.1278)
- Tokyo: (35.6762, 139.6503)
- Nepal: (27.7172, 85.3240) - Close but outside

---

## 🔒 Rate Limiting & Caching

### Rate Limiting
- **Limit:** 1 request per second per IP
- **Response:** 429 Too Many Requests

```json
{
  "error": "Too many requests. Please wait 1 second between requests."
}
```

### Caching
- **Duration:** 1 hour
- **Max Entries:** 1000
- **Cache Key:** Lowercase address or `reverse-lat-lng`

---

## 🎨 TypeScript Types

```typescript
// Forward geocoding single result
interface GeocodeResult {
  lat: number
  lng: number
  address: string
}

// Autocomplete results
interface AutocompleteResult {
  display_name: string
  lat?: number
  lng?: number
  place_id?: string
  type?: string
  importance?: number
  address?: any
}

// Reverse geocoding result
interface ReverseGeocodeResult {
  address: string
  city?: string
  state?: string
  country?: string
  postcode?: string
  formatted_address?: string
}
```

---

## 🧪 Testing Examples

### Test Forward Geocoding
```bash
# Using curl
curl "https://your-app.vercel.app/api/geocode?address=India+Gate+Delhi"

# Using JavaScript fetch
const response = await fetch('/api/geocode?address=India+Gate+Delhi')
const data = await response.json()
console.log(data.lat, data.lng)
```

### Test Reverse Geocoding
```bash
# Using curl
curl -X POST "https://your-app.vercel.app/api/geocode" \
  -H "Content-Type: application/json" \
  -d '{"lat": 28.6139, "lng": 77.2090}'

# Using JavaScript fetch
const response = await fetch('/api/geocode', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ lat: 28.6139, lng: 77.2090 })
})
const data = await response.json()
console.log(data.address)
```

### Test Geofencing
```bash
# Test with location outside India
curl -X POST "https://your-app.vercel.app/api/geocode" \
  -H "Content-Type: application/json" \
  -d '{"lat": 40.7128, "lng": -74.0060}'

# Should return 400 error
```

### Test Rate Limiting
```bash
# Send 2 requests quickly
curl "https://your-app.vercel.app/api/geocode?address=Delhi"
curl "https://your-app.vercel.app/api/geocode?address=Mumbai"

# Second request should return 429
```

### Test Caching
```bash
# First request (hits API, slower)
time curl "https://your-app.vercel.app/api/geocode?address=Bangalore"

# Second request (from cache, faster)
time curl "https://your-app.vercel.app/api/geocode?address=Bangalore"
```

---

## 🚀 Integration Examples

### React Component - Forward Geocoding

```tsx
import { useState } from 'react'

function AddressSearch() {
  const [address, setAddress] = useState('')
  const [result, setResult] = useState<any>(null)

  const handleSearch = async () => {
    const response = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`)
    const data = await response.json()
    
    if (response.ok) {
      setResult(data)
    } else {
      alert(data.error)
    }
  }

  return (
    <div>
      <input 
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Enter address"
      />
      <button onClick={handleSearch}>Search</button>
      
      {result && (
        <div>
          <p>Latitude: {result.lat}</p>
          <p>Longitude: {result.lng}</p>
          <p>Address: {result.address}</p>
        </div>
      )}
    </div>
  )
}
```

### React Component - Reverse Geocoding

```tsx
import { useState } from 'react'

function CoordinateSearch() {
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [result, setResult] = useState<any>(null)

  const handleSearch = async () => {
    const response = await fetch('/api/geocode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        lat: parseFloat(lat), 
        lng: parseFloat(lng) 
      })
    })
    const data = await response.json()
    
    if (response.ok) {
      setResult(data)
    } else {
      alert(data.error || data.message)
    }
  }

  return (
    <div>
      <input 
        value={lat}
        onChange={(e) => setLat(e.target.value)}
        placeholder="Latitude"
        type="number"
      />
      <input 
        value={lng}
        onChange={(e) => setLng(e.target.value)}
        placeholder="Longitude"
        type="number"
      />
      <button onClick={handleSearch}>Find Address</button>
      
      {result && (
        <div>
          <p><strong>Address:</strong> {result.address}</p>
          <p><strong>City:</strong> {result.city}</p>
          <p><strong>State:</strong> {result.state}</p>
          <p><strong>Postcode:</strong> {result.postcode}</p>
        </div>
      )}
    </div>
  )
}
```

### Map Integration (Leaflet)

```tsx
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import { useState } from 'react'

function MapWithReverseGeocode() {
  const [address, setAddress] = useState('')

  function LocationMarker() {
    useMapEvents({
      click: async (e) => {
        const { lat, lng } = e.latlng
        
        // Reverse geocode on map click
        const response = await fetch('/api/geocode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng })
        })
        
        const data = await response.json()
        
        if (response.ok) {
          setAddress(data.address)
        } else {
          alert(data.error || 'Location outside India')
        }
      }
    })
    return null
  }

  return (
    <div>
      <MapContainer center={[20.5937, 78.9629]} zoom={5}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <LocationMarker />
      </MapContainer>
      
      {address && (
        <div>
          <strong>Selected Location:</strong> {address}
        </div>
      )}
    </div>
  )
}
```

---

## 📊 Response Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | Success | Valid request, results found |
| 400 | Bad Request | Missing params, invalid input, outside India |
| 404 | Not Found | No results for address/coordinates |
| 429 | Too Many Requests | Rate limit exceeded (>1 req/sec) |
| 500 | Internal Error | Server error |
| 502 | Bad Gateway | External API (Google/Nominatim) failed |
| 504 | Gateway Timeout | Request took >5 seconds |

---

## 🎯 Use Cases

### 1. Ride Booking
```typescript
// User enters pickup address
const pickup = await fetch(`/api/geocode?address=${pickupAddress}`)
const pickupCoords = await pickup.json()

// User enters drop address
const drop = await fetch(`/api/geocode?address=${dropAddress}`)
const dropCoords = await drop.json()

// Calculate distance and fare
const distance = calculateDistance(pickupCoords, dropCoords)
const fare = calculateFare(distance)
```

### 2. Car Listing
```typescript
// Car owner enters location
const location = await fetch(`/api/geocode?address=${carLocation}`)
const coords = await location.json()

// Store car with coordinates
await createCar({ 
  ...carDetails, 
  lat: coords.lat, 
  lng: coords.lng,
  address: coords.address 
})
```

### 3. Carpool Route
```typescript
// User clicks on map to set waypoints
const waypoints = []

map.on('click', async (e) => {
  const reverseGeocode = await fetch('/api/geocode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat: e.latlng.lat, lng: e.latlng.lng })
  })
  
  const location = await reverseGeocode.json()
  waypoints.push(location)
})
```

### 4. Address Autocomplete
```typescript
// User types in search box
const handleAddressChange = async (input: string) => {
  if (input.length < 3) return
  
  const response = await fetch(`/api/geocode?address=${input}&autocomplete=true`)
  const suggestions = await response.json()
  
  setSuggestions(suggestions)
}
```

---

## 🎓 For Viva Presentation

**When explaining the geocoding system:**

"I implemented a comprehensive geocoding API with both forward and reverse geocoding capabilities:

**Forward Geocoding (GET):**
- Converts address strings to latitude/longitude coordinates
- Supports autocomplete mode for search suggestions
- Example: 'India Gate' → {lat: 28.6139, lng: 77.2090}

**Reverse Geocoding (POST):**
- Converts coordinates to human-readable addresses
- Returns structured data (city, state, country, postcode)
- Example: {lat: 28.6139, lng: 77.2090} → 'Rashtrapati Bhavan, New Delhi'

**Geofencing:**
- All locations are validated to be within India's boundaries
- Prevents invalid bookings outside service area
- Returns clear error messages for out-of-bounds requests

**Technical Implementation:**
- Rate limiting: 1 request/second per IP
- Caching: 1-hour TTL with 1000 entry limit
- Timeout: 5-second maximum per request
- Dual provider: Google Maps (if configured) with Nominatim fallback
- Type-safe: Full TypeScript interfaces for all responses

This ensures reliable location services while complying with API usage policies and providing a good user experience."

---

## 🔮 Future Enhancements

- [ ] Batch geocoding (multiple addresses at once)
- [ ] Distance matrix API (multi-point distances)
- [ ] Place details lookup (photos, ratings, hours)
- [ ] Route optimization for carpools
- [ ] Saved locations per user
- [ ] Recent searches history
- [ ] Popular destinations suggestions

---

**API is now fully deployed and production-ready!** 🚀
