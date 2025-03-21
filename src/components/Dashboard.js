import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  Avatar,
  AvatarGroup,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  FlightTakeoff as FlightIcon,
  CalendarMonth as CalendarIcon,
  LocationOn as LocationIcon,
  Group as GroupIcon,
  ArrowForward as ArrowIcon,
  Explore as ExploreIcon
} from '@mui/icons-material';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found');
          setLoading(false);
          return;
        }

        // Try getting user data directly from the token payload
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            if (payload && payload.id) {
              console.log("User ID from token:", payload.id);
              localStorage.setItem('userId', payload.id);
            }
          }
        } catch (e) {
          console.error("Error extracting user ID from token:", e);
        }

        // Get user ID with multiple fallbacks
        let userId = localStorage.getItem('userId');
        
        // Also try from user object in localStorage
        if (!userId) {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            try {
              // Try parsing as JSON
              const userData = JSON.parse(userStr);
              if (userData._id) {
                userId = userData._id;
              } else if (userData.id) {
                userId = userData.id;
              }
            } catch (e) {
              // If JSON parsing fails, try getting the ID directly
              userId = userStr;
            }
          }
        }

        console.log("Current user ID:", userId);

        const response = await fetch('http://localhost:5001/api/trips/userTrips', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            setError('Session expired. Please log in again.');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
            return;
          }
          throw new Error(`Failed to fetch trips: ${response.status}`);
        }

        const data = await response.json();
        console.log('Dashboard trips response:', data);
        
        if (data && data.trips) {
          // Log each trip's collaborators structure for debugging
          data.trips.forEach((trip, index) => {
            console.log(`Trip ${index + 1} (${trip.tripName}) collaborators:`, 
              trip.collaborators ? JSON.parse(JSON.stringify(trip.collaborators)) : 'No collaborators');
          });
          
          const allTrips = data.trips.map(trip => {
            // Add a property to indicate if user is owner or collaborator
            const isOwner = userId && (trip.userId === userId || trip.userId.toString() === userId);
            
            // Check if user is a collaborator
            let isCollaborator = false;
            let collaboratorRole = 'viewer';
            
            if (trip.collaborators && Array.isArray(trip.collaborators)) {
              trip.collaborators.forEach(collab => {
                // Skip invalid collaborator objects
                if (!collab) return;
                
                // Extract user information safely
                const user = collab.user || {};
                const collaboratorId = user._id || user.id || (typeof user === 'string' ? user : null);
                
                // Check if this is the current user
                if (collaboratorId && userId && 
                   (collaboratorId === userId || collaboratorId.toString() === userId)) {
                  isCollaborator = true;
                  collaboratorRole = collab.role || 'viewer';
                }
              });
            }
            
            const userRole = isOwner ? 'owner' : isCollaborator ? collaboratorRole : 'viewer';
            
            return {
              ...trip,
              userRole
            };
          });
          
          console.log('All trips for dashboard with roles:', allTrips);
          setTrips(allTrips);
        } else {
          setTrips([]);
        }
      } catch (err) {
        console.error('Error fetching trips:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, [navigate]);

  const getUpcomingTrips = () => {
    const now = new Date();
    // Set now to start of day
    now.setHours(0, 0, 0, 0);
    
    return trips.filter(trip => {
      try {
        // Handle ISO string dates
        const startDate = new Date(trip.startDate);
        return startDate > now;
      } catch (e) {
        console.error('Error parsing trip dates:', e);
        return false;
      }
    });
  };
  
  const getCurrentTrips = () => {
    const now = new Date();
    // Set now to start of day
    now.setHours(0, 0, 0, 0);
    
    return trips.filter(trip => {
      try {
        const startDate = new Date(trip.startDate);
        const endDate = new Date(trip.endDate);
        return startDate <= now && endDate >= now;
      } catch (e) {
        console.error('Error parsing trip dates:', e);
        return false;
      }
    });
  };
  
  // Get trips that are neither current nor upcoming (past trips)
  const getPastTrips = () => {
    const now = new Date();
    // Set now to start of day
    now.setHours(0, 0, 0, 0);
    
    return trips.filter(trip => {
      try {
        const endDate = new Date(trip.endDate);
        return endDate < now;
      } catch (e) {
        console.error('Error parsing trip dates:', e);
        return false;
      }
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  const NoTripsPlaceholder = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        p: 4
      }}
    >
      <ExploreIcon sx={{ fontSize: 100, color: 'primary.main', mb: 3, opacity: 0.7 }} />
      <Typography variant="h4" gutterBottom color="primary">
        Start Your Journey
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600 }}>
        Welcome to Alfred! Create your first trip and start planning your next adventure.
        Organize activities, manage expenses, and collaborate with fellow travelers.
      </Typography>
      <Button
        variant="contained"
        size="large"
        startIcon={<AddIcon />}
        onClick={() => navigate('/createTrip')}
        sx={{
          py: 2,
          px: 4,
          borderRadius: 2,
          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
          boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
        }}
      >
        Create Your First Trip
      </Button>
    </Box>
  );

  const TripCard = ({ trip }) => {
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);
    const isUpcoming = startDate > new Date();
    const isCurrent = startDate <= new Date() && endDate >= new Date();
    
    // Get current user ID
    const userStr = localStorage.getItem('user');
    let userId = null;
    if (userStr) {
      try {
        // Try parsing as JSON
        const userData = JSON.parse(userStr);
        if (userData._id) {
          userId = userData._id;
        } else if (userData.id) {
          userId = userData.id;
        }
      } catch (e) {
        // If JSON parsing fails, try getting the ID directly
        userId = userStr;
      }
    }
    
    // If we already calculated the userRole when fetching trips
    if (trip.userRole) {
      return renderTripCard(trip, startDate, endDate, isUpcoming, isCurrent, trip.userRole);
    }
    
    // Determine user role if not already set
    const isOwner = userId && (trip.userId === userId || trip.userId.toString() === userId);
    
    // Check if user is a collaborator
    let isCollaborator = false;
    let collaboratorRole = 'viewer';
    
    if (trip.collaborators && Array.isArray(trip.collaborators)) {
      trip.collaborators.forEach(collab => {
        // Skip invalid collaborator objects
        if (!collab) return;
        
        // Extract user information safely
        const user = collab.user || {};
        const collaboratorId = user._id || user.id || (typeof user === 'string' ? user : null);
        
        // Check if this is the current user
        if (collaboratorId && userId && 
           (collaboratorId === userId || collaboratorId.toString() === userId)) {
          isCollaborator = true;
          collaboratorRole = collab.role || 'viewer';
        }
      });
    }
    
    const userRole = isOwner ? 'Owner' : isCollaborator ? 
      collaboratorRole.charAt(0).toUpperCase() + collaboratorRole.slice(1) : 'Viewer';
      
    return renderTripCard(trip, startDate, endDate, isUpcoming, isCurrent, userRole);
  };
  
  // Helper function to render the trip card
  const renderTripCard = (trip, startDate, endDate, isUpcoming, isCurrent, userRole) => {
    const isOwner = userRole === 'Owner';
    
    // Helper function to safely check if collaborators can be rendered
    const canRenderCollaborators = () => {
      return trip.collaborators && 
             Array.isArray(trip.collaborators) && 
             trip.collaborators.length > 0 &&
             trip.collaborators.some(collab => collab && collab.user && collab.user.email);
    };
    
    return (
      <Card 
        elevation={2}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 4,
          },
        }}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Typography variant="h6" gutterBottom>
              {trip.tripName}
            </Typography>
            <Box>
              <Chip
                size="small"
                label={isUpcoming ? "Upcoming" : isCurrent ? "In Progress" : "Past"}
                color={isUpcoming ? "primary" : isCurrent ? "success" : "default"}
                sx={{ mb: 1 }}
              />
              <Chip
                size="small"
                label={userRole}
                color={isOwner ? "secondary" : "info"}
                variant="outlined"
                sx={{ ml: 1 }}
              />
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <CalendarIcon sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <LocationIcon sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {trip.destination || 'Location not set'}
            </Typography>
          </Box>

          {canRenderCollaborators() && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Collaborators:
              </Typography>
              <AvatarGroup max={4} sx={{ justifyContent: 'flex-start' }}>
                {trip.collaborators
                  .filter(collab => collab && collab.user && collab.user.email)
                  .map((collab, index) => (
                    <Tooltip key={index} title={collab.user.email}>
                      <Avatar sx={{ width: 30, height: 30 }}>
                        {collab.user.email[0].toUpperCase()}
                      </Avatar>
                    </Tooltip>
                  ))
                }
              </AvatarGroup>
            </Box>
          )}
        </CardContent>
        <CardActions>
          <Button
            size="small"
            endIcon={<ArrowIcon />}
            onClick={() => navigate(`/trips/${trip._id}`)}
          >
            View Details
          </Button>
        </CardActions>
      </Card>
    );
  };

  return (
    <>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Paper
          sx={{
            p: { xs: 3, sm: 4 },
            mb: 3,
            borderRadius: 2,
            backgroundImage: "linear-gradient(to right, #3f51b5, #2196f3)",
            color: "white",
            width: "100%",
            position: "relative",
            flexShrink: 0
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              gap: 2
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                width: "100%",
                gap: 2
              }}
            >
              <Box>
                <Typography
                  variant="h4"
                  fontWeight="bold"
                  sx={{
                    fontSize: { xs: "1.75rem", sm: "2.5rem" },
                    wordBreak: "break-word",
                    mb: 1
                  }}
                >
                  Alfred
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: { xs: "1rem", sm: "1.25rem" },
                    fontWeight: 300,
                    opacity: 0.9
                  }}
                >
                  Your Personal Travel Assistant
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/createTrip')}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.3)',
                  },
                  fontWeight: "bold",
                  borderRadius: 2,
                  textTransform: "none",
                  flexShrink: 0
                }}
              >
                Create New Trip
              </Button>
            </Box>
          </Box>
        </Paper>

        <Box sx={{ mb: 4 }}>
          {error && (
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
              <Typography>{error}</Typography>
            </Paper>
          )}

          {trips.length === 0 ? (
            <NoTripsPlaceholder />
          ) : (
            <>
              {/* Current Trips Section */}
              {getCurrentTrips().length > 0 && (
                <>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                    <FlightIcon sx={{ mr: 1 }} />
                    Current Trips
                  </Typography>
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    {getCurrentTrips().map((trip) => (
                      <Grid item xs={12} sm={6} md={4} key={trip._id}>
                        <TripCard trip={trip} />
                      </Grid>
                    ))}
                  </Grid>
                </>
              )}

              {/* Upcoming Trips Section */}
              {getUpcomingTrips().length > 0 && (
                <>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                    <CalendarIcon sx={{ mr: 1 }} />
                    Upcoming Trips
                  </Typography>
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    {getUpcomingTrips().map((trip) => (
                      <Grid item xs={12} sm={6} md={4} key={trip._id}>
                        <TripCard trip={trip} />
                      </Grid>
                    ))}
                  </Grid>
                </>
              )}
              
              {/* Past Trips Section */}
              {getPastTrips().length > 0 && (
                <>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                    <GroupIcon sx={{ mr: 1 }} />
                    Past Trips
                  </Typography>
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    {getPastTrips().map((trip) => (
                      <Grid item xs={12} sm={6} md={4} key={trip._id}>
                        <TripCard trip={trip} />
                      </Grid>
                    ))}
                  </Grid>
                </>
              )}
              
              {/* All Trips Section - Only shown if there are trips that don't fit into the above categories */}
              {getCurrentTrips().length + getUpcomingTrips().length + getPastTrips().length < trips.length && (
                <>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                    <GroupIcon sx={{ mr: 1 }} />
                    Other Trips
                  </Typography>
                  <Grid container spacing={3}>
                    {trips
                      .filter(trip => 
                        !getCurrentTrips().some(t => t._id === trip._id) && 
                        !getUpcomingTrips().some(t => t._id === trip._id) && 
                        !getPastTrips().some(t => t._id === trip._id)
                      )
                      .map((trip) => (
                        <Grid item xs={12} sm={6} md={4} key={trip._id}>
                          <TripCard trip={trip} />
                        </Grid>
                      ))
                    }
                  </Grid>
                </>
              )}
            </>
          )}
        </Box>
      </Container>
    </>
  );
};

export default Dashboard; 