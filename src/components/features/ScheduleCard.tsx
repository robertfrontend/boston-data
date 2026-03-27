'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import { StreetDetails, StreetData } from '@/types/street';

interface ScheduleCardProps {
  streetDetails: StreetDetails;
}

export const ScheduleCard: React.FC<ScheduleCardProps> = ({ streetDetails }) => {
  return (
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
  );
};
