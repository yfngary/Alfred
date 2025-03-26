import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
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
  Group as GroupIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { useTrips } from '../context/TripContext';
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Use the same API key as other components
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_API_KEY";

export default function LodgingManagement({ id }) {
  const params = useParams();
  const location = useLocation();
  const tripId = id || params.id;
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
    lodgingType: 'hotel',
    address: '',
    checkIn: '',
    checkOut: '',
    details: '',
    assignedGuests: []
  });
  
  // Google Places Autocomplete Setup
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    debounce: 300,
    requestOptions: { types: ["address"] }, // Restrict to addresses
  });
  
  // Reference for handling clicks outside the suggestions box
  const suggestionsRef = useRef(null);

  // Sync the address field with the Places Autocomplete value
  useEffect(() => {
    setValue(newLodging.address);
  }, [newLodging.address, setValue]);

  // Close suggestions on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        clearSuggestions();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [clearSuggestions]);
  
  // Handle selection of a suggested address
  const handleAddressSelect = async (address) => {
    setValue(address, false);
    clearSuggestions();
    setNewLodging(prev => ({ ...prev, address }));
    
    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      // You can optionally store coordinates with the lodging if needed
      // setNewLodging(prev => ({ ...prev, coordinates: { lat, lng } }));
    } catch (error) {
      console.error("Error fetching location details:", error);
    }
  };

  // Fetch trip data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        const response = await fetch(`http://localhost:5001/api/trips/${tripId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch trip data');
        }
        
        const data = await response.json();
        setTrip(data);
        setLodgings(data.lodgings || []);
        
        // Check if there's a lodging to edit from the location state
        if (location.state?.editLodging) {
          handleEditLodging(location.state.editLodging);
        }
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [tripId, location.state]);

  const handleAddLodging = async () => {
    if (!newLodging.name?.trim() || !newLodging.address?.trim()) return;
    
    try {
      setSaveLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5001/api/trips/${tripId}/lodgings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newLodging.name,
          address: newLodging.address,
          checkIn: newLodging.checkIn ? (newLodging.checkIn instanceof Date ? newLodging.checkIn : new Date(newLodging.checkIn)).toISOString() : null,
          checkOut: newLodging.checkOut ? (newLodging.checkOut instanceof Date ? newLodging.checkOut : new Date(newLodging.checkOut)).toISOString() : null,
          details: newLodging.details,
          lodgingType: newLodging.lodgingType,
          assignedGuests: newLodging.assignedGuests
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add lodging');
      }

      const data = await response.json();
      
      // Add the newly created lodging to our local state
      setLodgings(prev => [...prev, data.lodging]);
      
      // Reset the form
      setNewLodging({
        name: '',
        lodgingType: 'hotel',
        address: '',
        checkIn: '',
        checkOut: '',
        details: '',
        assignedGuests: []
      });
      
      // Clear Google Places Autocomplete state
      setValue('', false);
      clearSuggestions();
      
      // Refresh trip data
      refreshTrips();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleRemoveLodging = async (lodgingId) => {
    try {
      setSaveLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5001/api/trips/${tripId}/lodgings/${lodgingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete lodging');
      }
      
      // Remove the lodging from our local state
      setLodgings(prev => prev.filter(l => l._id !== lodgingId));
      
      // Refresh trip data
      refreshTrips();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEditLodging = (lodging) => {
    setEditingLodging(lodging);
    setNewLodging({
      name: lodging.name || '',
      lodgingType: lodging.lodgingType || 'hotel',
      address: lodging.address || '',
      checkIn: lodging.checkIn ? new Date(lodging.checkIn) : '',
      checkOut: lodging.checkOut ? new Date(lodging.checkOut) : '',
      details: lodging.details || '',
      assignedGuests: lodging.assignedGuests || []
    });
  };

  const handleUpdateLodging = async () => {
    if (!editingLodging || !newLodging.name?.trim()) return;
    
    try {
      setSaveLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5001/api/trips/${tripId}/lodgings/${editingLodging._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newLodging.name,
          address: newLodging.address,
          checkIn: newLodging.checkIn ? (newLodging.checkIn instanceof Date ? newLodging.checkIn : new Date(newLodging.checkIn)).toISOString() : null,
          checkOut: newLodging.checkOut ? (newLodging.checkOut instanceof Date ? newLodging.checkOut : new Date(newLodging.checkOut)).toISOString() : null,
          details: newLodging.details,
          lodgingType: newLodging.lodgingType,
          assignedGuests: newLodging.assignedGuests
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update lodging');
      }
      
      const data = await response.json();
      
      // Update the lodging in our local state
      setLodgings(prev => prev.map(l => 
        l._id === editingLodging._id ? data.lodging : l
      ));
      
      setEditingLodging(null);
      setNewLodging({
        name: '',
        lodgingType: 'hotel',
        address: '',
        checkIn: '',
        checkOut: '',
        details: '',
        assignedGuests: []
      });
      
      // Clear Google Places Autocomplete state
      setValue('', false);
      clearSuggestions();
      
      // Refresh trip data
      refreshTrips();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSaveChanges = () => {
    navigate(`/trips/${tripId}`);
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    
    // Ensure we're working with a Date object
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return ''; // Invalid date
    
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const isValidDateRange = () => {
    if (!newLodging.checkIn || !newLodging.checkOut) return true;
    
    // Ensure we're comparing Date objects
    const checkInDate = newLodging.checkIn instanceof Date ? newLodging.checkIn : new Date(newLodging.checkIn);
    const checkOutDate = newLodging.checkOut instanceof Date ? newLodging.checkOut : new Date(newLodging.checkOut);
    
    return checkOutDate > checkInDate;
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
                required
                error={!!newLodging.name?.trim() === false}
                helperText={!!newLodging.name?.trim() === false ? "Name is required" : ""}
              />
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={newLodging.lodgingType}
                  label="Type"
                  onChange={(e) => setNewLodging(prev => ({ ...prev, lodgingType: e.target.value }))}
                >
                  <MenuItem value="hotel">Hotel</MenuItem>
                  <MenuItem value="airbnb">Airbnb</MenuItem>
                  <MenuItem value="resort">Resort</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
              <Box sx={{ position: 'relative', marginBottom: 2 }}>
                <TextField
                  fullWidth
                  label="Address"
                  value={newLodging.address}
                  onChange={(e) => {
                    setNewLodging(prev => ({ ...prev, address: e.target.value }));
                    setValue(e.target.value);
                  }}
                  disabled={!ready}
                  placeholder="Start typing to search for an address"
                />
                {status === "OK" && (
                  <Box
                    ref={suggestionsRef}
                    sx={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      mt: 1,
                      zIndex: 1000, 
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      backgroundColor: '#4A148C', // Much darker purple color from the app's color scheme
                      maxHeight: '200px',
                      overflowY: 'auto',
                      boxShadow: 3,
                    }}
                  >
                    {data.length > 0 ? (
                      data.map(({ place_id, description }) => (
                        <Box
                          key={place_id}
                          sx={{
                            p: 1.5,
                            cursor: 'pointer',
                            borderBottom: '1px solid rgb(0, 0, 0)',
                            backgroundColor: '#4A148C', // Light purple background that matches the app's theme
                            '&:hover': {
                              bgcolor: '#7B1FA2', // Light gray hover state
                            },
                            '&:last-child': {
                              borderBottom: 'none'
                            }
                          }}
                          onClick={() => handleAddressSelect(description)}
                        >
                          <Typography variant="body2">{description}</Typography>
                        </Box>
                      ))
                    ) : (
                      <Box sx={{ p: 2, textAlign: 'center', backgroundColor: '#ffffff' }}>
                        <Typography variant="body2" color="text.secondary">
                          No results found
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Check-in Date
                </Typography>
                <DatePicker
                  selected={newLodging.checkIn ? new Date(newLodging.checkIn) : null}
                  onChange={(date) => setNewLodging(prev => ({ ...prev, checkIn: date }))}
                  customInput={
                    <TextField 
                      fullWidth 
                      variant="outlined"
                      placeholder="Select check-in date"
                      InputProps={{
                        startAdornment: <EventIcon color="action" sx={{ mr: 1 }} />,
                      }}
                    />
                  }
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Check-out Date
                </Typography>
                <DatePicker
                  selected={newLodging.checkOut ? new Date(newLodging.checkOut) : null}
                  onChange={(date) => setNewLodging(prev => ({ ...prev, checkOut: date }))}
                  customInput={
                    <TextField 
                      fullWidth 
                      variant="outlined"
                      placeholder="Select check-out date"
                      InputProps={{
                        startAdornment: <EventIcon color="action" sx={{ mr: 1 }} />,
                      }}
                    />
                  }
                  minDate={newLodging.checkIn ? new Date(newLodging.checkIn) : new Date()}
                />
              </Box>
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
                    <MenuItem key={guest._id || guest.id} value={guest.name}>
                      {guest.name}
                    </MenuItem>
                  ))}
                </Select>
                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    size="small"
                    onClick={() => {
                      const allGuestNames = trip?.guests?.map(guest => guest.name) || [];
                      setNewLodging(prev => ({ ...prev, assignedGuests: allGuestNames }));
                    }}
                  >
                    Select All Guests
                  </Button>
                </Box>
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
                disabled={!newLodging.name?.trim() || !newLodging.address?.trim() || !isValidDateRange()}
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
                      lodgingType: 'hotel',
                      address: '',
                      checkIn: '',
                      checkOut: '',
                      details: '',
                      assignedGuests: []
                    });
                    // Clear Google Places Autocomplete state
                    setValue('', false);
                    clearSuggestions();
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
                            label={lodging.lodgingType || 'hotel'}
                            size="small"
                            sx={{ ml: 1 }}
                            color="primary"
                          />
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <LocationIcon sx={{ mr: 0.5, fontSize: 'small' }} />
                          {lodging.address}
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
                              {lodging.assignedGuests.map((guestName) => (
                                <Chip
                                  key={guestName}
                                  label={guestName}
                                  size="small"
                                  variant="outlined"
                                />
                              ))}
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