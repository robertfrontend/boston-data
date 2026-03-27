'use client';

import React from 'react';
import { AlertTriangle, Clock, CheckCircle2, XCircle, Info } from 'lucide-react';
import { StreetDetails, StreetData } from '@/types/street';

interface StatusBannerProps {
  streetDetails: StreetDetails;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({ streetDetails }) => {
  const getStatusIcon = () => {
    switch (streetDetails.status) {
      case 'danger':
        return <XCircle className="w-16 h-16 mb-2 drop-shadow-md" />;
      case 'info':
        return <Info className="w-16 h-16 mb-2 drop-shadow-md" />;
      case 'safe':
      default:
        return <CheckCircle2 className="w-16 h-16 mb-2 drop-shadow-md" />;
    }
  };

  return (
    <div className={`rounded-3xl p-8 text-white shadow-lg transition-all border border-white/10 ${
      streetDetails.status === 'danger' ? 'bg-[#FF3B30]' : streetDetails.status === 'info' ? 'bg-[#007AFF]' : 'bg-[#34C759]'
    }`}>
      <div className="flex flex-col items-center text-center space-y-4">
        {getStatusIcon()}
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
  );
};
