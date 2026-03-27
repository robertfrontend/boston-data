'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, MapPin, Menu, Map as MapIcon, Info, AlertTriangle, CheckCircle2, Loader2, ChevronRight } from 'lucide-react';
import Papa from 'papaparse';

interface StreetData {
  main_id: string;
  st_name: string;
  dist_name: string;
  start_time: string;
  end_time: string;
  side: string;
  from: string;
  to: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
  week_1: string;
  week_2: string;
  week_3: string;
  week_4: string;
  week_5: string;
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [allStreets, setAllStreets] = useState<StreetData[]>([]);
  const [selectedStreet, setSelectedStreet] = useState<string | null>(null);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [selectedSide, setSelectedSide] = useState<'Odd' | 'Even'>('Odd');
  const [isLoading, setIsLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load CSV data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/data/tmp_9ctv8zh.csv');
        const csvText = await response.text();
        
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            setAllStreets(results.data as StreetData[]);
            setIsLoading(false);
          },
          error: (error: Error) => {
            console.error('Error parsing CSV:', error);
            setIsLoading(false);
          }
        });
      } catch (error) {
        console.error('Error fetching CSV:', error);
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const suggestions = useMemo(() => {
    if (!searchQuery.trim() || selectedStreet === searchQuery) return [];
    
    const query = searchQuery.toLowerCase();
    const matches = Array.from(new Set(
      allStreets
        .filter(s => s.st_name.toLowerCase().includes(query))
        .map(s => s.st_name)
    )).slice(0, 8);
    
    return matches;
  }, [searchQuery, allStreets, selectedStreet]);

  const handleSelectStreet = (streetName: string) => {
    setSelectedStreet(streetName);
    setSearchQuery(streetName);
    setShowSuggestions(false);
    
    const streetRows = allStreets.filter(s => s.st_name === streetName);
    const availableSides = Array.from(new Set(streetRows.map(s => s.side).filter(Boolean)));
    
    // Set default side
    const defaultSide = availableSides.includes('Odd') ? 'Odd' : (availableSides[0] as 'Odd' | 'Even' || 'Odd');
    setSelectedSide(defaultSide);
    
    // Auto-select segment if only one exists for this street and side
    const segmentsForDefault = streetRows.filter(s => s.side === defaultSide);
    if (segmentsForDefault.length === 1) {
      setSelectedSegmentId(segmentsForDefault[0].main_id);
    } else {
      setSelectedSegmentId(null);
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (suggestions.length > 0) {
      handleSelectStreet(suggestions[0]);
    }
  };

  const availableSegments = useMemo(() => {
    if (!selectedStreet) return [];
    return allStreets.filter(s => s.st_name === selectedStreet && s.side === selectedSide);
  }, [selectedStreet, selectedSide, allStreets]);

  const streetDetails = useMemo(() => {
    if (!selectedStreet || !selectedSegmentId) return null;
    
    const sideData = allStreets.find(s => s.main_id === selectedSegmentId);
    if (!sideData) return null;
    
    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[today.getDay()] as keyof StreetData;
    
    const date = today.getDate();
    const weekOfMonth = Math.ceil(date / 7);
    const weekKey = `week_${weekOfMonth}` as keyof StreetData;

    const isSweepingToday = sideData[todayName] === 't' && sideData[weekKey] === 't';
    
    let nextDateStr = "Check local signs";
    const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    for (const day of daysOrder) {
      if (sideData[day as keyof StreetData] === 't') {
        nextDateStr = `${day.charAt(0).toUpperCase() + day.slice(1)}, ${sideData.start_time} - ${sideData.end_time}`;
        break;
      }
    }

    return {
      name: sideData.st_name,
      dist: sideData.dist_name,
      side: sideData.side,
      status: isSweepingToday ? 'danger' : 'safe',
      message: isSweepingToday ? 'MOVE YOUR CAR' : 'YOU CAN PARK',
      nextSweeping: nextDateStr,
      from: sideData.from,
      to: sideData.to
    };
  }, [selectedStreet, selectedSegmentId, selectedSide, allStreets]);

  const handleLocationRequest = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      alert('Geolocation not supported');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setTimeout(() => {
          setIsLocating(false);
          handleSelectStreet('Ackley Pl');
        }, 1000);
      },
      () => {
        setIsLocating(false);
        alert('Location access denied');
      }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      <header className="flex items-center justify-between px-6 py-5 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-slate-100">
        <h1 className="text-xl font-bold tracking-tight text-slate-800">Boston Sweeper</h1>
        <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <Menu className="w-6 h-6 text-slate-600" />
        </button>
      </header>

      <main className="max-w-md mx-auto px-6 pt-8 space-y-8">
        <form onSubmit={handleSearch} className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder={isLocating ? "Locating..." : "Search street name..."}
            className="w-full pl-12 pr-12 py-5 bg-white border-none rounded-2xl shadow-sm text-lg focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all placeholder:text-slate-400"
            value={searchQuery}
            onFocus={() => setShowSuggestions(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
          />
          <button 
            type="button"
            onClick={handleLocationRequest}
            disabled={isLocating}
            className="absolute inset-y-0 right-4 flex items-center p-1"
          >
            <MapPin className={`w-5 h-5 ${isLocating ? 'text-slate-400 animate-pulse' : 'text-blue-500'}`} />
          </button>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-20">
              {suggestions.map((name, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectStreet(name)}
                  className="w-full px-5 py-4 text-left hover:bg-slate-50 border-b border-slate-50 last:border-none transition-colors flex items-center gap-3"
                >
                  <Search className="w-4 h-4 text-slate-300" />
                  <span className="font-medium text-slate-700">{name}</span>
                </button>
              ))}
            </div>
          )}
        </form>

        {selectedStreet && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            {/* Side Selection */}
            <div className="flex justify-center">
              <div className="inline-flex p-1 bg-slate-200/50 rounded-xl backdrop-blur-sm">
                {['Odd', 'Even'].map((side) => (
                  <button
                    key={side}
                    onClick={() => {
                      setSelectedSide(side as 'Odd' | 'Even');
                      setSelectedSegmentId(null);
                    }}
                    className={`px-8 py-2 text-sm font-semibold rounded-lg transition-all ${
                      selectedSide === side
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {side} Side
                  </button>
                ))}
              </div>
            </div>

            {/* Segment Selection */}
            {!selectedSegmentId && availableSegments.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Select Sector</h3>
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                  {availableSegments.map((seg) => (
                    <button
                      key={seg.main_id}
                      onClick={() => setSelectedSegmentId(seg.main_id)}
                      className="w-full px-5 py-4 text-left hover:bg-slate-50 border-b border-slate-50 last:border-none flex items-center justify-between group"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-700">{seg.from} to {seg.to}</p>
                        <p className="text-xs text-slate-500">{seg.dist_name}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Status Card */}
            {streetDetails && (
              <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
                <div className="p-8 text-center space-y-6">
                  <div className="space-y-1">
                    <h2 className="text-slate-400 font-medium uppercase tracking-widest text-xs">Current Status</h2>
                    <p className="text-2xl font-bold text-slate-800">{streetDetails.name}</p>
                    <p className="text-sm text-slate-500 font-medium">{streetDetails.from} <span className="text-slate-300 px-1">→</span> {streetDetails.to}</p>
                  </div>

                  <div className={`py-8 rounded-2xl flex flex-col items-center justify-center gap-4 ${
                    streetDetails.status === 'danger' 
                    ? 'bg-rose-100 text-rose-800' 
                    : 'bg-emerald-100 text-emerald-800'
                  } transition-colors duration-300`}>
                    {streetDetails.status === 'danger' ? (
                      <AlertTriangle className="w-16 h-16 animate-pulse" />
                    ) : (
                      <CheckCircle2 className="w-16 h-16" />
                    )}
                    <p className="text-3xl font-black tracking-tighter">{streetDetails.message}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 text-slate-600">
                      <Info className="w-4 h-4" />
                      <p className="text-sm font-medium">Next sweeping: {streetDetails.nextSweeping}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedSegmentId(null)}
                      className="text-xs text-blue-500 font-semibold hover:underline"
                    >
                      Change sector
                    </button>
                  </div>
                </div>
              </div>
            )}

            {selectedSegmentId && (
              <div className="relative h-32 bg-slate-200 rounded-[2rem] overflow-hidden group">
                <div className="absolute inset-0 flex items-center justify-center">
                  <button className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 font-bold rounded-xl shadow-lg hover:scale-105 transition-transform">
                    <MapIcon className="w-5 h-5 text-blue-500" />
                    View on Map
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {!selectedStreet && searchQuery === '' && (
          <div className="py-20 text-center space-y-4 opacity-40">
            <div className="w-16 h-16 bg-slate-200 rounded-full mx-auto flex items-center justify-center">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium">Search for a street in Boston<br/>to check the schedule</p>
          </div>
        )}
      </main>
    </div>
  );
}
