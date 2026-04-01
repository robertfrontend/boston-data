'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Fetch random businesses on load
  useEffect(() => {
    const fetchRandomBusinesses = async () => {
      setIsSearching(true);
      try {
        const resourceId = '4582bec6-2b4f-4f9e-bc55-cbaa73117f4c';
        // Fetch random active inspections, then we group them
        const sql = `SELECT * from "${resourceId}" WHERE "licstatus" = 'Active' ORDER BY random() LIMIT 30`;
        const url = `https://data.boston.gov/api/3/action/datastore_search_sql?sql=${encodeURIComponent(sql)}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
          const records: FoodInspection[] = data.result.records;
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

          // Take only first 5 grouped businesses
          setGroupedBusinesses(Object.values(groups).slice(0, 5));
        }
      } catch (error) {
        console.error("Error fetching random food inspections:", error);
      } finally {
        setIsSearching(false);
      }
    };

    fetchRandomBusinesses();
  }, []);

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
        // Distinct business names using SQL for better performance
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

  const executeSearch = async (name: string) => {
    setIsSearching(true);
    setHasSearched(true);
    setSelectedBusiness(name);
    setShowSuggestions(false);
    
    try {
      const resourceId = '4582bec6-2b4f-4f9e-bc55-cbaa73117f4c';
      const fiveYearsAgo = new Date();
      fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
      const dateLimit = fiveYearsAgo.toISOString().split('T')[0];

      const sql = `SELECT * from "${resourceId}" WHERE "businessname" = '${name.replace(/'/g, "''")}' AND "licstatus" = 'Active' AND "resultdttm" >= '${dateLimit}' ORDER BY "resultdttm" DESC LIMIT 100`;
      const url = `https://data.boston.gov/api/3/action/datastore_search_sql?sql=${encodeURIComponent(sql)}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        const records: FoodInspection[] = data.result.records;
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

        setGroupedBusinesses(Object.values(groups));
      }
    } catch (error) {
      console.error("Error fetching food inspections:", error);
    } finally {
      setIsSearching(false);
    }
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
    setGroupedBusinesses([]);
    setHasSearched(false);
    setSuggestions([]);
    setSelectedBusiness(null);
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-[#000000] font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,Helvetica,Arial,sans-serif] text-black dark:text-white pb-24 transition-colors duration-300">
      <main className="max-w-lg mx-auto px-5 pt-12 space-y-8">
        
        <header className="flex flex-col items-center text-center space-y-4 relative">
          <div className="absolute top-0 left-0">
            <Link href="/" className="p-2.5 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-all border border-black/5 dark:border-white/10 shadow-sm">
              <ChevronLeft className="w-5 h-5 text-black dark:text-white" />
            </Link>
          </div>
          <div className="absolute top-0 right-0">
            <ThemeToggle />
          </div>
          <div className="w-20 h-20 bg-[#FF9500]/10 rounded-[2rem] flex items-center justify-center transition-colors">
            <Utensils className="w-10 h-10 text-[#FF9500]" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Food Inspections</h1>
            <p className="text-[#8E8E93] dark:text-[#98989D] text-lg font-medium transition-colors">Check restaurant safety records.</p>
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
          {isSearching && !hasSearched ? (
            <div className="py-20 text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-[#007AFF] mx-auto" />
              <p className="text-[#8E8E93] font-medium animate-pulse">Loading featured restaurants...</p>
            </div>
          ) : isSearching ? (
            <div className="py-20 text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-[#007AFF] mx-auto" />
              <p className="text-[#8E8E93] font-medium animate-pulse">Searching and grouping records...</p>
            </div>
          ) : groupedBusinesses.length > 0 ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-sm font-bold text-[#8E8E93] dark:text-[#98989D] uppercase tracking-widest px-2">
                {hasSearched ? `Restaurants Found (${groupedBusinesses.length})` : 'Featured Restaurants'}
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
            </div>
          ) : hasSearched ? (
            <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-12 text-center space-y-4 border border-black/5 dark:border-white/5 animate-in zoom-in-95 duration-300 transition-colors">
              <div className="w-16 h-16 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-full flex items-center justify-center mx-auto transition-colors">
                <AlertCircle className="w-8 h-8 text-[#8E8E93]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold dark:text-white">No Records Found</h3>
                <p className="text-[#8E8E93] dark:text-[#98989D] font-medium px-4">
                  We couldn't find any active inspection results for "{searchQuery}".
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1C1C1E] p-8 rounded-[2.5rem] text-center space-y-4 border border-black/5 dark:border-white/5 transition-colors">
              <div className="w-16 h-16 bg-[#FF9500]/10 rounded-3xl flex items-center justify-center mx-auto transition-colors">
                <Utensils className="w-8 h-8 text-[#FF9500]" />
              </div>
              <p className="text-[#8E8E93] dark:text-[#98989D] font-medium leading-relaxed transition-colors">
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
