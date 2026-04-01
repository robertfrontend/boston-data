'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, ChevronRight, ChevronLeft, Info, MapPin } from 'lucide-react';
import Papa from 'papaparse';
import { APIProvider } from '@vis.gl/react-google-maps';

// Components
import { SearchBar } from '@/components/features/SearchBar';
import { StatusBanner } from '@/components/features/StatusBanner';
import { ScheduleCard } from '@/components/features/ScheduleCard';
import { MapPreview } from '@/components/features/MapPreview';
import { OnboardingGrid } from '@/components/features/OnboardingGrid';
import { Footer } from '@/components/layout/Footer';
import { LocationModal } from '@/components/features/LocationModal';
import { WelcomePermissionModal } from '@/components/features/WelcomePermissionModal';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

// Types & Utils
import { StreetData, StreetDetails } from '@/types/street';
import { normalizeStreetName, formatTime12h } from '@/lib/utils';

// --- CONFIGURATION ---
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''; 

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

  // Location Modal State
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [nearbyStreets, setNearbyStreets] = useState<string[]>([]);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Welcome Modal State
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);

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

  // API Autocomplete
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

  // Geocode
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
          if (status === 'OK' && results?.[0]) resolve(results[0].geometry.location);
          else resolve(null);
        });
      });
    };

    const fetchRoute = async () => {
      setIsGeocoding(true);
      const fromPos = await geocodePoint(`${segment.st_name} & ${segment.from}`);
      const toPos = await geocodePoint(`${segment.st_name} & ${segment.to}`);

      if (fromPos && toPos) {
        setCoords([{ lat: fromPos.lat(), lng: fromPos.lng() }, { lat: toPos.lat(), lng: toPos.lng() }]);
      } else {
        const centerPos = await geocodePoint(segment.st_name);
        if (centerPos) {
          setCoords([{ lat: centerPos.lat(), lng: centerPos.lng() }, { lat: centerPos.lat() + 0.0005, lng: centerPos.lng() + 0.0005 }]);
        }
      }
      setIsGeocoding(false);
    };

    fetchRoute();
  }, [selectedSegmentId, allStreets]);

  const handleSelectStreet = (name: string) => {
    if (!name) return;
    const normalizedSelected = normalizeStreetName(name);
    const localMatch = allStreets.find(s => normalizeStreetName(s.st_name) === normalizedSelected) 
                     || allStreets.find(s => normalizeStreetName(s.st_name).includes(normalizedSelected))
                     || allStreets.find(s => normalizedSelected.includes(normalizeStreetName(s.st_name)));

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
    if (suggestions.length > 0) handleSelectStreet(suggestions[0]);
  };

  const handleLocationClick = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    // Check if user has already seen/accepted the welcome permission modal
    const hasSeenWelcome = localStorage.getItem('boston_sweeper_welcome_seen');
    if (!hasSeenWelcome) {
      setIsWelcomeModalOpen(true);
      return;
    }
    
    setIsLocationModalOpen(true);
    setIsDetectingLocation(true);
    setNearbyStreets([]);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (!window.google) return;
        const geocoder = new google.maps.Geocoder();
        const latlng = { lat: position.coords.latitude, lng: position.coords.longitude };
        
        geocoder.geocode({ location: latlng }, (results, status) => {
          if (status === "OK" && results) {
            // Extract multiple unique street names from results
            const streets = Array.from(new Set(
              results
                .map(res => {
                  const route = res.address_components.find(c => c.types.includes("route"));
                  return route ? route.long_name : null;
                })
                .filter((name): name is string => name !== null)
            )).slice(0, 5);
            
            setNearbyStreets(streets);
          }
          setIsDetectingLocation(false);
        });
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsDetectingLocation(false);
        setIsLocationModalOpen(false);
        if (error.code !== error.PERMISSION_DENIED) {
          alert("Could not detect your location. Please check your browser permissions.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleAcceptPermission = () => {
    setIsWelcomeModalOpen(false);
    localStorage.setItem('boston_sweeper_welcome_seen', 'true');
    // Small delay to let the modal close before the system prompt
    setTimeout(() => {
      handleLocationClick();
    }, 300);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedStreet(null);
    setSelectedSegmentId(null);
    setShowSuggestions(false);
    setSuggestions([]);
    setCoords([]);
  };

  const streetDetails = useMemo<StreetDetails | null>(() => {
    if (!selectedSegmentId) return null;
    const sideData = allStreets.find(s => s.main_id === selectedSegmentId);
    if (!sideData) return null;

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
    
    const activeWeeks = ['1', '2', '3', '4', '5']
      .filter(w => sideData[`week_${w}` as keyof StreetData] === 't');
    
    const weeksText = activeWeeks.length === 5 
      ? 'Every week' 
      : activeWeeks.length > 0 
        ? `${activeWeeks.map(w => {
            if (w === '1') return '1st';
            if (w === '2') return '2nd';
            if (w === '3') return '3rd';
            return `${w}th`;
          }).join(' & ')} weeks`
        : '';

    const specificDaysText = activeDays.length > 0 
      ? `Every ${activeDays.join(' & ')}${weeksText ? ` (${weeksText})` : ''}`
      : 'No scheduled cleaning';

    let status: 'danger' | 'safe' | 'info' = isSweepingToday ? 'danger' : 'safe';
    let message = isSweepingToday ? 'Move Your Car' : 'Safe to Park';
    
    if (!isCurrentlyInSeason && scheduledForToday) {
      status = 'info';
      message = `Starts ${isExtendedArea ? 'March 1st' : 'April 1st'}`;
    }

    return {
      name: sideData.st_name,
      district: sideData.dist_name,
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
      <div className="min-h-screen flex flex-col items-center justify-center transition-colors duration-300">
        <Loader2 className="w-8 h-8 animate-spin text-[#007AFF]" />
      </div>
    );
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Boston Sweeper",
            "description": "Real-time street cleaning schedule and parking alerts for Boston.",
            "applicationCategory": "Utility",
            "operatingSystem": "All",
            "url": "https://boston-sweeper.vercel.app",
            "author": {
              "@type": "Person",
              "name": "Robert Frontend"
            }
          })
        }}
      />
      <div className="min-h-screen font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,Helvetica,Arial,sans-serif] pb-24 transition-colors duration-300">
        <main className="max-w-lg mx-auto px-5 pt-12 space-y-8">
          
          <header className="flex flex-col items-center text-center space-y-4 relative">
            <div className="absolute top-0 left-0">
              <Link href="/" className="p-2.5 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-all border border-black/5 dark:border-white/10 shadow-sm" aria-label="Back to Hub">
                <ChevronLeft className="w-5 h-5 text-black dark:text-white" />
              </Link>
            </div>
            <div className="absolute top-0 right-0">
              <ThemeToggle />
            </div>
            <div className="relative w-20 h-20 mx-auto opacity-90">
              <Image src="/new-logo.png" alt="Boston Sweeper" fill className="object-contain" priority />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">Boston Sweeper</h1>
              <p className="text-[#8E8E93] dark:text-[#98989D] text-lg font-medium transition-colors">Never get a ticket again.</p>
            </div>
          </header>

          <SearchBar 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isSearching={isSearching}
            showSuggestions={showSuggestions}
            setShowSuggestions={setShowSuggestions}
            suggestions={suggestions}
            handleSearch={handleSearch}
            handleSelectStreet={handleSelectStreet}
            handleLocationClick={handleLocationClick}
            clearSearch={clearSearch}
            searchContainerRef={searchContainerRef}
          />

          {selectedStreet ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col gap-4">
                {allStreets.some(s => s.st_name === selectedStreet) && (
                  <div className="space-y-2">
                    <div className="bg-[#E3E3E8] dark:bg-[#1C1C1E] p-1 rounded-xl flex transition-colors">
                      {['Odd', 'Even'].map(side => (
                        <button 
                          key={side} 
                          onClick={() => {setSelectedSide(side as 'Odd'|'Even'); setSelectedSegmentId(null);}} 
                          className={`flex-1 py-1.5 text-sm font-semibold rounded-[9px] transition-all ${
                            selectedSide === side 
                              ? 'bg-white dark:bg-[#3A3A3C] shadow-sm text-black dark:text-white' 
                              : 'text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white'
                          }`}
                        >
                          {side} Side
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-[#8E8E93] dark:text-[#98989D] text-center font-medium px-2">
                      Check the house numbers: <span className="text-black dark:text-white font-bold">Odd</span> (1, 3, 5) or <span className="text-black dark:text-white font-bold">Even</span> (2, 4, 6)
                    </p>
                  </div>
                )}
                
                {selectedSegmentId && (
                  <button onClick={() => {setSelectedSegmentId(null); setCoords([]);}} className="text-[#007AFF] font-semibold text-sm flex items-center gap-1">
                    <ChevronRight className="w-4 h-4 rotate-180" /> Back to Blocks
                  </button>
                )}
              </div>

              {!selectedSegmentId && allStreets.some(s => s.st_name === selectedStreet) && (
                <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden divide-y divide-[#F2F2F7] dark:divide-[#2C2C2E] shadow-sm border border-black/5 dark:border-white/5 transition-colors">
                  {allStreets.filter(s => s.st_name === selectedStreet && s.side === selectedSide).map(seg => (
                    <button key={seg.main_id} onClick={() => setSelectedSegmentId(seg.main_id)} className="w-full p-4 flex items-center justify-between hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] transition-all">
                      <div className="text-left">
                        <p className="font-bold text-[#1C1C1E] dark:text-white">{seg.from} to {seg.to}</p>
                        <p className="text-xs text-[#8E8E93] dark:text-[#98989D] font-medium uppercase tracking-wide">{seg.dist_name}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#C7C7CC] dark:text-[#48484A]" />
                    </button>
                  ))}
                </div>
              )}

              {!selectedSegmentId && !allStreets.some(s => s.st_name === selectedStreet) && (
                <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-10 text-center space-y-4 shadow-sm border border-black/5 dark:border-white/5 transition-colors">
                  <div className="w-16 h-16 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-full flex items-center justify-center mx-auto transition-colors">
                    <Info className="w-8 h-8 text-[#8E8E93]" />
                  </div>
                  <h3 className="text-xl font-bold dark:text-white transition-colors">{selectedStreet}</h3>
                  <p className="text-[#8E8E93] dark:text-[#98989D] font-medium transition-colors">No cleaning schedule found for this location.</p>
                </div>
              )}

              {streetDetails && (
                <div className="space-y-6">
                  <StatusBanner streetDetails={streetDetails} />
                  <ScheduleCard streetDetails={streetDetails} />
                  <MapPreview coords={coords} isGeocoding={isGeocoding} />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <button
                onClick={handleLocationClick}
                className="w-full bg-white dark:bg-[#1C1C1E] p-8 rounded-[2.5rem] shadow-sm hover:shadow-md active:scale-[0.98] transition-all group flex flex-col items-center text-center space-y-6 border border-black/5 dark:border-white/5 relative overflow-hidden"
              >
                <div className="w-20 h-20 bg-[#34C759]/10 rounded-[2rem] flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ease-out">
                  <MapPin className="w-10 h-10 text-[#34C759]" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-extrabold text-black dark:text-white tracking-tight">Schedules Near Me</h3>
                  <p className="text-[#8E8E93] dark:text-[#98989D] font-medium text-sm max-w-[240px] mx-auto leading-relaxed">
                    Automatically detect your street and check for upcoming cleaning.
                  </p>
                </div>

                <div className="flex items-center gap-2 px-6 py-3 bg-[#007AFF] text-white rounded-full font-bold text-sm shadow-lg shadow-[#007AFF]/20 group-hover:bg-[#0062CC] transition-all">
                  <span>Use Current Location</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          )}
        </main>
        
        <LocationModal 
          isOpen={isLocationModalOpen}
          onClose={() => setIsLocationModalOpen(false)}
          nearbyStreets={nearbyStreets}
          onSelectStreet={handleSelectStreet}
          isLoading={isDetectingLocation}
        />

        <WelcomePermissionModal 
          isOpen={isWelcomeModalOpen}
          onClose={() => {
            setIsWelcomeModalOpen(false);
            localStorage.setItem('boston_sweeper_welcome_seen', 'true');
          }}
          onAccept={handleAcceptPermission}
        />

        <Footer />
      </div>
    </APIProvider>
  );
}
