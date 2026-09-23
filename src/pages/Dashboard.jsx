import React from 'react';
import Header from '../components/layout/Header';
import Hero from '../components/dashboard/Hero';
import StatsOverview from '../components/dashboard/StatsOverview';
import CalendarGrid from '../components/calendar/CalendarGrid';

export default function Dashboard() {
  return (
    <div>
      <Header title="Dashboard" subtitle="Your personal growth command center" />
      <div className="px-4 md:px-8 py-6 space-y-6 pb-24 md:pb-10">
        <Hero />
        <StatsOverview />
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[rgb(var(--text))]">Plan Calendar</h2>
          </div>
          <CalendarGrid />
        </div>
      </div>
    </div>
  );
}
