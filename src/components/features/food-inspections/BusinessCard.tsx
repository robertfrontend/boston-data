'use client'

import { Calendar, ChevronDown, ChevronUp, MapPin, ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react'
import {
  formatInspectionDate,
  formatInspectionResult,
  type GroupedBusiness,
} from '@/lib/food-inspections'

interface BusinessCardProps {
  business: GroupedBusiness
  isExpanded: boolean
  onToggle: () => void
}

function resultTone(result: string): 'pass' | 'fail' | 'other' {
  const normalized = result.toLowerCase()
  if (normalized.includes('pass')) return 'pass'
  if (normalized.includes('fail')) return 'fail'
  return 'other'
}

export function BusinessCard({ business, isExpanded, onToggle }: BusinessCardProps) {
  const latest = business.inspections[0]
  if (!latest) return null

  const tone = resultTone(latest.result)
  const toneClass = tone === 'pass'
    ? 'bg-[#34C759]/10 text-[#34C759]'
    : tone === 'fail'
      ? 'bg-[#FF3B30]/10 text-[#FF3B30]'
      : 'bg-[#5856D6]/10 text-[#5856D6]'

  return (
    <div className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm transition-all dark:border-white/5 dark:bg-[#1C1C1E]">
      <button
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 p-5 text-left transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
      >
        <div className="space-y-1">
          <h3 className="text-lg font-bold leading-tight dark:text-white">{business.name}</h3>
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#8E8E93] dark:text-[#98989D]">
            <MapPin className="h-3 w-3" />
            <span>{business.address}, {business.city}</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${toneClass}`}>
              Latest: {formatInspectionResult(latest.result)}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-tighter text-[#8E8E93]">
              {formatInspectionDate(latest.resultdttm)}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className={`rounded-2xl p-2 ${toneClass}`}>
            {tone === 'pass' ? <ShieldCheck className="h-6 w-6" /> : tone === 'fail' ? <ShieldAlert className="h-6 w-6" /> : <ShieldQuestion className="h-6 w-6" />}
          </div>
          {isExpanded ? <ChevronUp className="h-4 w-4 text-[#C7C7CC]" /> : <ChevronDown className="h-4 w-4 text-[#C7C7CC]" />}
        </div>
      </button>

      {isExpanded ? (
        <div className="animate-in slide-in-from-top-2 space-y-4 px-5 pb-5 duration-200">
          <div className="h-px w-full bg-[#F2F2F7] dark:bg-[#2C2C2E]" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#8E8E93]">
            {business.inspections.length} {business.inspections.length === 1 ? 'inspection' : 'inspections'} loaded
          </p>
          <div className="space-y-4">
            {business.inspections.map((visit) => {
              const visitTone = resultTone(visit.result)
              return (
                <div key={`${visit.resultdttm}-${visit.result}`} className="relative space-y-2 border-l-2 border-[#F2F2F7] pl-4 dark:border-[#2C2C2E]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#1C1C1E] dark:text-white">
                      <Calendar className="h-3 w-3 text-[#8E8E93]" />
                      {formatInspectionDate(visit.resultdttm)}
                    </div>
                    <span className={`text-[10px] font-black uppercase ${
                      visitTone === 'pass' ? 'text-[#34C759]' : visitTone === 'fail' ? 'text-[#FF3B30]' : 'text-[#5856D6]'
                    }`}>
                      {formatInspectionResult(visit.result)}
                    </span>
                  </div>
                  {visit.violations.map((violation) => (
                    <div key={violation.id} className="space-y-1">
                      {violation.description ? (
                        <p className="text-xs leading-relaxed text-[#48484A] dark:text-[#D1D1D6]">
                          <span className="font-bold">Violation:</span> {violation.description}
                        </p>
                      ) : null}
                      {violation.comments ? (
                        <p className="rounded-lg bg-[#F2F2F7] p-2 text-[11px] italic text-[#8E8E93] dark:bg-[#2C2C2E]">
                          &ldquo;{violation.comments}&rdquo;
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
