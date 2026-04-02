'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, Loader2, Utensils, AlertCircle } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Footer } from '@/components/layout/Footer';
import { SearchBar } from '@/components/features/food-inspections/SearchBar';
import { BusinessCard } from '@/components/features/food-inspections/BusinessCard';
import { FoodInspection } from '@/types/street';

interface GroupedBusiness {
  licenseNo: string;
  name: string;
  address: string;
  city: string;
  inspections: FoodInspection[];
}

export default function FoodInspectionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [groupedBusinesses, setGroupedBusinesses] = useState<GroupedBusiness[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAutocompleteLoading, setIsAutocompleteLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  const PAGE_SIZE = 20;

  const groupInspections = (records: FoodInspection[]) => {
    const groups: Record<string, GroupedBusiness> = {};
    
    records.forEach(record => {
      const key = `${record.licenseno || record.businessname}-${record.address}`;
      if (!groups[key]) {
        groups[key] = {
          licenseNo: record.licenseno || 'N/A',
          name: record.businessname,
          address: record.address,
          city: record.city,
          inspections: []
        };
      }
      groups[key].inspections.push(record);
    });
    
    return Object.values(groups);
  };

  const fetchBusinesses = useCallback(async (query: string | null, currentOffset: number, isNewSearch: boolean) => {
    if (isNewSearch) {
      setIsSearching(true);
      setGroupedBusinesses([]);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const resourceId = '4582bec6-2b4f-4f9e-bc55-cbaa73117f4c';
      let sql = '';
      
      if (query) {
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
        const dateLimit = fiveYearsAgo.toISOString().split('T')[0];
        sql = `SELECT * from "${resourceId}" WHERE "businessname" = '${query.replace(/'/g, "''")}' AND "licstatus" = 'Active' AND "resultdttm" >= '${dateLimit}' ORDER BY "resultdttm" DESC LIMIT ${PAGE_SIZE} OFFSET ${currentOffset}`;
      } else {
        // Random featured businesses for initial load
        sql = `SELECT * from "${resourceId}" WHERE "licstatus" = 'Active' ORDER BY "resultdttm" DESC LIMIT ${PAGE_SIZE} OFFSET ${currentOffset}`;
      }

      const url = `https://data.boston.gov/api/3/action/datastore_search_sql?sql=${encodeURIComponent(sql)}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        const records: FoodInspection[] = data.result.records;
        const newGroups = groupInspections(records);
        
        if (records.length < PAGE_SIZE) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }

        setGroupedBusinesses(prev => {
          if (isNewSearch) return newGroups;
          
          // Merge avoiding duplicates (based on licenseNo and address)
          const existingKeys = new Set(prev.map(b => `${b.licenseNo}-${b.address}`));
          const uniqueNewGroups = newGroups.filter(b => !existingKeys.has(`${b.licenseNo}-${b.address}`));
          
          return [...prev, ...uniqueNewGroups];
        });
      }
    } catch (error) {
      console.error("Error fetching food inspections:", error);
    } finally {
      setIsSearching(false);
      setIsLoadingMore(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchBusinesses(null, 0, true);
  }, [fetchBusinesses]);

  // Intersection Observer for Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isSearching && !isLoadingMore) {
          const nextOffset = offset + PAGE_SIZE;
          setOffset(nextOffset);
          fetchBusinesses(selectedBusiness, nextOffset, false);
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isSearching, isLoadingMore, offset, selectedBusiness, fetchBusinesses]);

  // Autocomplete logic
  useEffect(() => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery || trimmedQuery.length < 2 || trimmedQuery === selectedBusiness) {
      setSuggestions([]);
      setIsAutocompleteLoading(false);
      return;
    }

    const fetchSuggestions = async () => {
      setIsAutocompleteLoading(true);
      try {
        const resourceId = '4582bec6-2b4f-4f9e-bc55-cbaa73117f4c';
        const sql = `SELECT DISTINCT "businessname" from "${resourceId}" WHERE "businessname" ILIKE '%${trimmedQuery.replace(/'/g, "''")}%' AND "licstatus" = 'Active' LIMIT 8`;
        const url = `https://data.boston.gov/api/3/action/datastore_search_sql?sql=${encodeURIComponent(sql)}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
          const names = data.result.records.map((r: any) => r.businessname);
          setSuggestions(names);
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setIsAutocompleteLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 150);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedBusiness]);

  // Click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const executeSearch = (name: string) => {
    setHasSearched(true);
    setSelectedBusiness(name);
    setShowSuggestions(false);
    setOffset(0);
    setHasMore(true);
    fetchBusinesses(name, 0, true);
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    executeSearch(searchQuery);
  };

  const handleSelectSuggestion = (name: string) => {
    setSearchQuery(name);
    executeSearch(name);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setHasSearched(false);
    setSuggestions([]);
    setSelectedBusiness(null);
    setOffset(0);
    setHasMore(true);
    fetchBusinesses(null, 0, true);
  };

  return (
    <div className="min-h-screen bg-app-bg font-sans text-app-fg pb-24 transition-colors duration-300">
      <main className="max-w-lg mx-auto px-5 pt-12 space-y-8">
        
        <header className="flex flex-col items-center text-center space-y-4 relative">
          <div className="absolute top-0 left-0">
            <Link href="/" className="p-2.5 flex items-center justify-center rounded-full bg-app-card/50 backdrop-blur-sm hover:bg-app-card transition-all border border-app-border shadow-sm">
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </div>
          <div className="absolute top-0 right-0">
            <ThemeToggle />
          </div>
          <div className="w-20 h-20 bg-system-orange/10 rounded-[2rem] flex items-center justify-center transition-colors">
            <Utensils className="w-10 h-10 text-system-orange" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight leading-tight">Food Inspections</h1>
            <p className="text-app-secondary-text text-lg font-medium transition-colors">Check restaurant safety records.</p>
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
            <div className="py-20 text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-system-blue mx-auto" />
              <p className="text-app-secondary-text font-medium animate-pulse">Loading restaurants...</p>
            </div>
          ) : groupedBusinesses.length > 0 ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-sm font-bold text-app-secondary-text uppercase tracking-widest px-2">
                {selectedBusiness ? `Results for ${selectedBusiness}` : 'Featured Restaurants'}
              </h2>
              <div className="grid gap-4">
                {groupedBusinesses.map((business) => (
                  <BusinessCard 
                    key={`${business.licenseNo}-${business.address}`}
                    business={business}
                    isExpanded={expandedId === `${business.licenseNo}-${business.address}`}
                    onToggle={() => setExpandedId(expandedId === `${business.licenseNo}-${business.address}` ? null : `${business.licenseNo}-${business.address}`)}
                  />
                ))}
              </div>
              
              {/* Infinite Scroll Trigger */}
              <div ref={observerTarget} className="py-10 text-center">
                {isLoadingMore && (
                  <div className="space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin text-system-blue mx-auto" />
                    <p className="text-xs text-app-secondary-text font-bold uppercase tracking-wider">Loading more...</p>
                  </div>
                )}
                {!hasMore && groupedBusinesses.length > 5 && (
                  <p className="text-xs text-app-secondary-text font-bold uppercase tracking-wider">You've reached the end</p>
                )}
              </div>
            </div>
          ) : hasSearched && !isSearching ? (
            <div className="bg-app-card rounded-3xl p-12 text-center space-y-4 border border-app-border animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-app-bg rounded-full flex items-center justify-center mx-auto transition-colors">
                <AlertCircle className="w-8 h-8 text-app-secondary-text" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold">No Records Found</h3>
                <p className="text-app-secondary-text font-medium px-4">
                  We couldn't find any active inspection results for "{searchQuery}".
                </p>
              </div>
            </div>
          ) : !isSearching && (
            <div className="bg-app-card p-8 rounded-[2.5rem] text-center space-y-4 border border-app-border">
              <div className="w-16 h-16 bg-system-orange/10 rounded-3xl flex items-center justify-center mx-auto transition-colors">
                <Utensils className="w-8 h-8 text-system-orange" />
              </div>
              <p className="text-app-secondary-text font-medium leading-relaxed">
                Enter a restaurant name to see their official health inspection history and results grouped by location.
              </p>
            </div>
          )}
        </div>

      </main>
      <Footer />
    </div>
  );
}
