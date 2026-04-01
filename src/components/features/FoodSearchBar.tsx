'use client';

import React from 'react';
import { Search, Loader2, X, Utensils } from 'lucide-react';

interface FoodSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearching: boolean;
  handleSearch: (e?: React.FormEvent) => void;
  clearSearch: () => void;
}

export const FoodSearchBar: React.FC<FoodSearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  isSearching,
  handleSearch,
  clearSearch,
}) => {
  return (
    <div className="relative z-50">
      <div className="relative group bg-white/70 dark:bg-[#1C1C1E]/70 backdrop-blur-2xl rounded-2xl border border-white/20 dark:border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden transition-all focus-within:shadow-[0_8px_24px_rgba(0,0,0,0.1)] focus-within:ring-1 focus-within:ring-[#007AFF]/20">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          {isSearching ? <Loader2 className="w-5 h-5 animate-spin text-[#007AFF]" /> : <Search className="w-5 h-5 text-[#8E8E93] dark:text-[#98989D]" />}
        </div>
        <form onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search Restaurant (e.g. McDonald's)"
            className="w-full bg-transparent py-4 pl-12 pr-12 focus:outline-none text-lg font-medium placeholder:text-[#AEAEB2] dark:placeholder:text-[#636366] dark:text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
        <div className="absolute inset-y-0 right-3 flex items-center gap-2">
          {searchQuery && (
            <button onClick={clearSearch} className="p-1 bg-[#8E8E93]/20 dark:bg-[#8E8E93]/30 rounded-full text-[#8E8E93] dark:text-[#AEAEB2] hover:bg-[#8E8E93]/30 dark:hover:bg-[#8E8E93]/40 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="p-2 bg-[#FF9500]/10 text-[#FF9500] rounded-full">
            <Utensils className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};
