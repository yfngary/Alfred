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
  IconButton,
  Divider,
  Stack,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  Hotel as HotelIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { useTrips } from '../context/TripContext';

export default function LodgingManagement() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { refreshTrips } = useTrips();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lodgings, setLodgings] = useState([]);
  const [editingLodging, setEditingLodging] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [newLodging, setNewLodging] = useState({
    name: '',
    type: 'hotel',
    location: '',
    checkIn: '',
    checkOut: '',
    details: '',
    assignedGuests: []
  });

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
        setLodgings(data.trip?.lodgings || data.lodgings || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTripDetails();
  }, [tripId]);

  const handleAddLodging = () => {
    if (!newLodging.name.trim() || !newLodging.location.trim()) return;
    
    const lodgingToAdd = {
      ...newLodging,
      id: `temp-${Date.now()}`,
      _id: `temp-${Date.now()}`
    };
    
    setLodgings(prev => [...prev, lodgingToAdd]);
    setNewLodging({
      name: '',
      type: 'hotel',
      location: '',
      checkIn: '',
      checkOut: '',
      details: '',
      assignedGuests: []
    });
  };

  const handleRemoveLodging = (lodgingId) => {
    setLodgings(prev => prev.filter(l => l._id !== lodgingId));
  };

  const handleEditLodging = (lodging) => {
    setEditingLodging(lodging);
    setNewLodging({
      name: lodging.name,
      type: lodging.type || 'hotel',
      location: lodging.location,
      checkIn: lodging.checkIn ? formatDateForInput(new Date(lodging.checkIn)) : '',
      checkOut: lodging.checkOut ? formatDateForInput(new Date(lodging.checkOut)) : '',
      details: lodging.details || '',
      assignedGuests: lodging.assignedGuests || []
    });
  };

  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  };

  const handleUpdateLodging = () => {
    if (!editingLodging || !newLodging.name.trim()) return;
    
    setLodgings(prev => prev.map(l => 
      l._id === editingLodging._id ? { ...l, ...newLodging } : l
    ));
    
    setEditingLodging(null);
    setNewLodging({
      name: '',
      type: 'hotel',
      location: '',
      checkIn: '',
      checkOut: '',
      details: '',
      assignedGuests: []
    });
  };

  const handleSaveChanges = async () => {
    try {
      setSaveLoading(true);
      const token = localStorage.getItem('token');
      
      // Clean up the data for API
      const cleanedLodgings = lodgings.map(({ id, ...lodging }) => ({
        ...lodging,
        checkIn: lodging.checkIn ? new Date(lodging.checkIn).toISOString() : null,
        checkOut: lodging.checkOut ? new Date(lodging.checkOut).toISOString() : null
      }));

      const response = await fetch(`http://localhost:5001/api/trips/${tripId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...trip,
          lodgings: cleanedLodgings
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update lodgings');
      }

      refreshTrips();
      navigate(`/trips/${tripId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isValidDateRange = () => {
    if (!newLodging.checkIn || !newLodging.checkOut) return true;
    return new Date(newLodging.checkOut) > new Date(newLodging.checkIn);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate(`/trips/${tripId}`)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">
          Manage Lodging - {trip?.tripName}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {editingLodging ? 'Edit Lodging' : 'Add New Lodging'}
            </Typography>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Name"
                value={newLodging.name}
                onChange={(e) => setNewLodging(prev => ({ ...prev, name: e.target.value }))}
              />
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={newLodging.type}
                  label="Type"
                  onChange={(e) => setNewLodging(prev => ({ ...prev, type: e.target.value }))}
                >
                  <MenuItem value="hotel">Hotel</MenuItem>
                  <MenuItem value="airbnb">Airbnb</MenuItem>
                  <MenuItem value="resort">Resort</MenuItem>
                  <MenuItem value="hostel">Hostel</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Location"
                value={newLodging.location}
                onChange={(e) => setNewLodging(prev => ({ ...prev, location: e.target.value }))}
              />
              <TextField
                fullWidth
                label="Check-in Date"
                type="date"
                value={newLodging.checkIn}
                onChange={(e) => setNewLodging(prev => ({ ...prev, checkIn: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Check-out Date"
                type="date"
                value={newLodging.checkOut}
                onChange={(e) => setNewLodging(prev => ({ ...prev, checkOut: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Details"
                multiline
                rows={4}
                value={newLodging.details}
                onChange={(e) => setNewLodging(prev => ({ ...prev, details: e.target.value }))}
              />
              <FormControl fullWidth>
                <InputLabel>Assigned Guests</InputLabel>
                <Select
                  multiple
                  value={newLodging.assignedGuests}
                  onChange={(e) => setNewLodging(prev => ({ ...prev, assignedGuests: e.target.value }))}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip 
                          key={value} 
                          label={trip?.guests?.find(g => g._id === value)?.name || value}
                          size="small"
                        />
                      ))}
                    </Box>
                  )}
                >
                  {trip?.guests?.map((guest) => (
                    <MenuItem key={guest._id} value={guest._id}>
                      {guest.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {newLodging.checkIn && newLodging.checkOut && !isValidDateRange() && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  Check-out date must be after check-in date
                </Alert>
              )}
              <Button
                variant="contained"
                onClick={editingLodging ? handleUpdateLodging : handleAddLodging}
                startIcon={editingLodging ? <EditIcon /> : <AddIcon />}
                disabled={!newLodging.name.trim() || !newLodging.location.trim() || !isValidDateRange()}
              >
                {editingLodging ? 'Update Lodging' : 'Add Lodging'}
              </Button>
              {editingLodging && (
                <Button
                  variant="outlined"
                  onClick={() => {
                    setEditingLodging(null);
                    setNewLodging({
                      name: '',
                      type: 'hotel',
                      location: '',
                      checkIn: '',
                      checkOut: '',
                      details: '',
                      assignedGuests: []
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
              Lodging List ({lodgings.length})
            </Typography>
            <List>
              {lodgings.map((lodging) => (
                <Card key={lodging._id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="h6">
                          {lodging.name}
                          <Chip
                            label={lodging.type}
                            size="small"
                            sx={{ ml: 1 }}
                            color="primary"
                          />
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <LocationIcon sx={{ mr: 0.5, fontSize: 'small' }} />
                          {lodging.location}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <CalendarIcon sx={{ mr: 0.5, fontSize: 'small' }} />
                          {formatDate(lodging.checkIn)} - {formatDate(lodging.checkOut)}
                        </Typography>
                        {lodging.details && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {lodging.details}
                          </Typography>
                        )}
                        {lodging.assignedGuests?.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                              <GroupIcon sx={{ mr: 0.5, fontSize: 'small' }} />
                              Assigned Guests:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                              {lodging.assignedGuests.map((guestId) => {
                                const guest = trip?.guests?.find(g => g._id === guestId);
                                return (
                                  <Chip
                                    key={guestId}
                                    label={guest?.name || guestId}
                                    size="small"
                                    variant="outlined"
                                  />
                                );
                              })}
                            </Box>
                          </Box>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton onClick={() => handleEditLodging(lodging)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleRemoveLodging(lodging._id)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

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