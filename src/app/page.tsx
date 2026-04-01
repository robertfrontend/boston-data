import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Map, MapPin, Bus, Car, Ticket, Navigation, ChevronRight, Utensils } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Footer } from '@/components/layout/Footer';

const services = [
  {
    id: 'boston-sweeper',
    title: 'Boston Sweeper',
    description: 'Check real-time street cleaning schedules and parking rules to avoid tickets.',
    icon: MapPin,
    iconBg: 'bg-[#34C759]/10 dark:bg-[#34C759]/20',
    iconColor: 'text-[#34C759]',
    href: '/boston-sweeper',
    tag: 'Live Data'
  },
  {
    id: 'food-inspections',
    title: 'Food Inspections',
    description: 'Search official health inspection records for any restaurant in Boston.',
    icon: Utensils,
    iconBg: 'bg-[#FF9500]/10 dark:bg-[#FF9500]/20',
    iconColor: 'text-[#FF9500]',
    href: '/food-inspections',
    tag: 'New'
  },
  {
    id: 'coming-soon-1',
    title: 'Transit Tracker',
    description: 'Real-time MBTA tracking and delays (Coming Soon).',
    icon: Bus,
    iconBg: 'bg-[#007AFF]/10 dark:bg-[#007AFF]/20',
    iconColor: 'text-[#007AFF]',
    href: '#',
    disabled: true
  },
  {
    id: 'coming-soon-2',
    title: 'Parking Meters',
    description: 'Find available metered parking spots and rates (Coming Soon).',
    icon: Car,
    iconBg: 'bg-[#5856D6]/10 dark:bg-[#5856D6]/20',
    iconColor: 'text-[#5856D6]',
    href: '#',
    disabled: true
  }
];

export default function Home() {
  return (
    <div className="min-h-screen font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,Helvetica,Arial,sans-serif] pb-24 transition-colors duration-300">
      <main className="max-w-lg mx-auto px-5 pt-12 space-y-10">
        
        {/* Header */}
        <header className="flex flex-col items-center text-center space-y-4 relative">
          <div className="absolute top-0 right-0">
            <ThemeToggle />
          </div>
          <div className="relative w-20 h-20 mx-auto opacity-90 rounded-3xl bg-white dark:bg-[#1C1C1E] shadow-sm border border-black/5 dark:border-white/5 flex items-center justify-center overflow-hidden p-2">
            <Image src="/new-logo.png" alt="Boston Hub" width={80} height={80} className="object-contain" priority />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight dark:text-white">Boston Services Hub</h1>
            <p className="text-[#8E8E93] dark:text-[#98989D] text-lg font-medium transition-colors max-w-[280px] mx-auto">
              Your one-stop gateway to Boston municipal tools.
            </p>
          </div>
        </header>

        {/* Services Grid */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-[#8E8E93] dark:text-[#98989D] uppercase tracking-widest px-2">
            Available Services
          </h2>
          <div className="grid gap-4">
            {services.map((service) => (
              <Link 
                key={service.id} 
                href={service.href}
                className={`block bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl shadow-sm border border-black/5 dark:border-white/5 transition-all ${
                  service.disabled 
                    ? 'opacity-60 cursor-not-allowed' 
                    : 'hover:shadow-md active:scale-[0.98] group'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center transition-colors ${service.iconBg}`}>
                    <service.icon className={`w-7 h-7 ${service.iconColor}`} />
                  </div>
                  <div className="flex-1 space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold dark:text-white">{service.title}</h3>
                      {!service.disabled && (
                        <ChevronRight className="w-5 h-5 text-[#C7C7CC] dark:text-[#48484A] group-hover:text-[#007AFF] transition-colors" />
                      )}
                    </div>
                    <p className="text-sm text-[#8E8E93] dark:text-[#98989D] font-medium leading-relaxed">
                      {service.description}
                    </p>
                    {service.tag && (
                      <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-[#FF3B30]/10 text-[#FF3B30] text-[10px] font-bold uppercase tracking-wider">
                        {service.tag}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}
