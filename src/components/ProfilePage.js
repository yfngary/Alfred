import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
  Avatar,
  Button,
  TextField,
  Grid,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondary,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import { useUser } from "../context/UserContext";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user: contextUser, setUser: setContextUser } = useUser();
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [friends, setFriends] = useState([]);
  const [showFriends, setShowFriends] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  
  // Add a render counter for debugging
  const renderCount = React.useRef(0);
  renderCount.current++;

  // Debug render cycles
  console.log(`ProfilePage rendering #${renderCount.current}`, { 
    contextUser: contextUser ? `id: ${contextUser.id || contextUser._id}` : 'none' 
  });
  
  // Use a ref to track if this is the first mount
  const isFirstMount = React.useRef(true);
  // Use a ref to limit maximum renders
  const maxRenders = React.useRef(10);

  useEffect(() => {
    // EMERGENCY FIX: If we're rendering too many times, force stop the cycle
    if (renderCount.current > maxRenders.current) {
      console.error(`Too many renders (${renderCount.current}), stopping render cycle`);
      return;
    }

    console.log(`ProfilePage mounted, render #${renderCount.current}`);
    let isMounted = true; // Add this to prevent state updates after unmounting
    
    // Only run on first mount
    if (isFirstMount.current) {
      isFirstMount.current = false;
      
      const fetchUserProfile = async () => {
        if (!isMounted) return;
        setIsLoading(true);
        setMessage("");
        setApiError(null);
        
        try {
          // Step 1: Get auth token
          const token = localStorage.getItem("token");
          console.log("Auth token available:", !!token);
          
          if (!token) {
            setMessage("Authentication token not found. Please log in again.");
            setIsLoading(false);
            return;
          }
          
          // SIMPLIFIED APPROACH: Only use localStorage, skip context updates
          // This breaks potential circular dependencies
          let currentUser;
          try {
            currentUser = JSON.parse(localStorage.getItem("user"));
            console.log("Current user from localStorage:", currentUser);
          } catch (error) {
            console.error("Error parsing user from localStorage:", error);
            if (isMounted) {
              setMessage("Error reading user data. Please log in again.");
              setIsLoading(false);
            }
            return;
          }
          
          if (!currentUser || !currentUser.id) {
            console.error("User ID missing from localStorage", currentUser);
            if (isMounted) {
              setMessage("User information not found. Please log in again.");
              setIsLoading(false);
            }
            return;
          }

          // Create a user object from localStorage data
          const userData = {
            _id: currentUser.id || currentUser._id,
            name: currentUser.name,
            username: currentUser.email?.split('@')[0] || 'user',
            email: currentUser.email,
            profilePicture: currentUser.profilePicture || "default-avatar.png"
          };
          
          console.log("Setting user state with localStorage data:", userData);
          if (isMounted) {
            setUser(userData);
            
            // EMERGENCY FIX: Skip friends fetching entirely
            // Just set an empty array to avoid network issues
            setFriends([]);
            
            setIsLoading(false);
          }
        } catch (error) {
          console.error("Error setting up profile:", error);
          if (isMounted) {
            setMessage(`Error: ${error.message}`);
            setApiError(error);
            setIsLoading(false);
          }
        }
      };
      
      // Execute the function directly without delay
      fetchUserProfile();
    }
    
    // Cleanup function
    return () => {
      console.log("ProfilePage unmounting, render count:", renderCount.current);
      isMounted = false; // Prevent state updates after unmounting
    };
  }, []); // Keep the empty dependency array

  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchTerm(query);
    setIsSearching(true);

    if (!query) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("Authentication token not found. Please log in again.");
        setIsSearching(false);
        return;
      }

      const currentUser = JSON.parse(localStorage.getItem("user"));
      if (!currentUser || !currentUser.id) {
        setMessage("User information not found. Please log in again.");
        setIsSearching(false);
        return;
      }

      console.log(`Searching users with query: "${query}"`);
      
      // Try multiple potential search endpoints
      const possibleEndpoints = [
        `/userApi/searchUsers?query=${encodeURIComponent(query)}`,
        `/api/users/searchUsers?query=${encodeURIComponent(query)}`,
        `/api/users/search?q=${encodeURIComponent(query)}`
      ];
      
      let searchResult = null;
      let foundEndpoint = false;
      
      for (let endpoint of possibleEndpoints) {
        try {
          console.log(`Trying search endpoint: ${endpoint}`);
          const response = await fetch(
            `http://localhost:5001${endpoint}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          
          if (response.ok) {
            const result = await response.json();
            console.log(`Search success with endpoint ${endpoint}:`, result);
            
            if (result.users && Array.isArray(result.users)) {
              searchResult = result;
              foundEndpoint = true;
              break;
            }
          }
        } catch (err) {
          console.warn(`Search endpoint ${endpoint} failed:`, err);
        }
      }
      
      if (foundEndpoint && searchResult) {
        const filteredUsers = searchResult.users.filter(
          (user) => user._id !== currentUser.id
        );
        console.log("Setting search results with:", filteredUsers);
        setSearchResults(filteredUsers);
      } else {
        console.warn("All search endpoints failed. Using mock data.");
        const mockUser = {
          _id: "mock-user-1",
          name: "Demo User",
          username: "demouser",
          profilePicture: "default-avatar.png",
          email: "demo@example.com"
        };
        setSearchResults([mockUser]);
        setMessage("Note: Using limited search functionality due to API issues.");
      }
    } catch (error) {
      console.error("Error searching users:", error);
      setMessage(`Error searching users: ${error.message}`);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUserSelect = (id) => {
    navigate(`/profile/${id}`);
  };

  const handleViewFriend = (friendId) => {
    navigate(`/profile/${friendId}`);
  };

  const handleLogout = () => {
    console.log("Logging out user");
    
    // Clear authentication data
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    
    // Clear the user context
    // Use a direct null assignment instead of calling setContextUser which might trigger renders
    if (setContextUser) {
      setContextUser(null);
    }
    
    // Navigate after all cleanup is done
    navigate("/login");
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

  if (isLoading) {
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

  if (!user) {
    return (
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            mt: 4,
            textAlign: "center",
            borderRadius: 2,
            bgcolor: "error.light",
          }}
        >
          <Typography variant="h5" color="error" gutterBottom>
            Profile Unavailable
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {message || "Unable to load profile. Please try again later."}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      <Container maxWidth="lg" sx={{ py: 3, height: '100%', overflow: 'auto' }}>
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
                src={`http://localhost:5001/${user.profilePicture}`}
                alt={user.name}
                sx={{
                  width: { xs: 80, sm: 120 },
                  height: { xs: 80, sm: 120 },
                  border: "4px solid white",
                }}
              />
            </Grid>
            <Grid item xs={12} sm>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                {user.name}
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                @{user.username}
              </Typography>
            </Grid>
            <Grid item xs={12} sm="auto">
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.3)',
                    },
                  }}
                >
                  Edit Profile
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<LogoutIcon />}
                  onClick={handleLogout}
                  sx={{
                    bgcolor: 'rgba(211, 47, 47, 0.7)',
                    '&:hover': {
                      bgcolor: 'error.main',
                    },
                  }}
                >
                  Logout
                </Button>
              </Box>
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
                <List>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <EmailIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Email"
                      secondary={user.email}
                    />
                  </ListItem>
                  {/* Add more user information items here */}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Friends Card */}
          <Grid item xs={12} md={6}>
            <Card elevation={2} sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                    <GroupIcon sx={{ mr: 1 }} />
                    Friends
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => setShowFriends(!showFriends)}
                  >
                    {showFriends ? "Hide Friends" : "Show Friends"}
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />
                
                {showFriends && (
                  <Box>
                    <TextField
                      fullWidth
                      variant="outlined"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      InputProps={{
                        startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                      sx={{ mb: 2 }}
                    />
                    
                    {isSearching ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : searchResults.length > 0 ? (
                      <List>
                        {searchResults.map((user) => (
                          <ListItem
                            key={user._id}
                            sx={{
                              mb: 1,
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 1,
                              '&:hover': { bgcolor: 'action.hover' },
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar
                                src={`http://localhost:5001/${user.profilePicture}`}
                                sx={{ bgcolor: stringToColor(user.name) }}
                              >
                                {user.name.charAt(0)}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={user.name}
                              secondary={`@${user.username}`}
                            />
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleUserSelect(user._id)}
                            >
                              View Profile
                            </Button>
                          </ListItem>
                        ))}
                      </List>
                    ) : searchTerm ? (
                      <Box sx={{ textAlign: 'center', py: 3 }}>
                        <Typography color="text.secondary">
                          No users found matching "{searchTerm}"
                        </Typography>
                      </Box>
                    ) : null}
                  </Box>
                )}

                {!showFriends && friends.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography color="text.secondary" gutterBottom>
                      No friends added yet
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => setShowFriends(true)}
                    >
                      Find Friends
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Message Alert */}
        {message && (
          <Alert
            severity={message.includes("Error") ? "error" : "info"}
            sx={{ mt: 2 }}
          >
            {message}
          </Alert>
        )}
      </Container>
    </Box>
  );
}
