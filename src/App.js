// src/App.js
import React, { useState, useEffect } from "react";
import "./utils/axiosConfig";
import "./styles/global.css"; // Import global CSS
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
  Navigate,
} from "react-router-dom";
import RegistrationForm from "./components/RegistrationForm";
import LoginPage from "./components/LoginPage";
import CreateTrip from "./pages/createTrip";
import TripDashboard from "./components/TripDashboard";
import NavBar from "./components/NavBar";
import CreateExperience from "./components/CreateExperience";
import CreateGroupChat from "./components/CreateGroupChat";
import ProfilePage from "./components/ProfilePage";
import UserProfile from "./components/userProfilePage";
import NotificationPage from "./components/NotificationsPage";
import Dashboard from "./components/Dashboard"; // We'll create this
import TripCalendarView from "./components/TripCalendarView"; // Import the calendar view component
import { Box, ThemeProvider, createTheme, CircularProgress } from "@mui/material";
import JoinTrip from "./components/JoinTrip";
import JoinTripPage from "./pages/JoinTripPage";
import { TripProvider } from "./context/TripContext";
import GuestManagement from "./components/GuestManagement";
import LodgingManagement from "./components/LodgingManagement";
import { UserProvider, useUser } from "./context/UserContext";
import VerifyEmailPage from "./components/VerifyEmailPage";
import ResetPasswordPage from "./components/ResetPasswordPage";

// Create dark theme for Material UI
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4776E6',
    },
    secondary: {
      main: '#8E54E9',
    },
    background: {
      default: '#0f0c29',
      paper: 'rgba(0, 0, 0, 0.6)',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.8)',
    },
  },
  typography: {
    fontFamily: '"Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
        contained: {
          backgroundImage: 'linear-gradient(90deg, #4776E6 0%, #8E54E9 100%)',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
          '&:hover': {
            backgroundImage: 'linear-gradient(90deg, #8E54E9 0%, #4776E6 100%)',
            transform: 'translateY(-2px)',
            boxShadow: '0 10px 20px rgba(0, 0, 0, 0.3)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(10px)',
          borderRadius: 16,
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          borderRadius: 8,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: 'rgba(255, 255, 255, 0.3)',
          },
          '&.Mui-focused': {
            borderColor: 'rgba(255, 255, 255, 0.5)',
            boxShadow: '0 0 0 3px rgba(255, 255, 255, 0.1)',
          },
        },
      },
    },
  },
});

const ProtectedRoute = ({ children }) => {
  const { loading, isAuthenticated, user } = useUser();
  const location = useLocation();
  const [localLoading, setLocalLoading] = useState(true);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // If loading, show loading indicator
  if (loading && !loadingTimeout) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)"
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  // If we hit the timeout but we have a token, proceed anyway
  if (loadingTimeout) {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      return children;
    } else {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  }

  // If user is authenticated, render the children
  if (isAuthenticated) {
    return children;
  }
  
  // If not authenticated, check if there's a token in localStorage
  // This is a fallback in case the context state gets out of sync
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  
  if (token && storedUser) {
    // Force a full page refresh to re-initialize the auth context
    window.location.href = location.pathname;
    return <CircularProgress />;
  }
  
  // Not authenticated and no token, redirect to login
  return <Navigate to="/login" state={{ from: location }} replace />;
};

// Define widths for collapsed and expanded states
const collapsedWidth = "60px";
const expandedWidth = "200px";

function Layout() {
  const location = useLocation();
  const [navOpen, setNavOpen] = React.useState(true);
  const hideNav = location.pathname === "/login" || 
                  location.pathname === "/" || 
                  location.pathname.startsWith("/verify-email") || 
                  location.pathname.startsWith("/reset-password") || 
                  location.pathname === "/register"; // Hide for login, registration, verification and reset password

  // Define routes
  const routes = [
    {
      path: "/dashboard",
      element: (
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      ),
    },
    {
      path: "/join/:inviteCode",
      element: (
        <ProtectedRoute>
          <JoinTripPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/create-trip",
      element: (
        <ProtectedRoute>
          <CreateTrip />
        </ProtectedRoute>
      ),
    },
    {
      path: "/trips/:id",
      element: (
        <ProtectedRoute>
          <TripDashboard />
        </ProtectedRoute>
      ),
    },
    {
      path: "/trips/:id/create-experience",
      element: (
        <ProtectedRoute>
          <CreateExperience />
        </ProtectedRoute>
      ),
    },
    {
      path: "/trips/:tripId/calendar",
      element: (
        <ProtectedRoute>
          <Box>
            <TripCalendarView />
          </Box>
        </ProtectedRoute>
      ),
    },
    {
      path: "/trips/:id/guests",
      element: (
        <ProtectedRoute>
          <GuestManagement />
        </ProtectedRoute>
      ),
    },
    {
      path: "/trips/:id/lodging",
      element: (
        <ProtectedRoute>
          <LodgingManagement />
        </ProtectedRoute>
      ),
    },
    {
      path: "/trips/:id/chat",
      element: (
        <ProtectedRoute>
          <CreateGroupChat />
        </ProtectedRoute>
      ),
    },
    {
      path: "/profile",
      element: (
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/users/:id",
      element: (
        <ProtectedRoute>
          <UserProfile />
        </ProtectedRoute>
      ),
    },
    {
      path: "/login",
      element: <LoginPage />,
    },
    {
      path: "/register",
      element: <RegistrationForm />,
    },
    {
      path: "/",
      element: <LoginPage />,
    },
    {
      path: "/verify-email/:token",
      element: <VerifyEmailPage />,
    },
    {
      path: "/reset-password/:token",
      element: <ResetPasswordPage />,
    },
    {
      path: "/notifications",
      element: (
        <ProtectedRoute>
          <NotificationPage />
        </ProtectedRoute>
      ),
    },
    // Catch-all route - redirect to dashboard if authenticated or login if not
    {
      path: "*",
      element: (
        <ProtectedRoute>
          <Navigate to="/dashboard" replace />
        </ProtectedRoute>
      ),
    },
  ];

  const routeElements = (
    <Routes>
      {routes.map((route, index) => (
        <Route key={index} path={route.path} element={route.element} />
      ))}
    </Routes>
  );

  useEffect(() => {
    if (hideNav) {
      setNavOpen(false);
    } else {
      setNavOpen(true);
    }
  }, [hideNav]);

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        width: "100vw",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
        overflow: "hidden",
      }}
    >
      {!hideNav && <NavBar isOpen={navOpen} setIsOpen={setNavOpen} />}
      <Box
        component="main"
        sx={{
          flex: 1,
          marginLeft: hideNav
            ? 0
            : navOpen
            ? `${expandedWidth}px`
            : `${collapsedWidth}px`,
          transition: "margin-left 0.3s ease",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "auto",
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "rgba(0, 0, 0, 0.1)",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            borderRadius: "4px",
          },
        }}
      >
        {routeElements}
      </Box>
    </Box>
  );
}

function App() {
  return (
    <Router>
      <TripProvider>
        <UserProvider>
          <ThemeProvider theme={darkTheme}>
            <Layout />
          </ThemeProvider>
        </UserProvider>
      </TripProvider>
    </Router>
  );
}

export default App;
