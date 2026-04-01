'use client';

import React from 'react';
import { MapPin, ShieldCheck, ShieldAlert, ShieldQuestion, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { FoodInspection } from '@/types/street';

interface GroupedBusiness {
  licenseNo: string;
  name: string;
  address: string;
  city: string;
  inspections: FoodInspection[];
}

interface BusinessCardProps {
  business: GroupedBusiness;
  isExpanded: boolean;
  onToggle: () => void;
}

export const BusinessCard: React.FC<BusinessCardProps> = ({ business, isExpanded, onToggle }) => {
  const latest = business.inspections[0];
  const isPass = latest.result.toLowerCase().includes('pass');
  const isFail = latest.result.toLowerCase().includes('fail');

  return (
    <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-sm border border-black/5 dark:border-white/5 overflow-hidden transition-all">
      {/* Business Header */}
      <button 
        onClick={onToggle}
        className="w-full p-5 text-left flex items-start justify-between gap-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
      >
        <div className="space-y-1">
          <h3 className="text-lg font-bold dark:text-white leading-tight">{business.name}</h3>
          <div className="flex items-center gap-1.5 text-[#8E8E93] dark:text-[#98989D] text-xs font-medium">
            <MapPin className="w-3 h-3" />
            <span>{business.address}, {business.city}</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
              isPass ? 'bg-[#34C759]/10 text-[#34C759]' : 
              isFail ? 'bg-[#FF3B30]/10 text-[#FF3B30]' : 
              'bg-[#5856D6]/10 text-[#5856D6]'
            }`}>
              Latest: {latest.result.replace('HE_', '').replace('_', ' ')}
            </span>
            <span className="text-[10px] text-[#8E8E93] font-bold uppercase tracking-tighter">
              {business.inspections.length} {business.inspections.length === 1 ? 'Inspection' : 'Inspections'}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className={`p-2 rounded-2xl ${
            isPass ? 'bg-[#34C759]/10 text-[#34C759]' : 
            isFail ? 'bg-[#FF3B30]/10 text-[#FF3B30]' : 
            'bg-[#5856D6]/10 text-[#5856D6]'
          }`}>
            {isPass ? <ShieldCheck className="w-6 h-6" /> : isFail ? <ShieldAlert className="w-6 h-6" /> : <ShieldQuestion className="w-6 h-6" />}
          </div>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-[#C7C7CC]" /> : <ChevronDown className="w-4 h-4 text-[#C7C7CC]" />}
        </div>
      </button>

      {/* Expanded History */}
      {isExpanded && (
        <div className="px-5 pb-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="h-px bg-[#F2F2F7] dark:bg-[#2C2C2E] w-full" />
          <div className="space-y-4">
            {business.inspections.map((insp, idx) => (
              <div key={idx} className="relative pl-4 border-l-2 border-[#F2F2F7] dark:border-[#2C2C2E] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#1C1C1E] dark:text-white">
                    <Calendar className="w-3 h-3 text-[#8E8E93]" />
                    {new Date(insp.resultdttm).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                  <span className={`text-[10px] font-black uppercase ${
                    insp.result.toLowerCase().includes('pass') ? 'text-[#34C759]' : 
                    insp.result.toLowerCase().includes('fail') ? 'text-[#FF3B30]' : 'text-[#5856D6]'
                  }`}>
                    {insp.result.replace('HE_', '').replace('_', ' ')}
                  </span>
                </div>
                {insp.violdesc && (
                  <p className="text-xs text-[#48484A] dark:text-[#D1D1D6] leading-relaxed">
                    <span className="font-bold">Violation:</span> {insp.violdesc}
                  </p>
                )}
                {insp.comments && (
                  <p className="text-[11px] text-[#8E8E93] italic bg-[#F2F2F7] dark:bg-[#2C2C2E] p-2 rounded-lg">
                    "{insp.comments}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
