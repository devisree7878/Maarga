import React, { createContext, useContext, useState, useCallback } from 'react';

const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [selectedDay, setSelectedDay] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const openDay = useCallback((dayNumber) => setSelectedDay(dayNumber), []);
  const closeDay = useCallback(() => setSelectedDay(null), []);

  return (
    <UIContext.Provider value={{ selectedDay, openDay, closeDay, searchOpen, setSearchOpen }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
}
