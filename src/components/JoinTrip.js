import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert
} from '@mui/material';
import { useUser } from '../context/UserContext';

const JoinTrip = () => {
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useUser();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/trips/join/${inviteCode}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to join trip');
      }

      const data = await response.json();
      
      // Update user in localStorage if returned from the API
      if (data.user) {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = {
          ...currentUser,
          ...data.user,
          // Ensure we have the user id in both formats
          id: data.user.id || data.user._id,
          _id: data.user._id || data.user.id
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Also update user context
        setUser(updatedUser);
      }
      
      // Navigate to the trip dashboard
      navigate(`/trips/${data.trip._id}`);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Join a Trip
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 3 }}>
            Enter the invite code you received to join a trip.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Invite Code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              margin="normal"
              required
              disabled={loading}
            />
            
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 3 }}
              disabled={loading}
            >
              {loading ? 'Joining...' : 'Join Trip'}
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default JoinTrip; 