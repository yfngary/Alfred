import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Chip,
  Divider,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Snackbar,
  Fab,
  Tooltip,
  Avatar,
  LinearProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Backpack as BackpackIcon,
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  Category as CategoryIcon,
  Person as PersonIcon,
  People as PeopleIcon,
  LocalLaundryService as ClothingIcon,
  ChildCare as ChildIcon,
  Spa as ToiletriesIcon,
  HealthAndSafety as HealthIcon,
  ElectricalServices as ElectronicsIcon,
  BeachAccess as BeachIcon,
  Hiking as HikingIcon,
  Restaurant as FoodIcon,
  Palette as MiscIcon,
} from '@mui/icons-material';
import { useTrips } from '../context/TripContext';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axiosConfig';

// Helper function for getting the appropriate icon based on category
function getCategoryIcon(category) {
  switch (category?.toLowerCase()) {
    case 'clothing':
      return <ClothingIcon />;
    case 'toiletries':
      return <ToiletriesIcon />;
    case 'electronics':
      return <ElectronicsIcon />;
    case 'health':
      return <HealthIcon />;
    case 'beach':
      return <BeachIcon />;
    case 'hiking':
      return <HikingIcon />;
    case 'food':
      return <FoodIcon />;
    case 'kids':
      return <ChildIcon />;
    default:
      return <MiscIcon />;
  }
}

// Helper function to determine color based on category
function getCategoryColor(category) {
  switch (category?.toLowerCase()) {
    case 'clothing':
      return '#3f51b5'; // Indigo
    case 'toiletries':
      return '#00bcd4'; // Cyan
    case 'electronics':
      return '#ff9800'; // Orange
    case 'health':
      return '#4caf50'; // Green
    case 'beach':
      return '#03a9f4'; // Light Blue
    case 'hiking':
      return '#8bc34a'; // Light Green
    case 'food':
      return '#ff5722'; // Deep Orange
    case 'kids':
      return '#9c27b0'; // Purple
    default:
      return '#9e9e9e'; // Grey
  }
}

export default function PackingList() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { updateTrip, loading, error, getTripById, fetchTripById, refreshTrips } = useTrips();
  const { user } = useAuth();
  
  const [trip, setTrip] = useState(null);
  const [categories, setCategories] = useState([
    'Clothing', 'Toiletries', 'Electronics', 'Health', 
    'Food', 'Kids', 'Miscellaneous'
  ]);
  const [packingItems, setPackingItems] = useState([]);
  const [newItemDialogOpen, setNewItemDialogOpen] = useState(false);
  const [editItemId, setEditItemId] = useState(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    category: 'Miscellaneous',
    quantity: 1,
    assignedTo: 'Everyone',
    notes: '',
  });
  const [activeCategory, setActiveCategory] = useState('All');
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load trip data
  useEffect(() => {
    const fetchTrip = async () => {
      console.log('Fetching trip data for ID:', tripId);
      setIsLoading(true);
      
      try {
        // First try to get trip from context state
        const localTrip = getTripById?.(tripId);
        
        if (localTrip) {
          console.log('Trip found in local state:', localTrip);
          setTrip(localTrip);
          setPackingItems(localTrip.packingItems || []);
          setIsLoading(false);
          return;
        }
        
        // If not in state, fetch from API
        console.log('Trip not in state, fetching from API');
        const result = await fetchTripById(tripId);
        
        if (result.success && result.trip) {
          console.log('Trip data received:', result.trip);
          setTrip(result.trip);
          setPackingItems(result.trip.packingItems || []);
        } else {
          console.error('Failed to fetch trip:', result.error);
          throw new Error(result.error || 'Failed to load trip');
        }
      } catch (err) {
        console.error('Error loading trip:', err);
        setNotification({
          open: true,
          message: `Failed to load trip data: ${err.message}`,
          severity: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrip();
  }, [tripId, fetchTripById, getTripById]);

  // Filter items by active category
  // const filteredItems = activeCategory === 'All' 
  //   ? packingItems 
  //   : packingItems.filter(item => item.category === activeCategory);

  // Filter items based on user and active category
  const userVisibleItems = useMemo(() => {
    if (!user || !user.name) {
      // If no user, show only 'Everyone' items (or handle as needed)
      return packingItems.filter(item => item.assignedTo === 'Everyone');
    }
    const currentUserItems = packingItems.filter(item => 
      item.assignedTo === 'Everyone' || item.assignedTo === user.name
    );
    return currentUserItems;
  }, [packingItems, user]);
  
  // Filter items by active category based on user-visible items
  const filteredItems = useMemo(() => {
    return activeCategory === 'All' 
      ? userVisibleItems 
      : userVisibleItems.filter(item => item.category === activeCategory);
  }, [userVisibleItems, activeCategory]);

  // Calculate completion stats  
  // const totalItems = packingItems.length; // Keep this if needed for overall trip stats
  // const packedItems = packingItems.filter(item => item.packed).length;
  // Calculate completion stats based on user-visible items
  const totalVisibleItems = userVisibleItems.length;
  const packedVisibleItems = userVisibleItems.filter(item => item.packed).length;
  const completionPercentage = totalVisibleItems > 0 
    ? Math.round((packedVisibleItems / totalVisibleItems) * 100) 
    : 0;
  const userCompletionPercentage = totalVisibleItems > 0 
    ? Math.round((packedVisibleItems / totalVisibleItems) * 100) 
    : 0;

  // Handle opening the dialog for new item
  const handleOpenNewItemDialog = () => {
    setEditItemId(null);
    setItemForm({
      name: '',
      category: 'Miscellaneous',
      quantity: 1,
      assignedTo: 'Everyone',
      assignedTo: user?.name || 'Everyone', // Default to current user for new items
      notes: '',
    });
    setNewItemDialogOpen(true);
  };

  // Handle opening the dialog for editing an item
  const handleOpenEditItemDialog = (item) => {
    setEditItemId(item.id);
    setItemForm({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      assignedTo: item.assignedTo || 'Everyone',
      notes: item.notes || '',
    });
    setNewItemDialogOpen(true);
  };

  // Handle item form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setItemForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle adding or updating an item
  const handleSaveItem = async () => {
    if (!itemForm.name.trim()) {
      setNotification({
        open: true,
        message: 'Item name is required',
        severity: 'error'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const updatedItems = [...packingItems];
      
      if (editItemId) {
        // Update existing item
        const index = updatedItems.findIndex(item => item.id === editItemId);
        if (index !== -1) {
          updatedItems[index] = {
            ...updatedItems[index],
            ...itemForm,
            updatedAt: new Date().toISOString()
          };
        }
      } else {
        // Add new item
        updatedItems.push({
          id: Date.now().toString(),
          ...itemForm,
          packed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      setPackingItems(updatedItems);
      
      // Save to backend
      const token = localStorage.getItem('token');
      await axios.put(`/api/trips/${tripId}`, 
        { packingItems: updatedItems },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Refresh trips data in context
      refreshTrips();
      
      setNotification({
        open: true,
        message: editItemId ? 'Item updated successfully' : 'Item added successfully',
        severity: 'success'
      });
      
      setNewItemDialogOpen(false);
    } catch (err) {
      console.error('Error saving packing item:', err);
      setNotification({
        open: true,
        message: 'Failed to save item',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle toggling an item's packed status
  const handleToggleItemPacked = async (itemId) => {
    try {
      const updatedItems = packingItems.map(item => 
        item.id === itemId 
          ? { ...item, packed: !item.packed, updatedAt: new Date().toISOString() } 
          : item
      );
      
      setPackingItems(updatedItems);
      
      // Save to backend
      const token = localStorage.getItem('token');
      await axios.put(`/api/trips/${tripId}`, 
        { packingItems: updatedItems },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Refresh trips data in context
      refreshTrips();
    } catch (err) {
      console.error('Error updating item status:', err);
      setNotification({
        open: true,
        message: 'Failed to update item status',
        severity: 'error'
      });
    }
  };

  // Handle deleting an item
  const handleDeleteItem = async (itemId) => {
    try {
      const updatedItems = packingItems.filter(item => item.id !== itemId);
      
      setPackingItems(updatedItems);
      
      // Save to backend
      const token = localStorage.getItem('token');
      await axios.put(`/api/trips/${tripId}`, 
        { packingItems: updatedItems },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Refresh trips data in context
      refreshTrips();
      
      setNotification({
        open: true,
        message: 'Item deleted successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error deleting item:', err);
      setNotification({
        open: true,
        message: 'Failed to delete item',
        severity: 'error'
      });
    }
  };

  // If loading, show loading indicator
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // If there's an error or no trip, show error message with return button
  if (error || !trip) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Paper sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
          <BackpackIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Sorry, we couldn't load your packing list
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {error?.message || "There was a problem loading the trip data. Please try again."}
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/trips/${tripId}`)}
            sx={{ mt: 2 }}
          >
            Back to Trip Dashboard
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, pb: 10 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, mt: 3 }}>
          <IconButton onClick={() => navigate(`/trips/${tripId}`)} edge="start" sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            <BackpackIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Packing List
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenNewItemDialog}
            color="primary"
          >
            Add Item
          </Button>
        </Box>

        {/* Trip Info */}
        <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h5" gutterBottom>
            {trip.tripName}
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Pack your bags for your trip to {trip.location}!
          </Typography>
          
          {/* Progress */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ width: '100%', mr: 1 }}>
              <LinearProgress 
                variant="determinate" 
                value={userCompletionPercentage}
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>
            <Box sx={{ minWidth: 35 }}>
              <Typography variant="body2" color="text.secondary">{`${userCompletionPercentage}%`}</Typography>
            </Box>
          </Box>
          
          {/* Optionally, keep overall trip stats if desired */}
          {/* <Typography variant="body2" color="text.secondary">
            Overall: {packedItems} of {totalItems} items packed ({completionPercentage}%)
          </Typography> */}

          <Typography variant="body2" color="text.secondary">
            You have packed {packedVisibleItems} of your {totalVisibleItems} assigned items
          </Typography>
        </Paper>

        {/* Category Filter */}
        <Box sx={{ overflowX: 'auto', mb: 3 }}>
          <Box sx={{ display: 'flex', pb: 1 }}>
            <Chip
              label="All"
              color={activeCategory === 'All' ? 'primary' : 'default'}
              onClick={() => setActiveCategory('All')}
              sx={{ m: 0.5 }}
            />
            {categories.map((category) => (
              <Chip
                key={category}
                label={category}
                icon={getCategoryIcon(category)}
                color={activeCategory === category ? 'primary' : 'default'}
                onClick={() => setActiveCategory(category)}
                sx={{ m: 0.5 }}
              />
            ))}
          </Box>
        </Box>

        {/* Packing Items List */}
        <Paper elevation={2} sx={{ borderRadius: 2 }}>
          {filteredItems.length > 0 ? (
            <List sx={{ width: '100%' }}>
              {filteredItems.map((item, index) => (
                <React.Fragment key={item.id}>
                  <ListItem
                    secondaryAction={
                      <Box>
                        {/* Conditionally render Edit button based on assignment */}
                        {user && (item.assignedTo === 'Everyone' || item.assignedTo === user.name) && (
                          <IconButton edge="end" onClick={() => handleOpenEditItemDialog(item)}>
                            <EditIcon />
                          </IconButton>
                        )}
                        <IconButton edge="end" onClick={() => handleDeleteItem(item.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    }
                  >
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={item.packed}
                        onChange={() => handleToggleItemPacked(item.id)}
                        icon={<CheckCircleIcon />}
                        checkedIcon={<CheckCircleIcon color="success" />}
                      />
                    </ListItemIcon>
                    <ListItemIcon>
                      <Avatar 
                        sx={{ 
                          bgcolor: getCategoryColor(item.category),
                          width: 36,
                          height: 36
                        }}
                      >
                        {getCategoryIcon(item.category)}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography
                          sx={{
                            textDecoration: item.packed ? 'line-through' : 'none',
                            color: item.packed ? 'text.secondary' : 'text.primary',
                            fontWeight: item.packed ? 'normal' : 'medium',
                          }}
                        >
                          {item.name} {item.quantity > 1 && `(${item.quantity})`}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" component="span">
                            {item.category} 
                            {item.assignedTo && item.assignedTo !== 'Everyone' && 
                              ` • Assigned to: ${item.assignedTo}`
                            }
                          </Typography>
                          {item.notes && (
                            <Typography variant="body2" color="text.secondary">
                              {item.notes}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < filteredItems.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <BackpackIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No items yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Start adding items to your packing list
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenNewItemDialog}
              >
                Add Your First Item
              </Button>
            </Box>
          )}
        </Paper>
      </Container>

      {/* Add/Edit Item Dialog */}
      <Dialog open={newItemDialogOpen} onClose={() => setNewItemDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editItemId ? 'Edit Packing Item' : 'Add New Packing Item'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                name="name"
                label="Item Name"
                value={itemForm.name}
                onChange={handleFormChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={itemForm.category}
                  onChange={handleFormChange}
                  label="Category"
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: getCategoryColor(category),
                            width: 24,
                            height: 24,
                            mr: 1
                          }}
                        >
                          {getCategoryIcon(category)}
                        </Avatar>
                        {category}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="quantity"
                label="Quantity"
                type="number"
                value={itemForm.quantity}
                onChange={handleFormChange}
                fullWidth
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="notes"
                label="Notes"
                value={itemForm.notes}
                onChange={handleFormChange}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewItemDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveItem} 
            variant="contained" 
            startIcon={<SaveIcon />}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Item'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setNotification(prev => ({ ...prev, open: false }))} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>

      {/* Add Item FAB for mobile */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', sm: 'none' }
        }}
        onClick={handleOpenNewItemDialog}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
} 