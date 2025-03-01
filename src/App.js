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
import CreateTrip from "./components/CreateTrip";
import Dashboard from "./components/Dashboard";
import NavBar from "./components/NavBar";
import CreateExperience from "./components/CreateExperience";
import CreateGroupChat from "./components/CreateGroupChat";
import ProfilePage from "./components/ProfilePage";
import UserProfile from "./components/userProfilePage";
import NotificationPage from "./components/NotificationsPage";

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
  const hideNavOnRoutes = ["/login", "/register", "/"]; // Routes where NavBar should be hidden

  return (
    <>
      {!hideNavOnRoutes.includes(location.pathname) && <NavBar />}
      <div className="p-6">
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
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
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
