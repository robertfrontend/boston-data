'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { Search, AlertTriangle, CheckCircle2, Loader2, ChevronRight, Map as MapIcon, Clock, Calendar, Truck, X, MapPin, Info, GitHub } from 'lucide-react';
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

    const debounceTimer = setTimeout(fetchSuggestions, 50);
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
            const routeComponent = results[0].address_components.find((c) => c.types.includes("route"));
            if (routeComponent) handleSelectStreet(routeComponent.long_name);
          }
        });
      },
      (error) => console.error(error)
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
    const month = today.getMonth() + 1;
    const isYearRound = sideData.year_round === 't';
    const isExtendedArea = ['North End', 'South End', 'Beacon Hill'].includes(sideData.dist_name);
    
    let isCurrentlyInSeason = isYearRound || (isExtendedArea ? (month >= 3 && month <= 12) : (month >= 4 && month <= 11));

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = days[today.getDay()] as keyof StreetData;
    const currentWeek = `week_${Math.ceil(today.getDate() / 7)}` as keyof StreetData;
    
    const scheduledForToday = sideData[currentDay] === 't' && sideData[currentWeek] === 't';
    const isSweepingToday = isCurrentlyInSeason && scheduledForToday;
    
    const activeDays = days
      .filter(day => sideData[day as keyof StreetData] === 't')
      .map(day => day.charAt(0).toUpperCase() + day.slice(1) + 's');
    
    const specificDaysText = activeDays.length > 0 ? `Every ${activeDays.join(' & ')}` : 'No scheduled cleaning';

    let status: 'danger' | 'safe' | 'info' = isSweepingToday ? 'danger' : 'safe';
    let message = isSweepingToday ? 'Move Your Car' : 'Safe to Park';
    
    if (!isCurrentlyInSeason && scheduledForToday) {
      status = 'info';
      message = `Starts ${isExtendedArea ? 'March 1st' : 'April 1st'}`;
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F2F2F7] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#007AFF]" />
      </div>
    );
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <div className="min-h-screen bg-[#F2F2F7] font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,Helvetica,Arial,sans-serif] text-black pb-24">
        <main className="max-w-lg mx-auto px-5 pt-12 space-y-8">
          
          {/* Header */}
          <header className="text-center space-y-2">
            <div className="relative w-20 h-20 mx-auto opacity-90">
              <Image src="/new-logo.png" alt="Boston Sweeper" fill className="object-contain" priority />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Boston Sweeper</h1>
            <p className="text-[#8E8E93] text-lg font-medium">Never get a ticket again.</p>
          </header>

          {/* Apple Style Search */}
          <div className="relative z-50" ref={searchContainerRef}>
            <div className="relative group bg-white/70 backdrop-blur-2xl rounded-2xl border border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden transition-all focus-within:shadow-[0_8px_24px_rgba(0,0,0,0.1)] focus-within:ring-1 focus-within:ring-[#007AFF]/20">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                {isSearching ? <Loader2 className="w-5 h-5 animate-spin text-[#007AFF]" /> : <Search className="w-5 h-5 text-[#8E8E93]" />}
              </div>
              <form onSubmit={handleSearch}>
                <input
                  type="text"
                  placeholder="Street Name"
                  className="w-full bg-transparent py-4 pl-12 pr-24 focus:outline-none text-lg font-medium placeholder:text-[#AEAEB2]"
                  value={searchQuery}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={(e) => {setSearchQuery(e.target.value); setShowSuggestions(true);}}
                />
              </form>
              <div className="absolute inset-y-0 right-3 flex items-center gap-2">
                {searchQuery && (
                  <button onClick={clearSearch} className="p-1 bg-[#8E8E93]/20 rounded-full text-[#8E8E93] hover:bg-[#8E8E93]/30 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button onClick={handleLocationClick} className="p-2 bg-[#007AFF]/10 text-[#007AFF] rounded-full hover:bg-[#007AFF]/20 transition-all">
                  <MapPin className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white/90 backdrop-blur-3xl border border-white/20 rounded-2xl shadow-[0_16px_32px_rgba(0,0,0,0.1)] overflow-hidden divide-y divide-[#F2F2F7]">
                {suggestions.map((name, i) => (
                  <button key={i} onClick={() => handleSelectStreet(name)} className="w-full px-5 py-4 text-left hover:bg-[#007AFF]/10 transition-colors flex items-center gap-3">
                    <MapIcon className="w-4 h-4 text-[#8E8E93]" />
                    <span className="font-semibold text-[#1C1C1E]">{name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedStreet ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Segmented Control */}
              <div className="flex flex-col gap-4">
                {allStreets.some(s => s.st_name === selectedStreet) && (
                  <div className="bg-[#E3E3E8] p-1 rounded-xl flex">
                    {['Odd', 'Even'].map(side => (
                      <button 
                        key={side} 
                        onClick={() => {setSelectedSide(side as 'Odd'|'Even'); setSelectedSegmentId(null);}} 
                        className={`flex-1 py-1.5 text-sm font-semibold rounded-[9px] transition-all ${
                          selectedSide === side ? 'bg-white shadow-sm text-black' : 'text-[#8E8E93] hover:text-[#1C1C1E]'
                        }`}
                      >
                        {side} Side
                      </button>
                    ))}
                  </div>
                )}
                
                {selectedSegmentId && (
                  <button onClick={() => {setSelectedSegmentId(null); setCoords([]);}} className="text-[#007AFF] font-semibold text-sm flex items-center gap-1">
                    <ChevronRight className="w-4 h-4 rotate-180" /> Back to Blocks
                  </button>
                )}
              </div>

              {!selectedSegmentId && allStreets.some(s => s.st_name === selectedStreet) && (
                <div className="bg-white rounded-2xl overflow-hidden divide-y divide-[#F2F2F7] shadow-sm">
                  {allStreets.filter(s => s.st_name === selectedStreet && s.side === selectedSide).map(seg => (
                    <button key={seg.main_id} onClick={() => setSelectedSegmentId(seg.main_id)} className="w-full p-4 flex items-center justify-between hover:bg-[#F2F2F7] transition-all">
                      <div className="text-left">
                        <p className="font-bold text-[#1C1C1E]">{seg.from} to {seg.to}</p>
                        <p className="text-xs text-[#8E8E93] font-medium uppercase tracking-wide">{seg.dist_name}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#C7C7CC]" />
                    </button>
                  ))}
                </div>
              )}

              {!selectedSegmentId && !allStreets.some(s => s.st_name === selectedStreet) && (
                <div className="bg-white rounded-3xl p-10 text-center space-y-4 shadow-sm">
                  <div className="w-16 h-16 bg-[#F2F2F7] rounded-full flex items-center justify-center mx-auto">
                    <Info className="w-8 h-8 text-[#8E8E93]" />
                  </div>
                  <h3 className="text-xl font-bold">{selectedStreet}</h3>
                  <p className="text-[#8E8E93] font-medium">No cleaning schedule found for this location.</p>
                </div>
              )}

              {streetDetails && (
                <div className="space-y-6">
                  {/* Status Card (Live Activity Style) */}
                  <div className={`rounded-3xl p-8 text-white shadow-lg transition-all border border-white/10 ${
                    streetDetails.status === 'danger' ? 'bg-[#FF3B30]' : streetDetails.status === 'info' ? 'bg-[#007AFF]' : 'bg-[#34C759]'
                  }`}>
                    <div className="flex flex-col items-center text-center space-y-6">
                      <div className="space-y-1">
                        <h2 className="text-3xl font-extrabold tracking-tight">{streetDetails.message}</h2>
                        <p className="text-white/80 font-medium">{streetDetails.name}</p>
                      </div>
                      
                      <div className="w-full bg-white/20 h-px"></div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-[10px] uppercase font-bold text-white/60 mb-1">Schedule</p>
                          <p className="font-bold text-lg">{streetDetails.nextSweeping}</p>
                        </div>
                        <div className="w-px bg-white/20 h-10"></div>
                        <div className="text-center">
                          <p className="text-[10px] uppercase font-bold text-white/60 mb-1">Days</p>
                          <p className="font-bold text-lg">
                            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                              .filter(day => streetDetails.raw[day as keyof StreetData] === 't')
                              .map(day => day.charAt(0).toUpperCase() + day.slice(1))
                              .join(', ')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Details List (Apple Settings Style) */}
                  <div className="bg-white rounded-3xl overflow-hidden shadow-sm divide-y divide-[#F2F2F7]">
                    <div className="p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-[#007AFF]" />
                          <span className="font-bold">Cleaning Schedule</span>
                        </div>
                        <span className="text-xs font-bold text-[#8E8E93] bg-[#F2F2F7] px-2 py-1 rounded-md">12h Format</span>
                      </div>
                      <p className="text-2xl font-bold text-[#1C1C1E]">{streetDetails.specificDays}</p>
                    </div>

                    <div className="p-5">
                      <div className="grid grid-cols-7 gap-1">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => {
                          const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                          const active = streetDetails.raw[dayNames[i] as keyof StreetData] === 't';
                          return (
                            <div key={i} className={`h-12 flex items-center justify-center rounded-xl font-bold transition-all ${
                              active ? 'bg-[#007AFF] text-white shadow-sm' : 'bg-[#F2F2F7] text-[#C7C7CC]'
                            }`}>
                              {d}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Map (Apple Maps Style) */}
                  <div className="bg-white rounded-3xl overflow-hidden h-64 border border-white shadow-sm relative group">
                    {isGeocoding && <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-sm flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#007AFF]" /></div>}
                    {coords.length > 0 ? (
                      <Map 
                        defaultCenter={coords[0]} 
                        center={coords[0]}
                        defaultZoom={17} 
                        gestureHandling={'greedy'} 
                        disableDefaultUI={true} 
                        className="w-full h-full grayscale-[0.1] contrast-[1.05]"
                      >
                        <Marker position={coords[0]} />
                        <Marker position={coords[1]} />
                        <Polyline
                          path={coords}
                          strokeColor="#007AFF"
                          strokeOpacity={0.8}
                          strokeWeight={6}
                        />
                      </Map>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-[#F2F2F7]"><MapIcon className="w-10 h-10 text-[#C7C7CC]" /></div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3 pt-4">
              {[
                { icon: Search, title: "Search", color: "#007AFF" },
                { icon: MapPin, title: "Locate", color: "#34C759" },
                { icon: Clock, title: "Alerts", color: "#FF9500" }
              ].map((item, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl text-center space-y-3 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm">{item.title}</h4>
                </div>
              ))}
            </div>
          )}
        </main>

        <footer className="max-w-lg mx-auto px-5 py-12 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-[#8E8E93] font-medium text-sm">
            <span>Created by Robert Frontend</span>
            <span className="opacity-30">•</span>
            <a 
              href="https://github.com/robertfrontend/boston-street-cleaning" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-[#007AFF] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 33.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
              <span>GitHub</span>
            </a>
          </div>
          <p className="text-[#AEAEB2] text-[10px] font-bold uppercase tracking-widest">
            Boston Municipal Data © 2026
          </p>
        </footer>
      </div>
    </APIProvider>
  );
}
