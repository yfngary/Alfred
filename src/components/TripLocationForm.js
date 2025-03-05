import React, { useState, useEffect } from "react";
import { Box, TextField, Typography } from "@mui/material";
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
    updateFormData({ location, coordinates });
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
        color: "black",
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: "bold" }}>
        Trip Location
      </Typography>
      <Typography variant="body1">
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
        InputLabelProps={{ style: { color: "black", textAlign: "center" } }}
        InputProps={{ style: { color: "black", textAlign: "center" } }}
      />

      {/* Suggestions List */}
      {suggestions.status === "OK" && (
        <Box
          sx={{
            border: "1px solid #ccc",
            borderRadius: "5px",
            p: 1,
            background: "#fff",
            mt: 1,
          }}
        >
          {suggestions.data.map((suggestion, index) => (
            <Typography
              key={index}
              sx={{
                cursor: "pointer",
                p: 1,
                textAlign: "center",
                "&:hover": { backgroundColor: "#f0f0f0" },
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
            }}
            center={coordinates}
            zoom={10}
          >
            <Marker position={coordinates} />
          </GoogleMap>
        </LoadScript>
      )}
    </Box>
  );
};

export default TripLocationForm;
