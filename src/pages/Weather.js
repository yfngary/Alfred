import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  IconButton,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Alert,
  Button,
  Stack,
  Tabs,
  Tab,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  LocationOn as LocationIcon,
  Cloud as CloudIcon,
  WbSunny as SunnyIcon,
  Opacity as RainIcon,
  AcUnit as SnowIcon,
  Thunderstorm as StormIcon,
  Waves as WindIcon,
  Thermostat as TempIcon,
  WaterDrop as HumidityIcon,
  Visibility as VisibilityIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useTrips } from '../context/TripContext';
import baseAxios from '../utils/axiosConfig';
import axios from 'axios';
import { format, addDays, differenceInDays, parseISO } from 'date-fns';

// Create a new instance specifically for OpenWeatherMap
const weatherApi = axios.create();

// Weather icon mapping function
const getWeatherIcon = (condition) => {
  const code = condition?.toLowerCase() || '';
  
  if (code.includes('clear') || code.includes('sunny')) {
    return <SunnyIcon fontSize="large" sx={{ color: '#FFD700' }} />;
  } else if (code.includes('rain') || code.includes('drizzle') || code.includes('shower')) {
    return <RainIcon fontSize="large" sx={{ color: '#1E90FF' }} />;
  } else if (code.includes('snow') || code.includes('sleet') || code.includes('ice')) {
    return <SnowIcon fontSize="large" sx={{ color: '#ADD8E6' }} />;
  } else if (code.includes('thunder') || code.includes('storm')) {
    return <StormIcon fontSize="large" sx={{ color: '#4B0082' }} />;
  } else if (code.includes('cloud') || code.includes('overcast')) {
    return <CloudIcon fontSize="large" sx={{ color: '#708090' }} />;
  } else {
    return <CloudIcon fontSize="large" sx={{ color: '#708090' }} />;
  }
};

// Function to get a color based on temperature
const getTempColor = (temp) => {
  if (temp >= 90) return '#FF5555'; // Hot
  if (temp >= 80) return '#FF8C42'; // Warm
  if (temp >= 70) return '#FFDA5E'; // Pleasant warm
  if (temp >= 60) return '#8AFF70'; // Mild
  if (temp >= 50) return '#70D1FF'; // Cool
  if (temp >= 40) return '#5E8BFF'; // Cold
  return '#A0A0FF'; // Very cold
};

export default function Weather() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { getTripById, fetchTripById } = useTrips();
  
  const [trip, setTrip] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);

  // Load trip data
  useEffect(() => {
    const fetchTrip = async () => {
      try {
        // First try to get trip from context state
        const localTrip = getTripById?.(tripId);
        
        if (localTrip) {
          setTrip(localTrip);
          fetchWeather(localTrip.destination, localTrip.startDate, localTrip.endDate);
          return;
        }
        
        // If not in state, fetch from API
        const result = await fetchTripById(tripId);
        
        if (result.success && result.trip) {
          setTrip(result.trip);
          fetchWeather(result.trip.destination, result.trip.startDate, result.trip.endDate);
        } else {
          throw new Error(result.error || 'Failed to load trip');
        }
      } catch (err) {
        console.error('Error loading trip:', err);
        setError('Failed to load trip data');
        setLoading(false);
      }
    };

    fetchTrip();
  }, [tripId, fetchTripById, getTripById]);

  // Fetch weather data
  const fetchWeather = async (destination, startDate, endDate) => {
    if (!destination) {
      setError('No destination specified for this trip');
      setLoading(false);
      return;
    }

    try {
      const API_KEY = '5237cd4a026bd24bb7b78271d223b4aa';

      // Use the new weatherApi instance and the relative path for the proxy
      const response = await weatherApi.get(
        `/data/2.5/forecast?q=${destination}&units=imperial&appid=${API_KEY}`
      );
      
      // Process API response into a more usable format
      const weatherData = {
        destination: destination,
        current: {
          temp: response.data.list[0].main.temp,
          feels_like: response.data.list[0].main.feels_like,
          humidity: response.data.list[0].main.humidity,
          wind_speed: response.data.list[0].wind.speed,
          condition: response.data.list[0].weather[0].main,
          icon: response.data.list[0].weather[0].icon,
        },
        forecast: response.data.list.filter((item, index) => index % 8 === 0).map(item => ({
          date: item.dt_txt.split(' ')[0],
          temp_max: item.main.temp_max,
          temp_min: item.main.temp_min,
          condition: item.weather[0].main,
          chance_of_rain: item.pop * 100,
          humidity: item.main.humidity,
          wind_speed: item.wind.speed,
        })),
      };
      
      setWeather(weatherData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching weather:', err);
      setError('Failed to fetch weather data');
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTabIndex(newValue);
  };

  // Show loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  // Show error state
  if (error || !trip) {
    console.log(error, trip)
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Paper sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
          <ErrorIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Sorry, we couldn't load the weather data
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

  // Get trip date range for display
  const formatTripDate = (dateStr) => {
    if (!dateStr) return '';
    return format(new Date(dateStr), 'MMM d, yyyy');
  };
  
  // Calculate the trip duration
  const getTripDuration = () => {
    if (!trip.startDate || !trip.endDate) return '';
    
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const days = differenceInDays(end, start) + 1;
    
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  // Get the forecast for the trip dates
  const getTripForecast = () => {
    if (!weather || !weather.forecast || !trip.startDate) return [];
    
    const startDate = parseISO(trip.startDate);
    const endDate = trip.endDate ? parseISO(trip.endDate) : addDays(startDate, 7);
    
    // Filter forecast to only show dates within the trip
    return weather.forecast.filter(day => {
      const forecastDate = parseISO(day.date);
      return forecastDate >= startDate && forecastDate <= endDate;
    });
  };

  // Trip forecast
  const tripForecast = getTripForecast();

  return (
    <Box sx={{ flexGrow: 1, pb: 10 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, mt: 3 }}>
          <IconButton onClick={() => navigate(`/trips/${tripId}`)} edge="start" sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            <CloudIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Weather Forecast
          </Typography>
        </Box>

        {/* Trip Info */}
        <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h5" gutterBottom>
            {trip.tripName}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationIcon fontSize="small" sx={{ mr: 0.5 }} /> 
                {trip.destination}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1">
                {formatTripDate(trip.startDate)} - {formatTripDate(trip.endDate)} ({getTripDuration()})
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Weather Overview */}
        {weather && (
          <>
            {/* Current Weather Card */}
            <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Current Weather in {weather.destination}
              </Typography>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={4} sx={{ textAlign: 'center' }}>
                  {getWeatherIcon(weather.current.condition)}
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>
                    {weather.current.temp}°F
                  </Typography>
                  <Typography variant="body1">{weather.current.condition}</Typography>
                </Grid>
                <Grid item xs={12} sm={8}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TempIcon color="secondary" />
                        <Typography variant="body1">
                          Feels like: {weather.current.feels_like}°F
                        </Typography>
                      </Stack>
                    </Grid>
                    <Grid item xs={6}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <HumidityIcon color="primary" />
                        <Typography variant="body1">
                          Humidity: {weather.current.humidity}%
                        </Typography>
                      </Stack>
                    </Grid>
                    <Grid item xs={6}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <WindIcon color="info" />
                        <Typography variant="body1">
                          Wind: {weather.current.wind_speed} mph
                        </Typography>
                      </Stack>
                    </Grid>
                    <Grid item xs={6}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <VisibilityIcon />
                        <Typography variant="body1">
                          Visibility: Good
                        </Typography>
                      </Stack>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Paper>

            {/* Trip Forecast */}
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Weather Forecast for Your Trip
              </Typography>
              
              {tripForecast.length > 0 ? (
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={2}>
                    {tripForecast.map((day, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card sx={{ height: '100%' }}>
                          <CardContent>
                            <Typography variant="h6" sx={{ mb: 1 }}>
                              {format(new Date(day.date), 'EEE, MMM d')}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              {getWeatherIcon(day.condition)}
                              <Box sx={{ ml: 2 }}>
                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                  {day.temp_max}°F / {day.temp_min}°F
                                </Typography>
                                <Typography variant="body2">
                                  {day.condition}
                                </Typography>
                              </Box>
                            </Box>
                            <Divider sx={{ my: 1 }} />
                            <Stack spacing={1}>
                              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                                <RainIcon fontSize="small" sx={{ mr: 0.5, color: '#1E90FF' }} />
                                Chance of Rain: {day.chance_of_rain}%
                              </Typography>
                              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                                <HumidityIcon fontSize="small" sx={{ mr: 0.5, color: '#1E90FF' }} />
                                Humidity: {day.humidity}%
                              </Typography>
                              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                                <WindIcon fontSize="small" sx={{ mr: 0.5, color: '#708090' }} />
                                Wind: {day.wind_speed} mph
                              </Typography>
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ) : (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No forecast data available for your trip dates. Try checking back closer to your trip.
                </Alert>
              )}
            </Paper>
          </>
        )}
      </Container>
    </Box>
  );
} 