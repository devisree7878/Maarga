import React from 'react';
import Header from '../components/layout/Header';
import CalendarGrid from '../components/calendar/CalendarGrid';

export default function DaysPage() {
  return (
    <div>
      <Header title="Plan" subtitle="Every day of your plan, at a glance" />
      <div className="px-4 md:px-8 py-6 pb-24 md:pb-10">
        <CalendarGrid />
      </div>
    </div>
  );
}
