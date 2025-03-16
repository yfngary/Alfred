import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  LinearProgress, 
  Button, 
  Card, 
  CardContent,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FlightIcon from '@mui/icons-material/Flight';
import HotelIcon from '@mui/icons-material/Hotel';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import AddIcon from '@mui/icons-material/Add';
import HomeIcon from '@mui/icons-material/Home';
import MapIcon from '@mui/icons-material/Map';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalActivityIcon from '@mui/icons-material/LocalActivity';

// Activity icon component
const ActivityIcon = () => <LocalActivityIcon />;

const TripCalendarView = ({ onToggleView }) => {
  const { tripId } = useParams();
  const [trip, setTrip] = useState({});
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showAddButton, setShowAddButton] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.down('sm'));

  // Fetch trip data and experiences when component mounts or tripId changes
  useEffect(() => {
    const fetchTripData = async () => {
      setLoading(true);
      setError(null); // Reset error state at the start of fetch
      const token = localStorage.getItem("token");
      
      try {
        // Fetch trip details
        const tripResponse = await fetch(
          `http://localhost:5001/api/trips/${tripId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Check if the response is ok before parsing
        if (!tripResponse.ok) {
          throw new Error(`Trip fetch failed with status: ${tripResponse.status}`);
        }
        
        const tripData = await tripResponse.json();
        setTrip(tripData);

        // Sample experience data based on what you provided
        const experiencesData = tripData.experiences || [];
        const startDate = tripData.startDate ? new Date(tripData.startDate) : null;
        const endDate = tripData.endDate ? new Date(tripData.endDate) : null;
        
        // Transform experiences into calendar events
        const calendarEvents = experiencesData.map(experience => ({
          id: experience._id,
          title: experience.title,
          start: new Date(`${experience.date.split('T')[0]}T${experience.startTime}`),
          end: new Date(`${experience.date.split('T')[0]}T${experience.endTime}`),
          resource: experience
        }));
        
        setEvents(calendarEvents);

        // Set selected date to trip start date if no date is selected
        if (!selectedDate && startDate) {
          setSelectedDate(startDate);
        }
      } catch (err) {
        console.error('Error fetching trip data:', err);
        setError(`Failed to load trip data: ${err.message}`);
      } finally {
        setLoading(false); // Always set loading to false when done
      }
    };

    if (tripId) { // Only fetch if tripId exists
      fetchTripData();
    }
  }, [tripId, selectedDate]);

  // Handle loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <Box sx={{ width: '80%', maxWidth: 400, mb: 2 }}>
          <LinearProgress />
        </Box>
        <Typography variant="body1" color="primary">
          Loading your adventure...
        </Typography>
      </Box>
    );
  }

  // Handle error state
  if (error || !trip) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderLeft: '4px solid',
          borderColor: 'error.main',
          bgcolor: 'error.light',
          mb: 3,
          borderRadius: 1
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight="bold" color="error.main" sx={{ mr: 1 }}>
            Error!
          </Typography>
          <Typography variant="body1" color="error.main">
            {error || "Trip not found."}
          </Typography>
        </Box>
      </Paper>
    );
  }

  // Get the icon component based on experience type
  const getExperienceIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'flight':
        return <FlightIcon />;
      case 'hotel':
        return <HotelIcon />;
      case 'activity':
        return <ActivityIcon />;
      case 'meal':
      case 'restaurant':
        return <RestaurantIcon />;
      case 'transportation':
        return <DirectionsCarIcon />;
      default:
        return <CalendarTodayIcon />;
    }
  };

  // Get the color for an experience type
  const getExperienceTypeColor = (type) => {
    // Material UI palette for better integration
    const typeColors = {
      'flight': '#1976d2', // Primary blue
      'hotel': '#2e7d32', // Green
      'activity': '#ed6c02', // Orange
      'meal': '#d32f2f', // Red
      'restaurant': '#d32f2f', // Red
      'transportation': '#9c27b0' // Purple
    };
    
    return typeColors[type?.toLowerCase()] || '#0288d1'; // Default blue
  };

  // Handle event selection
  const handleSelectExperience = (experienceId) => {
    navigate(`/experiences/${experienceId}`);
  };
  
  // Group events by date for our custom calendar
  const groupEventsByDate = () => {
    const grouped = {};
    
    if (events.length > 0) {
      events.forEach(event => {
        const dateStr = event.start.toDateString();
        if (!grouped[dateStr]) {
          grouped[dateStr] = [];
        }
        grouped[dateStr].push(event);
      });
      
      // Sort events within each day by start time
      Object.keys(grouped).forEach(date => {
        grouped[date].sort((a, b) => a.start - b.start);
      });
    }
    
    return grouped;
  };

  // Format date function (simple version without moment.js)
  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  // Format day function
  const formatDay = (dateString) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric'
    });
  };
  
  // Format time function
  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  // Generate dates between start and end dates
  const getDatesInRange = (startDate, endDate) => {
    if (!startDate || !endDate) return [];
    
    const dates = [];
    const currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    // Set time to midnight to compare only dates
    currentDate.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    while (currentDate <= end) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };
  
  // Group events by date
  const eventsByDate = groupEventsByDate();
  
  // Get all dates in the trip
  const allDates = trip.startDate && trip.endDate ? getDatesInRange(trip.startDate, trip.endDate) : [];

  // Navigate to previous date
  const handlePrevDate = () => {
    const currentIndex = allDates.findIndex(date => 
      date.toDateString() === selectedDate.toDateString()
    );
    
    if (currentIndex > 0) {
      setSelectedDate(allDates[currentIndex - 1]);
    }
  };

  // Navigate to next date
  const handleNextDate = () => {
    const currentIndex = allDates.findIndex(date => 
      date.toDateString() === selectedDate.toDateString()
    );
    
    if (currentIndex < allDates.length - 1) {
      setSelectedDate(allDates[currentIndex + 1]);
    }
  };

  // Check if a date is the current selected date
  const isSelectedDate = (date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  // Navigate to add experience page
  const handleAddExperience = () => {
    navigate(`/createExperience/${tripId}`, { 
      state: { 
        defaultDate: selectedDate ? selectedDate.toISOString().split('T')[0] : null
      } 
    });
  };

  // Calculate trip progress
  const calculateTripProgress = () => {
    if (!trip.startDate || !trip.endDate) return 0;
    
    const today = new Date();
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    
    if (today < start) return 0;
    if (today > end) return 100;
    
    const totalDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const daysElapsed = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1;
    
    return Math.round((daysElapsed / totalDays) * 100);
  };

  // Get today's date
  const today = new Date();

  return (
    <Box 
      sx={{ 
        width: '100%',
        minHeight: '100vh',
        pt: { xs: 2, sm: 3 },
        pb: { xs: 2, sm: 3 },
        px: { xs: 1, sm: 2, md: 3 },
        backgroundColor: '#f5f5f5',
        overflowX: 'hidden'
      }}
    >
      <Box 
        sx={{ 
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}
      >
        {/* Trip Header with Progress Bar */}
        <Card 
          elevation={2} 
          sx={{ 
            borderRadius: 2,
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            backgroundColor: 'white'
          }}
        >
          <CardContent>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between', 
              alignItems: { xs: 'flex-start', sm: 'center' }, 
              gap: 2,
              mb: 2 
            }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {trip?.name}
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                gap: 1,
                width: { xs: '100%', sm: 'auto' }
              }}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={<HomeIcon />}
                  onClick={() => navigate(`/trips/${tripId}`)}
                  fullWidth={matches}
                >
                  Dashboard
                </Button>
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={<MapIcon />}
                  onClick={onToggleView}
                  fullWidth={matches}
                >
                  Map View
                </Button>
              </Box>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between', 
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: 1,
              mb: 1 
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CalendarTodayIcon sx={{ fontSize: 'small', mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {formatDate(trip?.startDate)} - {formatDate(trip?.endDate)}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {calculateTripProgress()}% complete
              </Typography>
            </Box>
            
            <LinearProgress 
              variant="determinate" 
              value={calculateTripProgress()} 
              sx={{ height: 6, borderRadius: 1 }}
            />
          </CardContent>
        </Card>
        
        {/* Calendar Header */}
        <Card elevation={2} sx={{ borderRadius: 2 }}>
          <CardContent>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between', 
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: 2,
              mb: 2 
            }}>
              <Typography variant="h6" sx={{ 
                display: 'flex', 
                alignItems: 'center',
                fontSize: { xs: '1.1rem', sm: '1.25rem' }
              }}>
                <CalendarTodayIcon sx={{ mr: 1 }} />
                Calendar View
              </Typography>
              
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                width: { xs: '100%', sm: 'auto' }
              }}>
                <IconButton 
                  onClick={handlePrevDate}
                  disabled={!selectedDate || !allDates.length || selectedDate.toDateString() === allDates[0]?.toDateString()}
                  size="small"
                  sx={{ mr: 1 }}
                >
                  <NavigateBeforeIcon />
                </IconButton>
                
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    mx: 1, 
                    fontWeight: 'medium',
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    flex: 1,
                    textAlign: { xs: 'center', sm: 'left' }
                  }}
                >
                  {selectedDate ? formatDay(selectedDate) : 'Select a date'}
                </Typography>
                
                <IconButton 
                  onClick={handleNextDate}
                  disabled={!selectedDate || !allDates.length || selectedDate.toDateString() === allDates[allDates.length - 1]?.toDateString()}
                  size="small"
                  sx={{ ml: 1 }}
                >
                  <NavigateNextIcon />
                </IconButton>
              </Box>
            </Box>
            
            <Box sx={{ 
              overflowX: 'hidden',
              overflowY: 'auto',
              maxHeight: { xs: '50vh', sm: '60vh' },
              py: 1,
              px: 0.5,
              '&::-webkit-scrollbar': { width: 8, height: 8 },
              '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,.2)', borderRadius: 4 }
            }}>
              <Grid container spacing={2}>
                {allDates.map((date, index) => {
                  const dateStr = date.toDateString();
                  const dayEvents = eventsByDate[dateStr] || [];
                  const isToday = date.toDateString() === today.toDateString();
                  const isSelected = isSelectedDate(date);
                  
                  // Sort events by start time
                  const sortedEvents = [...dayEvents].sort((a, b) => a.start - b.start);
                  
                  return (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={dateStr}>
                      <Paper
                        elevation={isSelected ? 3 : 1}
                        onClick={() => setSelectedDate(date)}
                        sx={{
                          height: 180,
                          display: 'flex',
                          flexDirection: 'column',
                          cursor: 'pointer',
                          border: isSelected ? '2px solid' : '1px solid',
                          borderColor: isSelected ? 'primary.main' : isToday ? 'warning.main' : 'divider',
                          bgcolor: isSelected ? 'primary.light' : isToday ? 'warning.light' : 'background.paper',
                          opacity: 0.95,
                          '&:hover': {
                            opacity: 1,
                            boxShadow: 3,
                            bgcolor: isSelected ? 'primary.light' : isToday ? 'warning.light' : 'action.hover'
                          },
                          overflow: 'hidden'
                        }}
                      >
                        <Box sx={{ 
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          p: 1,
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          bgcolor: isSelected ? 'primary.main' : isToday ? 'warning.main' : 'grey.100'
                        }}>
                          <Box>
                            <Typography 
                              variant="subtitle2" 
                              sx={{ 
                                color: isSelected ? 'white' : isToday ? 'white' : 'text.primary',
                                fontWeight: 'bold'
                              }}
                            >
                              {date.toLocaleDateString('en-US', { weekday: 'short' })}
                            </Typography>
                            <Typography 
                              variant="h5" 
                              sx={{ 
                                fontWeight: 'medium',
                                color: isSelected ? 'white' : isToday ? 'white' : 'text.primary'
                              }}
                            >
                              {date.getDate()}
                            </Typography>
                          </Box>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: isSelected ? 'white' : isToday ? 'white' : 'text.secondary',
                              fontWeight: 'medium'
                            }}
                          >
                            {date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ 
                          flex: 1, 
                          overflowY: 'auto', 
                          p: 1,
                          '&::-webkit-scrollbar': { width: 4 },
                          '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,.2)', borderRadius: 2 }
                        }}>
                          {sortedEvents.length > 0 ? (
                            sortedEvents.slice(0, 4).map((event, idx) => (
                              <Box
                                key={event.id || idx}
                                sx={{
                                  p: 0.5,
                                  mb: 0.5,
                                  borderRadius: 1,
                                  fontSize: '0.75rem',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  border: '1px solid',
                                  borderColor: getExperienceTypeColor(event.resource?.type),
                                  bgcolor: `${getExperienceTypeColor(event.resource?.type)}20`,
                                  color: 'text.primary',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                              >
                                <Box 
                                  component="span" 
                                  sx={{ 
                                    minWidth: 35, 
                                    fontSize: '0.65rem', 
                                    color: 'text.secondary', 
                                    mr: 0.5,
                                    display: 'inline-block' 
                                  }}
                                >
                                  {event.start ? formatTime(event.start).replace(' ', '').toLowerCase() : ''}
                                </Box>
                                <Typography variant="inherit" noWrap>
                                  {event.title}
                                </Typography>
                              </Box>
                            ))
                          ) : (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', pt: 2 }}>
                              No events
                            </Typography>
                          )}
                          
                          {sortedEvents.length > 4 && (
                            <Typography 
                              variant="caption" 
                              color="primary" 
                              sx={{ 
                                display: 'block', 
                                textAlign: 'center', 
                                mt: 0.5,
                                fontWeight: 'medium' 
                              }}
                            >
                              +{sortedEvents.length - 4} more events
                            </Typography>
                          )}
                        </Box>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          </CardContent>
        </Card>
        
        {/* Selected Date Details */}
        <Card 
          elevation={2} 
          sx={{ 
            borderRadius: 2,
            position: 'relative',
            '&:hover .add-button': {
              opacity: 1
            }
          }}
          onMouseEnter={() => setShowAddButton(true)}
          onMouseLeave={() => setShowAddButton(false)}
        >
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <ActivityIcon sx={{ mr: 1 }} />
                {selectedDate ? `Details for ${formatDate(selectedDate)}` : 'Select a date to view details'}
              </Typography>
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddExperience}
                size="small"
                className="add-button"
              >
                Add Experience
              </Button>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {selectedDate ? (
              <>
                {eventsByDate[selectedDate.toDateString()]?.length > 0 ? (
                  <List sx={{ minHeight: 200 }}>
                    {eventsByDate[selectedDate.toDateString()].map((event, index) => (
                      <ListItem
                        key={event.id}
                        secondaryAction={
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleSelectExperience(event.id)}
                          >
                            Details
                          </Button>
                        }
                        sx={{
                          mb: 1,
                          border: '1px solid #eee',
                          borderRadius: 1,
                          '&:hover': { backgroundColor: '#f9f9f9' },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{ bgcolor: getExperienceTypeColor(event.resource?.type) }}
                          >
                            {getExperienceIcon(event.resource?.type)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" fontWeight="medium">
                              {event.title}
                            </Typography>
                          }
                          secondary={
                            <React.Fragment>
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                <AccessTimeIcon sx={{ fontSize: 'small', mr: 0.5, color: 'text.secondary' }} />
                                <Typography
                                  component="span"
                                  variant="body2"
                                  color="text.primary"
                                  sx={{ mr: 1 }}
                                >
                                  {formatTime(event.start)} - {formatTime(event.end)}
                                </Typography>
                              </Box>
                              {event.resource?.location && (
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                  <LocationOnIcon sx={{ fontSize: 'small', mr: 0.5, color: 'text.secondary' }} />
                                  <Typography variant="body2">
                                    {event.resource.location}
                                  </Typography>
                                </Box>
                              )}
                              {event.resource?.guests && event.resource.guests.length > 0 && (
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    Guests: {event.resource.guests.join(', ')}
                                  </Typography>
                                </Box>
                              )}
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      py: 4,
                      bgcolor: 'background.paper',
                      borderRadius: 1
                    }}
                  >
                    <CalendarTodayIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                      No experiences scheduled for this day
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleAddExperience}
                    >
                      Add Experience
                    </Button>
                  </Box>
                )}
              </>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 4,
                  bgcolor: 'background.paper',
                  borderRadius: 1
                }}
              >
                <CalendarTodayIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  Select a date from the calendar above to view your schedule
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default TripCalendarView;