/**
 * Client-side caching utilities to support offline mode
 */

// Cache keys
const CACHE_KEYS = {
  TRIP: (id) => `trip_${id}`,
  USER_TRIPS: 'user_trips',
  USER_PROFILE: 'user_profile'
};

// Cache trip data
export const cacheTrip = (trip) => {
  if (!trip || !trip.id) return false;
  
  try {
    const key = CACHE_KEYS.TRIP(trip.id);
    const data = {
      trip,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`Trip cached successfully: ${trip.id}`);
    return true;
  } catch (error) {
    console.error('Error caching trip:', error);
    return false;
  }
};

// Get cached trip by ID
export const getCachedTrip = (tripId) => {
  try {
    const key = CACHE_KEYS.TRIP(tripId);
    const cachedData = localStorage.getItem(key);
    
    if (!cachedData) return null;
    
    const data = JSON.parse(cachedData);
    const now = Date.now();
    const ageInHours = (now - data.timestamp) / (1000 * 60 * 60);
    
    // Add cache age information
    data.trip.cacheAge = {
      hours: ageInHours.toFixed(1),
      timestamp: new Date(data.timestamp).toISOString(),
      isStale: ageInHours > 24 // Consider cache stale after 24 hours
    };
    
    return data.trip;
  } catch (error) {
    console.error('Error retrieving cached trip:', error);
    return null;
  }
};

// Cache user trips
export const cacheUserTrips = (trips) => {
  if (!trips || !Array.isArray(trips)) return false;
  
  try {
    const data = {
      trips,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEYS.USER_TRIPS, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error caching user trips:', error);
    return false;
  }
};

// Get cached user trips
export const getCachedUserTrips = () => {
  try {
    const cachedData = localStorage.getItem(CACHE_KEYS.USER_TRIPS);
    
    if (!cachedData) return null;
    
    const data = JSON.parse(cachedData);
    const now = Date.now();
    const ageInHours = (now - data.timestamp) / (1000 * 60 * 60);
    
    // Add cache age information
    data.cacheAge = {
      hours: ageInHours.toFixed(1),
      timestamp: new Date(data.timestamp).toISOString(),
      isStale: ageInHours > 24 // Consider cache stale after 24 hours
    };
    
    return data;
  } catch (error) {
    console.error('Error retrieving cached user trips:', error);
    return null;
  }
};

// Get all cached trip IDs
export const getAllCachedTripIds = () => {
  try {
    const cachedIds = [];
    
    // Scan localStorage for trip cache entries
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('trip_')) {
        const tripId = key.replace('trip_', '');
        cachedIds.push(tripId);
      }
    }
    
    return cachedIds;
  } catch (error) {
    console.error('Error getting cached trip IDs:', error);
    return [];
  }
};

// Clear specific trip cache
export const clearTripCache = (tripId) => {
  try {
    const key = CACHE_KEYS.TRIP(tripId);
    localStorage.removeItem(key);
    console.log(`Trip cache cleared: ${tripId}`);
    return true;
  } catch (error) {
    console.error('Error clearing trip cache:', error);
    return false;
  }
};

// Clear all trip caches
export const clearAllTripCaches = () => {
  try {
    const tripKeys = [];
    
    // Find all trip cache keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('trip_')) {
        tripKeys.push(key);
      }
    }
    
    // Remove each cache
    tripKeys.forEach(key => localStorage.removeItem(key));
    
    console.log(`All trip caches cleared: ${tripKeys.length} items`);
    return tripKeys.length;
  } catch (error) {
    console.error('Error clearing all trip caches:', error);
    return 0;
  }
};

// Utility to check if we're in offline mode
export const checkOfflineStatus = () => {
  return !navigator.onLine;
}; 