import axios from 'axios';

// Track active requests and their abort controllers
window.activeRequests = window.activeRequests || {};
const requestAbortControllers = {};

// Set default base URL for all axios requests
axios.defaults.baseURL = 'http://localhost:5001';

// Set a default timeout for all requests (5 seconds - less than component timeout)
axios.defaults.timeout = 5000;

// Add a request interceptor to add the token to all requests
axios.interceptors.request.use(
  (config) => {
    // Generate a request ID if not already present
    const requestId = config.headers['X-Request-ID'] || `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    
    // Store the full URL for better debugging
    const fullUrl = (config.baseURL || '') + config.url;
    
    // Create and store an abort controller for this request
    const controller = new AbortController();
    
    // Only use our signal if one isn't already provided
    if (!config.signal) {
      config.signal = controller.signal;
    }
    
    // Store the controller for later use
    requestAbortControllers[requestId] = controller;
    
    // Track the request with more details
    window.activeRequests[requestId] = {
      method: config.method,
      url: fullUrl,
      startTime: Date.now(),
      status: 'pending',
      abortController: controller
    };
    
    // Add request ID to config for later reference
    config.headers['X-Request-ID'] = requestId;
    config.requestId = requestId; // Store on config object too for easier reference
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Axios request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Track response received
axios.interceptors.response.use(
  response => {
    // Get the request ID from headers
    const requestId = response.config.headers['X-Request-ID'] || response.config.requestId;
    const fullUrl = (response.config.baseURL || '') + response.config.url;
    
    if (requestId && window.activeRequests[requestId]) {
      const startTime = window.activeRequests[requestId].startTime;
      const duration = Date.now() - startTime;
    
      // Remove from tracking
      delete window.activeRequests[requestId];
      
      // Clean up abort controller
      if (requestAbortControllers[requestId]) {
        delete requestAbortControllers[requestId];
      }
    } else {
    }
    
    // Periodically log active requests for debugging
    const activeCount = Object.keys(window.activeRequests || {}).length;
    if (activeCount > 0 || Math.random() < 0.1) {
    }
    
    return response;
  },
  error => {
    // Get request info
    if (error.config) {
      const requestId = error.config.headers['X-Request-ID'] || error.config.requestId;
      const fullUrl = (error.config.baseURL || '') + error.config.url;
      
      if (requestId && window.activeRequests[requestId]) {
        const startTime = window.activeRequests[requestId].startTime;
        const duration = Date.now() - startTime;
        
        // Remove from tracking
        delete window.activeRequests[requestId];
        
        // Clean up abort controller
        if (requestAbortControllers[requestId]) {
          delete requestAbortControllers[requestId];
        }
      } else {
        console.warn(`Error for untracked request: ${fullUrl}`, error);
      }
    } else {
      console.error('Axios error without config:', error);
    }
    
    return Promise.reject(error);
  }
);

// Add a debugging helper
window.debugAxiosRequests = () => {
  // Return a copy of the active requests with additional diagnostic info
  const result = {...window.activeRequests};
  
  // Add current time information to each request for age calculation
  const now = Date.now();
  Object.keys(result).forEach(key => {
    if (result[key].startTime) {
      result[key].pendingFor = now - result[key].startTime + 'ms';
    }
  });
  
  return result;
};

// Add a cancel function to abort all requests
window.cancelAllRequests = () => {
  const requestIds = Object.keys(window.activeRequests);
  let cancelledCount = 0;
  
  console.log(`Attempting to cancel ${requestIds.length} requests`);
  
  requestIds.forEach(id => {
    try {
      const request = window.activeRequests[id];
      console.log(`Cancelling request: ${request?.method} ${request?.url} (started ${Date.now() - request?.startTime}ms ago)`);
      
      // Try to abort the request
      if (requestAbortControllers[id]) {
        console.log(`Aborting request ${id} via AbortController`);
        requestAbortControllers[id].abort();
        cancelledCount++;
      }
      
      // Mark as cancelled in our tracking
      if (window.activeRequests[id]) {
        window.activeRequests[id].status = 'cancelled';
        window.activeRequests[id].cancelTime = Date.now();
      }
      
      // Force cleanup of stale requests after 1 second
      setTimeout(() => {
        if (window.activeRequests[id]) {
          console.log(`Forced cleanup of request ${id} after cancel`);
          delete window.activeRequests[id];
          delete requestAbortControllers[id];
        }
      }, 1000);
    } catch (err) {
      console.error(`Error cancelling request ${id}:`, err);
    }
  });
  
  return cancelledCount;
};

export default axios; 