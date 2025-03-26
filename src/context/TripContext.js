import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { cacheTrip, getCachedTrip, cacheUserTrips, getCachedUserTrips, checkOfflineStatus } from '../utils/cacheUtils';

// Create Trip Context
const TripContext = createContext();

// Custom hook to use the trip context
export const useTrips = () => {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTrips must be used within a TripProvider');
  }
  return context;
};

// Store information about problematic endpoints
const problematicEndpoints = {
  '/api/trips/userTrips': {
    failureCount: 0,
    lastFailure: null,
    recoveryTime: 60000, // Avoid this endpoint for 1 minute after consecutive failures
  }
};

// Function to check if an endpoint is problematic
const isEndpointProblematic = (url) => {
  const endpoint = problematicEndpoints[url];
  if (!endpoint) return false;
  
  // If we've had 3+ consecutive failures and it's been less than the recovery time
  if (endpoint.failureCount >= 3 && endpoint.lastFailure) {
    const timeSinceLastFailure = Date.now() - endpoint.lastFailure;
    if (timeSinceLastFailure < endpoint.recoveryTime) {
      console.warn(`Avoiding problematic endpoint ${url} for ${Math.round((endpoint.recoveryTime - timeSinceLastFailure)/1000)}s more`);
      return true;
    } else {
      // Reset failure count if recovery time has passed
      endpoint.failureCount = 0;
      endpoint.lastFailure = null;
    }
  }
  
  return false;
};

// Function to mark an endpoint as problematic
const markEndpointAsProblematic = (url) => {
  if (problematicEndpoints[url]) {
    problematicEndpoints[url].failureCount += 1;
    problematicEndpoints[url].lastFailure = Date.now();
    console.warn(`Marked ${url} as problematic (failures: ${problematicEndpoints[url].failureCount})`);
  }
};

// Add this function to reset problematic endpoints
const resetProblematicEndpoints = () => {
  Object.keys(problematicEndpoints).forEach(endpoint => {
    problematicEndpoints[endpoint].failureCount = 0;
    problematicEndpoints[endpoint].lastFailure = null;
  });
  console.log('Reset all problematic endpoints tracking');
};

// Trip Provider Component
export const TripProvider = ({ children }) => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [offlineMode, setOfflineMode] = useState(checkOfflineStatus());

  // Function to trigger a refresh of trips
  const refreshTrips = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Function to toggle offline mode
  const toggleOfflineMode = useCallback((mode) => {
    if (mode === undefined) {
      setOfflineMode(prev => !prev);
    } else {
      setOfflineMode(!!mode);
    }
    console.log(`Offline mode ${mode === undefined ? 'toggled' : 'set to ' + !!mode}`);
  }, []);

  // Fetch all trips the user has access to
  useEffect(() => {
    let isMounted = true;
    
    const fetchTrips = async () => {
      // Skip fetching if we're in offline mode
      if (offlineMode) {
        const cachedData = getCachedUserTrips();
        if (cachedData && cachedData.trips) {
          console.log('Using cached trips in offline mode', cachedData);
          setTrips(cachedData.trips);
        }
        return;
      }

      // Check if userTrips endpoint is currently problematic
      if (isEndpointProblematic('/api/trips/userTrips')) {
        console.log('Using cached trips due to problematic endpoint');
        const cachedData = getCachedUserTrips();
        if (cachedData && cachedData.trips) {
          setTrips(cachedData.trips);
          setError(`Using cached trips - API endpoint is temporarily unavailable`);
        } else {
          setTrips([]);
          setError(`API endpoint is temporarily unavailable and no cached data exists`);
        }
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      // A unique ID for this particular fetch operation
      const fetchId = `fetch-trips-${Date.now()}`;

      try {
        // Check token exists
        const token = localStorage.getItem('token');
        if (!token) {
          if (isMounted) {
            setError('Authentication required. Please log in.');
            setLoading(false);
          }
          return;
        }

        const start = Date.now();
        
        // Use the new X-Request-ID header to track this request
        const response = await axios.get('/api/trips/userTrips', {
          timeout: 8000, // 8 second timeout
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'X-Request-ID': fetchId,
            'X-Fetch-Operation': 'userTrips'
          }
        });
        
        // Reset problematic status on success
        if (problematicEndpoints['/api/trips/userTrips']) {
          problematicEndpoints['/api/trips/userTrips'].failureCount = 0;
          problematicEndpoints['/api/trips/userTrips'].lastFailure = null;
        }
        
        const duration = Date.now() - start;
        
        if (isMounted) {
          if (response.data && response.data.trips) {
            setTrips(response.data.trips);
            // Cache trips for offline use
            cacheUserTrips(response.data.trips);
          } else {
            setTrips([]);
          }
          setLoading(false);
        }
      } catch (err) {
        // Add specific logging for timeout errors
        if (err.code === 'ECONNABORTED') {
          console.error('Timeout error fetching trips:', err.message);
          markEndpointAsProblematic('/api/trips/userTrips');
        } else if (err.name === 'AbortError' || err.message === 'canceled') {
          console.error('Request was aborted:', err.message);
          markEndpointAsProblematic('/api/trips/userTrips');
        } else {
          console.error('Error fetching trips:', err);
        }
        
        // If canceled, don't update state
        if (axios.isCancel(err)) {
          console.log('Trips fetch was canceled');
          return;
        }
        
        if (isMounted) {
          setError(`Failed to load trips: ${err.message}`);
          setLoading(false);

          // Try to load from cache if network error or timeout
          if (err.message === 'Network Error' || err.code === 'ECONNABORTED' || 
              err.name === 'AbortError' || err.message === 'canceled') {
            console.log('Network error or timeout, trying to load trips from cache');
            const cachedData = getCachedUserTrips();
            if (cachedData && cachedData.trips) {
              console.log('Using cached trips due to network error', cachedData);
              setTrips(cachedData.trips);
              setError(`Using cached trips from ${cachedData.cacheAge.hours} hours ago (network unavailable)`);
            }
          }
        }
      }
    };

    fetchTrips();

    // Listen for online/offline changes
    const handleOnline = () => {
      console.log('Device is online, you can refresh to get fresh data');
      if (isMounted && offlineMode === true) {
        // Only auto-refresh if we were in forced offline mode
        setOfflineMode(false);
        refreshTrips();
      }
    };

    const handleOffline = () => {
      console.log('Device is offline, using cached data');
      if (isMounted) {
        setOfflineMode(true);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      isMounted = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshTrigger, offlineMode]);

  // Get a trip by ID - first from state, with option to force refresh
  const getTripById = useCallback((id) => {
    if (!id) return null;
    return trips.find(trip => trip._id === id || trip.id === id) || null;
  }, [trips]);

  // Function to fetch trip by ID
  const fetchTripById = async (tripId, options = {}) => {
    const { signal, cancelToken } = options;
    console.log(`=== fetchTripById INTERNAL START for ${tripId} ===`);
    
    // Skip fetching if we're in offline mode
    if (offlineMode) {
      console.log(`Offline mode active, checking cache for trip ${tripId}`);
      const cachedTrip = getCachedTrip(tripId);
      if (cachedTrip) {
        console.log(`Using cached trip ${tripId} in offline mode`);
        return cachedTrip;
      }
      console.log(`No cached data available for trip ${tripId} in offline mode`);
      throw new Error('Trip not available in offline mode');
    }

    // Check auth token first to avoid unnecessary requests
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token available for API request');
      throw new Error('Authentication required');
    }

    // Check if the specific trip endpoint is problematic
    const tripEndpoint = `/api/trips/${tripId}`;
    if (isEndpointProblematic(tripEndpoint)) {
      console.warn(`Bypassing problematic endpoint ${tripEndpoint}`);
      const cachedTrip = getCachedTrip(tripId);
      if (cachedTrip) {
        return {
          ...cachedTrip, 
          _fromCache: true,
          _fetchError: "API endpoint temporarily unavailable"
        };
      }
      throw new Error('API endpoint is temporarily unavailable and no cached data exists');
    }

    // Create our own abort controller if none provided
    const localAbortController = new AbortController();
    const effectiveSignal = signal || localAbortController.signal;
    
    // Set a hard timeout for this request
    const hardTimeoutId = setTimeout(() => {
      console.warn(`Hard timeout (10s) reached for trip ${tripId} request, aborting`);
      localAbortController.abort('Timeout');
      markEndpointAsProblematic(tripEndpoint);
    }, 10000);

    try {
      console.log(`Starting actual API fetch for trip ${tripId} (with 8s timeout)`);
      console.log(`Auth token present: ${!!token}, token length: ${token?.length || 0}`);
      
      const startTime = Date.now();
      
      // Add diagnostic timeout to check status after 5 seconds
      const diagnosticTimeoutId = setTimeout(() => {
        console.log(`API request for trip ${tripId} still pending after 5s`);
        console.log('Currently active requests:', window.activeRequests || {});
      }, 5000);
      
      // Add a unique request ID for tracking
      const requestId = `trip-${tripId}-${Date.now()}`;
      console.log(`Request ID for tracking: ${requestId}`);
      
      const response = await axios.get(`/api/trips/${tripId}`, {
        signal: effectiveSignal,
        cancelToken: cancelToken,
        timeout: 8000,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'X-Request-ID': requestId
        }
      });
      
      // Clear timeouts since request completed
      clearTimeout(hardTimeoutId);
      clearTimeout(diagnosticTimeoutId);
      
      const duration = Date.now() - startTime;
      console.log(`Fetched trip ${tripId} in ${duration}ms`);
      
      // Reset problematic status on success
      if (problematicEndpoints[tripEndpoint]) {
        problematicEndpoints[tripEndpoint] = {
          failureCount: 0,
          lastFailure: null,
          recoveryTime: 60000
        };
      }
      
      const trip = response.data;
      
      // Update cache
      cacheTrip(trip);
      
      console.log(`=== fetchTripById INTERNAL END for ${tripId} (success) ===`);
      return trip;
    } catch (err) {
      // Clear timeouts
      clearTimeout(hardTimeoutId);
      
      console.error(`Error fetching trip ${tripId}:`, err);
      console.log(`Error type: ${err.name}, message: ${err.message}, code: ${err.code}`);
      
      // Track failures for this specific endpoint
      markEndpointAsProblematic(tripEndpoint);
      
      // Log additional diagnostic info
      console.log('Currently active requests after error:', window.activeRequests || {});
      
      // Try to use cached data as fallback
      const cachedTrip = getCachedTrip(tripId);
      if (cachedTrip) {
        console.log(`Using cached data for trip ${tripId} due to fetch error`);
        console.log(`=== fetchTripById INTERNAL END for ${tripId} (fallback to cache) ===`);
        return {
          ...cachedTrip, 
          _fromCache: true,
          _fetchError: err.message
        };
      }
      
      console.log(`=== fetchTripById INTERNAL END for ${tripId} (error) ===`);
      throw err;
    }
  };

  // Wrap fetchTripById in a useCallback with compatibility interface
  const fetchTripByIdCompat = useCallback(async (tripId, options = {}) => {
    const { force = false, useCache = true, signal, cancelToken } = options;
    
    try {
      console.log(`=== TripContext.fetchTripById START for ${tripId} ===`);
      console.log('  Options:', { force, useCache, hasSignal: !!signal, hasCancelToken: !!cancelToken });
      
      if (!tripId) {
        throw new Error("No trip ID provided");
      }
      
      console.log(`Fetching trip ${tripId} [force=${force}, useCache=${useCache}, offlineMode=${offlineMode}]`);
      
      // 1. Check local state first if not forcing refresh
      if (!force) {
        const localTrip = getTripById(tripId);
        if (localTrip) {
          console.log(`Trip ${tripId} found in local state, returning immediately`);
          return { success: true, trip: localTrip, source: 'context' };
        }
        console.log(`Trip ${tripId} not found in local state, continuing with fetch`);
      }
      
      // 2. Use fetchTripById for actual fetching
      console.log(`Making actual API call for trip ${tripId}`);
      const startTime = Date.now();
      
      const trip = await fetchTripById(tripId, { 
        signal, 
        cancelToken
      });
      
      const duration = Date.now() - startTime;
      console.log(`API call for trip ${tripId} completed in ${duration}ms`);
      
      // If trip has _fromCache flag, it's a fallback
      if (trip._fromCache) {
        console.log(`Using cached version of trip ${tripId} due to: ${trip._fetchError}`);
        return { 
          success: true, 
          trip, 
          source: 'manual-cache-fallback',
          warning: trip._fetchError || 'Using cached data as fallback'
        };
      }
      
      console.log(`Successfully fetched fresh data for trip ${tripId}`);
      return { success: true, trip, source: 'direct' };
    } catch (err) {
      console.error(`Error in fetchTripByIdCompat for ${tripId}:`, err);
      return { 
        success: false, 
        error: err.message, 
        source: null
      };
    } finally {
      console.log(`=== TripContext.fetchTripById END for ${tripId} ===`);
    }
  }, [getTripById, offlineMode, fetchTripById]);

  // Value to be provided by the context
  const value = {
    trips,
    loading,
    error,
    refreshTrips,
    refreshTrigger,
    getTripById,
    fetchTripById: fetchTripByIdCompat,
    toggleOfflineMode,
    offlineMode,
    loadingTimeoutMs: 10000,
    resetProblematicEndpoints,
    isEndpointProblematic
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}; 