import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Chat as ChatIcon,
  ExpandMore,
  ExpandLess,
  Add as AddIcon,
  Tag as TagIcon,
  ChevronLeft,
  Menu as MenuIcon
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
  Divider
} from '@mui/material';
import { useTrips } from '../context/TripContext';
import axios from "../utils/axiosConfig";

// Define widths for collapsed and expanded states
const collapsedWidth = "60px";
const expandedWidth = "200px";

// Function to generate nav style based on state
const navStyle = (isOpen) => ({
  position: "fixed",
  left: 0,
  top: 0,
  height: "100vh",
  width: isOpen ? expandedWidth : collapsedWidth,
  backgroundColor: "#3B82F6",
  color: "white",
  display: "flex",
  flexDirection: "column",
  transition: "width 0.3s ease",
  overflow: "hidden",
  boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
  zIndex: 1000,
});

// Styles for the toggle button container
const toggleButtonContainerStyle = {
  display: "flex",
  justifyContent: "flex-end",
  padding: "12px 12px 8px 12px",
  position: "relative",
};

const headerStyle = {
  fontSize: "1.5rem",
  fontWeight: "bold",
  marginBottom: "1rem",
  padding: "0 12px",
};

const channelStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '8px 12px',
  cursor: 'pointer',
  borderRadius: '4px',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
};

const selectedChannelStyle = {
  ...channelStyle,
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
        console.log('Fetching trips with token:', token);
        const response = await axios.get('/api/trips/userTrips');  // Changed from /api/trips to /api/trips/userTrips
        console.log('Trips response:', response.data);
        
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

  const handleTripChange = (tripId) => {
    setSelectedTrip(tripId);
    navigate(`/trips/${tripId}`);
  };

  const handleChatClick = (chatId) => {
    setSelectedChat(chatId);
    navigate(`/chat/${chatId}`);
  };

  const toggleChannels = () => {
    setChannelsOpen(!channelsOpen);
  };

  const toggleTrips = () => {
    setTripsOpen(!tripsOpen);
  };

  return (
    <nav style={navStyle(isOpen)}>
      <div style={toggleButtonContainerStyle}>
        <IconButton
          onClick={() => setIsOpen((prev) => !prev)}
          sx={{
            color: 'white',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '4px',
            minWidth: '32px',
            minHeight: '32px',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            },
            transition: 'background-color 0.2s ease',
          }}
          size="small"
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isOpen ? <ChevronLeft /> : <MenuIcon />}
        </IconButton>
      </div>

      {isOpen && (
        <>
          <Link to="/" style={{ ...headerStyle, textDecoration: 'none', color: 'white', display: 'block' }}>
            Trip Planner
          </Link>

          {/* Navigation Links */}
          <Link to="/createTrip" style={{ color: 'white', textDecoration: 'none', marginBottom: '8px' }}>
            <Box sx={channelStyle}>
              <AddIcon sx={{ marginRight: 1 }} />
              Create Trip
            </Box>
          </Link>
          
          <Link to="/notifications" style={{ color: 'white', textDecoration: 'none', marginBottom: '8px' }}>
            <Box sx={channelStyle}>
              <ChatIcon sx={{ marginRight: 1 }} />
              Notifications
            </Box>
          </Link>

          <Divider sx={{ my: 2, backgroundColor: 'rgba(255, 255, 255, 0.2)' }} />

          {/* Trips Section */}
          <Box sx={{ mb: 2 }}>
            <Box
              onClick={toggleTrips}
              sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                padding: '8px 12px',
                marginBottom: '8px',
                '&:hover': {
                  color: 'rgba(255, 255, 255, 0.8)',
                },
              }}
            >
              {tripsOpen ? <ExpandLess /> : <ExpandMore />}
              <Typography variant="subtitle1" sx={{ marginLeft: 1 }}>
                Your Trips
              </Typography>
            </Box>
            <Collapse in={tripsOpen}>
              <List sx={{ padding: 0 }}>
                {trips.map((trip) => (
                  <ListItem
                    key={trip._id}
                    sx={{
                      ...channelStyle,
                      backgroundColor: selectedTrip === trip._id ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                    }}
                    onClick={() => handleTripChange(trip._id)}
                  >
                    <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
                      <TagIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={trip.tripName}
                      primaryTypographyProps={{
                        style: { 
                          fontSize: '0.9rem',
                          fontWeight: selectedTrip === trip._id ? 600 : 400
                        }
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </Box>

          <Divider sx={{ my: 2, backgroundColor: 'rgba(255, 255, 255, 0.2)' }} />

          {/* Channels Section */}
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <Box
              onClick={toggleChannels}
              sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                padding: '8px 12px',
                marginBottom: '8px',
                '&:hover': {
                  color: 'rgba(255, 255, 255, 0.8)',
                },
              }}
            >
              {channelsOpen ? <ExpandLess /> : <ExpandMore />}
              <Typography variant="subtitle1" sx={{ marginLeft: 1 }}>
                Channels
              </Typography>
            </Box>

            <Collapse in={channelsOpen}>
              <List sx={{ padding: 0 }}>
                {trips.map((trip) => (
                  <React.Fragment key={trip._id}>
                    {/* Trip Channel */}
                    <ListItem
                      sx={trip.chat._id === selectedChat ? selectedChannelStyle : channelStyle}
                      onClick={() => handleChatClick(trip.chat._id)}
                    >
                      <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
                        <TagIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={trip.tripName.toLowerCase().replace(/\s+/g, '-')}
                        primaryTypographyProps={{
                          style: { 
                            fontSize: '0.9rem',
                            fontWeight: trip.chat._id === selectedChat ? 600 : 400
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
                            ...(exp.chat._id === selectedChat ? selectedChannelStyle : {})
                          }}
                          onClick={() => handleChatClick(exp.chat._id)}
                        >
                          <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
                            <TagIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={exp.title.toLowerCase().replace(/\s+/g, '-')}
                            primaryTypographyProps={{
                              style: { 
                                fontSize: '0.9rem',
                                fontWeight: exp.chat._id === selectedChat ? 600 : 400
                              }
                            }}
                          />
                        </ListItem>
                      )
                    ))}
                  </React.Fragment>
                ))}
              </List>
            </Collapse>
          </Box>

          <Box sx={{ marginTop: 'auto', padding: '12px' }}>
            <Link to="/profilePage" style={{ color: 'white', textDecoration: 'none' }}>
              <Box sx={{
                ...channelStyle,
                backgroundColor: '#2563EB',
                '&:hover': {
                  backgroundColor: '#1D4ED8',
                },
              }}>
                Profile
              </Box>
            </Link>
          </Box>
        </>
      )}
    </nav>
  );
}
