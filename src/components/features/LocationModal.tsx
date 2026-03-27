'use client';

import React from 'react';
import { MapPin, ChevronRight } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  nearbyStreets: string[];
  onSelectStreet: (name: string) => void;
  isLoading: boolean;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  nearbyStreets,
  onSelectStreet,
  isLoading,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Streets Near You">
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-10 text-center space-y-3">
            <div className="inline-block w-8 h-8 border-4 border-[#007AFF]/30 border-t-[#007AFF] rounded-full animate-spin"></div>
            <p className="text-[#8E8E93] font-medium">Detecting your location...</p>
          </div>
        ) : nearbyStreets.length > 0 ? (
          <div className="bg-white rounded-2xl overflow-hidden divide-y divide-[#F2F2F7] shadow-sm">
            {nearbyStreets.map((street, index) => (
              <button
                key={index}
                onClick={() => {
                  onSelectStreet(street);
                  onClose();
                }}
                className="w-full p-4 flex items-center justify-between hover:bg-[#F2F2F7] transition-all group"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-full bg-[#34C759]/10 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-[#34C759]" />
                  </div>
                  <span className="font-bold text-[#1C1C1E]">{street}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-[#C7C7CC] group-hover:text-[#007AFF] transition-colors" />
              </button>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center">
            <p className="text-[#8E8E93] font-medium">No nearby streets found.</p>
          </div>
        )}
        
        <p className="text-[11px] text-[#8E8E93] text-center px-4 leading-relaxed">
          The accuracy of nearby streets depends on your GPS signal and Google Maps data.
        </p>
      </div>
    </Modal>
  );
};
