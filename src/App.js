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
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
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
            path="*"
            element={
              <ProtectedRoute>
                <Navigate to="/dashboard" replace />
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
