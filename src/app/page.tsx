'use client';

import React from 'react';
import { MapPin, Bus, Car, Utensils, ShieldCheck, Zap, Globe, ArrowRight, LayoutGrid } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Footer } from '@/components/layout/Footer';
import { ServiceCard } from '@/components/features/hub/ServiceCard';

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

export default function HubPage() {
  const scrollToServices = () => {
    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-[#000000] font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,Helvetica,Arial,sans-serif] text-black dark:text-white transition-colors duration-300">
      
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[60] bg-white/70 dark:bg-black/70 backdrop-blur-2xl border-b border-black/5 dark:border-white/5">
        <div className="max-w-lg mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center bg-[#007AFF] rounded-lg shadow-sm">
              <LayoutGrid className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight">Boston Hub</span>
          </div>
          <ThemeToggle />
        </div>
      </nav>

      <main className="max-w-lg mx-auto px-5 pt-28 space-y-16">
        
        {/* Hero Section */}
        <section className="text-center space-y-6 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="space-y-3">
            <div className="w-24 h-24 bg-[#007AFF] rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#007AFF]/20">
              <LayoutGrid className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1]">
              Everything <span className="text-[#007AFF]">Boston</span>.
            </h1>
            <p className="text-[#8E8E93] dark:text-[#98989D] text-lg md:text-xl font-medium max-w-[320px] mx-auto leading-snug transition-colors">
              Access real-time municipal data to navigate the city like a pro.
            </p>
          </div>
          
          <div className="pt-2">
            <button 
              onClick={scrollToServices}
              className="px-8 py-4 bg-[#007AFF] text-white rounded-2xl font-bold text-lg hover:bg-[#0062CC] active:scale-95 transition-all shadow-xl shadow-[#007AFF]/25 flex items-center gap-2 mx-auto"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* Value Proposition Grid */}
        <section className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
          <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl border border-black/5 dark:border-white/5 flex gap-4 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-[#34C759]/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-[#34C759]" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold">Avoid Penalties</h4>
              <p className="text-sm text-[#8E8E93] dark:text-[#98989D] font-medium leading-relaxed">
                Stay updated with street cleaning and parking rules to save money on tickets.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl border border-black/5 dark:border-white/5 flex gap-4 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-[#FF9500]/10 flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6 text-[#FF9500]" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold">Real-Time Data</h4>
              <p className="text-sm text-[#8E8E93] dark:text-[#98989D] font-medium leading-relaxed">
                Direct integration with official Boston Open Data APIs for 100% accuracy.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl border border-black/5 dark:border-white/5 flex gap-4 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-[#5856D6]/10 flex items-center justify-center shrink-0">
              <Globe className="w-6 h-6 text-[#5856D6]" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold">One Platform</h4>
              <p className="text-sm text-[#8E8E93] dark:text-[#98989D] font-medium leading-relaxed">
                All essential city services consolidated into a single, beautiful dashboard.
              </p>
            </div>
          </div>
        </section>

        {/* Services Hub */}
        <section id="services" className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-extrabold tracking-tight">Available Services</h2>
            <p className="text-[#8E8E93] dark:text-[#98989D] font-medium text-sm">Choose a tool to begin</p>
          </div>
          <div className="grid gap-4">
            {services.map((service) => (
              <ServiceCard key={service.id} {...service} />
            ))}
          </div>
        </section>

        {/* About Data Section */}
        <section className="bg-[#E3E3E8] dark:bg-[#1C1C1E] rounded-[2.5rem] p-8 text-center space-y-4 transition-colors border border-black/5 dark:border-white/5">
          <div className="w-12 h-12 bg-white dark:bg-[#2C2C2E] rounded-2xl flex items-center justify-center mx-auto shadow-sm transition-colors">
            <Globe className="w-6 h-6 text-[#007AFF]" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold">Powered by Analyze Boston</h3>
            <p className="text-[#8E8E93] dark:text-[#98989D] text-sm font-medium leading-relaxed transition-colors">
              We leverage official municipal data provided by the City of Boston's Open Data portal to provide residents with reliable, up-to-date information.
            </p>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
