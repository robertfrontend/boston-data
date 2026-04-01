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
      aria-disabled={disabled}
      className={`block bg-app-card p-6 rounded-3xl shadow-sm border border-app-border transition-all ${
        disabled 
          ? 'opacity-60 cursor-not-allowed pointer-events-none' 
          : 'hover:shadow-md active:scale-[0.98] group'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center transition-colors ${iconBg}`}>
          <Icon className={`w-7 h-7 ${iconColor}`} aria-hidden="true" />
        </div>
        <div className="flex-1 space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">{title}</h3>
            {!disabled && (
              <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-system-blue transition-colors" aria-hidden="true" />
            )}
          </div>
          <p className="text-sm text-app-secondary-text font-medium leading-relaxed">
            {description}
          </p>
          {tag && (
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-system-red/10 text-system-red text-[10px] font-bold uppercase tracking-wider">
              {tag}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};
