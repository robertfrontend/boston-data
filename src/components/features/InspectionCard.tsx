'use client';

import React from 'react';
import { ShieldCheck, ShieldAlert, ShieldQuestion, Calendar, MapPin, Info } from 'lucide-react';
import { FoodInspection } from '@/types/street';

interface InspectionCardProps {
  inspection: FoodInspection;
}

export const InspectionCard: React.FC<InspectionCardProps> = ({ inspection }) => {
  const isPass = inspection.result.toLowerCase().includes('pass');
  const isFail = inspection.result.toLowerCase().includes('fail');
  
  const date = new Date(inspection.resultdttm).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="bg-white dark:bg-[#1C1C1E] p-5 rounded-3xl shadow-sm border border-black/5 dark:border-white/5 space-y-4 transition-all hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-bold dark:text-white leading-tight">
            {inspection.businessname}
          </h3>
          <div className="flex items-center gap-1.5 text-[#8E8E93] dark:text-[#98989D] text-xs font-medium">
            <MapPin className="w-3 h-3" />
            <span>{inspection.address}, {inspection.city}</span>
          </div>
        </div>
        <div className={`p-2 rounded-2xl shrink-0 ${
          isPass ? 'bg-[#34C759]/10 text-[#34C759]' : 
          isFail ? 'bg-[#FF3B30]/10 text-[#FF3B30]' : 
          'bg-[#5856D6]/10 text-[#5856D6]'
        }`}>
          {isPass ? <ShieldCheck className="w-6 h-6" /> : 
           isFail ? <ShieldAlert className="w-6 h-6" /> : 
           <ShieldQuestion className="w-6 h-6" />}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 py-1">
        <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] p-3 rounded-2xl space-y-1">
          <div className="flex items-center gap-1.5 text-[#8E8E93] dark:text-[#98989D] text-[10px] font-bold uppercase tracking-wider">
            <Calendar className="w-3 h-3" />
            <span>Date</span>
          </div>
          <p className="text-sm font-bold dark:text-white">{date}</p>
        </div>
        <div className={`p-3 rounded-2xl space-y-1 ${
          isPass ? 'bg-[#34C759]/5' : isFail ? 'bg-[#FF3B30]/5' : 'bg-[#5856D6]/5'
        }`}>
          <div className="flex items-center gap-1.5 text-[#8E8E93] dark:text-[#98989D] text-[10px] font-bold uppercase tracking-wider">
            <Info className="w-3 h-3" />
            <span>Result</span>
          </div>
          <p className={`text-sm font-bold ${
            isPass ? 'text-[#34C759]' : isFail ? 'text-[#FF3B30]' : 'text-[#5856D6]'
          }`}>
            {inspection.result.replace('HE_', '').replace('_', ' ')}
          </p>
        </div>
      </div>

      {inspection.violdesc && (
        <div className="pt-3 border-t border-[#F2F2F7] dark:border-[#2C2C2E] space-y-2">
          <div className="text-[10px] font-bold text-[#8E8E93] dark:text-[#98989D] uppercase tracking-widest">
            Observation
          </div>
          <p className="text-sm font-medium text-[#48484A] dark:text-[#D1D1D6] leading-relaxed">
            {inspection.violdesc}
          </p>
          {inspection.comments && (
            <p className="text-xs text-[#8E8E93] dark:text-[#98989D] italic bg-[#F2F2F7] dark:bg-[#2C2C2E] p-3 rounded-xl">
              "{inspection.comments}"
            </p>
          )}
        </div>
      )}
    </div>
  );
};
