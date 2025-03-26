// AuthContext.js
// This file serves as a compatibility layer for components expecting AuthContext
// but the app is actually using UserContext for authentication

import { useUser } from './UserContext';

// Re-export useUser as useAuth for compatibility
export const useAuth = useUser;

// Export other potential auth-related functions and constants
export default {
  useAuth
}; 