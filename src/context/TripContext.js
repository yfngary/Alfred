import React, { createContext, useContext, useState, useCallback } from 'react';

const TripContext = createContext();

export const TripProvider = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshTrips = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <TripContext.Provider value={{ refreshTrips, refreshTrigger }}>
      {children}
    </TripContext.Provider>
  );
};

export const useTrips = () => {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTrips must be used within a TripProvider');
  }
  return context;
}; 