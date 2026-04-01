'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, LucideIcon } from 'lucide-react';

interface ServiceCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  href: string;
  tag?: string;
  disabled?: boolean;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  title,
  description,
  icon: Icon,
  iconBg,
  iconColor,
  href,
  tag,
  disabled
}) => {
  return (
    <Link 
      href={href}
      className={`block bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl shadow-sm border border-black/5 dark:border-white/5 transition-all ${
        disabled 
          ? 'opacity-60 cursor-not-allowed' 
          : 'hover:shadow-md active:scale-[0.98] group'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center transition-colors ${iconBg}`}>
          <Icon className={`w-7 h-7 ${iconColor}`} />
        </div>
        <div className="flex-1 space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold dark:text-white">{title}</h3>
            {!disabled && (
              <ChevronRight className="w-5 h-5 text-[#C7C7CC] dark:text-[#48484A] group-hover:text-[#007AFF] transition-colors" />
            )}
          </div>
          <p className="text-sm text-[#8E8E93] dark:text-[#98989D] font-medium leading-relaxed">
            {description}
          </p>
          {tag && (
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-[#FF3B30]/10 text-[#FF3B30] text-[10px] font-bold uppercase tracking-wider">
              {tag}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};
