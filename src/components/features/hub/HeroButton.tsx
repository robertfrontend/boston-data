'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';

export function HeroButton() {
  const scrollToServices = () => {
    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <button 
      onClick={scrollToServices}
      className="px-8 py-4 bg-system-blue text-white rounded-2xl font-bold text-lg hover:bg-system-blue/90 active:scale-95 transition-all shadow-xl shadow-system-blue/25 flex items-center gap-2 mx-auto"
    >
      Get Started
      <ArrowRight className="w-5 h-5" />
    </button>
  );
}
