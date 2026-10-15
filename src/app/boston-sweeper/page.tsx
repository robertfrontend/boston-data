'use client'

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Info, Loader2, MapPin } from 'lucide-react'
import Papa from 'papaparse'
import { SearchBar } from '@/components/features/boston-sweeper/SearchBar'
import { StatusBanner } from '@/components/features/boston-sweeper/StatusBanner'
import { ScheduleCard } from '@/components/features/boston-sweeper/ScheduleCard'
import { MapPreview } from '@/components/features/boston-sweeper/MapPreview'
import { LocationModal } from '@/components/features/boston-sweeper/LocationModal'
import { WelcomePermissionModal } from '@/components/features/boston-sweeper/WelcomePermissionModal'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Footer } from '@/components/layout/Footer'
import { SITE_URL } from '@/lib/site'
import { describeStreet, sideKey, sidePhrase, uniqueSides } from '@/lib/sweeping'
import { normalizeStreetName } from '@/lib/utils'
import type { GeoPoint } from '@/lib/geocode'
import type { StreetData, StreetDetails } from '@/types/street'

const SWEEPING_CSV = '/data/street-sweeping-schedules.csv'

interface SamStreetRecord {
  ST_NAME?: string
  ST_TYPE?: string
  PRE_DIR?: string
  SUF_DIR?: string
}

async function geocodeQuery(query: string): Promise<GeoPoint | null> {
  const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`)
  if (!response.ok) return null
  const data = (await response.json()) as { point?: GeoPoint | null }
  return data.point ?? null
}

function intersectionQuery(street: string, cross: string): string | null {
  const trimmed = cross.trim()
  if (!trimmed || trimmed.toLowerCase() === 'dead end') return null
  return `${street} and ${trimmed}, Boston, MA`
}

export default function BostonSweeperPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [allStreets, setAllStreets] = useState<StreetData[]>([])
  const [selectedStreet, setSelectedStreet] = useState<string | null>(null)
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null)
  const [selectedSide, setSelectedSide] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [coords, setCoords] = useState<GeoPoint[]>([])
  const [isGeocoding, setIsGeocoding] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const locationRequest = useRef(0)

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)
  const [nearbyStreets, setNearbyStreets] = useState<string[]>([])
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch(SWEEPING_CSV)
        const csvText = await response.text()
        Papa.parse<StreetData>(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            setAllStreets(results.data)
            setIsLoading(false)
          },
        })
      } catch (error) {
        console.error('Failed to load street data:', error)
        setIsLoading(false)
      }
    }
    void loadData()
  }, [])

  useEffect(() => {
    const trimmedQuery = searchQuery.trim()
    if (!trimmedQuery || trimmedQuery === selectedStreet) {
      setSuggestions([])
      setIsSearching(false)
      return
    }

    const fetchSuggestions = async () => {
      setIsSearching(true)
      try {
        const resourceId = '6fa7932b-7bc8-42bc-9250-168d5f5dc1ad'
        const url = `https://data.boston.gov/api/3/action/datastore_search?resource_id=${resourceId}&q=${encodeURIComponent(trimmedQuery)}&limit=15&fields=ST_NAME,ST_TYPE,PRE_DIR,SUF_DIR`
        const response = await fetch(url)
        const data = (await response.json()) as { success: boolean, result?: { records: SamStreetRecord[] } }

        if (data.success && data.result) {
          const uniqueNames = Array.from(new Set(data.result.records
            .map((record) => {
              const name = (record.ST_NAME || '').trim()
              if (!name) return ''
              const type = (record.ST_TYPE || '').trim()
              const pre = record.PRE_DIR ? `${record.PRE_DIR.trim()} ` : ''
              const suf = record.SUF_DIR ? ` ${record.SUF_DIR.trim()}` : ''
              return `${pre}${name} ${type}${suf}`.trim()
            })
            .filter((name) => name.length > 0)))
            .slice(0, 8)
          setSuggestions(uniqueNames)
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error)
      } finally {
        setIsSearching(false)
      }
    }

    const debounceTimer = setTimeout(() => {
      void fetchSuggestions()
    }, 50)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery, selectedStreet])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!selectedSegmentId) {
      setCoords([])
      return
    }

    const segment = allStreets.find((street) => street.main_id === selectedSegmentId)
    if (!segment) return

    let cancelled = false
    const fetchRoute = async () => {
      setIsGeocoding(true)
      try {
        const fromQuery = intersectionQuery(segment.st_name, segment.from)
        const toQuery = intersectionQuery(segment.st_name, segment.to)
        const [fromPoint, toPoint] = await Promise.all([
          fromQuery ? geocodeQuery(fromQuery) : Promise.resolve(null),
          toQuery ? geocodeQuery(toQuery) : Promise.resolve(null),
        ])
        if (cancelled) return

        if (fromPoint && toPoint) {
          setCoords([fromPoint, toPoint])
          return
        }

        const center = fromPoint ?? toPoint ?? await geocodeQuery(`${segment.st_name}, Boston, MA`)
        if (!cancelled) setCoords(center ? [center] : [])
      } catch (error) {
        console.error('Error geocoding street segment:', error)
        if (!cancelled) setCoords([])
      } finally {
        if (!cancelled) setIsGeocoding(false)
      }
    }

    void fetchRoute()
    return () => {
      cancelled = true
    }
  }, [selectedSegmentId, allStreets])

  const applyStreet = (name: string) => {
    if (!name) return
    const normalizedSelected = normalizeStreetName(name)
    const localMatch = allStreets.find((street) => normalizeStreetName(street.st_name) === normalizedSelected)
      ?? allStreets.find((street) => normalizeStreetName(street.st_name).includes(normalizedSelected))
      ?? allStreets.find((street) => normalizedSelected.includes(normalizeStreetName(street.st_name)))

    const streetNameToUse = localMatch ? localMatch.st_name : name
    setSelectedStreet(streetNameToUse)
    setSearchQuery(streetNameToUse)
    setShowSuggestions(false)
    setSuggestions([])

    const rows = allStreets.filter((street) => street.st_name === streetNameToUse)
    if (rows.length === 0) {
      setSelectedSide('')
      setSelectedSegmentId(null)
      setCoords([])
      return
    }

    const sides = uniqueSides(rows)
    const side = sides.includes('Odd') ? 'Odd' : (sides[0] ?? '')
    setSelectedSide(side)
    const segments = rows.filter((street) => sideKey(street.side) === side)
    setSelectedSegmentId(segments.length === 1 ? segments[0].main_id : null)
  }

  const handleSearch = (event?: FormEvent) => {
    event?.preventDefault()
    const choice = suggestions[0] ?? searchQuery.trim()
    if (choice) applyStreet(choice)
  }

  const lookupNearbyStreets = () => {
    if (!navigator.geolocation) {
      setLocationError('Location is not available in this browser.')
      setNearbyStreets([])
      setIsDetectingLocation(false)
      setIsLocationModalOpen(true)
      return
    }

    const requestId = ++locationRequest.current
    setIsLocationModalOpen(true)
    setIsDetectingLocation(true)
    setNearbyStreets([])
    setLocationError(null)

    const safetyTimer = window.setTimeout(() => {
      if (requestId !== locationRequest.current) return
      setIsDetectingLocation(false)
      setLocationError('Looking up nearby streets took too long. Try searching by name.')
    }, 20000)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        void (async () => {
          try {
            const params = new URLSearchParams({
              lat: String(position.coords.latitude),
              lng: String(position.coords.longitude),
            })
            const response = await fetch(`/api/geocode?${params.toString()}`)
            const data = (await response.json()) as { streets?: string[], error?: string }
            if (requestId !== locationRequest.current) return
            if (!response.ok) {
              setLocationError(data.error ?? 'Could not look up streets for that location.')
              setNearbyStreets([])
              return
            }
            setNearbyStreets(data.streets ?? [])
            if (!data.streets?.length) {
              setLocationError('No street name came back for this location. Try searching by name.')
            }
          } catch (error) {
            console.error(error)
            if (requestId !== locationRequest.current) return
            setLocationError('Could not look up streets for that location.')
            setNearbyStreets([])
          } finally {
            window.clearTimeout(safetyTimer)
            if (requestId === locationRequest.current) setIsDetectingLocation(false)
          }
        })()
      },
      (error) => {
        console.error(error)
        window.clearTimeout(safetyTimer)
        if (requestId !== locationRequest.current) return
        setIsDetectingLocation(false)
        setNearbyStreets([])
        setLocationError(error.code === error.PERMISSION_DENIED
          ? 'Location permission was denied. You can still search by street name.'
          : 'Could not detect your location.')
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    )
  }

  const handleLocationClick = () => {
    const hasSeenWelcome = localStorage.getItem('boston_sweeper_welcome_seen')
    if (!hasSeenWelcome) {
      setIsWelcomeModalOpen(true)
      return
    }
    lookupNearbyStreets()
  }

  const handleAcceptPermission = () => {
    setIsWelcomeModalOpen(false)
    localStorage.setItem('boston_sweeper_welcome_seen', 'true')
    window.setTimeout(() => lookupNearbyStreets(), 300)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSelectedStreet(null)
    setSelectedSegmentId(null)
    setShowSuggestions(false)
    setSuggestions([])
    setCoords([])
  }

  const streetRows = useMemo(
    () => (selectedStreet ? allStreets.filter((street) => street.st_name === selectedStreet) : []),
    [allStreets, selectedStreet],
  )
  const sides = useMemo(() => uniqueSides(streetRows), [streetRows])
  const sideRows = streetRows.filter((street) => sideKey(street.side) === selectedSide)
  const hasSchedule = streetRows.length > 0

  const streetDetails = useMemo<StreetDetails | null>(() => {
    if (!selectedSegmentId) return null
    const sideData = allStreets.find((street) => street.main_id === selectedSegmentId)
    if (!sideData) return null
    const summary = describeStreet(sideData)
    return {
      name: sideData.st_name,
      district: sideData.dist_name,
      status: summary.status,
      message: summary.message,
      nextSweeping: summary.timeRange,
      nextDateLabel: summary.nextDateLabel,
      hasUpcoming: summary.hasUpcoming,
      from: sideData.from,
      to: sideData.to,
      specificDays: summary.specificDays,
      raw: sideData,
    }
  }, [selectedSegmentId, allStreets])

  const selectSide = (side: string) => {
    setSelectedSide(side)
    setCoords([])
    const segments = streetRows.filter((street) => sideKey(street.side) === side)
    setSelectedSegmentId(segments.length === 1 ? segments[0].main_id : null)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center transition-colors duration-300">
        <Loader2 className="h-8 w-8 animate-spin text-[#007AFF]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,Helvetica,Arial,sans-serif] transition-colors duration-300">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'Boston Sweeper',
            description: 'Street cleaning schedules and the next sweeping date for Boston.',
            applicationCategory: 'Utility',
            operatingSystem: 'All',
            url: `${SITE_URL}/boston-sweeper`,
            author: { '@type': 'Person', name: 'robertfrontend' },
          }),
        }}
      />
      <main className="mx-auto max-w-lg space-y-8 px-5 pt-12">
        <header className="relative flex flex-col items-center space-y-4 text-center">
          <div className="absolute top-0 left-0">
            <Link href="/" className="flex items-center justify-center rounded-full border border-black/5 bg-black/5 p-2.5 shadow-sm transition-all hover:bg-black/10 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/20">
              <ChevronLeft className="h-5 w-5 text-black dark:text-white" />
            </Link>
          </div>
          <div className="absolute top-0 right-0">
            <ThemeToggle />
          </div>
          <div className="relative mx-auto h-20 w-20 opacity-90">
            <Image src="/new-logo.png" alt="Boston Sweeper" fill className="object-contain" priority />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Boston Sweeper</h1>
            <p className="text-lg font-medium text-[#8E8E93] transition-colors dark:text-[#98989D]">Never get a ticket again.</p>
          </div>
        </header>

        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isSearching={isSearching}
          showSuggestions={showSuggestions}
          setShowSuggestions={setShowSuggestions}
          suggestions={suggestions}
          handleSearch={handleSearch}
          handleSelectStreet={applyStreet}
          handleLocationClick={handleLocationClick}
          clearSearch={clearSearch}
          searchContainerRef={searchContainerRef}
        />

        {selectedStreet ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-500">
            {hasSchedule ? (
              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  {sides.length > 1 ? (
                    <div className="flex flex-wrap gap-1 rounded-xl bg-[#E3E3E8] p-1 transition-colors dark:bg-[#1C1C1E]">
                      {sides.map((side) => (
                        <button
                          key={side || 'entire'}
                          onClick={() => selectSide(side)}
                          className={`min-w-[30%] flex-1 rounded-[9px] px-2 py-1.5 text-sm font-semibold transition-all ${
                            selectedSide === side
                              ? 'bg-white text-black shadow-sm dark:bg-[#3A3A3C] dark:text-white'
                              : 'text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white'
                          }`}
                        >
                          {sidePhrase(side)}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-sm font-semibold text-[#1C1C1E] dark:text-white">
                      {sidePhrase(sides[0] ?? '')}
                    </p>
                  )}
                  <p className="px-2 text-center text-[11px] font-medium text-[#8E8E93] dark:text-[#98989D]">
                    {sides.every((side) => side === 'Odd' || side === 'Even')
                      ? 'Check house numbers: Odd (1, 3, 5) or Even (2, 4, 6).'
                      : 'Choose the side that matches the sign on your block.'}
                  </p>
                </div>

                {selectedSegmentId ? (
                  <button
                    onClick={() => {
                      setSelectedSegmentId(null)
                      setCoords([])
                    }}
                    className="flex items-center gap-1 text-sm font-semibold text-[#007AFF]"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" /> Back to Blocks
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="space-y-3 rounded-3xl border border-black/5 bg-white p-8 text-center shadow-sm dark:border-white/5 dark:bg-[#1C1C1E]">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#007AFF]/10">
                  <Info className="h-7 w-7 text-[#007AFF]" />
                </div>
                <h2 className="text-xl font-bold text-[#1C1C1E] dark:text-white">No sweeping schedule</h2>
                <p className="text-sm font-medium leading-relaxed text-[#8E8E93] dark:text-[#98989D]">
                  {selectedStreet} is not in the City of Boston street sweeping list. Many streets have no posted sweeping. Check the signs on your block — those are what parking enforcement follows.
                </p>
              </div>
            )}

            {!selectedSegmentId && hasSchedule ? (
              sideRows.length > 0 ? (
                <div className="divide-y divide-[#F2F2F7] overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition-colors dark:divide-[#2C2C2E] dark:border-white/5 dark:bg-[#1C1C1E]">
                  {sideRows.map((segment) => (
                    <button
                      key={segment.main_id}
                      onClick={() => setSelectedSegmentId(segment.main_id)}
                      className="flex w-full items-center justify-between p-4 transition-all hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E]"
                    >
                      <div className="text-left">
                        <p className="font-bold text-[#1C1C1E] dark:text-white">{segment.from} to {segment.to}</p>
                        <p className="text-xs font-medium tracking-wide text-[#8E8E93] uppercase dark:text-[#98989D]">{segment.dist_name}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-[#C7C7CC] dark:text-[#48484A]" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm font-medium text-[#8E8E93]">No blocks listed for this side.</p>
              )
            ) : null}

            {streetDetails ? (
              <div className="space-y-6">
                <StatusBanner streetDetails={streetDetails} />
                <ScheduleCard streetDetails={streetDetails} />
                <MapPreview coords={coords} isGeocoding={isGeocoding} />
              </div>
            ) : null}
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-700">
            <button
              onClick={handleLocationClick}
              className="group flex w-full flex-col items-center space-y-6 rounded-[2.5rem] border border-black/5 bg-white p-8 text-center shadow-sm transition-all hover:shadow-md active:scale-[0.98] dark:border-white/5 dark:bg-[#1C1C1E]"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-[#34C759]/10 transition-transform duration-500 ease-out group-hover:scale-110">
                <MapPin className="h-10 w-10 text-[#34C759]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-extrabold tracking-tight text-black dark:text-white">Schedules Near Me</h3>
                <p className="mx-auto max-w-[240px] text-sm font-medium leading-relaxed text-[#8E8E93] dark:text-[#98989D]">
                  Detect your street and check the next cleaning day.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-[#007AFF] px-6 py-3 text-sm font-bold text-white shadow-lg transition-all group-hover:bg-[#0062CC]">
                <span>Use Current Location</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </button>
          </div>
        )}
      </main>

      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        nearbyStreets={nearbyStreets}
        onSelectStreet={applyStreet}
        isLoading={isDetectingLocation}
        error={locationError}
      />
      <WelcomePermissionModal
        isOpen={isWelcomeModalOpen}
        onClose={() => {
          setIsWelcomeModalOpen(false)
          localStorage.setItem('boston_sweeper_welcome_seen', 'true')
        }}
        onAccept={handleAcceptPermission}
      />
      <Footer />
    </div>
  )
}
