'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { Search, AlertTriangle, CheckCircle2, Loader2, ChevronRight, Map as MapIcon, Clock, Calendar, Truck, X, MapPin, Info } from 'lucide-react';
import Papa from 'papaparse';
import { APIProvider, Map, Marker, Polyline } from '@vis.gl/react-google-maps';

// --- CONFIGURATION ---
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''; 

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
  year_round?: string;
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [allStreets, setAllStreets] = useState<StreetData[]>([]);
  const [selectedStreet, setSelectedStreet] = useState<string | null>(null);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [selectedSide, setSelectedSide] = useState<'Odd' | 'Even'>('Odd');
  const [isLoading, setIsLoading] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [coords, setCoords] = useState<{lat: number, lng: number}[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Load CSV data
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
        });
      } catch (error) {
        console.error("Failed to load street data:", error);
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // API Autocomplete for all Boston streets
  useEffect(() => {
    const trimmedQuery = searchQuery.trim();
    // Start searching immediately from the first character
    if (!trimmedQuery || trimmedQuery.length < 1 || trimmedQuery === selectedStreet) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const fetchSuggestions = async () => {
      setIsSearching(true);
      try {
        const resourceId = '6fa7932b-7bc8-42bc-9250-168d5f5dc1ad';
        const url = `https://data.boston.gov/api/3/action/datastore_search?resource_id=${resourceId}&q=${encodeURIComponent(trimmedQuery)}&limit=15&fields=ST_NAME,ST_TYPE,PRE_DIR,SUF_DIR`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
          const records = data.result.records as any[];
          const uniqueNames = Array.from(new Set(records
            .map(r => {
              const name = (r.ST_NAME || '').trim();
              if (!name) return '';
              const type = (r.ST_TYPE || '').trim();
              const pre = r.PRE_DIR ? `${r.PRE_DIR.trim()} ` : '';
              const suf = r.SUF_DIR ? ` ${r.SUF_DIR.trim()}` : '';
              return `${pre}${name} ${type}${suf}`.trim();
            })
            .filter(name => name.length > 0)
          )).slice(0, 8);
          
          setSuggestions(uniqueNames as string[]);
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 50); // Near-instant debounce
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedStreet]);

  // Close suggestions on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Geocode using Google Maps
  useEffect(() => {
    if (!selectedSegmentId || typeof window === 'undefined' || !window.google) {
      setCoords([]);
      return;
    }
    const segment = allStreets.find(s => s.main_id === selectedSegmentId);
    if (!segment) return;

    const geocoder = new google.maps.Geocoder();
    const geocodePoint = (addr: string): Promise<google.maps.LatLng | null> => {
      return new Promise((resolve) => {
        geocoder.geocode({ address: addr + ', Boston, MA' }, (results, status) => {
          if (status === 'OK' && results?.[0]) {
            resolve(results[0].geometry.location);
          } else {
            resolve(null);
          }
        });
      });
    };

    const fetchRoute = async () => {
      setIsGeocoding(true);
      const fromPos = await geocodePoint(`${segment.st_name} & ${segment.from}`);
      const toPos = await geocodePoint(`${segment.st_name} & ${segment.to}`);

      if (fromPos && toPos) {
        setCoords([
          { lat: fromPos.lat(), lng: fromPos.lng() },
          { lat: toPos.lat(), lng: toPos.lng() }
        ]);
      } else {
        const centerPos = await geocodePoint(segment.st_name);
        if (centerPos) {
          setCoords([
            { lat: centerPos.lat(), lng: centerPos.lng() },
            { lat: centerPos.lat() + 0.0005, lng: centerPos.lng() + 0.0005 }
          ]);
        }
      }
      setIsGeocoding(false);
    };

    fetchRoute();
  }, [selectedSegmentId, allStreets]);

  const handleSelectStreet = (name: string) => {
    if (!name) return;
    // Helper to normalize street names for better matching
    const normalize = (s: string) => s.toLowerCase()
      .replace(/\bstreet\b/g, 'st')
      .replace(/\bavenue\b/g, 'ave')
      .replace(/\bplace\b/g, 'pl')
      .replace(/\broad\b/g, 'rd')
      .replace(/\bparkway\b/g, 'pkwy')
      .replace(/\bboulevard\b/g, 'blvd')
      .replace(/\bterrace\b/g, 'ter')
      .replace(/\bcourt\b/g, 'ct')
      .replace(/\blane\b/g, 'ln')
      .replace(/\bcircle\b/g, 'cir')
      .replace(/\bsquare\b/g, 'sq')
      .replace(/[^\w\s]/g, '')
      .trim();

    const normalizedSelected = normalize(name);
    
    // Find the closest match in our local cleaning database
    const localMatch = allStreets.find(s => normalize(s.st_name) === normalizedSelected) 
                     || allStreets.find(s => normalize(s.st_name).includes(normalizedSelected))
                     || allStreets.find(s => normalizedSelected.includes(normalize(s.st_name)));

    const streetNameToUse = localMatch ? localMatch.st_name : name;

    setSelectedStreet(streetNameToUse);
    setSearchQuery(streetNameToUse);
    setShowSuggestions(false);
    setSuggestions([]);
    
    const rows = allStreets.filter(s => s.st_name === streetNameToUse);
    if (rows.length > 0) {
      const side = rows.find(s => s.side === 'Odd') ? 'Odd' : 'Even';
      setSelectedSide(side);
      const segments = rows.filter(s => s.side === side);
      if (segments.length === 1) setSelectedSegmentId(segments[0].main_id);
      else setSelectedSegmentId(null);
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

  const handleLocationClick = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        if (!window.google) return;
        
        const geocoder = new google.maps.Geocoder();
        const latlng = { lat: latitude, lng: longitude };
        
        geocoder.geocode({ location: latlng }, (results, status) => {
          if (status === "OK" && results?.[0]) {
            // Find the street name from address components
            const routeComponent = results[0].address_components.find(
              (c) => c.types.includes("route")
            );
            if (routeComponent) {
              const streetName = routeComponent.long_name;
              handleSelectStreet(streetName);
            }
          }
        });
      },
      (error) => {
        console.error("Error getting location:", error);
      }
    );
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedStreet(null);
    setSelectedSegmentId(null);
    setShowSuggestions(false);
    setSuggestions([]);
    setCoords([]);
  };

  const streetDetails = useMemo(() => {
    if (!selectedSegmentId) return null;
    const sideData = allStreets.find(s => s.main_id === selectedSegmentId);
    if (!sideData) return null;

    const formatTime12h = (timeStr: string) => {
      if (!timeStr) return '';
      const [hours, minutes] = timeStr.split(':').map(Number);
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;
      return `${hours12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    };

    const today = new Date();
    const month = today.getMonth() + 1; // 1-12
    
    // Official Boston Seasons Logic
    const isYearRound = sideData.year_round === 't';
    const isExtendedArea = ['North End', 'South End', 'Beacon Hill'].includes(sideData.dist_name);
    
    let isCurrentlyInSeason = false;
    if (isYearRound) {
      isCurrentlyInSeason = true;
    } else if (isExtendedArea) {
      // March 1st to December 31st
      isCurrentlyInSeason = month >= 3 && month <= 12;
    } else {
      // April 1st to November 30th
      isCurrentlyInSeason = month >= 4 && month <= 11;
    }

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = days[today.getDay()] as keyof StreetData;
    const currentWeek = `week_${Math.ceil(today.getDate() / 7)}` as keyof StreetData;
    
    const scheduledForToday = sideData[currentDay] === 't' && sideData[currentWeek] === 't';
    const isSweepingToday = isCurrentlyInSeason && scheduledForToday;
    
    const activeDays = days
      .filter(day => sideData[day as keyof StreetData] === 't')
      .map(day => day.charAt(0).toUpperCase() + day.slice(1) + 's');
    
    const specificDaysText = activeDays.length > 0 
      ? `Every ${activeDays.join(' & ')}`
      : 'No scheduled cleaning';

    let status: 'danger' | 'safe' | 'info' = isSweepingToday ? 'danger' : 'safe';
    let message = isSweepingToday ? 'MOVE YOUR CAR' : 'YOU CAN PARK';
    
    if (!isCurrentlyInSeason && scheduledForToday) {
      status = 'info';
      const seasonStart = isExtendedArea ? 'March 1st' : 'April 1st';
      message = `OFF-SEASON (Starts ${seasonStart})`;
    }

    return {
      name: sideData.st_name,
      status,
      message,
      nextSweeping: `${formatTime12h(sideData.start_time)} - ${formatTime12h(sideData.end_time)}`,
      from: sideData.from,
      to: sideData.to,
      specificDays: specificDaysText,
      raw: sideData
    };
  }, [selectedSegmentId, allStreets]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-slate-500 font-medium animate-pulse">Loading street data...</p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <div className="min-h-screen bg-slate-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-slate-100 font-sans text-slate-900 pb-24 selection:bg-blue-100">
        <main className="max-w-lg mx-auto px-5 pt-12 md:pt-20 space-y-10">
          
          {/* Header */}
          <header className="text-center space-y-5 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="relative w-24 h-24 mx-auto mb-2 drop-shadow-xl">
              <Image 
                src="/new-logo.png" 
                alt="Boston Sweeper" 
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
                Boston Sweeper
              </h1>
              <p className="text-slate-500 text-lg md:text-xl max-w-sm mx-auto font-medium leading-relaxed px-4">
                Never get a parking ticket again.
              </p>
            </div>
          </header>

          {/* Search Section */}
          <div className="relative z-50 animate-in fade-in zoom-in-95 duration-500" ref={searchContainerRef}>
            <form onSubmit={handleSearch} className="relative group">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none z-10">
                {isSearching ? (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                ) : (
                  <Search className={`w-5 h-5 transition-colors ${searchQuery ? 'text-blue-500' : 'text-slate-400'}`} />
                )}
              </div>
              <input
                type="text"
                placeholder="Search your street (e.g. Boylston St)"
                className="w-full bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl py-4 pl-14 pr-24 shadow-[0_8px_30px_rgb(0,0,0,0.06)] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-medium text-lg"
                value={searchQuery}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {setSearchQuery(e.target.value); setShowSuggestions(true);}}
              />
              <div className="absolute inset-y-0 right-3 flex items-center gap-2">
                {searchQuery && (
                  <button 
                    type="button" 
                    onClick={clearSearch}
                    className="flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors p-1"
                  >
                    <X className="w-5 h-5 bg-slate-100 rounded-full p-0.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleLocationClick}
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                  title="Use my location"
                >
                  <MapPin className="w-5 h-5" />
                </button>
              </div>
            </form>
            
            {/* Dropdown Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-xl border border-slate-100 rounded-2xl shadow-[0_20px_40px_rgb(0,0,0,0.08)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 divide-y divide-slate-50">
                {suggestions.map((name, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleSelectStreet(name)} 
                    className="w-full px-5 py-4 text-left hover:bg-blue-50/50 transition-colors flex items-center gap-4 group"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-white flex items-center justify-center transition-colors">
                      <MapIcon className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                    </div>
                    <span className="font-semibold text-slate-700 group-hover:text-blue-700 transition-colors text-lg">{name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedStreet ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both">
              
              {/* Controls & Navigation */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Segmented Control */}
                {allStreets.some(s => s.st_name === selectedStreet) && (
                  <div className="flex p-1 bg-white border border-slate-200/60 rounded-xl shadow-sm w-full sm:w-auto">
                    {['Odd', 'Even'].map(side => (
                      <button 
                        key={side} 
                        onClick={() => {setSelectedSide(side as 'Odd'|'Even'); setSelectedSegmentId(null);}} 
                        className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${
                          selectedSide === side 
                            ? 'bg-slate-900 text-white shadow-md' 
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        {side} Side
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Back Button (if looking at details) */}
                {selectedSegmentId && (
                  <button 
                    onClick={() => {setSelectedSegmentId(null); setCoords([]);}}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                    Back to Blocks
                  </button>
                )}
              </div>

              {/* View 1: Block Selection */}
              {!selectedSegmentId && allStreets.some(s => s.st_name === selectedStreet) && (
                <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                  <div className="flex items-center gap-2 px-1">
                    <div className="h-px bg-slate-200 flex-1"></div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Select your block</h3>
                    <div className="h-px bg-slate-200 flex-1"></div>
                  </div>
                  
                  <div className="grid gap-3">
                    {allStreets.filter(s => s.st_name === selectedStreet && s.side === selectedSide).map(seg => (
                      <button 
                        key={seg.main_id} 
                        onClick={() => setSelectedSegmentId(seg.main_id)} 
                        className="w-full p-5 bg-white border border-slate-200/60 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between group"
                      >
                        <div className="text-left space-y-1">
                          <p className="font-bold text-slate-800 text-lg leading-tight group-hover:text-blue-700 transition-colors">
                            {seg.from} <span className="text-slate-400 font-medium text-base px-1">to</span> {seg.to}
                          </p>
                          <p className="text-sm text-slate-500 flex items-center gap-1.5 font-medium">
                            <MapIcon className="w-3.5 h-3.5 opacity-70"/> {seg.dist_name}
                          </p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors shrink-0 ml-4">
                          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </button>
                    ))}
                    
                    {allStreets.filter(s => s.st_name === selectedStreet && s.side === selectedSide).length === 0 && (
                      <div className="text-center py-10 px-4 bg-slate-100 rounded-2xl border border-slate-200 border-dashed">
                        <p className="text-slate-500 font-medium">No blocks found for the {selectedSide} side of {selectedStreet}.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* View 3: No Schedule Found */}
              {!selectedSegmentId && !allStreets.some(s => s.st_name === selectedStreet) && (
                <div className="text-center space-y-6 py-12 animate-in fade-in zoom-in-95 duration-500">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Info className="w-10 h-10 text-slate-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">{selectedStreet}</h3>
                    <p className="text-slate-500 font-medium max-w-xs mx-auto">No street sweeping schedule found for this location in our database.</p>
                  </div>
                  <button 
                    onClick={clearSearch}
                    className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                  >
                    Try another street
                  </button>
                </div>
              )}

              {/* View 2: Status & Details */}
              {streetDetails && (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-400">
                  
                  {/* Big Status Banner */}
                  <div className={`relative overflow-hidden rounded-[2rem] p-8 md:p-10 text-white shadow-2xl transition-all duration-500 border border-white/20 ${
                    streetDetails.status === 'danger' 
                      ? 'bg-gradient-to-br from-rose-500 via-red-500 to-red-600 shadow-red-500/25' 
                      : streetDetails.status === 'info'
                        ? 'bg-gradient-to-br from-blue-500 via-indigo-500 to-indigo-600 shadow-indigo-500/25'
                        : 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 shadow-emerald-500/25'
                  }`}>
                    {/* Decorative Blobs */}
                    <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
                    <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-black/10 blur-3xl pointer-events-none"></div>
                    
                    <div className="relative z-10 flex flex-col items-center text-center space-y-8">
                      {/* Location Header */}
                      <div className="space-y-2 w-full">
                        <p className="text-white/80 font-black uppercase tracking-[0.2em] text-xs">Target Zone</p>
                        <div className="bg-white/10 border border-white/20 rounded-2xl p-4 backdrop-blur-md shadow-inner">
                          <h3 className="font-bold text-xl md:text-2xl mb-2">{streetDetails.name}</h3>
                          <div className="flex items-center justify-center gap-2 text-sm md:text-base font-semibold text-white/90">
                            <span className="truncate">{streetDetails.from}</span>
                            <ChevronRight className="w-4 h-4 opacity-50 shrink-0" />
                            <span className="truncate">{streetDetails.to}</span>
                          </div>
                        </div>
                      </div>

                      {/* Main Status */}
                      <div className="flex flex-col items-center gap-5">
                        <div className={`p-5 rounded-[2rem] bg-white/20 backdrop-blur-md shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)] border border-white/30`}>
                          {streetDetails.status === 'danger' ? <AlertTriangle className="w-14 h-14 text-white drop-shadow-md" /> : streetDetails.status === 'info' ? <Clock className="w-14 h-14 text-white drop-shadow-md" /> : <CheckCircle2 className="w-14 h-14 text-white drop-shadow-md" />}
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight drop-shadow-sm">
                          {streetDetails.message}
                        </h2>
                      </div>

                      {/* Time Schedule */}
                      <div className="flex items-center gap-3 bg-black/20 px-6 py-4 rounded-2xl backdrop-blur-md w-full justify-center border border-black/10 shadow-inner">
                        <Clock className="w-6 h-6 text-white/90" />
                        <div className="text-left">
                          <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-0.5">Cleaning Hours</p>
                          <p className="font-bold text-lg leading-none">{streetDetails.nextSweeping}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cleaning Schedule Details Card */}
                  <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-800 font-bold">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        <h4 className="text-lg">Full Schedule</h4>
                      </div>
                      <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase text-slate-400 tracking-wider">Official Data</span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-2xl font-black text-blue-600 tracking-tight">
                        {streetDetails.specificDays}
                      </p>
                      <p className="text-sm text-slate-500 font-medium">During active weeks</p>
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => {
                        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                        const isActive = streetDetails.raw[dayNames[i] as keyof StreetData] === 't';
                        const isToday = new Date().getDay() === i;
                        
                        return (
                          <div key={i} className={`flex flex-col items-center gap-2 p-2.5 rounded-2xl border transition-all ${
                            isActive 
                              ? 'bg-blue-600 border-blue-600 text-white shadow-[0_8px_16px_rgba(37,99,235,0.25)]' 
                              : 'bg-slate-50 border-slate-100 text-slate-400 opacity-60'
                          } ${isToday && !isActive ? 'ring-2 ring-slate-200' : ''}`}>
                            <span className="text-[10px] font-black uppercase tracking-tighter">{day[0]}</span>
                            {isToday && <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-slate-300'}`}></div>}
                          </div>
                        )
                      })}
                    </div>

                    <div className="pt-6 border-t border-slate-50 space-y-4">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-slate-400" />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Weeks</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {['1', '2', '3', '4', '5'].map(w => {
                          const isActive = streetDetails.raw[`week_${w}` as keyof StreetData] === 't';
                          const isCurrentWeek = Math.ceil(new Date().getDate() / 7) === parseInt(w);
                          
                          return (
                            <div key={w} className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                              isActive 
                                ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                                : 'bg-slate-50 border-slate-100 text-slate-300'
                            } ${isCurrentWeek && !isActive ? 'border-dashed border-slate-300' : ''}`}>
                              Week {w}
                              {isCurrentWeek && <span className="ml-1.5 opacity-50 text-[9px] uppercase tracking-tighter">(Current)</span>}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Google Map Card */}
                  <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-hidden h-72 relative border border-slate-200 group">
                    {isGeocoding && (
                      <div className="absolute inset-0 z-10 bg-white/70 flex items-center justify-center backdrop-blur-sm">
                        <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
                      </div>
                    )}
                    {coords.length > 0 ? (
                      <Map
                        defaultCenter={coords[0]}
                        defaultZoom={17}
                        gestureHandling={'greedy'}
                        disableDefaultUI={true}
                        className="w-full h-full grayscale-[0.2] contrast-[1.05]"
                      >
                        <Marker position={coords[0]} />
                        <Marker position={coords[1]} />
                        <Polyline
                          path={coords}
                          strokeColor="#2563eb"
                          strokeOpacity={0.9}
                          strokeWeight={8}
                        />
                      </Map>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                        <div className="flex flex-col items-center gap-3 opacity-30 group-hover:opacity-50 transition-opacity">
                          <MapIcon className="w-12 h-12" />
                          <p className="font-black uppercase tracking-widest text-xs">Map Unavailable</p>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          ) : (
            /* Empty State / How it works */
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both">
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { icon: Search, title: "1. Search", desc: "Find your street name", color: "blue" },
                  { icon: Calendar, title: "2. Select", desc: "Pick your exact block", color: "indigo" },
                  { icon: Truck, title: "3. Check", desc: "Get real-time status", color: "violet" }
                ].map((step, i) => (
                  <div key={i} className="flex flex-col items-center text-center gap-4 p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow">
                    <div className={`p-4 bg-${step.color}-50 text-${step.color}-600 rounded-2xl ring-4 ring-${step.color}-50/50`}>
                      <step.icon className="w-7 h-7" />
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="font-bold text-slate-800 text-lg">{step.title}</h4>
                      <p className="text-sm text-slate-500 font-medium leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] p-8 md:p-10 text-center shadow-2xl">
                {/* Abstract bg pattern */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent bg-[length:20px_20px]"></div>
                
                <div className="relative z-10 space-y-3">
                  <h3 className="text-white font-black text-2xl tracking-tight">Stay Ticket-Free</h3>
                  <p className="text-slate-400 font-medium text-base md:text-lg max-w-sm mx-auto">
                    Boston Sweeper analyzes municipal data to keep your car safe from street sweeping tickets.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </APIProvider>
  );
}
