import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
  TextField,
  Divider,
} from "@mui/material";
import { CheckCircle, Error as ErrorIcon, Login } from "@mui/icons-material";

// Helper function to format dates
const formatDate = (dateString) => {
  const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

const JoinTripPage = () => {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tripDetails, setTripDetails] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [joinSuccess, setJoinSuccess] = useState(false);
  
  // Check authentication status and trip details on component mount
  useEffect(() => {
    const checkAuthAndTripDetails = async () => {
      try {
        // Try to get current user (will fail if not logged in)
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const userResponse = await axios.get("/api/users/profile");
            if (userResponse.data) {
              setIsLoggedIn(true);
            }
          } catch (authError) {
            // Token is invalid or expired
            localStorage.removeItem('token');
            setIsLoggedIn(false);
          }
        } else {
          // No token found
          setIsLoggedIn(false);
        }
        
        // Check trip details regardless of auth status
        const tripResponse = await axios.get(`/api/trips/details/${inviteCode}`);
        setTripDetails(tripResponse.data);
      } catch (err) {
        console.error("Error checking trip details:", err);
        setError(err.response?.data?.error || "Invalid invitation or expired link");
      } finally {
        setLoading(false);
      }
    };
    
    checkAuthAndTripDetails();
  }, [inviteCode]);
  
  // Handle user login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.post("/api/auth/login", credentials);
      
      // Set token in localStorage or handle via auth context
      localStorage.setItem("token", response.data.token);
      
      // Set axios default header for future requests
      axios.defaults.headers.common["Authorization"] = `Bearer ${response.data.token}`;
      
      setIsLoggedIn(true);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };
  
  // Handle trip join after login
  const handleJoinTrip = async () => {
    try {
      setLoading(true);
      await axios.post(`/api/trips/join/${inviteCode}`);
      setJoinSuccess(true);
      
      // After 2 seconds, redirect to the trip page
      setTimeout(() => {
        navigate(`/trips/${tripDetails.id}`);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to join trip");
    } finally {
      setLoading(false);
    }
  };
  
  // Handle register and redirect to register page with invite code in URL
  const handleRegister = () => {
    navigate(`/register?invite=${inviteCode}`);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 3, maxWidth: "600px", mx: "auto", mt: 8 }}>
        <Paper sx={{ p: 4, borderRadius: 2, textAlign: "center" }}>
          <ErrorIcon color="error" sx={{ fontSize: 64, mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Invitation Error
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {error}
          </Typography>
          <Button variant="contained" onClick={() => navigate("/")}>
            Go to Homepage
          </Button>
        </Paper>
      </Box>
    );
  }
  
  if (joinSuccess) {
    return (
      <Box sx={{ p: 3, maxWidth: "600px", mx: "auto", mt: 8 }}>
        <Paper sx={{ p: 4, borderRadius: 2, textAlign: "center" }}>
          <CheckCircle color="success" sx={{ fontSize: 64, mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Successfully Joined Trip!
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            You now have access to "{tripDetails.name}". Redirecting to trip page...
          </Typography>
          <CircularProgress size={24} sx={{ mt: 2 }} />
        </Paper>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3, maxWidth: "600px", mx: "auto", mt: 8 }}>
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Join Trip
        </Typography>
        
        {tripDetails && (
          <Box sx={{ mb: 4, textAlign: "center" }}>
            <Typography variant="h5" color="primary.main" gutterBottom>
              {tripDetails.name}
            </Typography>
            {tripDetails.dates && (
              <Typography variant="subtitle1" color="text.secondary">
                {formatDate(tripDetails.dates.start)} - {formatDate(tripDetails.dates.end)}
              </Typography>
            )}
            <Typography variant="body1" sx={{ mt: 2 }}>
              You've been invited to join this trip by {tripDetails.organizer?.name || "the organizer"}.
            </Typography>
          </Box>
        )}
        
        <Divider sx={{ my: 3 }} />
        
        {isLoggedIn ? (
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body1" paragraph>
              You're logged in and ready to join this trip.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<Login />}
              onClick={handleJoinTrip}
              disabled={loading}
              fullWidth
            >
              {loading ? <CircularProgress size={24} /> : "Join Trip"}
            </Button>
          </Box>
        ) : (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              You need to log in or create an account to join this trip.
            </Alert>
            
            <form onSubmit={handleLogin}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                margin="normal"
                value={credentials.email}
                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                required
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                margin="normal"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                required
              />
              
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 3 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : "Log In & Join"}
              </Button>
            </form>
            
            <Box sx={{ mt: 3, textAlign: "center" }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Don't have an account?
              </Typography>
              <Button 
                variant="outlined" 
                onClick={handleRegister}
                fullWidth
              >
                Sign Up
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default JoinTripPage; 