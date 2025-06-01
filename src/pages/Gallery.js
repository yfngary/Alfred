import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  IconButton,
  CircularProgress,
  Button,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  ImageList,
  ImageListItem,
  Fab,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Divider,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  PhotoCamera as CameraIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Error as ErrorIcon,
  CloudUpload as CloudUploadIcon,
  LocationOn as LocationOnIcon,
  CalendarToday as CalendarTodayIcon,
  Comment as CommentIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { useTrips } from '../context/TripContext';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axiosConfig';
import { format } from 'date-fns';

export default function Gallery() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { getTripById, fetchTripById, refreshTrips } = useTrips();
  const { user } = useAuth();
  
  const [trip, setTrip] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [commentText, setCommentText] = useState('');
  const [activePhotoId, setActivePhotoId] = useState(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);

  // Sample photos for demonstration
  const samplePhotos = [
    {
      id: 1,
      imageUrl: 'https://source.unsplash.com/random/800x600/?beach',
      caption: 'Beautiful beach sunrise',
      uploadedBy: 'John Doe',
      uploadDate: new Date().toISOString(),
      comments: [
        {
          id: 101,
          text: 'What a gorgeous view!',
          author: 'Jane Smith',
          date: new Date().toISOString(),
          likes: 3,
          liked: true,
        },
        {
          id: 102,
          text: 'I wish I was there right now',
          author: 'Mike Johnson',
          date: new Date().toISOString(),
          likes: 1,
          liked: false,
        }
      ]
    },
    {
      id: 2,
      imageUrl: 'https://source.unsplash.com/random/800x600/?mountain',
      caption: 'Mountain hiking trail',
      uploadedBy: 'Jane Smith',
      uploadDate: new Date().toISOString(),
      comments: [
        {
          id: 103,
          text: 'That trail looks challenging!',
          author: 'John Doe',
          date: new Date().toISOString(),
          likes: 2,
          liked: false,
        }
      ]
    },
    {
      id: 3,
      imageUrl: 'https://source.unsplash.com/random/800x600/?food',
      caption: 'Local cuisine',
      uploadedBy: 'John Doe',
      uploadDate: new Date().toISOString(),
      comments: []
    },
    {
      id: 4,
      imageUrl: 'https://source.unsplash.com/random/800x600/?city',
      caption: 'City skyline',
      uploadedBy: 'Mike Johnson',
      uploadDate: new Date().toISOString(),
      comments: [
        {
          id: 104,
          text: 'This skyline is amazing!',
          author: 'Sarah Williams',
          date: new Date().toISOString(),
          likes: 4,
          liked: false,
        }
      ]
    },
    {
      id: 5,
      imageUrl: 'https://source.unsplash.com/random/800x600/?monument',
      caption: 'Historical monument',
      uploadedBy: 'Sarah Williams',
      uploadDate: new Date().toISOString(),
      comments: []
    },
    {
      id: 6,
      imageUrl: 'https://source.unsplash.com/random/800x600/?sunset',
      caption: 'Sunset by the lake',
      uploadedBy: 'John Doe',
      uploadDate: new Date().toISOString(),
      comments: [
        {
          id: 105,
          text: 'Those colors are spectacular',
          author: 'Jane Smith',
          date: new Date().toISOString(),
          likes: 5,
          liked: true,
        }
      ]
    },
  ];

  // Load trip data
  useEffect(() => {
    const fetchTrip = async () => {
      try {
        // First try to get trip from context state
        const localTrip = getTripById?.(tripId);
        
        if (localTrip) {
          setTrip(localTrip);
          // In a real app, we would fetch photos from the API
          // For demo purposes, we'll use the sample photos
          setPhotos(samplePhotos);
          setLoading(false);
          return;
        }
        
        // If not in state, fetch from API
        const result = await fetchTripById(tripId);
        
        if (result.success && result.trip) {
          setTrip(result.trip);
          // In a real app, we would fetch photos from the API
          // For demo purposes, we'll use the sample photos
          setPhotos(samplePhotos);
        } else {
          throw new Error(result.error || 'Failed to load trip');
        }
      } catch (err) {
        console.error('Error loading trip:', err);
        setError('Failed to load trip data');
      } finally {
        setLoading(false);
      }
    };

    fetchTrip();
  }, [tripId, fetchTripById, getTripById]);

  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle photo upload
  const handleUploadPhoto = async () => {
    if (!photoFile) {
      setNotification({
        open: true,
        message: 'Please select a photo to upload',
        severity: 'error'
      });
      return;
    }

    setUploading(true);
    
    try {
      // In a real app, you would upload the photo to your server
      // For demo purposes, we'll create a mock response
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create a new photo object
      const newPhoto = {
        id: Date.now(),
        imageUrl: photoPreview, // In real app, this would be a URL from the server
        caption: photoCaption,
        uploadedBy: user?.name || 'Current User',
        uploadDate: new Date().toISOString(),
        comments: [],
      };
      
      // Add the new photo to the list
      setPhotos([newPhoto, ...photos]);
      
      // Reset the form
      setPhotoFile(null);
      setPhotoPreview(null);
      setPhotoCaption('');
      setUploadOpen(false);
      
      setNotification({
        open: true,
        message: 'Photo uploaded successfully!',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error uploading photo:', err);
      setNotification({
        open: true,
        message: 'Failed to upload photo',
        severity: 'error'
      });
    } finally {
      setUploading(false);
    }
  };

  // Handle adding a comment
  const handleAddComment = () => {
    if (!commentText.trim()) return;
    
    setPhotos(photos.map(photo => {
      if (photo.id === activePhotoId) {
        const newComment = {
          id: Date.now(),
          text: commentText,
          author: user?.name || 'Current User',
          date: new Date().toISOString(),
          likes: 0,
          liked: false,
        };
        return {
          ...photo,
          comments: [...photo.comments, newComment]
        };
      }
      return photo;
    }));
    
    setCommentText('');
    setNotification({
      open: true,
      message: 'Comment added successfully',
      severity: 'success'
    });
  };

  // Handle like/unlike comment
  const handleToggleCommentLike = (photoId, commentId) => {
    setPhotos(photos.map(photo => {
      if (photo.id === photoId) {
        const updatedComments = photo.comments.map(comment => {
          if (comment.id === commentId) {
            const newLiked = !comment.liked;
            return {
              ...comment,
              liked: newLiked,
              likes: newLiked ? comment.likes + 1 : comment.likes - 1
            };
          }
          return comment;
        });
        return {
          ...photo,
          comments: updatedComments
        };
      }
      return photo;
    }));
  };

  // Handle delete photo
  const handleDeletePhoto = (photoId) => {
    setPhotos(photos.filter(photo => photo.id !== photoId));
    setNotification({
      open: true,
      message: 'Photo deleted successfully',
      severity: 'success'
    });
  };

  // Open comment dialog
  const openCommentDialog = (photoId) => {
    setActivePhotoId(photoId);
    setCommentDialogOpen(true);
  };

  // Calculate how many columns to show based on screen width
  const getCols = () => {
    return window.innerWidth < 600 ? 1 : window.innerWidth < 960 ? 2 : 3;
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error || !trip) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Paper sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
          <ErrorIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Sorry, we couldn't load the gallery
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {error || "There was a problem loading the trip data. Please try again."}
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
            <CameraIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Trip Gallery
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setUploadOpen(true)}
            color="primary"
          >
            Add Photo
          </Button>
        </Box>

        {/* Trip Info */}
        <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h5" gutterBottom>
            {trip.tripName}
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Capture and share moments from your trip to {trip.location}!
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Chip 
              icon={<LocationOnIcon />} 
              label={trip.location} 
              color="primary" 
              variant="outlined" 
            />
            <Chip 
              icon={<CalendarTodayIcon />} 
              label={`${format(new Date(trip.startDate), 'MMM d')} - ${format(new Date(trip.endDate), 'MMM d, yyyy')}`} 
              color="primary" 
              variant="outlined" 
            />
          </Box>
        </Paper>

        {/* Photo Grid */}
        {photos.length > 0 ? (
          <Box sx={{ mb: 4 }}>
            <Grid container spacing={2}>
              {photos.map((photo) => (
                <Grid item xs={12} sm={6} md={4} key={photo.id}>
                  <Card sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 20px rgba(0, 0, 0, 0.2)'
                    },
                    borderRadius: 2,
                    overflow: 'hidden'
                  }}>
                    <CardMedia
                      component="img"
                      height="240"
                      image={photo.imageUrl}
                      alt={photo.caption}
                      sx={{ objectFit: 'cover' }}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="body1" component="div" sx={{ mb: 1, fontWeight: 'medium' }}>
                        {photo.caption}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: 'primary.main' }}>
                          {photo.uploadedBy.charAt(0)}
                        </Avatar>
                        <Typography variant="body2" color="text.secondary">
                          {photo.uploadedBy}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(photo.uploadDate), 'MMM d, yyyy')}
                      </Typography>
                    </CardContent>
                    <Divider />
                    <CardActions sx={{ justifyContent: 'space-between', px: 2 }}>
                      <Button 
                        size="small" 
                        startIcon={<CommentIcon />}
                        onClick={() => openCommentDialog(photo.id)}
                      >
                        {photo.comments.length}
                      </Button>
                      <Box>
                        <IconButton size="small" color="primary">
                          <ShareIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="primary">
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeletePhoto(photo.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        ) : (
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
            <CameraIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Photos Yet
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Be the first to add a photo to this trip gallery!
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setUploadOpen(true)}
              sx={{ mt: 2 }}
            >
              Add Photo
            </Button>
          </Paper>
        )}
      </Container>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onClose={() => !uploading && setUploadOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Add New Photo
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            {!photoPreview ? (
              <Box
                sx={{
                  border: '2px dashed #ccc',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  },
                }}
                onClick={() => document.getElementById('photo-upload').click()}
              >
                <input
                  type="file"
                  id="photo-upload"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="body1" gutterBottom>
                  Click to select a photo or drag and drop here
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Supported formats: JPG, PNG, GIF (max 10MB)
                </Typography>
              </Box>
            ) : (
              <Box sx={{ mb: 2 }}>
                <img
                  src={photoPreview}
                  alt="Preview"
                  style={{
                    width: '100%',
                    maxHeight: '300px',
                    objectFit: 'contain',
                    borderRadius: '8px',
                  }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setPhotoFile(null);
                    setPhotoPreview(null);
                  }}
                  sx={{ mt: 1 }}
                >
                  Change Photo
                </Button>
              </Box>
            )}
            <TextField
              margin="dense"
              label="Caption"
              fullWidth
              variant="outlined"
              value={photoCaption}
              onChange={(e) => setPhotoCaption(e.target.value)}
              sx={{ mt: 3 }}
              disabled={uploading}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadOpen(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUploadPhoto}
            variant="contained"
            disabled={!photoFile || uploading}
            startIcon={uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
          >
            {uploading ? 'Uploading...' : 'Upload Photo'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Comments Dialog */}
      <Dialog 
        open={commentDialogOpen} 
        onClose={() => setCommentDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          Comments
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            {activePhotoId && photos.find(p => p.id === activePhotoId)?.comments.length > 0 ? (
              <List>
                {photos.find(p => p.id === activePhotoId)?.comments.map(comment => (
                  <ListItem key={comment.id} alignItems="flex-start" sx={{ mb: 1 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {comment.author.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="subtitle2">{comment.author}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(comment.date), 'MMM d, yyyy')}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.primary"
                            sx={{ display: 'block', mb: 1, mt: 0.5 }}
                          >
                            {comment.text}
                          </Typography>
                          <Button 
                            size="small" 
                            startIcon={comment.liked ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                            onClick={() => handleToggleCommentLike(activePhotoId, comment.id)}
                          >
                            {comment.likes}
                          </Button>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ py: 2, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No comments yet. Be the first to add a comment!
                </Typography>
              </Box>
            )}
            
            <Box sx={{ display: 'flex', mt: 2 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                size="small"
              />
              <Button 
                variant="contained" 
                sx={{ ml: 1 }}
                disabled={!commentText.trim()}
                onClick={handleAddComment}
              >
                <SendIcon />
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Photo FAB for mobile */}
      <Fab
        color="primary"
        aria-label="add photo"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', sm: 'none' }
        }}
        onClick={() => setUploadOpen(true)}
      >
        <AddIcon />
      </Fab>

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
    </Box>
  );
} 