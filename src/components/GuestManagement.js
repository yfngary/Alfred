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
  CircularProgress,
  ThemeProvider,
  createTheme,
  useTheme
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

export default function GuestManagement({ id }) {
  const params = useParams();
  const tripId = id || params.id;
  const navigate = useNavigate();
  const { refreshTrips } = useTrips();
  const baseTheme = useTheme();
  
  // Create custom styles for the select menus to ensure text is visible
  const selectTheme = createTheme({
    ...baseTheme,
    components: {
      ...baseTheme.components,
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
          }
        }
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            color: '#ffffff',
            '&:hover': {
              backgroundColor: 'rgba(71, 118, 230, 0.1)',
            },
            '&.Mui-selected': {
              backgroundColor: 'rgba(71, 118, 230, 0.2)',
            },
          }
        }
      },
    }
  });

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
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedGuestId, setSelectedGuestId] = useState('');

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
    
    // Create a UUID for frontend use only
    const uniqueId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    const guestToAdd = {
      ...newGuest,
      id: uniqueId,  // For frontend reference
      _id: uniqueId  // Will be removed before sending to server
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
    
    // Create a UUID for frontend use only
    const uniqueId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    setGroups(prev => [...prev, {
      ...newGroup,
      id: uniqueId,
      _id: uniqueId
    }]);
    
    setNewGroup({
      name: '',
      level1: [],
      level2: []
    });
  };

  const handleAddGuestToGroup = (level) => {
    if (!selectedGroupId || !selectedGuestId) return;
    
    // Find the selected guest object
    const guestToAdd = guests.find(g => g._id === selectedGuestId);
    if (!guestToAdd) return;
    
    // Update the groups array
    setGroups(prev => prev.map(group => {
      if (group._id === selectedGroupId) {
        // Check if guest already exists in either level
        const existsInLevel1 = group.level1.some(g => 
          (typeof g === 'string' && g === selectedGuestId) || 
          (g._id === selectedGuestId)
        );
        const existsInLevel2 = group.level2.some(g => 
          (typeof g === 'string' && g === selectedGuestId) || 
          (g._id === selectedGuestId)
        );
        
        // If guest exists in the opposite level, remove them first
        let updatedLevel1 = group.level1;
        let updatedLevel2 = group.level2;
        
        if (level === 'level1' && existsInLevel2) {
          updatedLevel2 = group.level2.filter(g => 
            (typeof g === 'string' && g !== selectedGuestId) || 
            (g._id !== selectedGuestId)
          );
        } else if (level === 'level2' && existsInLevel1) {
          updatedLevel1 = group.level1.filter(g => 
            (typeof g === 'string' && g !== selectedGuestId) || 
            (g._id !== selectedGuestId)
          );
        }
        
        // Add to the appropriate level if not already there
        if (level === 'level1' && !existsInLevel1) {
          return {
            ...group,
            level1: [...updatedLevel1, guestToAdd],
            level2: updatedLevel2
          };
        } else if (level === 'level2' && !existsInLevel2) {
          return {
            ...group,
            level1: updatedLevel1,
            level2: [...updatedLevel2, guestToAdd]
          };
        }
      }
      return group;
    }));
    
    // Reset the guest selection after adding
    setSelectedGuestId('');
  };
  
  // Method to remove a guest from a group
  const handleRemoveGuestFromGroup = (groupId, level, guestId) => {
    setGroups(prev => prev.map(group => {
      if (group._id === groupId) {
        if (level === 'level1') {
          return {
            ...group,
            level1: group.level1.filter(g => 
              (typeof g === 'string' && g !== guestId) || 
              (g._id !== guestId)
            )
          };
        } else if (level === 'level2') {
          return {
            ...group,
            level2: group.level2.filter(g => 
              (typeof g === 'string' && g !== guestId) || 
              (g._id !== guestId)
            )
          };
        }
      }
      return group;
    }));
  };

  const handleSaveChanges = async () => {
    try {
      setSaveLoading(true);
      const token = localStorage.getItem('token');
      
      // Clean up the data for API by removing temporary IDs
      const cleanedGuests = guests.map(guest => {
        // If it doesn't have a MongoDB ObjectId format (24 hex chars), remove it
        if (guest._id && (typeof guest._id === 'string' && !/^[0-9a-fA-F]{24}$/.test(guest._id))) {
          const { _id, id, ...restOfGuest } = guest;
          return restOfGuest;
        }
        // Otherwise keep the existing _id (which should be a valid MongoDB ObjectId)
        const { id, ...restOfGuest } = guest;
        return restOfGuest;
      });

      // Process groups - preserve guest references by ID
      const cleanedGroups = groups.map(group => {
        // Remove ID from group if it's not a valid MongoDB ObjectId
        const { id, ...restOfGroup } = group;
        const cleanGroup = (group._id && (typeof group._id === 'string' && !/^[0-9a-fA-F]{24}$/.test(group._id)))
          ? { ...restOfGroup, _id: undefined } 
          : restOfGroup;

        // Convert guest references from objects to references or strings as needed
        const processGuests = (guestList) => {
          if (!guestList || !Array.isArray(guestList)) return [];
          
          return guestList.map(guest => {
            // If it's already a string ID
            if (typeof guest === 'string') return guest;
            
            // If it's a guest object
            if (guest && typeof guest === 'object') {
              // Return the guest object with properly formatted data
              return {
                name: guest.name,
                email: guest.email || '',
                phone: guest.phone || '',
                type: guest.type || 'adult'
              };
            }
            
            return null;
          }).filter(Boolean); // Remove any null entries
        };
          
        return {
          name: cleanGroup.name || 'Unnamed Group',
          level1: processGuests(cleanGroup.level1),
          level2: processGuests(cleanGroup.level2)
        };
      });

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

  const renderGuestForm = () => (
    <Paper 
      sx={{ 
        p: 3, 
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(10px)',
        
        borderRadius: 2,
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
        {editingGuest ? 'Edit Guest' : 'Add New Guest'}
      </Typography>
      <Stack spacing={2}>
        <TextField
          fullWidth
          label="Name"
          value={newGuest.name}
          onChange={(e) => setNewGuest(prev => ({ ...prev, name: e.target.value }))}
          InputLabelProps={{ shrink: true }}
          InputProps={{ style: { color: 'white' } }}
        />
        <TextField
          fullWidth
          label="Email"
          type="email"
          value={newGuest.email}
          onChange={(e) => setNewGuest(prev => ({ ...prev, email: e.target.value }))}
          InputLabelProps={{ shrink: true }}
          InputProps={{ style: { color: 'white' } }}
        />
        <TextField
          fullWidth
          label="Phone"
          value={newGuest.phone}
          onChange={(e) => setNewGuest(prev => ({ ...prev, phone: e.target.value }))}
          InputLabelProps={{ shrink: true }}
          InputProps={{ style: { color: 'white' } }}
        />
        <ThemeProvider theme={selectTheme}>
          <FormControl fullWidth>
            <InputLabel sx={{ color: 'text.secondary' }}>Type</InputLabel>
            <Select
              value={newGuest.type}
              label="Type"
              onChange={(e) => setNewGuest(prev => ({ ...prev, type: e.target.value }))}
              sx={{ color: 'white' }}
            >
              <MenuItem value="adult">Adult</MenuItem>
              <MenuItem value="child">Child</MenuItem>
            </Select>
          </FormControl>
        </ThemeProvider>
        <Button
          variant="contained"
          onClick={editingGuest ? handleUpdateGuest : handleAddGuest}
          startIcon={editingGuest ? <EditIcon /> : <AddIcon />}
          disabled={!newGuest.name.trim()}
          sx={{ 
            borderRadius: 2,
            fontWeight: 600,
            textTransform: 'none',
            backgroundImage: 'linear-gradient(90deg, #4776E6 0%, #8E54E9 100%)',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
            '&:hover': {
              backgroundImage: 'linear-gradient(90deg, #8E54E9 0%, #4776E6 100%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 10px 20px rgba(0, 0, 0, 0.3)',
            },
            '&.Mui-disabled': {
              backgroundImage: 'none',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
            }
          }}
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
            sx={{ 
              borderRadius: 2,
              fontWeight: 600,
              textTransform: 'none',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              color: 'white',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              }
            }}
          >
            Cancel Edit
          </Button>
        )}
      </Stack>
    </Paper>
  );

  const renderGroupForm = () => (
    <Paper 
      sx={{ 
        p: 3, 
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(10px)',
        borderRadius: 2,
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
        Create New Group
      </Typography>
      <Stack spacing={2}>
        <TextField
          fullWidth
          label="Group Name"
          value={newGroup.name}
          onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
          InputLabelProps={{ shrink: true }}
          InputProps={{ style: { color: 'white' } }}
        />
        <Button
          variant="contained"
          onClick={handleAddGroup}
          startIcon={<AddIcon />}
          disabled={!newGroup.name.trim()}
          sx={{ 
            borderRadius: 2,
            fontWeight: 600,
            textTransform: 'none',
            backgroundImage: 'linear-gradient(90deg, #4776E6 0%, #8E54E9 100%)',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
            '&:hover': {
              backgroundImage: 'linear-gradient(90deg, #8E54E9 0%, #4776E6 100%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 10px 20px rgba(0, 0, 0, 0.3)',
            },
            '&.Mui-disabled': {
              backgroundImage: 'none',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
            }
          }}
        >
          Create Group
        </Button>
      </Stack>
      
      {/* Add Guest to Group Section */}
      {groups.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
            Add Guest to Group
          </Typography>
          <Stack spacing={2}>
            <ThemeProvider theme={selectTheme}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'text.secondary' }}>Select Group</InputLabel>
                <Select
                  value={selectedGroupId}
                  label="Select Group"
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  sx={{ color: 'white' }}
                >
                  {groups.map(group => (
                    <MenuItem key={group._id} value={group._id}>
                      {group.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth disabled={!selectedGroupId}>
                <InputLabel sx={{ color: 'text.secondary' }}>Select Guest</InputLabel>
                <Select
                  value={selectedGuestId}
                  label="Select Guest"
                  onChange={(e) => setSelectedGuestId(e.target.value)}
                  sx={{ color: 'white' }}
                >
                  {guests.map(guest => (
                    <MenuItem key={guest._id} value={guest._id}>
                      {guest.name} ({guest.type})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </ThemeProvider>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                color="primary"
                disabled={!selectedGroupId || !selectedGuestId}
                onClick={() => handleAddGuestToGroup('level1')}
                fullWidth
                sx={{ 
                  borderRadius: 2,
                  fontWeight: 600,
                  textTransform: 'none',
                  color: 'white',
                  borderColor: 'rgba(71, 118, 230, 0.5)',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'rgba(71, 118, 230, 0.1)',
                  },
                  '&.Mui-disabled': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  }
                }}
              >
                Add as Adult
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                disabled={!selectedGroupId || !selectedGuestId}
                onClick={() => handleAddGuestToGroup('level2')}
                fullWidth
                sx={{ 
                  borderRadius: 2,
                  fontWeight: 600,
                  textTransform: 'none',
                  color: 'white',
                  borderColor: 'rgba(142, 84, 233, 0.5)',
                  '&:hover': {
                    borderColor: 'secondary.main',
                    backgroundColor: 'rgba(142, 84, 233, 0.1)',
                  },
                  '&.Mui-disabled': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  }
                }}
              >
                Add as Child
              </Button>
            </Box>
          </Stack>
        </Box>
      )}
    </Paper>
  );

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
        <IconButton 
          onClick={() => navigate(`/trips/${tripId}`)}
          sx={{ 
            color: 'primary.main', 
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
          Manage Guests - {trip?.tripName}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'rgba(255, 255, 255, 0.1)', mb: 3 }}>
        <Tabs 
          value={currentTab} 
          onChange={(e, newValue) => setCurrentTab(newValue)}
          sx={{ 
            '& .MuiTab-root': { 
              color: 'text.secondary',
              '&.Mui-selected': { 
                color: 'primary.main',
              }
            },
            '& .MuiTabs-indicator': { backgroundColor: 'primary.main' }
          }}
        >
          <Tab label="Guests" icon={<PersonIcon />} iconPosition="start" />
          <Tab label="Groups" icon={<GroupIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {currentTab === 0 ? (
        // Guests Tab
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            {renderGuestForm()}
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper 
              sx={{ 
                p: 3, 
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                Guest List ({guests.length})
              </Typography>
              <List>
                {guests.map((guest) => (
                  <ListItem
                    key={guest._id}
                    sx={{
                      mb: 1,
                      border: '1px solid',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: 2,
                      bgcolor: guest.type === 'child' ? 'rgba(142, 84, 233, 0.1)' : 'rgba(71, 118, 230, 0.05)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      }
                    }}
                  >
                    <Avatar sx={{ bgcolor: stringToColor(guest.name), mr: 2 }}>
                      {guest.name.charAt(0)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" sx={{ color: 'white' }}>
                        {guest.name}
                        <Chip
                          size="small"
                          label={guest.type}
                          sx={{ ml: 1 }}
                          color={guest.type === 'child' ? 'secondary' : 'primary'}
                        />
                      </Typography>
                      <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                        {guest.email} {guest.phone && `• ${guest.phone}`}
                      </Typography>
                    </Box>
                    <IconButton 
                      onClick={() => handleEditGuest(guest)}
                      sx={{ 
                        color: 'primary.main',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      onClick={() => handleRemoveGuest(guest._id)} 
                      color="error"
                      sx={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.1)' }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItem>
                ))}
                {guests.length === 0 && (
                  <Typography variant="body1" color="rgba(255, 255, 255, 0.7)" align="center" sx={{ py: 4 }}>
                    No guests added yet. Add guests to manage your trip attendees.
                  </Typography>
                )}
              </List>
            </Paper>
          </Grid>
        </Grid>
      ) : (
        // Groups Tab
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            {renderGroupForm()}
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper 
              sx={{ 
                p: 3, 
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                Groups ({groups.length})
              </Typography>
              {groups.map((group, index) => (
                <Paper
                  key={group._id}
                  elevation={0}
                  sx={{
                    p: 2,
                    mb: 2,
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.4)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'white' }}>
                      {group.name}
                    </Typography>
                    <IconButton 
                      size="small" 
                      color="error"
                      sx={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.1)' }
                      }}
                      onClick={() => {
                        setGroups(prev => prev.filter(g => g._id !== group._id));
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="primary.main" gutterBottom>
                        Adults
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {Array.isArray(group.level1) && group.level1.length > 0 ? (
                          group.level1.map(guest => {
                            // Get guest object and ID
                            const guestId = typeof guest === 'string' ? guest : guest._id;
                            const guestObj = typeof guest === 'string' 
                              ? guests.find(g => g._id === guest)
                              : guest;
                              
                            if (!guestObj) return null;
                            
                            return (
                              <Chip
                                key={guestId}
                                label={guestObj.name}
                                onDelete={() => handleRemoveGuestFromGroup(group._id, 'level1', guestId)}
                                color="primary"
                                sx={{ 
                                  borderRadius: 4,
                                  '& .MuiChip-deleteIcon': {
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    '&:hover': { color: 'white' }
                                  }
                                }}
                              />
                            );
                          })
                        ) : (
                          <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                            No adults in this group
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="secondary.main" gutterBottom>
                        Children
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {Array.isArray(group.level2) && group.level2.length > 0 ? (
                          group.level2.map(guest => {
                            // Get guest object and ID
                            const guestId = typeof guest === 'string' ? guest : guest._id;
                            const guestObj = typeof guest === 'string' 
                              ? guests.find(g => g._id === guest)
                              : guest;
                              
                            if (!guestObj) return null;
                            
                            return (
                              <Chip
                                key={guestId}
                                label={guestObj.name}
                                onDelete={() => handleRemoveGuestFromGroup(group._id, 'level2', guestId)}
                                color="secondary"
                                sx={{ 
                                  borderRadius: 4,
                                  '& .MuiChip-deleteIcon': {
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    '&:hover': { color: 'white' }
                                  }
                                }}
                              />
                            );
                          })
                        ) : (
                          <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                            No children in this group
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
              {groups.length === 0 && (
                <Typography variant="body1" color="rgba(255, 255, 255, 0.7)" align="center" sx={{ py: 4 }}>
                  No groups created yet. Create a group to organize your guests.
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={() => navigate(`/trips/${tripId}`)}
          sx={{ 
            borderRadius: 2,
            fontWeight: 600,
            textTransform: 'none',
            color: 'white',
            borderColor: 'rgba(255, 255, 255, 0.3)',
            '&:hover': {
              borderColor: 'rgba(255, 255, 255, 0.5)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            }
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSaveChanges}
          disabled={saveLoading}
          startIcon={saveLoading ? <CircularProgress size={20} /> : null}
          sx={{ 
            borderRadius: 2,
            fontWeight: 600,
            textTransform: 'none',
            backgroundImage: 'linear-gradient(90deg, #4776E6 0%, #8E54E9 100%)',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
            '&:hover': {
              backgroundImage: 'linear-gradient(90deg, #8E54E9 0%, #4776E6 100%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 10px 20px rgba(0, 0, 0, 0.3)',
            },
            '&.Mui-disabled': {
              backgroundImage: 'none',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
            }
          }}
        >
          {saveLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>
    </Container>
  );
} 