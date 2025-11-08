import { NextRequest, NextResponse } from 'next/server'

// Enhanced geocoding API with rate limiting, caching, and improved error handling
// Supports both Nominatim (free) and Google Maps API (if configured)

// Simple in-memory rate limiter (for production, use Redis)
const requestLog = new Map<string, number>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const lastRequest = requestLog.get(ip) || 0
  
  // Nominatim requires: max 1 request per second
  if (now - lastRequest < 1000) {
    return false // Too many requests
  }
  
  requestLog.set(ip, now)
  
  // Clean old entries to prevent memory leak
  if (requestLog.size > 1000) {
    const oldestKey = requestLog.keys().next().value
    if (oldestKey) requestLog.delete(oldestKey)
  }
  
  return true
}

// Simple cache (for production, use Redis with TTL)
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 1000 * 60 * 60 // 1 hour

function getCached(key: string) {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  return null
}

function setCache(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() })
  
  // Limit cache size to prevent memory issues
  if (cache.size > 1000) {
    const firstKey = cache.keys().next().value
    if (firstKey) cache.delete(firstKey)
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown'

    // Apply rate limiting
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait 1 second between requests.' }, 
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    const autocomplete = searchParams.get('autocomplete')

    // Validate required parameter
    if (!address) {
      return NextResponse.json({ error: 'address query required' }, { status: 400 })
    }

    // Input validation
    if (address.length > 200) {
      return NextResponse.json({ error: 'address too long (max 200 characters)' }, { status: 400 })
    }

    // Check for suspicious characters (basic XSS prevention)
    if (/[<>]/.test(address)) {
      return NextResponse.json({ error: 'invalid characters in address' }, { status: 400 })
    }

    // Check cache first
    const cacheKey = `${address.toLowerCase()}-${autocomplete || 'false'}`
    const cached = getCached(cacheKey)
    if (cached) {
      console.log('[Geocode] Cache hit:', cacheKey)
      return NextResponse.json(cached)
    }

    // Check if Google Maps API key is configured
    const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY
    
    let result
    if (GOOGLE_API_KEY) {
      // Use Google Maps Geocoding API (more reliable, paid)
      result = await geocodeWithGoogle(address, autocomplete === 'true', GOOGLE_API_KEY)
    } else {
      // Fallback to Nominatim (free, rate-limited)
      result = await geocodeWithNominatim(address, autocomplete === 'true')
    }

    // Cache the result
    setCache(cacheKey, result)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Geocode] Error:', {
      address: request.url,
      error: error instanceof Error ? error.message : 'unknown',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timeout. Please try again.' }, 
          { status: 504 }
        )
      }
    }
    
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}

// Geocode using Google Maps API
async function geocodeWithGoogle(address: string, autocomplete: boolean, apiKey: string) {
  const baseUrl = autocomplete 
    ? 'https://maps.googleapis.com/maps/api/place/autocomplete/json'
    : 'https://maps.googleapis.com/maps/api/geocode/json'
  
  const url = autocomplete
    ? `${baseUrl}?input=${encodeURIComponent(address)}&components=country:in&key=${apiKey}`
    : `${baseUrl}?address=${encodeURIComponent(address)}&region=in&key=${apiKey}`

  const resp = await fetch(url, {
    signal: AbortSignal.timeout(5000) // 5 second timeout
  })

  if (!resp.ok) {
    console.error('[Geocode] Google API error:', resp.status, resp.statusText)
    throw new Error('Google geocoding failed')
  }

  const data = await resp.json()

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    console.error('[Geocode] Google API status:', data.status)
    throw new Error(`Google API error: ${data.status}`)
  }

  if (autocomplete) {
    // Return autocomplete predictions
    return data.predictions?.map((pred: any) => ({
      display_name: pred.description,
      place_id: pred.place_id
    })) || []
  } else {
    // Return single geocoding result
    if (!data.results || data.results.length === 0) {
      throw new Error('No results found')
    }

    const result = data.results[0]
    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      address: result.formatted_address
    }
  }
}

// Geocode using Nominatim (OpenStreetMap)
async function geocodeWithNominatim(address: string, autocomplete: boolean) {
  const limit = autocomplete ? '5' : '1'
  const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=${limit}&addressdetails=1&countrycodes=in`
  
  const resp = await fetch(nominatimUrl, {
    headers: {
      'User-Agent': 'DriveHire-CarShare/1.0 (support@drivehire.com)'
    },
    signal: AbortSignal.timeout(5000) // 5 second timeout
  })

  if (!resp.ok) {
    console.error('[Geocode] Nominatim error:', resp.status, resp.statusText)
    throw new Error('Nominatim geocoding failed')
  }

  const data = await resp.json()
  
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('No results found')
  }

  if (autocomplete) {
    // Return formatted autocomplete results
    return data.map(item => ({
      display_name: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      type: item.type,
      importance: item.importance,
      address: item.address
    }))
  } else {
    // Return single result with lat/lng
    const { lat, lon, display_name } = data[0]
    return { 
      lat: parseFloat(lat), 
      lng: parseFloat(lon),
      address: display_name 
    }
  }
}
