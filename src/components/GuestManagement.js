import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  TextField,
  Grid,
  List,
  ListItem,
  Avatar,
  IconButton,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Tab,
  Tabs,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  ChildCare as ChildIcon
} from '@mui/icons-material';
import { useTrips } from '../context/TripContext';

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

export default function GuestManagement() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { refreshTrips } = useTrips();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [guests, setGuests] = useState([]);
  const [groups, setGroups] = useState([]);
  const [newGuest, setNewGuest] = useState({
    name: '',
    email: '',
    phone: '',
    type: 'adult'
  });
  const [newGroup, setNewGroup] = useState({
    name: '',
    level1: [],
    level2: []
  });
  const [editingGuest, setEditingGuest] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);

  // Fetch trip data
  useEffect(() => {
    const fetchTripDetails = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await fetch(
          `http://localhost:5001/api/trips/${tripId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch trip details');
        }

        const data = await response.json();
        setTrip(data.trip || data);
        setGuests(data.trip?.guests || data.guests || []);
        setGroups(data.trip?.guestRelationships || data.guestRelationships || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTripDetails();
  }, [tripId]);

  const handleAddGuest = () => {
    if (!newGuest.name.trim()) return;
    
    const guestToAdd = {
      ...newGuest,
      id: `temp-${Date.now()}`,
      _id: `temp-${Date.now()}`
    };
    
    setGuests(prev => [...prev, guestToAdd]);
    setNewGuest({
      name: '',
      email: '',
      phone: '',
      type: 'adult'
    });
  };

  const handleRemoveGuest = (guestId) => {
    setGuests(prev => prev.filter(g => g._id !== guestId));
    // Remove from groups
    setGroups(prev => prev.map(group => ({
      ...group,
      level1: group.level1.filter(id => id !== guestId),
      level2: group.level2.filter(id => id !== guestId)
    })));
  };

  const handleEditGuest = (guest) => {
    setEditingGuest(guest);
    setNewGuest({
      name: guest.name,
      email: guest.email || '',
      phone: guest.phone || '',
      type: guest.type || 'adult'
    });
  };

  const handleUpdateGuest = () => {
    if (!editingGuest || !newGuest.name.trim()) return;
    
    setGuests(prev => prev.map(g => 
      g._id === editingGuest._id ? { ...g, ...newGuest } : g
    ));
    
    setEditingGuest(null);
    setNewGuest({
      name: '',
      email: '',
      phone: '',
      type: 'adult'
    });
  };

  const handleAddGroup = () => {
    if (!newGroup.name.trim()) return;
    
    setGroups(prev => [...prev, {
      ...newGroup,
      id: `group-${Date.now()}`,
      _id: `group-${Date.now()}`
    }]);
    
    setNewGroup({
      name: '',
      level1: [],
      level2: []
    });
  };

  const handleSaveChanges = async () => {
    try {
      setSaveLoading(true);
      const token = localStorage.getItem('token');
      
      // Clean up the data for API
      const cleanedGuests = guests.map(({ id, ...guest }) => guest);
      const cleanedGroups = groups.map(({ id, ...group }) => group);

      const response = await fetch(`http://localhost:5001/api/trips/${tripId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...trip,
          guests: cleanedGuests,
          guestRelationships: cleanedGroups
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update guests');
      }

      refreshTrips();
      navigate(`/trips/${tripId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    console.log(groups, guests), 
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2, color: 'black' }}>
        <IconButton onClick={() => navigate(`/trips/${tripId}`)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">
          Manage Guests - {trip?.tripName}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
          <Tab label="Guests" icon={<PersonIcon />} iconPosition="start" />
          <Tab label="Groups" icon={<GroupIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {currentTab === 0 ? (
        // Guests Tab
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                {editingGuest ? 'Edit Guest' : 'Add New Guest'}
              </Typography>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Name"
                  value={newGuest.name}
                  onChange={(e) => setNewGuest(prev => ({ ...prev, name: e.target.value }))}
                />
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={newGuest.email}
                  onChange={(e) => setNewGuest(prev => ({ ...prev, email: e.target.value }))}
                />
                <TextField
                  fullWidth
                  label="Phone"
                  value={newGuest.phone}
                  onChange={(e) => setNewGuest(prev => ({ ...prev, phone: e.target.value }))}
                />
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={newGuest.type}
                    label="Type"
                    onChange={(e) => setNewGuest(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <MenuItem value="adult">Adult</MenuItem>
                    <MenuItem value="child">Child</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  onClick={editingGuest ? handleUpdateGuest : handleAddGuest}
                  startIcon={editingGuest ? <EditIcon /> : <AddIcon />}
                  disabled={!newGuest.name.trim()}
                >
                  {editingGuest ? 'Update Guest' : 'Add Guest'}
                </Button>
                {editingGuest && (
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setEditingGuest(null);
                      setNewGuest({
                        name: '',
                        email: '',
                        phone: '',
                        type: 'adult'
                      });
                    }}
                  >
                    Cancel Edit
                  </Button>
                )}
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Guest List ({guests.length})
              </Typography>
              <List>
                {guests.map((guest) => (
                  <ListItem
                    key={guest._id}
                    sx={{
                      mb: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      bgcolor: guest.type === 'child' ? 'rgba(156, 39, 176, 0.05)' : 'transparent'
                    }}
                  >
                    <Avatar sx={{ bgcolor: stringToColor(guest.name), mr: 2 }}>
                      {guest.name.charAt(0)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1">
                        {guest.name}
                        <Chip
                          size="small"
                          label={guest.type}
                          sx={{ ml: 1 }}
                          color={guest.type === 'child' ? 'secondary' : 'primary'}
                        />
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {guest.email} {guest.phone && `• ${guest.phone}`}
                      </Typography>
                    </Box>
                    <IconButton onClick={() => handleEditGuest(guest)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleRemoveGuest(guest._id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      ) : (
        // Groups Tab
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Create New Group
              </Typography>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Group Name"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                />
                <Button
                  variant="contained"
                  onClick={handleAddGroup}
                  startIcon={<AddIcon />}
                  disabled={!newGroup.name.trim()}
                >
                  Create Group
                </Button>
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Groups ({groups.length})
              </Typography>
              {groups.map((group, index) => (
                <Paper
                  key={group._id}
                  elevation={0}
                  sx={{
                    p: 2,
                    mb: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1
                  }}
                >
                  <Typography variant="subtitle1" gutterBottom>
                    {group.name}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        Adults
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {group.level1
                          .filter(g => g.type === 'adult')
                          .map(guest => (
                            <Chip
                              key={guest._id}
                              label={guest.name}
                              onClick={() => {
                                const isInGroup = group.level1.includes(guest._id);
                                setGroups(prev => prev.map(g => 
                                  g._id === group._id
                                    ? {
                                        ...g,
                                        level1: isInGroup
                                          ? g.level1.filter(id => id !== guest._id)
                                          : [...g.level1, guest._id]
                                      }
                                    : g
                                ));
                              }}
                              color={group.level1.includes(guest._id) ? 'primary' : 'default'}
                              variant={group.level1.includes(guest._id) ? 'filled' : 'outlined'}
                            />
                          ))}
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="secondary" gutterBottom>
                        Children
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {group.level2
                          .filter(g => g.type === 'child')
                          .map(guest => (
                            <Chip
                              key={guest._id}
                              label={guest.name}
                              onClick={() => {
                                const isInGroup = group.level2.includes(guest._id);
                                setGroups(prev => prev.map(g => 
                                  g._id === group._id
                                    ? {
                                        ...g,
                                        level2: isInGroup
                                          ? g.level2.filter(id => id !== guest._id)
                                          : [...g.level2, guest._id]
                                      }
                                    : g
                                ));
                              }}
                              color={group.level2.includes(guest._id) ? 'secondary' : 'default'}
                              variant={group.level2.includes(guest._id) ? 'filled' : 'outlined'}
                            />
                          ))}
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Paper>
          </Grid>
        </Grid>
      )}

      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={() => navigate(`/trips/${tripId}`)}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSaveChanges}
          disabled={saveLoading}
          startIcon={saveLoading ? <CircularProgress size={20} /> : null}
        >
          {saveLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>
    </Container>
  );
} 