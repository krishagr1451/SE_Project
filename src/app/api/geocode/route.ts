import { NextRequest, NextResponse } from 'next/server'

// Simple server-side proxy to Nominatim (OpenStreetMap) geocoding.
// Note: Nominatim has usage policies and rate limits. For production use consider a paid geocoding service or caching.

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    const autocomplete = searchParams.get('autocomplete')

    if (!address) {
      return NextResponse.json({ error: 'address query required' }, { status: 400 })
    }

    // Use Nominatim public API with India bias
    const limit = autocomplete === 'true' ? '5' : '1'
    // Add countrycodes=in to prioritize Indian results
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=${limit}&addressdetails=1&countrycodes=in`
    const resp = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'DriveHire-CarShare/1.0 (support@drivehire.com)'
      }
    })

    if (!resp.ok) {
      return NextResponse.json({ error: 'geocoding failed' }, { status: 502 })
    }

    const data = await resp.json()
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'no results' }, { status: 404 })
    }

    // If autocomplete mode, return full array
    if (autocomplete === 'true') {
      return NextResponse.json(data)
    }

    // Otherwise return single result with lat/lng
    const { lat, lon } = data[0]
    return NextResponse.json({ lat: parseFloat(lat), lng: parseFloat(lon) })
  } catch (error) {
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}
