import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Button,
  Container
} from "@mui/material";
import { MarkEmailRead, ErrorOutline } from "@mui/icons-material";

const VerifyEmailPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Make a request to the verification endpoint
        const response = await fetch(`http://localhost:5001/api/auth/verify-email/${token}`);
        
        // If the server responds with a redirect (status 302/303/307), 
        // we'll be automatically redirected to the login page
        // Otherwise, we handle the response here
        if (response.ok) {
          setVerified(true);
          // After a delay, redirect to login
          setTimeout(() => {
            navigate("/login?verified=true");
          }, 3000);
        } else {
          const data = await response.json();
          setError(data.message || "Verification failed");
        }
      } catch (error) {
        console.error("Verification error:", error);
        setError("Failed to connect to the server. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
        {loading ? (
          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
            <CircularProgress size={60} />
            <Typography variant="h6">Verifying your email...</Typography>
          </Box>
        ) : verified ? (
          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
            <MarkEmailRead sx={{ fontSize: 60, color: "success.main" }} />
            <Typography variant="h5" color="success.main">Email Verified Successfully!</Typography>
            <Typography variant="body1">
              Your email has been verified. You will be redirected to the login page shortly.
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => navigate("/login?verified=true")}
              sx={{ mt: 2 }}
            >
              Go to Login
            </Button>
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
            <ErrorOutline sx={{ fontSize: 60, color: "error.main" }} />
            <Typography variant="h5" color="error.main">Verification Failed</Typography>
            <Typography variant="body1">
              {error || "Your verification link is invalid or has expired."}
            </Typography>
            <Box mt={2} display="flex" gap={2}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => navigate("/login")}
              >
                Go to Login
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => {
                  navigate("/login", { 
                    state: { resendVerification: true, email: "" } 
                  });
                }}
              >
                Resend Verification
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default VerifyEmailPage; 