'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Loader2, Utensils, AlertCircle, MapPin, ShieldCheck, ShieldAlert, ShieldQuestion, Calendar, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Footer } from '@/components/layout/Footer';
import { FoodSearchBar } from '@/components/features/FoodSearchBar';
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
  const [hasSearched, setHasSearched] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const resourceId = '4582bec6-2b4f-4f9e-bc55-cbaa73117f4c';
      
      // Calculate date 5 years ago
      const fiveYearsAgo = new Date();
      fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
      const dateLimit = fiveYearsAgo.toISOString().split('T')[0];

      // SQL query: Active licenses only + Last 5 years + Business name filter
      const sql = `SELECT * from "${resourceId}" WHERE "businessname" ILIKE '%${searchQuery.replace(/'/g, "''")}%' AND "licstatus" = 'Active' AND "resultdttm" >= '${dateLimit}' ORDER BY "resultdttm" DESC LIMIT 100`;
      const url = `https://data.boston.gov/api/3/action/datastore_search_sql?sql=${encodeURIComponent(sql)}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        const records: FoodInspection[] = data.result.records;
        
        // Grouping logic by License Number and Address
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

  const clearSearch = () => {
    setSearchQuery('');
    setGroupedBusinesses([]);
    setHasSearched(false);
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
          <div className="w-20 h-20 bg-[#FF9500]/10 rounded-[2rem] flex items-center justify-center">
            <Utensils className="w-10 h-10 text-[#FF9500]" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight">Food Inspections</h1>
            <p className="text-[#8E8E93] dark:text-[#98989D] text-lg font-medium">Check restaurant safety records.</p>
          </div>
        </header>

        <FoodSearchBar 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isSearching={isSearching}
          handleSearch={handleSearch}
          clearSearch={clearSearch}
        />

        <div className="space-y-4">
          {isSearching ? (
            <div className="py-20 text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-[#007AFF] mx-auto" />
              <p className="text-[#8E8E93] font-medium animate-pulse">Searching and grouping records...</p>
            </div>
          ) : groupedBusinesses.length > 0 ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-sm font-bold text-[#8E8E93] dark:text-[#98989D] uppercase tracking-widest px-2">
                Restaurants Found ({groupedBusinesses.length})
              </h2>
              <div className="grid gap-4">
                {groupedBusinesses.map((business) => {
                  const latest = business.inspections[0];
                  const isPass = latest.result.toLowerCase().includes('pass');
                  const isFail = latest.result.toLowerCase().includes('fail');
                  const isExp = expandedId === `${business.licenseNo}-${business.address}`;

                  return (
                    <div 
                      key={`${business.licenseNo}-${business.address}`}
                      className="bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-sm border border-black/5 dark:border-white/5 overflow-hidden transition-all"
                    >
                      {/* Business Header */}
                      <button 
                        onClick={() => setExpandedId(isExp ? null : `${business.licenseNo}-${business.address}`)}
                        className="w-full p-5 text-left flex items-start justify-between gap-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="space-y-1">
                          <h3 className="text-lg font-bold dark:text-white leading-tight">{business.name}</h3>
                          <div className="flex items-center gap-1.5 text-[#8E8E93] dark:text-[#98989D] text-xs font-medium">
                            <MapPin className="w-3 h-3" />
                            <span>{business.address}, {business.city}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              isPass ? 'bg-[#34C759]/10 text-[#34C759]' : 
                              isFail ? 'bg-[#FF3B30]/10 text-[#FF3B30]' : 
                              'bg-[#5856D6]/10 text-[#5856D6]'
                            }`}>
                              Latest: {latest.result.replace('HE_', '').replace('_', ' ')}
                            </span>
                            <span className="text-[10px] text-[#8E8E93] font-bold uppercase tracking-tighter">
                              {business.inspections.length} {business.inspections.length === 1 ? 'Inspection' : 'Inspections'}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <div className={`p-2 rounded-2xl ${
                            isPass ? 'bg-[#34C759]/10 text-[#34C759]' : 
                            isFail ? 'bg-[#FF3B30]/10 text-[#FF3B30]' : 
                            'bg-[#5856D6]/10 text-[#5856D6]'
                          }`}>
                            {isPass ? <ShieldCheck className="w-6 h-6" /> : isFail ? <ShieldAlert className="w-6 h-6" /> : <ShieldQuestion className="w-6 h-6" />}
                          </div>
                          {isExp ? <ChevronUp className="w-4 h-4 text-[#C7C7CC]" /> : <ChevronDown className="w-4 h-4 text-[#C7C7CC]" />}
                        </div>
                      </button>

                      {/* Expanded History */}
                      {isExp && (
                        <div className="px-5 pb-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
                          <div className="h-px bg-[#F2F2F7] dark:bg-[#2C2C2E] w-full" />
                          <div className="space-y-4">
                            {business.inspections.map((insp, idx) => (
                              <div key={idx} className="relative pl-4 border-l-2 border-[#F2F2F7] dark:border-[#2C2C2E] space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-xs font-bold text-[#1C1C1E] dark:text-white">
                                    <Calendar className="w-3 h-3 text-[#8E8E93]" />
                                    {new Date(insp.resultdttm).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                  </div>
                                  <span className={`text-[10px] font-black uppercase ${
                                    insp.result.toLowerCase().includes('pass') ? 'text-[#34C759]' : 
                                    insp.result.toLowerCase().includes('fail') ? 'text-[#FF3B30]' : 'text-[#5856D6]'
                                  }`}>
                                    {insp.result.replace('HE_', '').replace('_', ' ')}
                                  </span>
                                </div>
                                {insp.violdesc && (
                                  <p className="text-xs text-[#48484A] dark:text-[#D1D1D6] leading-relaxed">
                                    <span className="font-bold">Violation:</span> {insp.violdesc}
                                  </p>
                                )}
                                {insp.comments && (
                                  <p className="text-[11px] text-[#8E8E93] italic bg-[#F2F2F7] dark:bg-[#2C2C2E] p-2 rounded-lg">
                                    "{insp.comments}"
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : hasSearched ? (
            <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-12 text-center space-y-4 border border-black/5 dark:border-white/5 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-full flex items-center justify-center mx-auto transition-colors">
                <AlertCircle className="w-8 h-8 text-[#8E8E93]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold dark:text-white">No Records Found</h3>
                <p className="text-[#8E8E93] dark:text-[#98989D] font-medium px-4">
                  We couldn't find any inspection results for "{searchQuery}".
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1C1C1E] p-8 rounded-[2.5rem] text-center space-y-4 border border-black/5 dark:border-white/5">
              <div className="w-16 h-16 bg-[#FF9500]/10 rounded-3xl flex items-center justify-center mx-auto">
                <Utensils className="w-8 h-8 text-[#FF9500]" />
              </div>
              <p className="text-[#8E8E93] dark:text-[#98989D] font-medium leading-relaxed">
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
