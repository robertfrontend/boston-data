'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { AlertCircle, ChevronLeft, Loader2, Utensils } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Footer } from '@/components/layout/Footer'
import { SearchBar } from '@/components/features/food-inspections/SearchBar'
import { BusinessCard } from '@/components/features/food-inspections/BusinessCard'
import { queryDatastore } from '@/lib/ckan'
import {
  featuredFoodSql,
  fiveYearDateLimit,
  mergeInspectionRecords,
  searchFoodSql,
  suggestionFoodSql,
  type FoodInspectionRecord,
  type GroupedBusiness,
} from '@/lib/food-inspections'

const PAGE_SIZE = 20

export default function FoodInspectionsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [groupedBusinesses, setGroupedBusinesses] = useState<GroupedBusiness[]>([])
  const [isSearching, setIsSearching] = useState(true)
  const [isAutocompleteLoading, setIsAutocompleteLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [activeQuery, setActiveQuery] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const searchContainerRef = useRef<HTMLDivElement>(null)
  const observerTarget = useRef<HTMLDivElement>(null)
  const requestSeq = useRef(0)

  const fetchBusinesses = useCallback(async (query: string | null, currentOffset: number, isNewSearch: boolean) => {
    const requestId = isNewSearch ? ++requestSeq.current : requestSeq.current
    if (isNewSearch) {
      setIsSearching(true)
      setGroupedBusinesses([])
    } else {
      setIsLoadingMore(true)
    }

    try {
      const sql = query
        ? searchFoodSql(query, PAGE_SIZE, currentOffset, fiveYearDateLimit())
        : featuredFoodSql(PAGE_SIZE, currentOffset)
      const records = await queryDatastore<FoodInspectionRecord>(sql)
      if (requestId !== requestSeq.current) return

      setHasMore(records.length === PAGE_SIZE)
      setGroupedBusinesses((previous) => mergeInspectionRecords(isNewSearch ? [] : previous, records))
    } catch (error) {
      console.error('Error fetching food inspections:', error)
      if (requestId === requestSeq.current) setHasMore(false)
    } finally {
      if (requestId === requestSeq.current) {
        setIsSearching(false)
        setIsLoadingMore(false)
      }
    }
  }, [])

  useEffect(() => {
    void fetchBusinesses(null, 0, true)
  }, [fetchBusinesses])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isSearching && !isLoadingMore) {
          const nextOffset = offset + PAGE_SIZE
          setOffset(nextOffset)
          void fetchBusinesses(activeQuery, nextOffset, false)
        }
      },
      { threshold: 1 },
    )

    const target = observerTarget.current
    if (target) observer.observe(target)
    return () => observer.disconnect()
  }, [hasMore, isSearching, isLoadingMore, offset, activeQuery, fetchBusinesses])

  useEffect(() => {
    const trimmedQuery = searchQuery.trim()
    if (!trimmedQuery || trimmedQuery.length < 2 || trimmedQuery === activeQuery) {
      setSuggestions([])
      setIsAutocompleteLoading(false)
      return
    }

    const fetchSuggestions = async () => {
      setIsAutocompleteLoading(true)
      try {
        const records = await queryDatastore<{ businessname: string }>(suggestionFoodSql(trimmedQuery))
        setSuggestions(records.map((record) => record.businessname))
      } catch (error) {
        console.error('Error fetching suggestions:', error)
      } finally {
        setIsAutocompleteLoading(false)
      }
    }

    const debounceTimer = setTimeout(() => {
      void fetchSuggestions()
    }, 150)
    return () => clearTimeout(debounceTimer)
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

  const executeSearch = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setHasSearched(true)
    setActiveQuery(trimmed)
    setShowSuggestions(false)
    setOffset(0)
    setHasMore(true)
    void fetchBusinesses(trimmed, 0, true)
  }

  const handleSearch = (event?: FormEvent) => {
    event?.preventDefault()
    if (!searchQuery.trim()) return
    executeSearch(searchQuery)
  }

  const handleSelectSuggestion = (name: string) => {
    setSearchQuery(name)
    executeSearch(name)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setHasSearched(false)
    setSuggestions([])
    setActiveQuery(null)
    setOffset(0)
    setHasMore(true)
    void fetchBusinesses(null, 0, true)
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
          <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-system-orange/10 transition-colors">
            <Utensils className="h-10 w-10 text-system-orange" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Food Inspections</h1>
            <p className="text-lg font-medium text-app-secondary-text transition-colors">Check restaurant safety records.</p>
          </div>
        </header>

        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isSearching={isSearching}
          isAutocompleteLoading={isAutocompleteLoading}
          showSuggestions={showSuggestions}
          setShowSuggestions={setShowSuggestions}
          suggestions={suggestions}
          handleSearch={handleSearch}
          handleSelectSuggestion={handleSelectSuggestion}
          clearSearch={clearSearch}
          searchContainerRef={searchContainerRef}
        />

        <div className="space-y-4">
          {isSearching && groupedBusinesses.length === 0 ? (
            <div className="space-y-4 py-20 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-system-blue" />
              <p className="animate-pulse font-medium text-app-secondary-text">Loading restaurants...</p>
            </div>
          ) : groupedBusinesses.length > 0 ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-4 duration-500">
              <h2 className="px-2 text-sm font-bold tracking-widest text-app-secondary-text uppercase">
                {activeQuery ? `Results for ${activeQuery}` : 'Featured Restaurants'}
              </h2>
              <div className="grid gap-4">
                {groupedBusinesses.map((business) => (
                  <BusinessCard
                    key={business.key}
                    business={business}
                    isExpanded={expandedId === business.key}
                    onToggle={() => setExpandedId(expandedId === business.key ? null : business.key)}
                  />
                ))}
              </div>

              <div ref={observerTarget} className="py-10 text-center">
                {isLoadingMore ? (
                  <div className="space-y-2">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-system-blue" />
                    <p className="text-xs font-bold tracking-wider text-app-secondary-text uppercase">Loading more...</p>
                  </div>
                ) : null}
                {!hasMore && groupedBusinesses.length > 5 ? (
                  <p className="text-xs font-bold tracking-wider text-app-secondary-text uppercase">End of results</p>
                ) : null}
              </div>
            </div>
          ) : hasSearched && !isSearching ? (
            <div className="animate-in zoom-in-95 space-y-4 rounded-3xl border border-app-border bg-app-card p-12 text-center duration-300">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-app-bg transition-colors">
                <AlertCircle className="h-8 w-8 text-app-secondary-text" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold">No Records Found</h3>
                <p className="px-4 font-medium text-app-secondary-text">
                  No active inspection results matched &ldquo;{searchQuery}&rdquo;.
                </p>
              </div>
            </div>
          ) : !isSearching ? (
            <div className="space-y-4 rounded-[2.5rem] border border-app-border bg-app-card p-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-system-orange/10 transition-colors">
                <Utensils className="h-8 w-8 text-system-orange" />
              </div>
              <p className="font-medium leading-relaxed text-app-secondary-text">
                Enter a restaurant name to see official health inspection history, grouped by location.
              </p>
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  )
}
