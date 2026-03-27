'use client';

import { Calendar, Truck } from 'lucide-react';
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

      <div className="p-5 space-y-6">
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

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#8E8E93]" />
            <span className="text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Weeks of the Month</span>
          </div>
          <div className="flex gap-2">
            {['1', '2', '3', '4', '5'].map((w) => {
              const active = streetDetails.raw[`week_${w}` as keyof StreetData] === 't';
              const isCurrent = Math.ceil(new Date().getDate() / 7) === parseInt(w);
              return (
                <div key={w} className={`flex-1 h-10 flex items-center justify-center rounded-xl text-xs font-bold border transition-all ${
                  active 
                    ? 'bg-[#1C1C1E] text-white border-[#1C1C1E] shadow-sm' 
                    : 'bg-white text-[#AEAEB2] border-[#F2F2F7]'
                } ${isCurrent && !active ? 'border-dashed border-[#AEAEB2]' : ''}`}>
                  W{w}
                  {isCurrent && <div className="absolute -top-1 right-1 w-1.5 h-1.5 bg-[#FF3B30] rounded-full"></div>}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
