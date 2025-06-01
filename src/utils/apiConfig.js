// Central API configuration
// Use relative URL if no environment variable is set - this ensures frontend and backend use the same domain
export const API_BASE_URL = process.env.REACT_APP_API_URL || '';

// Helper function for making API requests
export const apiRequest = async (endpoint, options = {}) => {
  // If API_BASE_URL is empty, the endpoint will be relative to the current domain
  const url = API_BASE_URL ? `${API_BASE_URL}${endpoint}` : endpoint;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  };

  // Add auth token if available
  const token = localStorage.getItem('token');
  if (token) {
    defaultOptions.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, defaultOptions);
    return response;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
};

// Helper for common API patterns
export const apiHelpers = {
  get: (endpoint, options = {}) => apiRequest(endpoint, { method: 'GET', ...options }),
  post: (endpoint, data, options = {}) => apiRequest(endpoint, { 
    method: 'POST', 
    body: JSON.stringify(data),
    ...options 
  }),
  put: (endpoint, data, options = {}) => apiRequest(endpoint, { 
    method: 'PUT', 
    body: JSON.stringify(data),
    ...options 
  }),
  delete: (endpoint, options = {}) => apiRequest(endpoint, { method: 'DELETE', ...options }),
}; 