'use client';

import { Calendar, Truck, CalendarPlus } from 'lucide-react';
import { StreetDetails, StreetData } from '@/types/street';
import { downloadICS } from '@/lib/utils';

interface ScheduleCardProps {
  streetDetails: StreetDetails;
}

export const ScheduleCard: React.FC<ScheduleCardProps> = ({ streetDetails }) => {
  return (
    <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl overflow-hidden shadow-sm divide-y divide-[#F2F2F7] dark:divide-[#2C2C2E] border border-black/5 dark:border-white/5 transition-colors">
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-[#007AFF]" />
            <span className="font-bold dark:text-white">Cleaning Schedule</span>
          </div>
          <span className="text-xs font-bold text-[#8E8E93] dark:text-[#98989D] bg-[#F2F2F7] dark:bg-[#2C2C2E] px-2 py-1 rounded-md">12h Format</span>
        </div>
        <p className="text-2xl font-bold text-[#1C1C1E] dark:text-white">{streetDetails.specificDays}</p>
      </div>

      <div className="p-5 space-y-6">
        <div className="grid grid-cols-7 gap-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => {
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const active = streetDetails.raw[dayNames[i] as keyof StreetData] === 't';
            return (
              <div key={i} className={`h-12 flex items-center justify-center rounded-xl font-bold transition-all ${
                active ? 'bg-[#007AFF] text-white shadow-sm' : 'bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#C7C7CC] dark:text-[#48484A]'
              }`}>
                {d}
              </div>
            )
          })}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#8E8E93] dark:text-[#98989D]" />
            <span className="text-xs font-bold text-[#8E8E93] dark:text-[#98989D] uppercase tracking-wider">Weeks of the Month</span>
          </div>
          <div className="flex gap-2">
            {['1', '2', '3', '4', '5'].map((w) => {
              const active = streetDetails.raw[`week_${w}` as keyof StreetData] === 't';
              const isCurrent = Math.ceil(new Date().getDate() / 7) === parseInt(w);
              return (
                <div key={w} className={`flex-1 h-10 flex items-center justify-center rounded-xl text-xs font-bold border transition-all ${
                  active 
                    ? 'bg-[#1C1C1E] dark:bg-[#3A3A3C] text-white border-[#1C1C1E] dark:border-[#3A3A3C] shadow-sm' 
                    : 'bg-white dark:bg-[#1C1C1E] text-[#AEAEB2] dark:text-[#636366] border-[#F2F2F7] dark:border-[#2C2C2E]'
                } ${isCurrent && !active ? 'border-dashed border-[#AEAEB2] dark:border-[#48484A]' : ''} relative`}>
                  W{w}
                  {isCurrent && <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#FF3B30] rounded-full border-2 border-white dark:border-[#1C1C1E]"></div>}
                </div>
              )
            })}
          </div>
        </div>

        <button 
          onClick={() => downloadICS(streetDetails.raw)}
          className="w-full py-4 bg-[#F2F2F7] dark:bg-[#2C2C2E] hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C] text-[#007AFF] rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2"
        >
          <CalendarPlus className="w-4 h-4" />
          Add to My Calendar
        </button>
      </div>
    </div>
  );
};
