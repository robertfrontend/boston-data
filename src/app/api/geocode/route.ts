import { NextResponse } from 'next/server'
import {
  nearbySamplePoints,
  pointFromPhoton,
  streetFromNominatim,
  streetFromPhoton,
  type GeoPoint,
} from '@/lib/geocode'

const USER_AGENT = 'BostonHub/1.0 (https://github.com/robertfrontend/boston-data)'

let lastRequestAt = 0
let queue: Promise<void> = Promise.resolve()
const pointCache = new Map<string, GeoPoint | null>()
const streetCache = new Map<string, string | null>()

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const wait = Math.max(0, 1100 - (Date.now() - lastRequestAt))
    if (wait > 0) await delay(wait)
    try {
      return await task()
    } finally {
      lastRequestAt = Date.now()
    }
  })
  queue = run.then(() => undefined, () => undefined)
  return run
}

async function readJson<T>(response: Response): Promise<T | null> {
  if (!response.ok) return null
  return response.json() as Promise<T>
}

async function nominatimSearch(query: string): Promise<GeoPoint | null> {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', '1')
  url.searchParams.set('q', query)
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
  })
  const data = await readJson<Array<{ lat: string, lon: string }>>(response)
  const first = data?.[0]
  if (!first) return null
  const lat = Number(first.lat)
  const lng = Number(first.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

async function photonSearch(query: string): Promise<GeoPoint | null> {
  const url = new URL('https://photon.komoot.io/api/')
  url.searchParams.set('q', query)
  url.searchParams.set('limit', '1')
  url.searchParams.set('lat', '42.3601')
  url.searchParams.set('lon', '-71.0589')
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
  })
  const data = await readJson<{ features?: Array<{ geometry?: { coordinates?: number[] } }> }>(response)
  return pointFromPhoton(data?.features?.[0])
}

async function searchPlace(query: string): Promise<GeoPoint | null> {
  const key = query.trim().toLowerCase()
  if (!key) return null
  if (pointCache.has(key)) return pointCache.get(key) ?? null

  const point = await enqueue(async () => (await nominatimSearch(query)) ?? photonSearch(query))
  pointCache.set(key, point)
  return point
}

async function nominatimReverse(lat: number, lng: number): Promise<string | null> {
  const url = new URL('https://nominatim.openstreetmap.org/reverse')
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(lng))
  url.searchParams.set('zoom', '18')
  url.searchParams.set('addressdetails', '1')
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
  })
  const data = await readJson<{ address?: Record<string, string> }>(response)
  return streetFromNominatim(data?.address)
}

async function photonReverse(lat: number, lng: number): Promise<string | null> {
  const url = new URL('https://photon.komoot.io/reverse')
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(lng))
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
  })
  const data = await readJson<{ features?: Array<{ properties?: Record<string, unknown> }> }>(response)
  return streetFromPhoton(data?.features?.[0]?.properties)
}

async function reverseStreet(lat: number, lng: number): Promise<string | null> {
  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`
  if (streetCache.has(key)) return streetCache.get(key) ?? null
  const street = await enqueue(async () => (await nominatimReverse(lat, lng)) ?? photonReverse(lat, lng))
  streetCache.set(key, street)
  return street
}

function isCoordinate(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim()
  const lat = Number(searchParams.get('lat'))
  const lng = Number(searchParams.get('lng'))

  if (query) {
    const point = await searchPlace(query)
    return NextResponse.json(
      { point },
      { headers: { 'Cache-Control': 'public, max-age=86400' } },
    )
  }

  if (isCoordinate(lat, lng)) {
    const streets: string[] = []
    for (const point of nearbySamplePoints(lat, lng)) {
      const street = await reverseStreet(point.lat, point.lng)
      if (street && !streets.includes(street)) streets.push(street)
    }
    return NextResponse.json(
      { streets },
      { headers: { 'Cache-Control': 'public, max-age=300' } },
    )
  }

  return NextResponse.json({ error: 'Provide q or lat and lng.' }, { status: 400 })
}
