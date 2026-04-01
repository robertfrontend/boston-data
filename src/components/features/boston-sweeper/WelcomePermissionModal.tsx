'use client';

import React from 'react';
import { MapPin, ShieldCheck } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface WelcomePermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export const WelcomePermissionModal: React.FC<WelcomePermissionModalProps> = ({
  isOpen,
  onClose,
  onAccept,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Location Access">
      <div className="py-4 text-center space-y-6 transition-colors">
        <div className="w-20 h-20 bg-[#007AFF]/10 rounded-3xl flex items-center justify-center mx-auto">
          <MapPin className="w-10 h-10 text-[#007AFF]" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-black dark:text-white px-4 transition-colors">Find Schedules Near You</h2>
          <p className="text-[#8E8E93] dark:text-[#98989D] font-medium px-6 leading-relaxed transition-colors">
            Allow Boston Sweeper to access your location to automatically show street cleaning schedules for your current block.
          </p>
        </div>

        <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-2xl p-4 flex items-start gap-3 text-left mx-2 transition-colors border border-black/5 dark:border-white/5">
          <ShieldCheck className="w-5 h-5 text-[#34C759] shrink-0 mt-0.5" />
          <p className="text-xs text-[#8E8E93] dark:text-[#98989D] font-medium transition-colors">
            Your location data is only used to find nearby streets and is never stored or shared with third parties.
          </p>
        </div>

        <div className="flex flex-col gap-3 px-2">
          <button
            onClick={onAccept}
            className="w-full py-4 bg-[#007AFF] text-white rounded-2xl font-bold text-lg hover:bg-[#0062CC] transition-all shadow-lg shadow-[#007AFF]/20"
          >
            Allow Location Access
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 text-[#8E8E93] dark:text-[#98989D] font-bold text-sm hover:text-black dark:hover:text-white transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </Modal>
  );
};
