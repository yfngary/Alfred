import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Chat as ChatIcon,
  ExpandMore,
  ExpandLess,
  Add as AddIcon,
  Tag as TagIcon
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
  padding: "1rem",
  display: "flex",
  flexDirection: "column",
  transition: "width 0.3s ease",
  overflow: "hidden",
});

// Styles for the toggle button
const toggleButtonStyle = {
  backgroundColor: "transparent",
  border: "none",
  color: "white",
  cursor: "pointer",
  fontSize: "1.2rem",
  marginBottom: "1rem",
};

const headerStyle = {
  fontSize: "1.5rem",
  fontWeight: "bold",
  marginBottom: "1rem",
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

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`http://localhost:5001/api/userTrips`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.trips) {
          console.log("Trips data:", data.trips);
          console.log("First trip experiences:", data.trips[0]?.experiences);
          if (data.trips[0]?.experiences) {
            console.log("Experience chat IDs:", data.trips[0].experiences.map(exp => ({
              title: exp.title,
              chatId: exp.chat?._id
            })));
          }
          setTrips(data.trips);
        }
      })
      .catch((error) => console.error("Error fetching trips:", error));
  }, []);

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
      <button
        style={toggleButtonStyle}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {isOpen ? "<" : ">"}
      </button>

      {isOpen && (
        <>
          <h1 style={headerStyle}>Trip Planner</h1>

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
                padding: '8px 0',
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
                padding: '8px 0',
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

          <Box sx={{ marginTop: 'auto' }}>
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
