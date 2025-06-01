import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Chat as ChatIcon,
  ExpandMore,
  ExpandLess,
  Add as AddIcon,
  Tag as TagIcon,
  ChevronLeft,
  Menu as MenuIcon,
  Luggage as LuggageIcon,
  Forum as ForumIcon,
  Dashboard as DashboardIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { 
  IconButton, 
  Tooltip, 
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  Divider,
  Paper,
  Avatar
} from '@mui/material';
import { useTrips } from '../context/TripContext';
import axios from "../utils/axiosConfig";

// Define widths for collapsed and expanded states
const collapsedWidth = "60px";
const expandedWidth = "230px";

// Colors for dark theme - aligned with TripDashboard
const darkTheme = {
  primary: "rgba(0, 0, 0, 0.6)", // Matching TripDashboard Paper background
  secondary: "rgba(51, 51, 51, 0.7)", // Slightly lighter for hover states
  highlight: "#4776E6", // Matching TripDashboard gradient start
  highlightGradient: "linear-gradient(90deg, #4776E6 0%, #8E54E9 100%)", // Matching button gradients
  text: "#ffffff", // White text
  divider: "rgba(255, 255, 255, 0.1)", // Subtle divider
  selectedItem: "rgba(71, 118, 230, 0.2)", // Blue tint for selected items
};

// Function to generate nav style based on state
const navStyle = (isOpen) => ({
  position: "fixed",
  left: 0,
  top: 0,
  height: "100vh",
  width: isOpen ? expandedWidth : collapsedWidth,
  backgroundColor: darkTheme.primary,
  backdropFilter: "blur(10px)",
  color: darkTheme.text,
  display: "flex",
  flexDirection: "column",
  transition: "width 0.3s ease",
  overflow: "hidden",
  boxShadow: "0 0 10px rgba(0, 0, 0, 0.3)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: "0 16px 16px 0",
  zIndex: 1000,
});

// Styles for the toggle button container
const toggleButtonContainerStyle = {
  display: "flex",
  justifyContent: "flex-end",
  padding: "16px 16px 8px 16px",
  position: "relative",
};

const headerStyle = {
  fontSize: "1.5rem",
  fontWeight: "bold",
  marginBottom: "1rem",
  padding: "0 16px",
};

// Base style for clickable items
const navItemStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '10px 16px',
  cursor: 'pointer',
  borderRadius: '8px',
  margin: '4px 8px',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: darkTheme.secondary,
    transform: 'translateY(-2px)',
  },
};

// Style for trips items
const tripStyle = {
  ...navItemStyle,
  backgroundColor: 'rgba(71, 118, 230, 0.1)', // Blue tint matching the theme
  '&:hover': {
    backgroundColor: 'rgba(71, 118, 230, 0.2)',
    transform: 'translateY(-2px)',
  },
};

const selectedTripStyle = {
  ...tripStyle,
  backgroundColor: 'rgba(71, 118, 230, 0.25)', // More pronounced for selected
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
};

// Style for channel items
const channelStyle = {
  ...navItemStyle,
  backgroundColor: 'rgba(142, 84, 233, 0.1)', // Purple tint (gradient end)
  '&:hover': {
    backgroundColor: 'rgba(142, 84, 233, 0.2)',
    transform: 'translateY(-2px)',
  },
};

const selectedChannelStyle = {
  ...channelStyle,
  backgroundColor: 'rgba(142, 84, 233, 0.25)', // More pronounced for selected
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
};

// Section header style
const sectionHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  padding: '12px 16px',
  marginBottom: '8px',
  borderRadius: '8px',
  fontWeight: 'bold',
  '&:hover': {
    backgroundColor: darkTheme.secondary,
  },
};

export default function NavBar({ isOpen, setIsOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedTrip, setSelectedTrip] = useState("");
  const [trips, setTrips] = useState([]);
  const [channelsOpen, setChannelsOpen] = useState(true);
  const [tripsOpen, setTripsOpen] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const { refreshTrigger } = useTrips();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found");
      return;
    }

    const fetchTrips = async () => {
      try {
        const response = await axios.get('/api/trips/userTrips');
        
        if (response.data && Array.isArray(response.data)) {
          setTrips(response.data);
        } else if (response.data && Array.isArray(response.data.trips)) {
          setTrips(response.data.trips);
        } else {
          console.warn('Unexpected trips response format:', response.data);
          setTrips([]);
        }
      } catch (error) {
        console.error("Error fetching trips:", error.response || error);
        if (error.response?.status === 401) {
          console.log("Unauthorized access - token may be invalid");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
      }
    };

    fetchTrips();
  }, [refreshTrigger]);

  useEffect(() => {
    // Set the selected trip based on the current location
    const match = location.pathname.match(/\/trips\/([^/]+)/);
    if (match && match[1]) {
      setSelectedTrip(match[1]);
    } else {
      setSelectedTrip("");
    }
  }, [location]);

  const handleTripChange = (tripId) => {
    setSelectedTrip(tripId);
    navigate(`/trips/${tripId}`);
  };

  const handleChatClick = (chatId, tripId, experienceId = null) => {
    setSelectedChat(chatId);
    if (experienceId) {
      navigate(`/trips/${tripId}/chat?experienceId=${experienceId}`);
    } else {
      navigate(`/trips/${tripId}/chat`);
    }
  };

  const toggleChannels = () => {
    setChannelsOpen(!channelsOpen);
  };

  const toggleTrips = () => {
    setTripsOpen(!tripsOpen);
  };

  // Generate random avatar background color based on trip name
  const getAvatarColor = (string) => {
    if (!string) return "#4776E6";

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

  return (
    <Paper sx={navStyle(isOpen)} elevation={5}>
      <Box sx={toggleButtonContainerStyle}>
        <IconButton
          onClick={() => setIsOpen((prev) => !prev)}
          sx={{
            color: darkTheme.text,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '8px',
            minWidth: '36px',
            minHeight: '36px',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              transform: 'scale(1.1)',
            },
            transition: 'all 0.2s ease',
          }}
          size="small"
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isOpen ? <ChevronLeft /> : <MenuIcon />}
        </IconButton>
      </Box>

      {isOpen && (
        <>
          <Link to="/dashboard" style={{ ...headerStyle, textDecoration: 'none', color: darkTheme.text, display: 'block' }}>
            <Typography 
              variant="h5" 
              component="div" 
              sx={{ 
                fontWeight: 'bold', 
                letterSpacing: '0.5px',
                background: '-webkit-linear-gradient(45deg, #4776E6, #8E54E9)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Trip Planner
            </Typography>
          </Link>

          {/* Navigation Links */}
          <Box sx={{ mb: 2 }}>
            <Link to="/dashboard" style={{ color: darkTheme.text, textDecoration: 'none' }}>
              <Box sx={{
                ...navItemStyle,
                backgroundColor: location.pathname === '/dashboard' ? 'rgba(71, 118, 230, 0.25)' : 'transparent',
              }}>
                <DashboardIcon sx={{ marginRight: 1.5 }} />
                <Typography variant="body1" fontWeight={500}>Dashboard</Typography>
              </Box>
            </Link>
            
            <Link to="/create-trip" style={{ color: darkTheme.text, textDecoration: 'none' }}>
              <Box sx={{
                ...navItemStyle,
                background: darkTheme.highlightGradient,
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3)',
                },
              }}>
                <AddIcon sx={{ marginRight: 1.5 }} />
                <Typography variant="body1" fontWeight={600}>Create Trip</Typography>
              </Box>
            </Link>
            
            <Link to="/notifications" style={{ color: darkTheme.text, textDecoration: 'none' }}>
              <Box sx={{
                ...navItemStyle,
                backgroundColor: location.pathname === '/notifications' ? 'rgba(71, 118, 230, 0.25)' : 'transparent',
              }}>
                <NotificationsIcon sx={{ marginRight: 1.5 }} />
                <Typography variant="body1" fontWeight={500}>Notifications</Typography>
              </Box>
            </Link>
          </Box>

          <Divider sx={{ my: 2, backgroundColor: darkTheme.divider }} />

          {/* Trips Section */}
          <Box sx={{ mb: 2 }}>
            <Box
              onClick={toggleTrips}
              sx={{
                ...sectionHeaderStyle,
                backgroundImage: 'linear-gradient(135deg, rgba(71, 118, 230, 0.2) 0%, rgba(71, 118, 230, 0.1) 100%)',
              }}
            >
              {tripsOpen ? <ExpandLess /> : <ExpandMore />}
              <LuggageIcon sx={{ mx: 1.5 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Your Trips
              </Typography>
            </Box>
            <Collapse in={tripsOpen}>
              <List sx={{ padding: 0 }}>
                {trips.map((trip) => (
                  <ListItem
                    key={trip._id}
                    sx={{
                      ...(selectedTrip === trip._id ? selectedTripStyle : tripStyle),
                      padding: '6px 8px',
                    }}
                    onClick={() => handleTripChange(trip._id)}
                  >
                    <Avatar 
                      sx={{ 
                        width: 28, 
                        height: 28, 
                        marginRight: 1.5, 
                        bgcolor: getAvatarColor(trip.tripName),
                        fontSize: '0.875rem',
                      }}
                    >
                      {trip.tripName?.charAt(0).toUpperCase() || 'T'}
                    </Avatar>
                    <ListItemText 
                      primary={trip.tripName}
                      primaryTypographyProps={{
                        style: { 
                          fontSize: '0.9rem',
                          fontWeight: selectedTrip === trip._id ? 600 : 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </Box>

          <Divider sx={{ my: 2, backgroundColor: darkTheme.divider }} />

          {/* Channels Section */}
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <Box
              onClick={toggleChannels}
              sx={{
                ...sectionHeaderStyle,
                backgroundImage: 'linear-gradient(135deg, rgba(142, 84, 233, 0.2) 0%, rgba(142, 84, 233, 0.1) 100%)',
              }}
            >
              {channelsOpen ? <ExpandLess /> : <ExpandMore />}
              <ForumIcon sx={{ mx: 1.5 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Channels
              </Typography>
            </Box>

            <Collapse in={channelsOpen}>
              <List sx={{ padding: 0 }}>
                {trips.map((trip) => (
                  trip.chat && (
                    <React.Fragment key={trip._id}>
                      {/* Trip Channel */}
                      <ListItem
                        sx={{
                          ...(trip.chat._id === selectedChat ? selectedChannelStyle : channelStyle),
                          padding: '6px 8px',
                        }}
                        onClick={() => handleChatClick(trip.chat._id, trip._id)}
                      >
                        <Avatar 
                          sx={{ 
                            width: 28, 
                            height: 28, 
                            marginRight: 1.5, 
                            bgcolor: getAvatarColor(trip.tripName + '-chat'),
                            fontSize: '0.875rem',
                          }}
                        >
                          #
                        </Avatar>
                        <ListItemText 
                          primary={trip.tripName.toLowerCase().replace(/\s+/g, '-')}
                          primaryTypographyProps={{
                            style: { 
                              fontSize: '0.9rem',
                              fontWeight: trip.chat._id === selectedChat ? 600 : 500,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }
                          }}
                        />
                      </ListItem>

                      {/* Experience Channels */}
                      {trip.experiences && trip.experiences.map((exp) => (
                        exp.chat && (
                          <ListItem
                            key={exp._id}
                            sx={{
                              ...channelStyle,
                              paddingLeft: '28px',
                              ...(exp.chat._id === selectedChat ? selectedChannelStyle : {}),
                              padding: '6px 8px',
                              marginLeft: '16px',
                            }}
                            onClick={() => handleChatClick(exp.chat._id, trip._id, exp._id)}
                          >
                            <Avatar 
                              sx={{ 
                                width: 24, 
                                height: 24, 
                                marginRight: 1.5, 
                                bgcolor: getAvatarColor(exp.title),
                                fontSize: '0.75rem',
                              }}
                            >
                              #
                            </Avatar>
                            <ListItemText 
                              primary={exp.title.toLowerCase().replace(/\s+/g, '-')}
                              primaryTypographyProps={{
                                style: { 
                                  fontSize: '0.85rem',
                                  fontWeight: exp.chat._id === selectedChat ? 600 : 500,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }
                              }}
                            />
                          </ListItem>
                        )
                      ))}
                    </React.Fragment>
                  )
                ))}
              </List>
            </Collapse>
          </Box>

          <Divider sx={{ mt: 2, backgroundColor: darkTheme.divider }} />

          <Box sx={{ marginTop: 'auto', padding: '16px' }}>
            <Link to="/profile" style={{ color: darkTheme.text, textDecoration: 'none' }}>
              <Box sx={{
                ...navItemStyle,
                backgroundImage: darkTheme.highlightGradient,
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3)',
                },
              }}>
                <PersonIcon sx={{ marginRight: 1.5 }} />
                <Typography variant="body1" fontWeight={600}>Profile</Typography>
              </Box>
            </Link>
          </Box>
        </>
      )}
    </Paper>
  );
}
