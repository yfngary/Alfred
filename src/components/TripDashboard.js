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

const TripDashboard = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [experienceTab, setExperienceTab] = useState(0);
  const [openExperienceDialog, setOpenExperienceDialog] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState(null);

  useEffect(() => {
    const fetchTripDetails = async (tripId) => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

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

        // Determine where the trip data is located in the response
        if (data && data.trip) {
          setTrip(data.trip);
        } else if (data && typeof data === "object") {
          // Check if data itself is the trip object by looking for expected properties
          if ("tripName" in data || "_id" in data || "startDate" in data) {
            setTrip(data);
          } else if (data.trips && data.trips.length > 0) {
            // In case the API returns an array of trips\
            setTrip(data.trips[0]);
          } else {
            throw new Error("Trip data not found in API response");
          }
        } else {
          throw new Error("Invalid response format from API");
        }
      } catch (err) {
        console.error("Error fetching trip details:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (tripId) {
      fetchTripDetails(tripId);
    } else {
      console.warn("No tripId provided, skipping fetch");
    }

    return () => {
      console.log("Cleaning up effect for tripId:", tripId);
    };
  }, [tripId]);

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
            <Typography
              variant="h4"
              fontWeight="bold"
              sx={{
                fontSize: { xs: "1.25rem", sm: "1.5rem", md: "2rem" },
                wordBreak: "break-word"
              }}
            >
              {trip.tripName || "Unnamed Trip"}
            </Typography>
            
            <Button
              variant="contained"
              startIcon={<CalendarMonthIcon />}
              onClick={navigateToCalendarView}
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
              Calendar View
            </Button>
          </Box>
  
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", sm: "center" },
              width: "100%",
              gap: 2
            }}
          >
            <Stack direction="column" spacing={1}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <CalendarIcon
                  sx={{ mr: 0.5, fontSize: { xs: "0.9rem", sm: "1rem" } }}
                />
                <Typography
                  variant="body2"
                  sx={{ fontSize: { xs: "0.85rem", sm: "0.9rem" } }}
                >
                  {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                </Typography>
              </Box>
              <Chip
                label={statusText}
                color={statusColor}
                size="small"
                sx={{ fontWeight: "bold", alignSelf: "flex-start" }}
              />
            </Stack>
  
            <Box sx={{ textAlign: "left" }}>
              <Typography
                variant="h6"
                fontWeight="bold"
                sx={{ 
                  fontSize: { xs: "1rem", sm: "1.25rem" }
                }}
              >
                {getDaysRemaining(trip.startDate)}
              </Typography>
              {getDaysRemaining(trip.startDate) !== "In progress" && (
                <Typography
                  variant="body2"
                  sx={{ fontSize: { xs: "0.75rem", sm: "0.85rem" } }}
                >
                  until trip
                </Typography>
              )}
            </Box>
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
