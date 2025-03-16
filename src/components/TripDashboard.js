import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
  Chip,
  Avatar,
  AvatarGroup,
  Divider,
  CircularProgress,
  Button,
  Paper,
  Stack,
  Tabs,
  Tab,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondary,
  Tooltip,
  Badge,
  TextField,
  MenuItem,
} from "@mui/material";
import {
  CalendarMonth as CalendarIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  Hotel as HotelIcon,
  Attractions as ActivityIcon,
  Checklist as ChecklistIcon,
  AccountBalance as BudgetIcon,
  ArrowForward as ArrowIcon,
  Notes as NotesIcon,
  Add as AddIcon,
  Restaurant as RestaurantIcon,
  Hiking as HikingIcon,
  LocalActivity as EventIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Sailing as OtherIcon,
  Backpack as BackpackIcon,
  AccessTime as TimeIcon,
  Place as PlaceIcon,
  Group as GroupIcon,
} from "@mui/icons-material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { useTrips } from '../context/TripContext';

const TripDashboard = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { refreshTrips } = useTrips();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [experienceTab, setExperienceTab] = useState(0);
  const [openExperienceDialog, setOpenExperienceDialog] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [userRole, setUserRole] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const fetchTripDetails = async (tripId) => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");
        let userId = null;
        
        console.log("Raw user data from localStorage:", userStr);
        
        if (userStr) {
          try {
            // Try parsing as JSON first
            const userData = JSON.parse(userStr);
            if (userData._id) {
              userId = userData._id;
            } else if (userData.id) {
              userId = userData.id;
            }
            console.log("Parsed user data:", userData);
          } catch (e) {
            // If JSON parsing fails, try getting the ID directly
            userId = userStr;
            console.log("Using raw user string as ID:", userId);
          }
        }

        console.log("Final userId:", userId);

        console.log("Auth Debug:", {
          token: token ? "Present" : "Missing",
          userId: userId || "Missing",
          localStorage: Object.keys(localStorage),
          userStr: userStr ? "Present" : "Missing"
        });

        const response = await fetch(
          `http://localhost:5001/api/trips/${tripId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch trip details: ${response.status}`);
        }

        const data = await response.json();
        let tripData;

        // Determine where the trip data is located in the response
        if (data && data.trip) {
          tripData = data.trip;
        } else if (data && typeof data === "object") {
          if ("tripName" in data || "_id" in data || "startDate" in data) {
            tripData = data;
          } else if (data.trips && data.trips.length > 0) {
            tripData = data.trips[0];
          } else {
            throw new Error("Trip data not found in API response");
          }
        }

        console.log("Role Debug:", {
          currentUserId: userId,
          tripOwnerId: tripData.userId,
          isMatch: userId === tripData.userId || userId === tripData.userId.toString(),
          rawComparison: `${userId} === ${tripData.userId}`,
          collaborators: tripData.collaborators || []
        });

        setTrip(tripData);

        // Set user role - compare both as strings to ensure proper matching
        if (userId && tripData.userId && (userId === tripData.userId || userId === tripData.userId.toString())) {
          console.log("Setting user as owner - IDs match:", {
            userId,
            tripUserId: tripData.userId,
            comparison: `${userId} === ${tripData.userId}`
          });
          setUserRole('owner');
        } else {
          console.log("Checking collaborator role");
          const collaborator = tripData.collaborators?.find(c => 
            c.user._id === userId || c.user._id === userId?.toString()
          );
          const role = collaborator?.role || 'viewer';
          console.log("Setting user as:", role, "Collaborator found:", !!collaborator);
          setUserRole(role);
        }

        setCollaborators(tripData.collaborators || []);
      } catch (err) {
        console.error("Error fetching trip details:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (tripId) {
      fetchTripDetails(tripId);
    }
  }, [tripId]);

  // Add a debug effect to monitor userRole changes
  useEffect(() => {
    console.log("Current user role:", userRole);
  }, [userRole]);

  // Format date helper function
  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format time helper function
  const formatTime = (timeString) => {
    if (!timeString) return "";
    if (timeString.includes(":")) {
      const [hours, minutes] = timeString.split(":");
      const hour = parseInt(hours);
      return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? "PM" : "AM"}`;
    }
    return timeString;
  };

  // Calculate days remaining until trip
  const getDaysRemaining = (startDate) => {
    if (!startDate) return null;
    const today = new Date();
    const tripStart = new Date(startDate);
    const timeDiff = tripStart.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysDiff < 0) return "In progress";
    if (daysDiff === 0) return "Today";
    return `${daysDiff} days`;
  };

  // Calculate trip duration
  const getTripDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return "Not specified";
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return `${daysDiff} days`;
  };

  // Handle experience tab change
  const handleExperienceTabChange = (event, newValue) => {
    setExperienceTab(newValue);
  };

  // Handle viewing experience details
  const handleViewExperience = (experience) => {
    setSelectedExperience(experience);
    setOpenExperienceDialog(true);
  };

  // Navigate to create experience page
  const handleCreateExperience = () => {
    navigate(`/createExperience/${tripId}`);
  };

  const useCalendarNavigation = (tripId) => {
    const navigate = useNavigate();

    const navigateToCalendarView = () => {
      navigate(`/tripsCalendar/${tripId}`);
    };

    return navigateToCalendarView;
  };

  // Get icon based on experience type
  const getExperienceIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "meal":
        return <RestaurantIcon />;
      case "activity":
        return <HikingIcon />;
      case "event":
        return <EventIcon />;
      default:
        return <OtherIcon />;
    }
  };

  const handleAddCollaborator = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/trips/${trip._id}/collaborators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          email: newCollaboratorEmail,
          role: 'viewer'
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add collaborator');
      }

      const data = await response.json();
      setCollaborators(data.trip.collaborators);
      setNewCollaboratorEmail('');
      onTripUpdate(data.trip);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      const response = await fetch(`/api/trips/${trip._id}/collaborators/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update role');
      }

      const data = await response.json();
      setCollaborators(data.trip.collaborators);
      onTripUpdate(data.trip);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleRemoveCollaborator = async (userId) => {
    try {
      const response = await fetch(`/api/trips/${trip._id}/collaborators/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove collaborator');
      }

      const data = await response.json();
      setCollaborators(data.trip.collaborators);
      onTripUpdate(data.trip);
    } catch (error) {
      setError(error.message);
    }
  };

  const generateInviteCode = async () => {
    try {
      const response = await fetch(`/api/trips/${trip._id}/invite-code`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate invite code');
      }

      const data = await response.json();
      setInviteCode(data.inviteCode);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDeleteTrip = async () => {
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/trips/${tripId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        refreshTrips(); // Refresh trips in NavBar
        navigate('/');
      } else {
        throw new Error('Failed to delete trip');
      }
    } catch (error) {
      console.error('Error deleting trip:', error);
    } finally {
      setDeleteLoading(false);
      setOpenDeleteDialog(false);
    }
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

  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Typography variant="h6" color="error">
          Error: {error}
        </Typography>
      </Box>
    );
  }

  if (!trip) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Typography variant="h6">No trip data found.</Typography>
      </Box>
    );
  }

  // Trip status logic
  const today = new Date();
  const tripStart = new Date(trip.startDate);
  const tripEnd = new Date(trip.endDate);

  let statusColor = "default";
  let statusText = "Planning";

  if (today >= tripStart && today <= tripEnd) {
    statusColor = "success";
    statusText = "In Progress";
  } else if (today > tripEnd) {
    statusColor = "secondary";
    statusText = "Completed";
  } else if (tripStart.getTime() - today.getTime() < 7 * 24 * 60 * 60 * 1000) {
    statusColor = "warning";
    statusText = "Upcoming";
  }

  // Filter experiences by type for tabs
  const experiences = trip.experiences || [];
  const upcomingExperiences = experiences.filter(
    (exp) => new Date(exp.date) >= today
  );
  const mealExperiences = experiences.filter((exp) => exp.type === "meal");
  const activityExperiences = experiences.filter(
    (exp) => exp.type === "activity"
  );
  const otherExperiences = experiences.filter(
    (exp) => exp.type !== "meal" && exp.type !== "activity"
  );

  const TripHeader = ({ trip, formatDate, getDaysRemaining }) => {
    const navigate = useNavigate();
    
    const navigateToCalendarView = () => {
      const id = trip._id;
      navigate(`/tripsCalendar/${id}`);
    };
    
    const statusText = trip.status === 'upcoming' ? 'Upcoming' : 
                       trip.status === 'completed' ? 'Completed' : 'In Progress';
    const statusColor = trip.status === 'upcoming' ? 'primary' : 
                        trip.status === 'completed' ? 'success' : 'warning';
  
    return (
      <Paper
        sx={{
          p: { xs: 1.5, sm: 2 },
          mb: 2,
          borderRadius: 2,
          backgroundImage: "linear-gradient(to right, #3f51b5, #2196f3)",
          color: "white",
          width: "97%",
          position: "relative",
          flexShrink: 0,
          overflow: "visible"
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
          width: "100%",
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h4"
              fontWeight="bold"
              sx={{
                fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" },
                mb: 2,
                wordBreak: "break-word"
              }}
            >
              {trip.tripName || "Unnamed Trip"}
            </Typography>
            
            <Box sx={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <CalendarIcon sx={{ mr: 0.5, fontSize: "0.875rem" }} />
                <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
                  {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                </Typography>
              </Box>
              <Chip
                label={statusText}
                color={statusColor}
                size="small"
                sx={{ fontWeight: "bold", height: "28px" }}
              />
              <Typography
                variant="body2"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  fontWeight: "medium",
                  fontSize: "0.875rem"
                }}
              >
                {getDaysRemaining(trip.startDate)}
                {getDaysRemaining(trip.startDate) !== "In progress" && (
                  <span style={{ marginLeft: '4px' }}>until trip</span>
                )}
              </Typography>
            </Box>
          </Box>
            
          <Box sx={{ display: 'flex', gap: 1, flexShrink: 0, alignSelf: 'flex-start' }}>
            <Button
              variant="contained"
              startIcon={<CalendarMonthIcon />}
              onClick={navigateToCalendarView}
              size="small"
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.3)',
                },
                fontWeight: "bold",
                borderRadius: 2,
                textTransform: "none",
                whiteSpace: "nowrap",
                py: 0.5
              }}
            >
              Calendar View
            </Button>
            {userRole === 'owner' && (
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setOpenDeleteDialog(true)}
                size="small"
                sx={{
                  bgcolor: 'rgba(244, 67, 54, 0.8)',
                  '&:hover': {
                    bgcolor: 'rgba(244, 67, 54, 0.9)',
                  },
                  fontWeight: "bold",
                  borderRadius: 2,
                  textTransform: "none",
                  whiteSpace: "nowrap",
                  py: 0.5
                }}
              >
                Delete Trip
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    );
  };
  

  return (
    <Box 
      sx={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden'
      }}
    >
      <Container 
        maxWidth="lg" 
        sx={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          py: 3,
          height: '100%',
          overflow: 'auto'
        }}
      >
        <TripHeader 
          trip={trip} 
          formatDate={formatDate} 
          getDaysRemaining={getDaysRemaining} 
        />

        <Grid container spacing={3}>
          {/* Trip Overview Card */}
          <Grid item xs={12} md={8}>
            <Card elevation={2} sx={{ borderRadius: 2, height: "100%" }}>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ display: "flex", alignItems: "center" }}
                >
                  <CalendarIcon sx={{ mr: 1 }} />
                  Trip Overview
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Trip Duration
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {getTripDuration(trip.startDate, trip.endDate)}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      Start Date
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {formatDate(trip.startDate)}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      End Date
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(trip.endDate)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Total Guests
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {(trip.adults || 0) + (trip.kids || 0)} ({trip.adults || 0}{" "}
                      adults, {trip.kids || 0} children)
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      Location
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {trip.location || trip.destination || "Not specified"}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      Experiences
                    </Typography>
                    <Typography variant="body1">
                      {experiences.length > 0
                        ? `${experiences.length} planned`
                        : "No experiences added"}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Guests Preview Card */}
          <Grid item xs={12} md={4}>
            <Card elevation={2} sx={{ borderRadius: 2, height: "100%" }}>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ display: "flex", alignItems: "center" }}
                  >
                    <PeopleIcon sx={{ mr: 1 }} />
                    Guests
                  </Typography>
                  <Button
                    size="small"
                    endIcon={<ArrowIcon />}
                    sx={{ textTransform: "none" }}
                    onClick={() => navigate(`/trips/${tripId}/guests`)}
                  >
                    Manage
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />

                {trip.guests && trip.guests.length > 0 ? (
                  <>
                    <AvatarGroup max={5} sx={{ mb: 2, justifyContent: "center" }}>
                      {trip.guests.map((guest) => (
                        <Avatar
                          key={guest._id}
                          alt={guest.name}
                          sx={{ bgcolor: stringToColor(guest.name) }}
                        >
                          {guest.name.charAt(0)}
                        </Avatar>
                      ))}
                    </AvatarGroup>

                    <Box sx={{ maxHeight: 200, overflow: "auto" }}>
                      <Grid container spacing={1}>
                        {trip.guests.slice(0, 6).map((guest) => (
                          <Grid item xs={6} key={guest._id}>
                            <Chip
                              avatar={
                                <Avatar
                                  sx={{ bgcolor: stringToColor(guest.name) }}
                                >
                                  {guest.name.charAt(0)}
                                </Avatar>
                              }
                              label={guest.name}
                              variant="outlined"
                              sx={{ width: "100%" }}
                            />
                          </Grid>
                        ))}
                      </Grid>

                      {trip.guests.length > 6 && (
                        <Typography
                          variant="body2"
                          align="center"
                          sx={{
                            mt: 1,
                            color: "text.secondary",
                            fontStyle: "italic",
                          }}
                        >
                          +{trip.guests.length - 6} more guests
                        </Typography>
                      )}
                    </Box>
                  </>
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontStyle: "italic", textAlign: "center" }}
                  >
                    No guests added yet
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Experiences Section */}
          <Grid item xs={12}>
            <Card elevation={2} sx={{ borderRadius: 2, mb: 3 }}>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ display: "flex", alignItems: "center" }}
                  >
                    <ActivityIcon sx={{ mr: 1 }} />
                    Experiences
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleCreateExperience}
                    size="small"
                  >
                    Create Experience
                  </Button>
                </Box>

                <Tabs
                  value={experienceTab}
                  onChange={handleExperienceTabChange}
                  sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
                >
                  <Tab label={`Upcoming (${upcomingExperiences.length})`} />
                  <Tab label={`Meals (${mealExperiences.length})`} />
                  <Tab label={`Activities (${activityExperiences.length})`} />
                  <Tab label={`Other (${otherExperiences.length})`} />
                  <Tab label={`All (${experiences.length})`} />
                </Tabs>

                <Box sx={{ minHeight: 200 }}>
                  {experiences.length === 0 ? (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        py: 4,
                      }}
                    >
                      <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                      >
                        No experiences added yet
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={handleCreateExperience}
                      >
                        Add your first experience
                      </Button>
                    </Box>
                  ) : (
                    <List>
                      {(experienceTab === 0
                        ? upcomingExperiences
                        : experienceTab === 1
                        ? mealExperiences
                        : experienceTab === 2
                        ? activityExperiences
                        : experienceTab === 3
                        ? otherExperiences
                        : experiences
                      )
                        .slice(0, 5)
                        .map((exp, index) => (
                          <ListItem
                            key={exp._id || index}
                            secondaryAction={
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => handleViewExperience(exp)}
                              >
                                Details
                              </Button>
                            }
                            sx={{
                              mb: 1,
                              border: "1px solid #eee",
                              borderRadius: 1,
                              "&:hover": { backgroundColor: "#f9f9f9" },
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar
                                sx={{ bgcolor: getExperienceTypeColor(exp.type) }}
                              >
                                {getExperienceIcon(exp.type)}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography
                                  variant="subtitle1"
                                  fontWeight="medium"
                                >
                                  {exp.title || exp.type}
                                </Typography>
                              }
                              secondary={
                                <React.Fragment>
                                  <Typography
                                    component="span"
                                    variant="body2"
                                    color="text.primary"
                                  >
                                    {formatDate(exp.date)} •{" "}
                                    {formatTime(exp.startTime)}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    sx={{ display: "block" }}
                                  >
                                    {exp.location || "Location not specified"}
                                  </Typography>
                                </React.Fragment>
                              }
                            />
                          </ListItem>
                        ))}

                      {experienceTab === 4 && experiences.length > 5 && (
                        <Box sx={{ textAlign: "center", mt: 2 }}>
                          <Button
                            variant="text"
                            onClick={() =>
                              navigate(`/trips/${tripId}/experiences`)
                            }
                          >
                            View all {experiences.length} experiences
                          </Button>
                        </Box>
                      )}
                    </List>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Access Links */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Quick Access
            </Typography>
            <Grid container spacing={2}>
              {[
                {
                  icon: <HotelIcon />,
                  title: "Lodging",
                  color: "#4caf50",
                  path: `/trips/${tripId}/lodging`,
                  count: trip.lodgings?.length || 0,
                },
                {
                  icon: <ActivityIcon />,
                  title: "Experiences",
                  color: "#ff9800",
                  path: `/trips/${tripId}/experiences`,
                  count: experiences.length,
                },
                {
                  icon: <ChecklistIcon />,
                  title: "Packing List",
                  color: "#9c27b0",
                  path: `/trips/${tripId}/packing`,
                  count: 0,
                },
                {
                  icon: <BudgetIcon />,
                  title: "Budget",
                  color: "#f44336",
                  path: `/trips/${tripId}/budget`,
                  count: 0,
                },
                {
                  icon: <NotesIcon />,
                  title: "Notes",
                  color: "#2196f3",
                  path: `/trips/${tripId}/notes`,
                  count: 0,
                },
              ].map((item, index) => (
                <Grid item xs={6} md={2.4} key={index}>
                  <Card
                    elevation={2}
                    sx={{
                      borderRadius: 2,
                      cursor: "pointer",
                      transition: "transform 0.2s",
                      "&:hover": { transform: "translateY(-5px)" },
                    }}
                    onClick={() => navigate(item.path)}
                  >
                    <CardContent sx={{ textAlign: "center", p: 2 }}>
                      <Badge
                        badgeContent={item.count}
                        color="primary"
                        sx={{ display: "inline-block", mb: 1 }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: item.color,
                            width: 48,
                            height: 48,
                            margin: "0 auto 8px",
                          }}
                        >
                          {item.icon}
                        </Avatar>
                      </Badge>
                      <Typography variant="body1" fontWeight="medium">
                        {item.title}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>

        {/* Experience Details Dialog */}
        <Dialog
          open={openExperienceDialog}
          onClose={() => setOpenExperienceDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          {selectedExperience && (
            <>
              <DialogTitle sx={{ display: "flex", alignItems: "center" }}>
                <Avatar
                  sx={{
                    mr: 1,
                    bgcolor: getExperienceTypeColor(selectedExperience.type),
                  }}
                >
                  {getExperienceIcon(selectedExperience.type)}
                </Avatar>
                <Typography variant="h6">
                  {selectedExperience.title || selectedExperience.type}
                </Typography>
              </DialogTitle>
              <DialogContent dividers>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      <TimeIcon
                        fontSize="small"
                        sx={{ mr: 0.5, verticalAlign: "middle" }}
                      />
                      Date & Time
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {formatDate(selectedExperience.date)}
                      {selectedExperience.startTime &&
                        ` at ${formatTime(selectedExperience.startTime)}`}
                      {selectedExperience.endTime &&
                        ` - ${formatTime(selectedExperience.endTime)}`}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      <PlaceIcon
                        fontSize="small"
                        sx={{ mr: 0.5, verticalAlign: "middle" }}
                      />
                      Location
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {selectedExperience.location || "Location not specified"}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      <GroupIcon
                        fontSize="small"
                        sx={{ mr: 0.5, verticalAlign: "middle" }}
                      />
                      Participating Guests
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {selectedExperience.guests &&
                      selectedExperience.guests.length > 0 ? (
                        <Stack
                          direction="row"
                          spacing={1}
                          flexWrap="wrap"
                          useFlexGap
                        >
                          {selectedExperience.guests.map((guest, idx) => (
                            <Chip
                              key={idx}
                              avatar={
                                <Avatar sx={{ bgcolor: stringToColor(guest) }}>
                                  {guest.charAt(0)}
                                </Avatar>
                              }
                              label={guest}
                              size="small"
                              sx={{ mb: 1 }}
                            />
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No guests specified
                        </Typography>
                      )}
                    </Box>
                  </Grid>

                  {selectedExperience.details && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        <NotesIcon
                          fontSize="small"
                          sx={{ mr: 0.5, verticalAlign: "middle" }}
                        />
                        Details
                      </Typography>
                      <Typography variant="body1" paragraph>
                        {selectedExperience.details}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={() =>
                    navigate(
                      `/trips/${tripId}/edit-experience/${selectedExperience._id}`
                    )
                  }
                  color="primary"
                  startIcon={<EditIcon />}
                >
                  Edit
                </Button>
                <Button
                  onClick={() => setOpenExperienceDialog(false)}
                  color="primary"
                >
                  Close
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Collaborators Section */}
        {(userRole === 'owner' || userRole === 'admin') && (
          <Grid item xs={12}>
            <Card elevation={2} sx={{ borderRadius: 2, mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
                  <GroupIcon sx={{ mr: 1 }} />
                  Manage Collaborators
                </Typography>
                <Divider sx={{ my: 2 }} />

                {error && (
                  <Typography color="error" sx={{ mb: 2 }}>
                    {error}
                  </Typography>
                )}

                <Box component="form" onSubmit={handleAddCollaborator} sx={{ mb: 3 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={8}>
                      <TextField
                        fullWidth
                        type="email"
                        value={newCollaboratorEmail}
                        onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                        placeholder="Enter email to invite"
                        required
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        startIcon={<AddIcon />}
                      >
                        Add Collaborator
                      </Button>
                    </Grid>
                  </Grid>
                </Box>

                <Button
                  onClick={generateInviteCode}
                  variant="outlined"
                  startIcon={<ShareIcon />}
                  sx={{ mb: 3 }}
                >
                  Generate Invite Code
                </Button>

                {inviteCode && (
                  <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
                    <Typography variant="body2">Share this code:</Typography>
                    <Typography variant="h6" sx={{ mt: 1 }}>
                      {inviteCode}
                    </Typography>
                  </Paper>
                )}

                <List>
                  {collaborators.map((collaborator) => (
                    <ListItem
                      key={collaborator.user._id}
                      secondaryAction={
                        userRole === 'owner' && (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                              select
                              size="small"
                              value={collaborator.role}
                              onChange={(e) =>
                                handleUpdateRole(collaborator.user._id, e.target.value)
                              }
                              sx={{ minWidth: 120 }}
                            >
                              <MenuItem value="viewer">Viewer</MenuItem>
                              <MenuItem value="editor">Editor</MenuItem>
                              <MenuItem value="admin">Admin</MenuItem>
                            </TextField>
                            <IconButton
                              edge="end"
                              color="error"
                              onClick={() => handleRemoveCollaborator(collaborator.user._id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        )
                      }
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: stringToColor(collaborator.user.email) }}>
                          {collaborator.user.email.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={collaborator.user.email}
                        secondary={`Role: ${collaborator.role}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Delete Trip Dialog */}
        <Dialog
          open={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Delete Trip</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this trip? This action cannot be undone.
              All experiences, chats, and associated data will be permanently deleted.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setOpenDeleteDialog(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteTrip}
              color="error"
              disabled={deleteLoading}
              startIcon={deleteLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
            >
              {deleteLoading ? 'Deleting...' : 'Delete Trip'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

// Helper function to generate avatar colors from strings
function stringToColor(string) {
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
}

// Helper function to get color based on experience type
function getExperienceTypeColor(type) {
  switch (type?.toLowerCase()) {
    case "meal":
      return "#ff9800"; // Orange
    case "activity":
      return "#4caf50"; // Green
    case "event":
      return "#9c27b0"; // Purple
    default:
      return "#2196f3"; // Blue
  }
}

export default TripDashboard;
