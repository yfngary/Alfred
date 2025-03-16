import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  CardActions,
  CircularProgress,
  Paper
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import '../styles/home.css';

const HomePage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [trips, setTrips] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const checkAuthAndFetchTrips = async () => {
            const token = localStorage.getItem('token');
            const user = localStorage.getItem('user');

            if (!token || !user) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch('http://localhost:5001/api/trips', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch trips');
                }

                const data = await response.json();
                setTrips(data.trips || []);
            } catch (err) {
                console.error('Error fetching trips:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        checkAuthAndFetchTrips();
    }, []);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    // If user is not authenticated, show landing page
    if (!localStorage.getItem('token')) {
        return (
            <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
                <Typography variant="h2" component="h1" gutterBottom>
                    Welcome to Alfred
                </Typography>
                <Typography variant="h5" color="text.secondary" paragraph>
                    Your personal travel companion for planning and organizing trips.
                </Typography>
                <Box sx={{ mt: 4 }}>
                    <Button
                        component={Link}
                        to="/register"
                        variant="contained"
                        size="large"
                        sx={{ mr: 2 }}
                    >
                        Register
                    </Button>
                    <Button
                        component={Link}
                        to="/login"
                        variant="outlined"
                        size="large"
                    >
                        Login
                    </Button>
                </Box>
            </Container>
        );
    }

    // For authenticated users, show their trips
    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" component="h1">
                    My Trips
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/createTrip')}
                >
                    Create New Trip
                </Button>
            </Box>

            {error && (
                <Paper sx={{ p: 2, mb: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
                    <Typography>{error}</Typography>
                </Paper>
            )}

            {trips.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No trips yet
                    </Typography>
                    <Typography color="text.secondary" paragraph>
                        Start by creating your first trip!
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/createTrip')}
                    >
                        Create Trip
                    </Button>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {trips.map((trip) => (
                        <Grid item xs={12} sm={6} md={4} key={trip._id}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        {trip.tripName}
                                    </Typography>
                                    <Typography color="text.secondary">
                                        {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                        {trip.location || 'No location set'}
                                    </Typography>
                                </CardContent>
                                <CardActions>
                                    <Button 
                                        size="small" 
                                        onClick={() => navigate(`/trips/${trip._id}`)}
                                    >
                                        View Details
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Container>
    );
};

export default HomePage;
