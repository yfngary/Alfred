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
import HomePage from "./components/HomePage"; // Assuming you have a home page
import LoginPage from "./components/LoginPage";
import CreateTrip from "./pages/createTrip";
import TripDashboard from "./components/TripDashboard";
import NavBar from "./components/NavBar";
import CreateExperience from "./components/CreateExperience";
import CreateGroupChat from "./components/CreateGroupChat";
import ProfilePage from "./components/ProfilePage";
import UserProfile from "./components/userProfilePage";
import NotificationPage from "./components/NotificationsPage";
import { useEffect } from "react";

// Function to check if the user is authenticated
const isAuthenticated = () => {
  return !!localStorage.getItem("token"); // Checks if the token exists
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

function Layout() {
  const location = useLocation();
  const hideNavOnRoutes = ["/login", "/register", "/"];
  const hideNav = hideNavOnRoutes.includes(location.pathname);

  // Manage NavBar open/closed state in Layout
  const [navOpen, setNavOpen] = React.useState(false);
  const expandedWidth = 160; // Further reduced width when the nav bar is expanded
  const collapsedWidth = 40; // Further reduced width when the nav bar is collapsed

  return (
    <>
      {/* Show NavBar only on routes where it's desired */}
      {!hideNav && <NavBar isOpen={navOpen} setIsOpen={setNavOpen} />}
      <div
        className="p-6"
        style={{
          marginLeft: hideNav ? 0 : navOpen ? expandedWidth : collapsedWidth,
          transition: "margin-left 0.3s ease",
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
            <TripDashboard />
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
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegistrationForm />} />
          <Route path="/" element={<HomePage />} />
        </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;
