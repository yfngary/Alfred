// src/App.js
import React from "react";
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
import { useEffect } from "react";
import TripCalendarView from "./components/TripCalendarView";
import { Box } from "@mui/material";
import JoinTrip from './components/JoinTrip';
import { TripProvider } from './context/TripContext';
import GuestManagement from './components/GuestManagement';
import LodgingManagement from './components/LodgingManagement';

const isAuthenticated = () => {
  const token = localStorage.getItem("token");
  
  if (!token) {
    return false;
  }
  
  try {
    const parts = token.split('.');
    
    if (parts.length !== 3) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return false;
    }
    
    const payload = JSON.parse(atob(parts[1]));
    
    if (!payload.exp) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return false;
    }
    
    const expiry = payload.exp * 1000;
    const now = Date.now();
    
    if (now >= expiry) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return false;
    }
    
    return true;
  } catch (error) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return false;
  }
};

const ProtectedRoute = ({ children }) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const location = useLocation();
  
  React.useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

function Layout() {
  const location = useLocation();
  const hideNavOnRoutes = ["/login", "/register"];
  const hideNav = hideNavOnRoutes.includes(location.pathname);
  const [navOpen, setNavOpen] = React.useState(false);
  const expandedWidth = 160;
  const collapsedWidth = 40;

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh',
      width: '100vw',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "#f5f5f5",
      overflow: 'hidden'
    }}>
      {!hideNav && <NavBar isOpen={navOpen} setIsOpen={setNavOpen} />}
      <Box
        component="main"
        sx={{
          flex: 1,
          marginLeft: hideNav ? 0 : navOpen ? `${expandedWidth}px` : `${collapsedWidth}px`,
          transition: "margin-left 0.3s ease",
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          position: "relative",
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#f5f5f5',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#888',
            borderRadius: '4px',
          }
        }}
      >
        <Routes>
          <Route
            path="/chat/:chatId"
            element={
              <ProtectedRoute>
                <CreateGroupChat />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/trips/:tripId" 
            element={
              <ProtectedRoute>
                <TripDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tripsCalendar/:tripId" 
            element={
              <ProtectedRoute>
                <TripCalendarView />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/profilePage"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/createTrip"
            element={
              <ProtectedRoute>
                <CreateTrip />
              </ProtectedRoute>
            }
          />
          <Route
            path="/createExperience/:tripId"
            element={
              <ProtectedRoute>
                <CreateExperience />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:userId"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications/"
            element={
              <ProtectedRoute>
                <NotificationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/join-trip"
            element={
              <ProtectedRoute>
                <JoinTrip />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trips/:tripId/guests"
            element={
              <ProtectedRoute>
                <GuestManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trips/:tripId/lodging"
            element={
              <ProtectedRoute>
                <LodgingManagement />
              </ProtectedRoute>
            }
          />
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegistrationForm />} />
          
          {/* Make Dashboard the default route */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <Router>
      <TripProvider>
        <Layout />
      </TripProvider>
    </Router>
  );
}

export default App;
