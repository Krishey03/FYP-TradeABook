import axios from "axios";

// Detect if we're using ngrok
const isNgrok = window.location.hostname.includes('ngrok') || 
                window.location.hostname.includes('localhost');

// Use ngrok URL if available, otherwise fallback to localhost
const getBaseURL = () => {
  // Check if we have a stored ngrok URL
  const storedNgrokUrl = localStorage.getItem('ngrokUrl');
  
  if (storedNgrokUrl) {
    return storedNgrokUrl;
  }
  
  // Default to localhost
  return 'http://localhost:5000';
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  // Add timeout to prevent hanging requests
  timeout: 10000
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Log request for debugging
  console.log(`Making request to: ${config.baseURL}${config.url}`);
  
  return config;
}, (error) => {
  console.error('Request error:', error);
  return Promise.reject(error);
});

// Response interceptor for better error handling
api.interceptors.response.use((response) => {
  return response;
}, (error) => {
  console.error('Response error:', error);
  
  // Handle blocked requests specifically
  if (error.code === 'ERR_NETWORK' || 
      error.message.includes('ERR_BLOCKED_BY_CLIENT') ||
      error.message.includes('Network Error')) {
    
    // Show user-friendly error for blocked requests
    const errorMessage = 'Request blocked by browser. Please disable ad blocker or Brave Shields for this site.';
    console.error(errorMessage);
    
    // You can show a toast notification here if you have a toast system
    if (window.showToast) {
      window.showToast(errorMessage, 'error');
    }
  }
  
  return Promise.reject(error);
});

// Function to update base URL (useful for ngrok)
export const updateBaseURL = (newURL) => {
  api.defaults.baseURL = newURL;
  localStorage.setItem('ngrokUrl', newURL);
  console.log('Updated base URL to:', newURL);
};

export default api;
