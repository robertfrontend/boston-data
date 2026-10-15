'use client'

import { CheckCircle2, Info, XCircle } from 'lucide-react'
import { StreetDetails } from '@/types/street'

interface StatusBannerProps {
  streetDetails: StreetDetails
}

export function StatusBanner({ streetDetails }: StatusBannerProps) {
  const icon = streetDetails.status === 'danger'
    ? <XCircle className="mb-2 h-16 w-16 drop-shadow-md" />
    : streetDetails.status === 'info'
      ? <Info className="mb-2 h-16 w-16 drop-shadow-md" />
      : <CheckCircle2 className="mb-2 h-16 w-16 drop-shadow-md" />

  return (
    <div className={`rounded-3xl border border-white/10 p-8 text-white shadow-lg transition-all ${
      streetDetails.status === 'danger' ? 'bg-[#FF3B30]' : streetDetails.status === 'info' ? 'bg-[#007AFF]' : 'bg-[#34C759]'
    }`}>
      <div className="flex flex-col items-center space-y-4 text-center">
        {icon}
        <div className="space-y-1">
          <div className="mb-1 inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
            {streetDetails.district || 'Boston'}
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">{streetDetails.message}</h2>
          <p className="font-medium text-white/80">{streetDetails.name}</p>
        </div>

        <div className="h-px w-full bg-white/20" />

        <div className="w-full space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">Next sweeping</p>
          <p className="text-xl font-bold">{streetDetails.nextDateLabel}</p>
          <p className="font-medium text-white/80">{streetDetails.nextSweeping}</p>
        </div>
      </div>
    </div>
  )
}
