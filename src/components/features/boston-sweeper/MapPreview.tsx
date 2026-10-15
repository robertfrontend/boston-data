'use client'

import dynamic from 'next/dynamic'
import { Loader2, Map as MapIcon } from 'lucide-react'

const LeafletMap = dynamic(
  () => import('./LeafletMap').then((mod) => mod.LeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-[#F2F2F7] dark:bg-[#2C2C2E]">
        <Loader2 className="w-8 h-8 animate-spin text-[#007AFF]" />
      </div>
    ),
  },
)

interface MapPreviewProps {
  coords: { lat: number, lng: number }[]
  isGeocoding: boolean
}

export function MapPreview({ coords, isGeocoding }: MapPreviewProps) {
  return (
    <div className="sweep-map relative isolate z-0 h-64 overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-[#1C1C1E]">
      {isGeocoding ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm dark:bg-black/50">
          <Loader2 className="w-8 h-8 animate-spin text-[#007AFF]" />
        </div>
      ) : null}
      {coords.length > 0 ? (
        <LeafletMap coords={coords} />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#F2F2F7] px-6 text-center dark:bg-[#2C2C2E]">
          <MapIcon className="h-10 w-10 text-[#C7C7CC] dark:text-[#48484A]" />
          {isGeocoding ? null : (
            <p className="text-sm font-medium text-[#8E8E93] dark:text-[#98989D]">
              No map location for this block yet.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
