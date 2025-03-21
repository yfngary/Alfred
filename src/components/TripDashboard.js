import React, { useState, useEffect, useCallback } from "react";
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
  FormControl,
  InputLabel,
  Select,
  Alert,
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
import { debounce } from 'lodash';
import axios from "../utils/axiosConfig";

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
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editedTrip, setEditedTrip] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [openGuestsDialog, setOpenGuestsDialog] = useState(false);
  const [editedGuests, setEditedGuests] = useState([]);
  const [guestEditLoading, setGuestEditLoading] = useState(false);
  const [newGuestName, setNewGuestName] = useState('');
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [openRelationshipsDialog, setOpenRelationshipsDialog] = useState(false);
  const [guests, setGuests] = useState([{ email: '', phone: '', name: '' }]);
  const [sending, setSending] = useState(false);
  const [searchResults, setSearchResults] = useState({});

  useEffect(() => {
    const fetchTripDetails = async (tripId) => {
      try {
        setLoading(true);
        const userStr = localStorage.getItem("user");
        let userId = null;
        
        if (userStr) {
          try {
            // Try parsing as JSON first
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

        console.log("Fetching trip details for ID:", tripId);
        
        // Skip the failing endpoint and directly use the working one
        const response = await axios.get('/api/trips/userTrips');
        console.log("UserTrips response:", response.data);
        
        let tripData;
        
        // Find the matching trip in the list
        if (response.data.trips && Array.isArray(response.data.trips)) {
          const matchingTrip = response.data.trips.find(trip => trip._id === tripId);
          if (matchingTrip) {
            tripData = matchingTrip;
          } else {
            throw new Error("Trip not found in user trips");
          }
        } else {
          throw new Error("Invalid response format from userTrips endpoint");
        }

        console.log("Trip data for display:", tripData);

        if (!tripData) {
          throw new Error("Could not extract trip data from response");
        }

        setTrip(tripData);

        // Set user role - compare both as strings to ensure proper matching
        // Add defensive checks to avoid errors with null values
        if (userId && tripData.userId && (userId === tripData.userId || userId === tripData.userId.toString())) {
          setUserRole('owner');
        } else {
          // Add defensive checks for collaborators
          const collaborators = tripData.collaborators || [];
          const collaborator = collaborators.find(c => 
            c && c.user && 
            (c.user._id === userId || 
             c.user._id === userId?.toString() || 
             c.user === userId || 
             c.user === userId?.toString())
          );
          const role = collaborator?.role || 'viewer';
          setUserRole(role);
        }

        // Also add a defensive check here
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
    console.log("Deleting trip with ID:", tripId);
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

  const handleEditTrip = async () => {
    setEditLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Helper function to format date in UTC
      const formatDateForServer = (dateString) => {
        // Split the date string into parts
        const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
        // Create date in UTC (month is 0-based in Date constructor)
        const date = Date.UTC(year, month - 1, day, 12, 0, 0);
        return new Date(date).toISOString();
      };

      // Create a copy of editedTrip with adjusted dates
      const adjustedTrip = {
        ...editedTrip,
        startDate: formatDateForServer(editedTrip.startDate),
        endDate: formatDateForServer(editedTrip.endDate)
      };

      const response = await fetch(`http://localhost:5001/api/trips/${tripId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(adjustedTrip)
      });

      if (!response.ok) {
        throw new Error('Failed to update trip');
      }

      const data = await response.json();
      // Update the trip state with the response data
      const updatedTrip = data.trip || data;
      setTrip(updatedTrip);
      setOpenEditDialog(false);
      refreshTrips(); // Refresh trips in NavBar
    } catch (error) {
      console.error('Error updating trip:', error);
      setError(error.message);
    } finally {
      setEditLoading(false);
    }
  };

  // Initialize guests and groups when opening the dialog
  useEffect(() => {
    if (openGuestsDialog && trip) {
      // Initialize guests with proper IDs, type, and contact info
      const guestsWithIds = (trip.guests || []).map(guest => ({
        ...guest,
        id: guest._id || guest.id, // Use existing ID or MongoDB _id
        type: guest.type || 'adult',
        email: guest.email || '',
        phone: guest.phone || '',
        name: guest.name || ''
      }));
      setEditedGuests(guestsWithIds);

      // Initialize groups from trip's guestRelationships with proper IDs
      const initialGroups = (trip.guestRelationships || []).map(group => ({
        ...group,
        id: group._id || group.id || `group-${Date.now()}-${Math.random()}`,
        level1: group.level1.map(guestId => {
          // Find the guest with this ID in the trip's guests array
          const guest = trip.guests.find(g => g._id === guestId);
          return guest ? guest._id : guestId;
        }),
        level2: group.level2.map(guestId => {
          // Find the guest with this ID in the trip's guests array
          const guest = trip.guests.find(g => g._id === guestId);
          return guest ? guest._id : guestId;
        })
      }));
      setGroups(initialGroups);

      // Create new group if none exist
      if (initialGroups.length === 0) {
        setGroups([{
          id: `group-${Date.now()}-${Math.random()}`,
          name: 'New Group',
          level1: [],
          level2: []
        }]);
      }
    }
  }, [openGuestsDialog, trip]);

  // Add handler for updating guest info
  const handleUpdateGuestInfo = (index, field, value) => {
    const updatedGuests = [...editedGuests];
    updatedGuests[index] = {
      ...updatedGuests[index],
      [field]: value
    };
    setEditedGuests(updatedGuests);
  };

  // Add handler for removing a guest
  const handleRemoveGuest = (index) => {
    const guestToRemove = editedGuests[index];
    
    // Remove guest from any groups they're in
    setGroups(prevGroups => prevGroups.map(group => ({
      ...group,
      level1: group.level1.filter(id => id !== guestToRemove.id),
      level2: group.level2.filter(id => id !== guestToRemove.id)
    })));

    // Remove guest from editedGuests
    setEditedGuests(prev => prev.filter((_, i) => i !== index));
  };

  // Update handleAddGuest to include guest type
  const handleAddGuest = (type = 'adult') => {
    if (newGuestName.trim()) {
      const newGuest = {
        id: `temp-${Date.now()}-${Math.random()}`,
        name: newGuestName.trim(),
        email: '',
        phone: '',
        type: type
      };
      setEditedGuests(prev => [...prev, newGuest]);
      setNewGuestName('');
    }
  };

  // Add handler for updating guest type
  const handleUpdateGuestType = (index, newType) => {
    const updatedGuests = [...editedGuests];
    updatedGuests[index] = {
      ...updatedGuests[index],
      type: newType
    };
    setEditedGuests(updatedGuests);

    // Remove from any groups since type changed
    const guestId = updatedGuests[index].id;
    setGroups(prevGroups => prevGroups.map(group => ({
      ...group,
      level1: group.level1.filter(id => id !== guestId),
      level2: group.level2.filter(id => id !== guestId)
    })));
  };

  // Update handleAddToGroup to handle level1/level2 based on guest type
  const handleAddToGroup = (guestId, groupId) => {
    const guest = editedGuests.find(g => g.id === guestId);
    if (!guest) return;

    setGroups(prevGroups => {
      // Remove guest from all other groups first
      const updatedGroups = prevGroups.map(group => ({
        ...group,
        level1: group.level1.filter(id => id !== guestId),
        level2: group.level2.filter(id => id !== guestId)
      }));

      // Add guest to the selected group in the appropriate level
      return updatedGroups.map(group => {
        if (group.id === groupId) {
          if (guest.type === 'adult') {
            return {
              ...group,
              level1: [...group.level1, guestId]
            };
          } else {
            return {
              ...group,
              level2: [...group.level2, guestId]
            };
          }
        }
        return group;
      });
    });
  };

  // Update handleRemoveFromGroup to handle both levels
  const handleRemoveFromGroup = (guestId, groupId) => {
    setGroups(prevGroups => prevGroups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          level1: group.level1.filter(id => id !== guestId),
          level2: group.level2.filter(id => id !== guestId)
        };
      }
      return group;
    }));
  };

  // Update handleUpdateGuests to save with the new structure
  const handleUpdateGuests = async () => {
    setGuestEditLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Clean up the guest data - remove temporary IDs
      const cleanedGuests = editedGuests.map(({ id, ...guest }) => guest);

      // Clean up the group data while preserving all relationships
      const cleanedGroups = groups.map(group => ({
        name: group.name,
        // For level1 and level2, convert to full guest objects
        level1: group.level1
          .filter(id => id && typeof id === 'string' && !id.startsWith('temp-'))
          .map(guestId => {
            const guest = editedGuests.find(g => g._id === guestId || g.id === guestId);
            return guest ? {
              _id: guest._id || guest.id,
              name: guest.name,
              email: guest.email || '',
              phone: guest.phone || '',
              type: guest.type || 'adult'
            } : null;
          }).filter(Boolean),
        level2: group.level2
          .filter(id => id && typeof id === 'string' && !id.startsWith('temp-'))
          .map(guestId => {
            const guest = editedGuests.find(g => g._id === guestId || g.id === guestId);
            return guest ? {
              _id: guest._id || guest.id,
              name: guest.name,
              email: guest.email || '',
              phone: guest.phone || '',
              type: guest.type || 'adult'
            } : null;
          }).filter(Boolean)
      })).filter(group => {
        // Keep groups that have at least one member or already exist in the trip
        const existingGroup = trip.guestRelationships?.find(g => g.name === group.name);
        return group.level1.length > 0 || group.level2.length > 0 || existingGroup;
      });

      // Create an update object that preserves existing trip data
      const updateData = {
        ...trip,
        guests: cleanedGuests,
        guestRelationships: cleanedGroups
      };

      // Remove MongoDB-specific fields
      delete updateData._id;
      delete updateData.__v;
      delete updateData.createdAt;
      delete updateData.updatedAt;

      const response = await fetch(`http://localhost:5001/api/trips/${tripId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update guests');
      }

      const data = await response.json();
      const updatedTrip = data.trip || data;
      setTrip(updatedTrip);
      setOpenGuestsDialog(false);
      refreshTrips();
    } catch (error) {
      console.error('Error updating guests:', error);
      setError(error.message);
    } finally {
      setGuestEditLoading(false);
    }
  };

  // Debounced search for existing users
  const searchExistingUser = useCallback(
    debounce(async (email, index) => {
      if (!email) return;
      try {
        const response = await fetch(`/api/users/search?email=${email}`);
        const data = await response.json();
        setSearchResults(prev => ({
          ...prev,
          [index]: data.user
        }));
      } catch (error) {
        console.error('Error searching user:', error);
      }
    }, []),
    []
  );

  // Handle email input change with existing user search
  const handleEmailChange = (index, value) => {
    const newGuests = [...guests];
    newGuests[index].email = value;
    setGuests(newGuests);
    searchExistingUser(value, index);
  };

  const handleCreateTripWithInvitations = async () => {
    try {
      setSending(true);
      
      // First create the trip
      const tripResponse = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(trip)
      });

      if (!tripResponse.ok) throw new Error('Failed to create trip');
      const { trip } = await tripResponse.json();

      // Then send invitations
      const validGuests = guests.filter(g => g.email || g.phone);
      
      const inviteResponse = await fetch(`/api/trips/${trip._id}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          guests: validGuests.map(guest => ({
            ...guest,
            isExistingUser: !!searchResults[guests.indexOf(guest)]
          }))
        })
      });

      if (!inviteResponse.ok) throw new Error('Failed to send invitations');

      onTripUpdate(trip);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
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
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography
                    variant="h6"
                    sx={{ display: "flex", alignItems: "center" }}
                  >
                    <CalendarIcon sx={{ mr: 1 }} />
                    Trip Overview
                  </Typography>
                  {userRole === 'owner' && (
                    <IconButton
                      size="small"
                      onClick={() => {
                        setEditedTrip({
                          tripName: trip.tripName,
                          startDate: trip.startDate,
                          endDate: trip.endDate,
                          location: trip.location || trip.destination
                        });
                        setOpenEditDialog(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  )}
                </Box>
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
                      {trip.guests?.length || 0} guests
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
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => navigate(`/trips/${tripId}/guests`)}
                      startIcon={<EditIcon />}
                    >
                      Manage Guests
                    </Button>
                  </Box>
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
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontStyle: "italic", mb: 2 }}
                    >
                      No guests added yet
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate(`/trips/${tripId}/guests`)}
                      startIcon={<AddIcon />}
                    >
                      Add Guests
                    </Button>
                  </Box>
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

          {/* Lodging Section */}
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
                    <HotelIcon sx={{ mr: 1 }} />
                    Lodging
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => navigate(`/trips/${tripId}/lodging`)}
                    size="small"
                  >
                    Add Lodging
                  </Button>
                </Box>

                {trip.lodgings && trip.lodgings.length > 0 ? (
                  <List>
                    {trip.lodgings.slice(0, 3).map((lodging) => (
                      <ListItem
                        key={lodging._id}
                        sx={{
                          mb: 1,
                          border: "1px solid #eee",
                          borderRadius: 1,
                          "&:hover": { backgroundColor: "#f9f9f9" },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <HotelIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" fontWeight="medium">
                              {lodging.name}
                              <Chip
                                label={lodging.type}
                                size="small"
                                sx={{ ml: 1 }}
                                color="primary"
                              />
                            </Typography>
                          }
                          secondary={
                            <React.Fragment>
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.primary"
                                sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}
                              >
                                <LocationIcon fontSize="small" />
                                {lodging.location}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}
                              >
                                <CalendarIcon fontSize="small" />
                                {formatDate(lodging.checkIn)} - {formatDate(lodging.checkOut)}
                              </Typography>
                            </React.Fragment>
                          }
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => navigate(`/trips/${tripId}/lodging`)}
                        >
                          Details
                        </Button>
                      </ListItem>
                    ))}

                    {trip.lodgings.length > 3 && (
                      <Box sx={{ textAlign: "center", mt: 2 }}>
                        <Button
                          variant="text"
                          onClick={() => navigate(`/trips/${tripId}/lodging`)}
                        >
                          View all {trip.lodgings.length} lodgings
                        </Button>
                      </Box>
                    )}
                  </List>
                ) : (
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
                      No lodging added yet
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => navigate(`/trips/${tripId}/lodging`)}
                    >
                      Add your first lodging
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Access Links */}
          <Grid item xs={12}
          sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          >
            <Typography variant="h6" gutterBottom>
              Quick Access
            </Typography>
            <Grid container spacing={2}>
              {[
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
                <Grid item xs={6} md={3} key={index}>
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

        {/* Edit Trip Dialog */}
        <Dialog
          open={openEditDialog}
          onClose={() => setOpenEditDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Edit Trip Details</DialogTitle>
          <DialogContent>
            <Box component="form" sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Trip Name"
                    value={editedTrip?.tripName || ''}
                    onChange={(e) => setEditedTrip({ ...editedTrip, tripName: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    value={editedTrip?.startDate?.split('T')[0] || ''}
                    onChange={(e) => setEditedTrip({ ...editedTrip, startDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    value={editedTrip?.endDate?.split('T')[0] || ''}
                    onChange={(e) => setEditedTrip({ ...editedTrip, endDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={editedTrip?.location || ''}
                    onChange={(e) => setEditedTrip({ ...editedTrip, location: e.target.value })}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEditDialog(false)} disabled={editLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleEditTrip}
              variant="contained"
              disabled={editLoading}
              startIcon={editLoading ? <CircularProgress size={20} /> : <EditIcon />}
            >
              {editLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>

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

        {/* Guests Edit Dialog */}
        <Dialog
          open={openGuestsDialog}
          onClose={() => setOpenGuestsDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Edit Guests</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              {/* Add New Guest Section */}
              <Box sx={{ mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={7}>
                    <TextField
                      fullWidth
                      label="Guest Name"
                      value={newGuestName}
                      onChange={(e) => setNewGuestName(e.target.value)}
                      placeholder="Enter guest name"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={5}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        onClick={() => handleAddGuest('adult')}
                        disabled={!newGuestName.trim()}
                        startIcon={<AddIcon />}
                        sx={{ flex: 1 }}
                      >
                        Add Adult
                      </Button>
                      <Button
                        variant="contained"
                        onClick={() => handleAddGuest('child')}
                        disabled={!newGuestName.trim()}
                        startIcon={<AddIcon />}
                        color="secondary"
                        sx={{ flex: 1 }}
                      >
                        Add Child
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Guest List */}
              <Typography variant="h6" gutterBottom>
                All Guests
              </Typography>
              <List>
                {guests.map((guest, index) => {
                  // Find which group this guest belongs to by checking both level1 and level2 arrays
                  const guestGroup = groups.find(g => 
                    g.level1.includes(guest._id) || g.level2.includes(guest._id)
                  );
                  
                  return (
                    <ListItem
                      key={guest.email}
                      sx={{
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        gap: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 2,
                        p: 2,
                        bgcolor: guest.type === 'child' ? 'rgba(156, 39, 176, 0.05)' : 'transparent'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Avatar sx={{ bgcolor: stringToColor(guest.name) }}>
                          {guest.name.charAt(0)}
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <TextField
                            fullWidth
                            label="Name"
                            value={guest.name}
                            onChange={(e) => handleUpdateGuestInfo(index, 'name', e.target.value)}
                            size="small"
                          />
                        </Box>
                        <FormControl sx={{ minWidth: 120 }}>
                          <InputLabel>Type</InputLabel>
                          <Select
                            value={guest.type}
                            onChange={(e) => handleUpdateGuestInfo(index, 'type', e.target.value)}
                            size="small"
                            label="Type"
                          >
                            <MenuItem value="adult">Adult</MenuItem>
                            <MenuItem value="child">Child</MenuItem>
                          </Select>
                        </FormControl>
                        <FormControl sx={{ minWidth: 150 }}>
                          <InputLabel>Group</InputLabel>
                          <Select
                            value={guestGroup?.id || ''}
                            onChange={(e) => {
                              const newGroupId = e.target.value;
                              if (newGroupId) {
                                handleAddToGroup(guest._id, newGroupId);
                              } else if (guestGroup) {
                                handleRemoveFromGroup(guest._id, guestGroup.id);
                              }
                            }}
                            size="small"
                            label="Group"
                          >
                            <MenuItem value="">
                              <em>None</em>
                            </MenuItem>
                            {groups.map((group) => (
                              <MenuItem key={group.id} value={group.id}>
                                {group.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleRemoveGuest(index)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Email"
                            value={guest.email}
                            onChange={(e) => handleEmailChange(index, e.target.value)}
                            type="email"
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Phone"
                            value={guest.phone}
                            onChange={(e) => handleUpdateGuestInfo(index, 'phone', e.target.value)}
                            type="tel"
                            size="small"
                          />
                        </Grid>
                      </Grid>
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenGuestsDialog(false)} disabled={sending}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateTripWithInvitations}
              disabled={sending}
            >
              {sending ? 'Sending...' : 'Create Trip & Send Invites'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Guest Relationships Dialog */}
        <Dialog
          open={openRelationshipsDialog}
          onClose={() => setOpenRelationshipsDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Guest Groups & Relationships</DialogTitle>
          <DialogContent>
            {trip.guestRelationships && trip.guestRelationships.length > 0 ? (
              <Box sx={{ mt: 2 }}>
                {trip.guestRelationships.map((group) => {
                  // Find guests for each level
                  const level1Guests = group.level1
                    .map(guestObj => {
                      // Handle both formats - if it's already a guest object with name
                      if (guestObj && guestObj.name) {
                        return guestObj;
                      }
                      // Otherwise if it's an ID string, find the guest in the trip.guests array
                      const guestId = typeof guestObj === 'string' ? guestObj : guestObj._id || guestObj.id;
                      return trip.guests.find(g => g._id === guestId || g._id.toString() === guestId);
                    })
                    .filter(Boolean);
                  
                  const level2Guests = group.level2
                    .map(guestObj => {
                      // Handle both formats - if it's already a guest object with name
                      if (guestObj && guestObj.name) {
                        return guestObj;
                      }
                      // Otherwise if it's an ID string, find the guest in the trip.guests array
                      const guestId = typeof guestObj === 'string' ? guestObj : guestObj._id || guestObj.id;
                      return trip.guests.find(g => g._id === guestId || g._id.toString() === guestId);
                    })
                    .filter(Boolean);

                  return (
                    <Paper
                      key={group._id}
                      elevation={3}
                      sx={{
                        p: 2,
                        mb: 2,
                        bgcolor: '#f5f5f5',
                        border: '1px solid',
                        borderColor: 'primary.main',
                        borderRadius: 2
                      }}
                    >
                      <Typography variant="h6" gutterBottom color="primary">
                        {group.name}
                      </Typography>
                      
                      <Grid container spacing={2}>
                        {/* Adults Section */}
                        <Grid item xs={12} md={6}>
                          <Paper
                            sx={{
                              p: 2,
                              bgcolor: '#e3f2fd',
                              border: '1px solid #90caf9'
                            }}
                          >
                            <Typography variant="subtitle1" gutterBottom>
                              Adults
                            </Typography>
                            <Stack spacing={1}>
                              {level1Guests.map((guest) => (
                                <Chip
                                  key={guest._id}
                                  avatar={
                                    <Avatar sx={{ bgcolor: stringToColor(guest.name) }}>
                                      {guest.name.charAt(0)}
                                    </Avatar>
                                  }
                                  label={guest.name}
                                  sx={{ justifyContent: 'flex-start' }}
                                />
                              ))}
                              {level1Guests.length === 0 && (
                                <Typography variant="body2" color="text.secondary">
                                  No adults in this group
                                </Typography>
                              )}
                            </Stack>
                          </Paper>
                        </Grid>

                        {/* Children Section */}
                        <Grid item xs={12} md={6}>
                          <Paper
                            sx={{
                              p: 2,
                              bgcolor: '#fce4ec',
                              border: '1px solid #f48fb1'
                            }}
                          >
                            <Typography variant="subtitle1" gutterBottom>
                              Children
                            </Typography>
                            <Stack spacing={1}>
                              {level2Guests.map((guest) => (
                                <Chip
                                  key={guest._id}
                                  avatar={
                                    <Avatar sx={{ bgcolor: stringToColor(guest.name) }}>
                                      {guest.name.charAt(0)}
                                    </Avatar>
                                  }
                                  label={guest.name}
                                  sx={{ justifyContent: 'flex-start' }}
                                />
                              ))}
                              {level2Guests.length === 0 && (
                                <Typography variant="body2" color="text.secondary">
                                  No children in this group
                                </Typography>
                              )}
                            </Stack>
                          </Paper>
                        </Grid>
                      </Grid>
                    </Paper>
                  );
                })}
              </Box>
            ) : (
              <Box sx={{ 
                py: 4, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                gap: 2 
              }}>
                <Typography color="text.secondary">
                  No guest groups have been created yet.
                </Typography>
                {userRole === 'owner' && (
                  <Button
                    variant="contained"
                    onClick={() => {
                      setOpenRelationshipsDialog(false);
                      setGuests(trip.guests || []);
                      setOpenGuestsDialog(true);
                    }}
                    startIcon={<EditIcon />}
                  >
                    Edit Guest Groups
                  </Button>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenRelationshipsDialog(false)}>
              Close
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

// Different email templates for existing vs new users
const sendEmailInvitation = async (email, trip, token) => {
  const joinLink = `${process.env.APP_URL}/join-trip/${token}`;
  
  const emailTemplate = {
    to: email,
    subject: `You're invited to join ${trip.tripName}!`,
    html: `
      <h1>You're invited to join ${trip.tripName}!</h1>
      <p>Trip Details:</p>
      <ul>
        <li>Dates: ${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}</li>
        <li>Location: ${trip.location}</li>
        <li>Host: ${trip.host.name}</li>
      </ul>
      <a href="${joinLink}">Click here to create your account and join the trip!</a>
    `
  };
  
  return await sendGrid.send(emailTemplate);
};

const sendTripAddedEmail = async (email, trip) => {
  const tripLink = `${process.env.APP_URL}/trips/${trip._id}`;
  
  const emailTemplate = {
    to: email,
    subject: `You've been added to ${trip.tripName}!`,
    html: `
      <h1>You've been added to ${trip.tripName}!</h1>
      <p>Trip Details:</p>
      <ul>
        <li>Dates: ${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}</li>
        <li>Location: ${trip.location}</li>
        <li>Host: ${trip.host.name}</li>
      </ul>
      <a href="${tripLink}">Click here to view the trip!</a>
    `
  };
  
  return await sendGrid.send(emailTemplate);
};

export default TripDashboard;
