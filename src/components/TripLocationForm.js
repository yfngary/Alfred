import React, { useState, useEffect } from "react";
import { Box, TextField, Typography, InputAdornment } from "@mui/material";
import { LocationOn as LocationIcon } from "@mui/icons-material";
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

// It's recommended to store your API key in an environment variable (e.g., REACT_APP_GOOGLE_MAPS_API_KEY)
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_API_KEY";

const TripLocationForm = ({ formData, updateFormData }) => {
  const [location, setLocation] = useState(formData.location || "");
  const [coordinates, setCoordinates] = useState(formData.coordinates || null);

  // Google Places Autocomplete Setup (restricting results to cities)
  const { suggestions, setValue, clearSuggestions } = usePlacesAutocomplete({
    debounce: 300,
    requestOptions: { types: ["(cities)"] },
  });

  useEffect(() => {
    updateFormData({ 
      location, 
      destination: location, // Add destination field for backend compatibility
      coordinates 
    });
  }, [location, coordinates]);

  // Handles when a city suggestion is selected
  const handleSelect = async (address) => {
    setValue(address, false);
    clearSuggestions();
    setLocation(address);

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      setCoordinates({ lat, lng });
      updateFormData({ location: address, coordinates: { lat, lng } });
    } catch (error) {
      console.error("Error fetching location details:", error);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        textAlign: "center",
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: "bold", mb: 1 }}>
        Trip Location
      </Typography>
      <Typography variant="body1" sx={{ mb: 2, color: "text.secondary" }}>
        Please enter your destination by providing the city and state.
      </Typography>

      <TextField
        label="City & State"
        fullWidth
        variant="outlined"
        value={location}
        onChange={(e) => {
          setLocation(e.target.value);
          setValue(e.target.value); // Update autocomplete suggestions
        }}
        InputLabelProps={{ shrink: true }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LocationIcon color="primary" />
            </InputAdornment>
          ),
        }}
      />

      {/* Suggestions List */}
      {suggestions.status === "OK" && (
        <Box
          sx={{
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "8px",
            p: 1,
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(10px)",
            mt: 1,
            maxHeight: "200px",
            overflowY: "auto",
            zIndex: 10,
            position: "relative",
          }}
        >
          {suggestions.data.map((suggestion, index) => (
            <Typography
              key={index}
              sx={{
                cursor: "pointer",
                p: 1,
                textAlign: "left",
                color: "white",
                borderRadius: "4px",
                "&:hover": { 
                  backgroundColor: "rgba(71, 118, 230, 0.3)",
                  color: "white"
                },
              }}
              onClick={() => handleSelect(suggestion.description)}
            >
              {suggestion.description}
            </Typography>
          ))}
        </Box>
      )}

      {/* Google Map */}
      {coordinates && (
        <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
          <GoogleMap
            mapContainerStyle={{
              width: "100%",
              height: "300px",
              marginTop: "10px",
              borderRadius: "8px",
              border: "1px solid rgba(255, 255, 255, 0.1)"
            }}
            center={coordinates}
            zoom={10}
            options={{
              styles: [
                { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                {
                  featureType: "administrative.locality",
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#d59563" }],
                },
                {
                  featureType: "poi",
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#d59563" }],
                },
                {
                  featureType: "poi.park",
                  elementType: "geometry",
                  stylers: [{ color: "#263c3f" }],
                },
                {
                  featureType: "poi.park",
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#6b9a76" }],
                },
                {
                  featureType: "road",
                  elementType: "geometry",
                  stylers: [{ color: "#38414e" }],
                },
                {
                  featureType: "road",
                  elementType: "geometry.stroke",
                  stylers: [{ color: "#212a37" }],
                },
                {
                  featureType: "road",
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#9ca5b3" }],
                },
                {
                  featureType: "road.highway",
                  elementType: "geometry",
                  stylers: [{ color: "#746855" }],
                },
                {
                  featureType: "road.highway",
                  elementType: "geometry.stroke",
                  stylers: [{ color: "#1f2835" }],
                },
                {
                  featureType: "road.highway",
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#f3d19c" }],
                },
                {
                  featureType: "transit",
                  elementType: "geometry",
                  stylers: [{ color: "#2f3948" }],
                },
                {
                  featureType: "transit.station",
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#d59563" }],
                },
                {
                  featureType: "water",
                  elementType: "geometry",
                  stylers: [{ color: "#17263c" }],
                },
                {
                  featureType: "water",
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#515c6d" }],
                },
                {
                  featureType: "water",
                  elementType: "labels.text.stroke",
                  stylers: [{ color: "#17263c" }],
                },
              ]
            }}
          >
            <Marker position={coordinates} />
          </GoogleMap>
        </LoadScript>
      )}
    </Box>
  );
};

export default TripLocationForm;
