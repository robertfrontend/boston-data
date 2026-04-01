import React from 'react';
import { MapPin, Bus, Car, Utensils, ShieldCheck, Zap, Globe, LayoutGrid } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Footer } from '@/components/layout/Footer';
import { ServiceCard } from '@/components/features/hub/ServiceCard';
import { HeroButton } from '@/components/features/hub/HeroButton';

const services = [
  {
    id: 'boston-sweeper',
    title: 'Boston Sweeper',
    description: 'Check real-time street cleaning schedules and parking rules to avoid tickets.',
    icon: MapPin,
    iconBg: 'bg-system-green/10',
    iconColor: 'text-system-green',
    href: '/boston-sweeper',
    tag: 'Live Data'
  },
  {
    id: 'food-inspections',
    title: 'Food Inspections',
    description: 'Search official health inspection records for any restaurant in Boston.',
    icon: Utensils,
    iconBg: 'bg-system-orange/10',
    iconColor: 'text-system-orange',
    href: '/food-inspections',
    tag: 'New'
  },
  {
    id: 'coming-soon-1',
    title: 'Transit Tracker',
    description: 'Real-time MBTA tracking and delays (Coming Soon).',
    icon: Bus,
    iconBg: 'bg-system-blue/10',
    iconColor: 'text-system-blue',
    href: '#',
    disabled: true
  },
  {
    id: 'coming-soon-2',
    title: 'Parking Meters',
    description: 'Find available metered parking spots and rates (Coming Soon).',
    icon: Car,
    iconBg: 'bg-system-indigo/10',
    iconColor: 'text-system-indigo',
    href: '#',
    disabled: true
  }
];

export default function HubPage() {
  return (
    <div className="min-h-screen bg-app-bg font-sans text-app-fg transition-colors duration-300">
      
      {/* Top Navigation */}
      <header className="fixed top-0 left-0 right-0 z-[60] bg-app-bg/70 backdrop-blur-2xl border-b border-app-border">
        <nav className="max-w-lg mx-auto px-5 h-16 flex items-center justify-between" aria-label="Main Navigation">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center bg-system-blue rounded-lg shadow-sm" aria-hidden="true">
              <LayoutGrid className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight">Boston Hub</span>
          </div>
          <ThemeToggle />
        </nav>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-28 space-y-16">
        
        {/* Hero Section */}
        <section className="text-center space-y-6 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="space-y-3">
            <div className="w-24 h-24 bg-system-blue rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-system-blue/20" aria-hidden="true">
              <LayoutGrid className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1]">
              Everything <span className="text-system-blue">Boston</span>.
            </h1>
            <p className="text-app-secondary-text text-lg md:text-xl font-medium max-w-[320px] mx-auto leading-snug transition-colors">
              Access real-time municipal data to navigate the city like a pro.
            </p>
          </div>
          
          <div className="pt-2">
            <HeroButton />
          </div>
        </section>

        {/* Value Proposition Section */}
        <section className="grid grid-cols-3 gap-2 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200" aria-labelledby="value-proposition">
          <h2 id="value-proposition" className="sr-only">Why use Boston Hub?</h2>
          
          <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white/50 dark:bg-white/5 border border-app-border">
            <div className="w-10 h-10 rounded-xl bg-system-green/10 flex items-center justify-center mb-2">
              <ShieldCheck className="w-5 h-5 text-system-green" aria-hidden="true" />
            </div>
            <h3 className="text-[13px] font-bold leading-tight mb-1">Avoid Fines</h3>
            <p className="text-[11px] text-app-secondary-text font-medium leading-tight">
              Real-time sweeping alerts
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white/50 dark:bg-white/5 border border-app-border">
            <div className="w-10 h-10 rounded-xl bg-system-orange/10 flex items-center justify-center mb-2">
              <Zap className="w-5 h-5 text-system-orange" aria-hidden="true" />
            </div>
            <h3 className="text-[13px] font-bold leading-tight mb-1">Live Data</h3>
            <p className="text-[11px] text-app-secondary-text font-medium leading-tight">
              100% official sources
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white/50 dark:bg-white/5 border border-app-border">
            <div className="w-10 h-10 rounded-xl bg-system-indigo/10 flex items-center justify-center mb-2">
              <Globe className="w-5 h-5 text-system-indigo" aria-hidden="true" />
            </div>
            <h3 className="text-[13px] font-bold leading-tight mb-1">One Hub</h3>
            <p className="text-[11px] text-app-secondary-text font-medium leading-tight">
              All city services in one
            </p>
          </div>
        </section>

        {/* Services Hub */}
        <section id="services" className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500" aria-labelledby="services-title">
          <div className="text-center space-y-1">
            <h2 id="services-title" className="text-2xl font-extrabold tracking-tight">Available Services</h2>
            <p className="text-app-secondary-text font-medium text-sm">Choose a tool to begin</p>
          </div>
          <div className="grid gap-4">
            {services.map((service) => (
              <ServiceCard key={service.id} {...service} />
            ))}
          </div>
        </section>

        {/* About Data Section */}
        <section className="bg-[#E3E3E8] dark:bg-app-card rounded-[2.5rem] p-8 text-center space-y-4 transition-colors border border-app-border" aria-labelledby="data-source-title">
          <div className="w-12 h-12 bg-white dark:bg-[#2C2C2E] rounded-2xl flex items-center justify-center mx-auto shadow-sm transition-colors" aria-hidden="true">
            <Globe className="w-6 h-6 text-system-blue" />
          </div>
          <div className="space-y-2">
            <h2 id="data-source-title" className="text-lg font-bold">Powered by Analyze Boston</h2>
            <p className="text-app-secondary-text text-sm font-medium leading-relaxed transition-colors">
              We leverage official municipal data provided by the City of Boston's Open Data portal to provide residents with reliable, up-to-date information.
            </p>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
