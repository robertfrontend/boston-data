'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Info, AlertTriangle, CheckCircle2, Loader2, ChevronRight, Map as MapIcon, Clock, Calendar, ShieldCheck } from 'lucide-react';
import Papa from 'papaparse';
import { APIProvider, Map, Marker, Polyline } from '@vis.gl/react-google-maps';

// --- CONFIGURATION ---
// Read from .env.local as NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
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
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [allStreets, setAllStreets] = useState<StreetData[]>([]);
  const [selectedStreet, setSelectedStreet] = useState<string | null>(null);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [selectedSide, setSelectedSide] = useState<'Odd' | 'Even'>('Odd');
  const [isLoading, setIsLoading] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [coords, setCoords] = useState<{lat: number, lng: number}[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);

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
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Geocode using Google Maps (client-side)
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

  const suggestions = useMemo(() => {
    if (!searchQuery.trim() || selectedStreet === searchQuery) return [];
    const query = searchQuery.toLowerCase();
    return Array.from(new Set(
      allStreets.filter(s => s.st_name.toLowerCase().includes(query)).map(s => s.st_name)
    )).slice(0, 8);
  }, [searchQuery, allStreets, selectedStreet]);

  const handleSelectStreet = (name: string) => {
    setSelectedStreet(name);
    setSearchQuery(name);
    setShowSuggestions(false);
    const rows = allStreets.filter(s => s.st_name === name);
    const side = rows.find(s => s.side === 'Odd') ? 'Odd' : 'Even';
    setSelectedSide(side);
    const segments = rows.filter(s => s.side === side);
    if (segments.length === 1) setSelectedSegmentId(segments[0].main_id);
    else setSelectedSegmentId(null);
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (suggestions.length > 0) {
      handleSelectStreet(suggestions[0]);
    }
  };

  const streetDetails = useMemo(() => {
    if (!selectedSegmentId) return null;
    const sideData = allStreets.find(s => s.main_id === selectedSegmentId);
    if (!sideData) return null;

    const today = new Date();
    const isSweepingToday = sideData[
      ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][today.getDay()] as keyof StreetData
    ] === 't' && sideData[`week_${Math.ceil(today.getDate() / 7)}` as keyof StreetData] === 't';
    
    return {
      name: sideData.st_name,
      status: isSweepingToday ? 'danger' : 'safe',
      message: isSweepingToday ? 'MOVE YOUR CAR' : 'YOU CAN PARK',
      nextSweeping: `${sideData.start_time} - ${sideData.end_time}`,
      from: sideData.from,
      to: sideData.to
    };
  }, [selectedSegmentId, allStreets]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
        <main className="max-w-md mx-auto px-6 pt-16 space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="inline-flex p-3 bg-blue-500 rounded-2xl shadow-lg shadow-blue-200 mb-2">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-tighter text-slate-800">Boston Sweeper</h1>
              <p className="text-slate-500 font-medium text-lg px-4">Never get a parking ticket again. Check your street's cleaning schedule in seconds.</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative group">
            <form onSubmit={handleSearch} className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
                <Search className="w-5 h-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search your street (e.g. Westville St)"
                className="w-full pl-12 pr-12 py-5 bg-white border-none rounded-2xl shadow-xl shadow-slate-200/50 text-lg focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all placeholder:text-slate-400 font-medium"
                value={searchQuery}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {setSearchQuery(e.target.value); setShowSuggestions(true);}}
              />
            </form>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl border-none z-30 overflow-hidden animate-in fade-in slide-in-from-top-2">
                {suggestions.map((name, i) => (
                  <button key={i} onClick={() => handleSelectStreet(name)} className="w-full px-6 py-5 text-left hover:bg-slate-50 border-b border-slate-50 last:border-none transition-colors flex items-center gap-4 group">
                    <Search className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                    <span className="font-bold text-slate-700">{name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedStreet ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
              {/* Side Selection */}
              <div className="flex justify-center">
                <div className="inline-flex p-1 bg-slate-200/50 rounded-xl backdrop-blur-sm">
                  {['Odd', 'Even'].map(side => (
                    <button key={side} onClick={() => {setSelectedSide(side as any); setSelectedSegmentId(null);}} 
                            className={`px-8 py-2 text-sm font-bold rounded-lg transition-all ${selectedSide === side ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                      {side} Side
                    </button>
                  ))}
                </div>
              </div>

              {/* Segment Selection */}
              {!selectedSegmentId && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest text-center">Select your exact block</h3>
                  <div className="grid gap-3">
                    {allStreets.filter(s => s.st_name === selectedStreet && s.side === selectedSide).map(seg => (
                      <button key={seg.main_id} onClick={() => setSelectedSegmentId(seg.main_id)} className="w-full px-6 py-5 text-left bg-white hover:bg-slate-50 rounded-2xl shadow-sm transition-all flex items-center justify-between group">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-slate-700">{seg.from} to {seg.to}</p>
                          <p className="text-xs text-slate-400 font-medium">{seg.dist_name}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {streetDetails && (
                <div className="space-y-8">
                  {/* Status Card */}
                  <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 overflow-hidden border-none animate-in zoom-in-95 duration-300">
                    <div className="p-10 text-center space-y-8">
                      <div className="space-y-2">
                        <h2 className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Active Schedule</h2>
                        <p className="text-3xl font-black tracking-tight text-slate-800 leading-tight">{streetDetails.name}</p>
                        <div className="inline-flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl">
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-tight">{streetDetails.from} <span className="text-slate-300 mx-1">→</span> {streetDetails.to}</p>
                        </div>
                      </div>

                      <div className={`py-12 rounded-[2.5rem] flex flex-col items-center justify-center gap-6 ${streetDetails.status === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'} transition-all duration-500 border border-current border-opacity-10`}>
                        {streetDetails.status === 'danger' ? <AlertTriangle className="w-20 h-20 animate-pulse" /> : <CheckCircle2 className="w-20 h-20" />}
                        <p className="text-4xl font-black tracking-tighter">{streetDetails.message}</p>
                      </div>

                      <div className="flex items-center justify-center gap-3 text-slate-600 bg-slate-50 py-4 rounded-2xl">
                        <Clock className="w-5 h-5 text-blue-500" />
                        <p className="text-base font-black">{streetDetails.nextSweeping}</p>
                      </div>
                    </div>
                  </div>

                  {/* Google Map Card */}
                  <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden h-80 relative border-4 border-white">
                    {isGeocoding && (
                      <div className="absolute inset-0 z-10 bg-white/60 flex items-center justify-center backdrop-blur-sm">
                        <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
                      </div>
                    )}
                    {coords.length > 0 ? (
                      <Map
                        defaultCenter={coords[0]}
                        defaultZoom={16}
                        gestureHandling={'greedy'}
                        disableDefaultUI={true}
                      >
                        <Marker position={coords[0]} />
                        <Marker position={coords[1]} />
                        <Polyline
                          path={coords}
                          strokeColor="#3b82f6"
                          strokeOpacity={0.8}
                          strokeWeight={6}
                        />
                      </Map>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                        <div className="flex flex-col items-center gap-3 opacity-20">
                          <MapIcon className="w-16 h-16" />
                          <p className="font-black uppercase tracking-widest text-xs">Route Preview</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-center pt-2">
                    <button 
                      onClick={() => {setSelectedSegmentId(null); setCoords([]);}}
                      className="px-6 py-3 bg-slate-200/50 text-slate-600 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
                    >
                      Search Another Sector
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Onboarding / How it works section */
            <div className="space-y-10 py-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="space-y-6">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] text-center">How it works</h3>
                
                <div className="grid gap-4">
                  {[
                    { icon: Search, title: "Search", desc: "Type your street name above", color: "blue" },
                    { icon: Calendar, title: "Select", desc: "Choose your side and block", color: "emerald" },
                    { icon: ShieldCheck, title: "Park Safely", desc: "Get instant status for today", color: "amber" }
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-5 p-5 bg-white rounded-3xl shadow-sm">
                      <div className={`p-4 bg-${step.color}-50 rounded-2xl`}>
                        <step.icon className={`w-6 h-6 text-${step.color}-500`} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-black text-slate-800">{step.title}</h4>
                        <p className="text-sm text-slate-500 font-medium">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 bg-blue-600 rounded-[2.5rem] shadow-xl shadow-blue-200 text-center space-y-4">
                <h3 className="text-white font-black text-xl leading-tight">Covering all Boston Neighborhoods</h3>
                <p className="text-blue-100 text-sm font-medium">Daily updates for Back Bay, South End, Dorchester, and more.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </APIProvider>
  );
}
