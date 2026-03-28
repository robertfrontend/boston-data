'use client';

import React from 'react';
import { Search, MapPin, Clock } from 'lucide-react';

export const OnboardingGrid: React.FC = () => {
  const items = [
    { icon: Search, title: "Search", color: "#007AFF" },
    { icon: MapPin, title: "Locate", color: "#34C759" },
    { icon: Clock, title: "Alerts", color: "#FF9500" }
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3 pt-4">
      {items.map((item, i) => (
        <div key={i} className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl text-center space-y-3 shadow-sm hover:shadow-md transition-all border border-black/5 dark:border-white/5">
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto" 
            style={{ backgroundColor: `${item.color}15`, color: item.color }}
          >
            <item.icon className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-sm dark:text-white">{item.title}</h4>
        </div>
      ))}
    </div>
  );
};
