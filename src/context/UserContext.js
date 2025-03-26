import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import React from "react";

// Create User Context with default values
const UserContext = createContext({
  user: null,
  setUser: () => {},
  isAuthenticated: false,
  loading: true,
  logout: () => {}
});

export const UserProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  // Track previous user for deep comparison
  const prevUserRef = useRef(null);
  // Track render count
  const renderCount = useRef(0);
  
  // Effect to initialize from localStorage, but only once
  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        try {
          // Validate token
          const parts = token.split(".");
          if (parts.length !== 3) {
            console.warn('Invalid token format in localStorage');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setLoading(false);
            return;
          }
          
          const payload = JSON.parse(atob(parts[1]));
          
          // Check if token is expired
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            console.warn('Token expired, logging out');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setLoading(false);
            return;
          }
          
          // Token is valid, set user
          const userData = JSON.parse(storedUser);
          setUserState(userData);
          setLoading(false);
        } catch (error) {
          console.error('Error validating token:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setLoading(false);
        }
      } else {
        console.log('No user or token in localStorage');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error initializing UserContext from localStorage:', error);
      setLoading(false);
    }
  }, []); // Empty dependency array - only run once on mount
  
  // Use useCallback to stabilize the setUser function reference
  const setUser = useCallback((newUser) => {
    renderCount.current++;
    
    if (!newUser) {
      // Null case - always update
      console.log("UserContext: Setting user to null");
      prevUserRef.current = null;
      setUserState(null);
      localStorage.removeItem('user'); // Also clear localStorage
      localStorage.removeItem('token');
      return;
    }
    
    // Check if new user is the same to prevent unnecessary updates
    const prevUser = prevUserRef.current;
    const newUserId = newUser.id || newUser._id;
    const prevUserId = prevUser ? (prevUser.id || prevUser._id) : null;
    
    if (prevUserId && newUserId && prevUserId === newUserId) {
      console.log("UserContext: Same user ID, skipping update");
      return;
    }
    
    // Update ref and state
    prevUserRef.current = newUser;
    
    // Use functional update pattern to avoid closures with stale state
    setUserState(() => newUser);
    
    // Also update localStorage
    try {
      localStorage.setItem('user', JSON.stringify(newUser));
    } catch (error) {
      console.error('Error storing user in localStorage:', error);
    }
  }, []); // No dependencies - never changes reference

  // Logout function
  const logout = useCallback(() => {
    console.log("UserContext: Logging out");
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUserState(null);
  }, []);

  // Enhanced check for authentication status that's more resilient
  const isAuthenticated = React.useMemo(() => {
    // First check context user state
    if (user) {
      const token = localStorage.getItem('token');
      return !!token;
    }
    
    // If no user in context, check localStorage as fallback
    // This helps when context state gets reset but localStorage still has valid data
    try {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (!token || !storedUser) {
        return false;
      }
      
      // Also verify token isn't expired
      const parts = token.split(".");
      if (parts.length !== 3) {
        console.log("UserContext: Invalid token format");
        return false;
      }
      
      const payload = JSON.parse(atob(parts[1]));
      
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        // Clean up expired token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return false;
      }
      
      // If there's a valid token and user in localStorage but not in context
      // update the context state
      if (!user) {
        try {
          const userData = JSON.parse(storedUser);
          setUserState(userData);
        } catch (parseError) {
          console.error("UserContext: Error parsing stored user", parseError);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('UserContext: Error checking authentication:', error);
      return false;
    }
  }, [user]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = React.useMemo(() => ({ 
    user, 
    setUser, 
    isAuthenticated, 
    loading,
    logout
  }), [user, setUser, isAuthenticated, loading, logout]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook for accessing User Context
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
