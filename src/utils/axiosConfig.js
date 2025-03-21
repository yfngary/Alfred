import axios from 'axios';

// Set default base URL for all axios requests
axios.defaults.baseURL = 'http://localhost:5001';

// Add a request interceptor to add the token to all requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axios; 