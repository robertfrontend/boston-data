'use client'

import { ChevronRight, MapPin } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'

interface LocationModalProps {
  isOpen: boolean
  onClose: () => void
  nearbyStreets: string[]
  onSelectStreet: (name: string) => void
  isLoading: boolean
  error?: string | null
}

export function LocationModal({
  isOpen,
  onClose,
  nearbyStreets,
  onSelectStreet,
  isLoading,
  error,
}: LocationModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Streets Near You">
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3 py-10 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#007AFF]/30 border-t-[#007AFF]" />
            <p className="font-medium text-[#8E8E93]">Finding streets near you...</p>
          </div>
        ) : nearbyStreets.length > 0 ? (
          <div className="divide-y divide-[#F2F2F7] overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition-colors dark:divide-[#3A3A3C] dark:border-white/5 dark:bg-[#2C2C2E]">
            {nearbyStreets.map((street) => (
              <button
                key={street}
                onClick={() => {
                  onSelectStreet(street)
                  onClose()
                }}
                className="group flex w-full items-center justify-between p-4 transition-all hover:bg-[#F2F2F7] dark:hover:bg-[#3A3A3C]"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#34C759]/10">
                    <MapPin className="h-4 w-4 text-[#34C759]" />
                  </div>
                  <span className="font-bold text-[#1C1C1E] dark:text-white">{street}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-[#C7C7CC] transition-colors group-hover:text-[#007AFF]" />
              </button>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center">
            <p className="font-medium text-[#8E8E93]">
              {error ?? 'No nearby streets found. Try searching by name.'}
            </p>
          </div>
        )}

        <p className="px-4 text-center text-[11px] leading-relaxed text-[#8E8E93]">
          Nearby streets come from your browser location and OpenStreetMap. Sweeping rules still come from the City of Boston schedule.
        </p>
      </div>
    </Modal>
  )
}
