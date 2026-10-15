'use client'

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { AlertCircle, ChevronLeft, Loader2, MapPin, Recycle, Trash2 } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Footer } from '@/components/layout/Footer'
import { queryDatastore } from '@/lib/ckan'
import { bostonNow, toCalendarDate } from '@/lib/sweeping'
import {
  formatCollectionDate,
  nextCollectionDate,
  parseScheduleCode,
  trashSearchSql,
  type TrashAddress,
} from '@/lib/trash'

function dedupeAddresses(rows: TrashAddress[]): TrashAddress[] {
  const seen = new Set<string>()
  return rows.filter((row) => {
    if (!row.full_address || seen.has(row.full_address)) return false
    seen.add(row.full_address)
    return true
  })
}

function ScheduleLine({
  label,
  code,
  icon,
}: {
  label: string
  code: string | null
  icon: ReactNode
}) {
  const parsed = parseScheduleCode(code)
  const today = toCalendarDate(bostonNow())
  const next = nextCollectionDate(parsed.days)
  return (
    <div className="space-y-1 rounded-2xl bg-[#F2F2F7] p-4 dark:bg-[#2C2C2E]">
      <div className="flex items-center gap-2 text-[10px] font-bold tracking-wider text-[#8E8E93] uppercase">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-lg font-bold text-[#1C1C1E] dark:text-white">{parsed.label}</p>
      {next ? (
        <p className="text-sm font-medium text-[#8E8E93] dark:text-[#98989D]">
          Next pickup: {formatCollectionDate(next, today)}
        </p>
      ) : null}
      {parsed.suffix ? (
        <p className="text-xs font-medium text-[#8E8E93]">City schedule code {code}</p>
      ) : null}
    </div>
  )
}

function TrashResult({ address }: { address: TrashAddress }) {
  return (
    <article className="space-y-4 rounded-3xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#1C1C1E]">
      <div className="space-y-1">
        <h3 className="text-lg font-bold leading-tight dark:text-white">{address.full_address}</h3>
        <div className="flex items-center gap-1.5 text-xs font-medium text-[#8E8E93]">
          <MapPin className="h-3 w-3" />
          <span>{[address.mailing_neighborhood, address.zip_code].filter(Boolean).join(' · ') || 'Boston'}</span>
        </div>
      </div>
      <div className="grid gap-3">
        <ScheduleLine label="Trash" code={address.trashday} icon={<Trash2 className="h-3 w-3" />} />
        <ScheduleLine label="Recycling" code={address.recollect} icon={<Recycle className="h-3 w-3" />} />
      </div>
    </article>
  )
}

export default function TrashDayPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<TrashAddress[]>([])
  const [results, setResults] = useState<TrashAddress[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [activeQuery, setActiveQuery] = useState<string | null>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const trimmed = searchQuery.trim()
    if (trimmed.length < 3 || trimmed === activeQuery) {
      setSuggestions([])
      setIsSuggesting(false)
      return
    }

    const fetchSuggestions = async () => {
      setIsSuggesting(true)
      try {
        const rows = await queryDatastore<TrashAddress>(trashSearchSql(trimmed, 8))
        setSuggestions(dedupeAddresses(rows))
      } catch (error) {
        console.error('Error fetching address suggestions:', error)
      } finally {
        setIsSuggesting(false)
      }
    }

    const timer = setTimeout(() => {
      void fetchSuggestions()
    }, 200)
    return () => clearTimeout(timer)
  }, [searchQuery, activeQuery])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const executeSearch = async (query: string) => {
    const trimmed = query.trim()
    if (trimmed.length < 3) return
    setActiveQuery(trimmed)
    setSearchQuery(trimmed)
    setShowSuggestions(false)
    setHasSearched(true)
    setIsSearching(true)
    try {
      const rows = await queryDatastore<TrashAddress>(trashSearchSql(trimmed, 15))
      setResults(dedupeAddresses(rows))
    } catch (error) {
      console.error('Error fetching trash schedules:', error)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearch = (event?: FormEvent) => {
    event?.preventDefault()
    void executeSearch(suggestions[0]?.full_address ?? searchQuery)
  }

  return (
    <div className="min-h-screen bg-app-bg pb-24 font-sans text-app-fg transition-colors duration-300">
      <main className="mx-auto max-w-lg space-y-8 px-5 pt-12">
        <header className="relative flex flex-col items-center space-y-4 text-center">
          <div className="absolute top-0 left-0">
            <Link href="/" className="flex items-center justify-center rounded-full border border-app-border bg-app-card/50 p-2.5 shadow-sm backdrop-blur-sm transition-all hover:bg-app-card">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </div>
          <div className="absolute top-0 right-0">
            <ThemeToggle />
          </div>
          <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-system-teal/10">
            <Trash2 className="h-10 w-10 text-system-teal" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Trash Day</h1>
            <p className="text-lg font-medium text-app-secondary-text">Trash and recycling pickup for your address.</p>
          </div>
        </header>

        <div className="relative z-50" ref={searchContainerRef}>
          <form
            onSubmit={handleSearch}
            className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/70 shadow-[0_4px_12px_rgba(0,0,0,0.05)] backdrop-blur-2xl transition-all focus-within:ring-1 focus-within:ring-[#007AFF]/20 dark:border-white/10 dark:bg-[#1C1C1E]/70"
          >
            <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
              {isSearching || isSuggesting ? (
                <Loader2 className="h-5 w-5 animate-spin text-[#007AFF]" />
              ) : (
                <MapPin className="h-5 w-5 text-[#8E8E93]" />
              )}
            </div>
            <input
              type="text"
              value={searchQuery}
              placeholder="Address (e.g. 100 Beacon St)"
              className="w-full bg-transparent py-4 pr-4 pl-12 text-lg font-medium focus:outline-none dark:text-white"
              onFocus={() => setShowSuggestions(true)}
              onChange={(event) => {
                setSearchQuery(event.target.value)
                setShowSuggestions(true)
                setActiveQuery(null)
              }}
            />
          </form>
          {showSuggestions && suggestions.length > 0 ? (
            <div className="absolute top-full right-0 left-0 mt-2 divide-y divide-[#F2F2F7] overflow-hidden rounded-2xl border border-white/20 bg-white/90 shadow-[0_16px_32px_rgba(0,0,0,0.1)] backdrop-blur-3xl dark:divide-[#2C2C2E] dark:border-white/10 dark:bg-[#1C1C1E]/95">
              {suggestions.map((address) => (
                <button
                  key={address.full_address}
                  type="button"
                  onClick={() => {
                    void executeSearch(address.full_address)
                  }}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-[#007AFF]/10"
                >
                  <MapPin className="h-4 w-4 text-[#8E8E93]" />
                  <span className="font-semibold text-[#1C1C1E] dark:text-white">{address.full_address}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          {isSearching ? (
            <div className="space-y-4 py-20 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-system-blue" />
              <p className="font-medium text-app-secondary-text">Looking up collection days...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              <h2 className="px-2 text-sm font-bold tracking-widest text-app-secondary-text uppercase">
                Results for {activeQuery}
              </h2>
              {results.map((address) => (
                <TrashResult key={address.full_address} address={address} />
              ))}
            </div>
          ) : hasSearched ? (
            <div className="space-y-4 rounded-3xl border border-app-border bg-app-card p-12 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-app-secondary-text" />
              <div className="space-y-1">
                <h3 className="text-xl font-bold">No Address Found</h3>
                <p className="font-medium text-app-secondary-text">
                  No collection schedule matched &ldquo;{searchQuery}&rdquo;.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 rounded-[2.5rem] border border-app-border bg-app-card p-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-system-teal/10">
                <Recycle className="h-8 w-8 text-system-teal" />
              </div>
              <p className="font-medium leading-relaxed text-app-secondary-text">
                Search a Boston address to see official trash and recycling days from Analyze Boston.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
