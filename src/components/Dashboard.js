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

        const response = await fetch('http://localhost:5001/api/userTrips', {
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
        if (data && data.trips) {
          console.log('Dashboard trips:', data.trips);
          setTrips(data.trips);
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

  const getUpcomingTrips = () => trips.filter(trip => new Date(trip.startDate) > new Date());
  const getCurrentTrips = () => {
    const now = new Date();
    return trips.filter(trip => {
      const startDate = new Date(trip.startDate);
      const endDate = new Date(trip.endDate);
      return startDate <= now && endDate >= now;
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
            <Chip
              size="small"
              label={isUpcoming ? "Upcoming" : isCurrent ? "In Progress" : "Past"}
              color={isUpcoming ? "primary" : isCurrent ? "success" : "default"}
            />
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

          {trip.collaborators && trip.collaborators.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <AvatarGroup max={4} sx={{ justifyContent: 'flex-start' }}>
                {trip.collaborators.map((collab, index) => (
                  <Tooltip key={index} title={collab.user.email}>
                    <Avatar sx={{ width: 30, height: 30 }}>
                      {collab.user.email[0].toUpperCase()}
                    </Avatar>
                  </Tooltip>
                ))}
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

              {getUpcomingTrips().length > 0 && (
                <>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                    <CalendarIcon sx={{ mr: 1 }} />
                    Upcoming Trips
                  </Typography>
                  <Grid container spacing={3}>
                    {getUpcomingTrips().map((trip) => (
                      <Grid item xs={12} sm={6} md={4} key={trip._id}>
                        <TripCard trip={trip} />
                      </Grid>
                    ))}
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