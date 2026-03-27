'use client';

import React from 'react';
import { Loader2, Map as MapIcon } from 'lucide-react';
import { Map, Marker, Polyline } from '@vis.gl/react-google-maps';

interface MapPreviewProps {
  coords: { lat: number; lng: number }[];
  isGeocoding: boolean;
}

export const MapPreview: React.FC<MapPreviewProps> = ({ coords, isGeocoding }) => {
  return (
    <div className="bg-white rounded-3xl overflow-hidden h-64 border border-white shadow-sm relative group">
      {isGeocoding && (
        <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-sm flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#007AFF]" />
        </div>
      )}
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
        <div className="absolute inset-0 flex items-center justify-center bg-[#F2F2F7]">
          <MapIcon className="w-10 h-10 text-[#C7C7CC]" />
        </div>
      )}
    </div>
  );
};
