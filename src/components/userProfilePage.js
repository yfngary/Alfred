import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Paper,
  Avatar,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Schedule as ScheduleIcon,
  Chat as ChatIcon,
} from "@mui/icons-material";

export default function UserProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [friendStatus, setFriendStatus] = useState("");
  const [requestSending, setRequestSending] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `http://localhost:5001/api/users/${userId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await response.json();

        if (response.ok) {
          setUser(result.user);
          // Check if there's an existing friend request
          checkFriendStatus(result.user._id);
        } else {
          setMessage(result.error || "Failed to load user profile.");
        }
      } catch (error) {
        setMessage("Error fetching user profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  const checkFriendStatus = async (userId) => {
    // This is a placeholder - you'll need to implement this endpoint on your backend
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5001/api/requests/checkFriendStatus/${userId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();
      if (response.ok) {
        setFriendStatus(result.status); // e.g., "none", "pending", "friends"
      }
    } catch (error) {
      console.error("Error checking friend status:", error);
    }
  };

  const sendFriendRequest = async (toUserId) => {
    setRequestSending(true);
    const token = localStorage.getItem("token");
  
    try {
      const response = await fetch(`http://localhost:5001/api/requests/sendFriendRequest/${toUserId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
  
      const result = await response.json();
      if (response.ok) {
        setFriendStatus("pending");
        setMessage("Friend request sent successfully!");
      } else {
        setMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error sending friend request:", error);
      setMessage("An error occurred while sending the friend request.");
    } finally {
      setRequestSending(false);
    }
  };

  const handleBackToProfile = () => {
    navigate('/profilePage');
  };

  // Helper function to generate avatar colors
  const stringToColor = (string) => {
    if (!string) return "#2196f3";
    let hash = 0;
    for (let i = 0; i < string.length; i++) {
      hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = "#";
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xff;
      color += ("00" + value.toString(16)).substr(-2);
    }
    return color;
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      <Container maxWidth="lg" sx={{ py: 3, height: '100%', overflow: 'auto' }}>
        {/* Back Button */}
        <Button
          variant="text"
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToProfile}
          sx={{ mb: 3 }}
        >
          Back to Your Profile
        </Button>

        {/* Profile Header */}
        <Paper
          sx={{
            p: { xs: 2, sm: 3 },
            mb: 3,
            borderRadius: 2,
            backgroundImage: "linear-gradient(to right, #3f51b5, #2196f3)",
            color: "white",
            position: "relative",
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm="auto">
              <Avatar
                src={`http://localhost:5001/${user?.profilePicture || "default-avatar.png"}`}
                alt={user?.name}
                sx={{
                  width: { xs: 80, sm: 120 },
                  height: { xs: 80, sm: 120 },
                  border: "4px solid white",
                  bgcolor: stringToColor(user?.name || ""),
                }}
              >
                {user?.name?.charAt(0)}
              </Avatar>
            </Grid>
            <Grid item xs={12} sm>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                {user?.name}
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                @{user?.username}
              </Typography>
            </Grid>
            <Grid item xs={12} sm="auto">
              {friendStatus === "friends" ? (
                <Button
                  variant="contained"
                  startIcon={<CheckIcon />}
                  sx={{
                    bgcolor: 'success.main',
                    '&:hover': {
                      bgcolor: 'success.dark',
                    },
                  }}
                >
                  Friends
                </Button>
              ) : friendStatus === "pending" ? (
                <Button
                  variant="contained"
                  startIcon={<ScheduleIcon />}
                  sx={{
                    bgcolor: 'warning.main',
                    '&:hover': {
                      bgcolor: 'warning.dark',
                    },
                  }}
                >
                  Request Sent
                </Button>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => sendFriendRequest(user?._id)}
                  disabled={requestSending}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.3)',
                    },
                  }}
                >
                  {requestSending ? "Sending..." : "Add Friend"}
                </Button>
              )}
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={3}>
          {/* User Info Card */}
          <Grid item xs={12} md={6}>
            <Card elevation={2} sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonIcon sx={{ mr: 1 }} />
                  User Information
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EmailIcon sx={{ mr: 2, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1">
                      {user?.email}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Activity Card */}
          <Grid item xs={12} md={6}>
            <Card elevation={2} sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <ChatIcon sx={{ mr: 1 }} />
                  Recent Activity
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <ChatIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography color="text.secondary" gutterBottom>
                    No activity to show yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    User hasn't posted any content
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Message Alert */}
        {message && (
          <Alert
            severity={message.includes("Error") ? "error" : "success"}
            sx={{ mt: 2 }}
          >
            {message}
          </Alert>
        )}
      </Container>
    </Box>
  );
}
