'use client';

import React from 'react';
import { Search, Loader2, X, MapPin, Map as MapIcon } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearching: boolean;
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  suggestions: string[];
  handleSearch: (e?: React.FormEvent) => void;
  handleSelectStreet: (name: string) => void;
  handleLocationClick: () => void;
  clearSearch: () => void;
  searchContainerRef: React.RefObject<HTMLDivElement | null>;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  isSearching,
  showSuggestions,
  setShowSuggestions,
  suggestions,
  handleSearch,
  handleSelectStreet,
  handleLocationClick,
  clearSearch,
  searchContainerRef,
}) => {
  return (
    <div className="relative z-50" ref={searchContainerRef}>
      <div className="relative group bg-white/70 dark:bg-[#1C1C1E]/70 backdrop-blur-2xl rounded-2xl border border-white/20 dark:border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden transition-all focus-within:shadow-[0_8px_24px_rgba(0,0,0,0.1)] focus-within:ring-1 focus-within:ring-[#007AFF]/20">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          {isSearching ? <Loader2 className="w-5 h-5 animate-spin text-[#007AFF]" /> : <Search className="w-5 h-5 text-[#8E8E93] dark:text-[#98989D]" />}
        </div>
        <form onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Street Name"
            className="w-full bg-transparent py-4 pl-12 pr-24 focus:outline-none text-lg font-medium placeholder:text-[#AEAEB2] dark:placeholder:text-[#636366] dark:text-white"
            value={searchQuery}
            onFocus={() => setShowSuggestions(true)}
            onChange={(e) => {setSearchQuery(e.target.value); setShowSuggestions(true);}}
          />
        </form>
        <div className="absolute inset-y-0 right-3 flex items-center gap-2">
          {searchQuery && (
            <button onClick={clearSearch} className="p-1 bg-[#8E8E93]/20 dark:bg-[#8E8E93]/30 rounded-full text-[#8E8E93] dark:text-[#AEAEB2] hover:bg-[#8E8E93]/30 dark:hover:bg-[#8E8E93]/40 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
          <button onClick={handleLocationClick} className="p-2 bg-[#007AFF]/10 text-[#007AFF] rounded-full hover:bg-[#007AFF]/20 transition-all">
            <MapPin className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/90 dark:bg-[#1C1C1E]/95 backdrop-blur-3xl border border-white/20 dark:border-white/10 rounded-2xl shadow-[0_16px_32px_rgba(0,0,0,0.1)] overflow-hidden divide-y divide-[#F2F2F7] dark:divide-[#2C2C2E]">
          {suggestions.map((name, i) => (
            <button key={i} onClick={() => handleSelectStreet(name)} className="w-full px-5 py-4 text-left hover:bg-[#007AFF]/10 transition-colors flex items-center gap-3">
              <MapIcon className="w-4 h-4 text-[#8E8E93] dark:text-[#98989D]" />
              <span className="font-semibold text-[#1C1C1E] dark:text-white">{name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
