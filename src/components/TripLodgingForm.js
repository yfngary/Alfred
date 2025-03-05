import React, { useState, useEffect } from "react";
import { Box, TextField, Typography, Button } from "@mui/material";
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";

const TripLodgingForm = ({ formData, updateFormData }) => {
  const [lodging, setLodging] = useState(formData.lodging || []);
  const tripStartDate = formData.startDate;
  const tripEndDate = formData.endDate;

  // Initialize usePlacesAutocomplete for suggestions
  const { suggestions, setValue, clearSuggestions } = usePlacesAutocomplete({
    debounce: 300,
  });

  const handleLodgingChange = (index, field, value) => {
    const updatedLodging = [...lodging];
    updatedLodging[index] = { ...updatedLodging[index], [field]: value };
    setLodging(updatedLodging);
  };

  const handleSelect = async (address, index) => {
    setValue(address, false);
    clearSuggestions();
    handleLodgingChange(index, "location", address);

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      // Optionally, you can save the coordinates with the lodging entry.
      // updatedLodging[index].coordinates = { lat, lng }
    } catch (error) {
      console.error("Error fetching location details:", error);
    }
  };

  const addLodging = () => {
    setLodging([
      ...lodging,
      { location: "", startDate: tripStartDate, endDate: tripEndDate },
    ]);
  };

  const removeLodging = (index) => {
    const updatedLodging = lodging.filter((_, i) => i !== index);
    setLodging(updatedLodging);
  };

  useEffect(() => {
    updateFormData({ lodging });
  }, [lodging]);

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
        Lodging Details
      </Typography>
      <Typography variant="body1">
        Please enter the details for your lodging. You can add multiple lodging locations if needed.
      </Typography>

      {lodging.map((lodgingItem, index) => (
        <Box
          key={index}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            border: "1px solid #ccc",
            borderRadius: "8px",
            p: 2,
            backgroundColor: "#f9f9f9",
          }}
        >
          <TextField
            label={`Lodging ${index + 1} Location`}
            fullWidth
            variant="outlined"
            value={lodgingItem.location}
            onChange={(e) => {
              handleLodgingChange(index, "location", e.target.value);
              setValue(e.target.value);
            }}
            InputLabelProps={{ style: { color: "black", textAlign: "center" } }}
            InputProps={{ style: { color: "black", textAlign: "center" } }}
          />

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
              {suggestions.data.map((suggestion, i) => (
                <Typography
                  key={i}
                  sx={{
                    cursor: "pointer",
                    p: 1,
                    textAlign: "center",
                    color: "black",
                    "&:hover": { backgroundColor: "#f0f0f0" },
                  }}
                  onClick={() => handleSelect(suggestion.description, index)}
                >
                  {suggestion.description}
                </Typography>
              ))}
            </Box>
          )}

          <TextField
            label="Lodging Start Date"
            type="date"
            fullWidth
            variant="outlined"
            InputLabelProps={{
              shrink: true,
              style: { color: "black", textAlign: "center" },
            }}
            inputProps={{
              min: tripStartDate,
              max: tripEndDate,
              style: { textAlign: "center", color: "black" },
            }}
            value={lodgingItem.startDate}
            onChange={(e) => {
              const newStartDate = e.target.value;
              handleLodgingChange(index, "startDate", newStartDate);
              if (newStartDate > lodgingItem.endDate) {
                handleLodgingChange(index, "endDate", newStartDate);
              }
            }}
            InputProps={{ style: { color: "black", textAlign: "center" } }}
          />

          <TextField
            label="Lodging End Date"
            type="date"
            fullWidth
            variant="outlined"
            InputLabelProps={{
              shrink: true,
              style: { color: "black", textAlign: "center" },
            }}
            inputProps={{
              min: lodgingItem.startDate,
              max: tripEndDate,
              style: { textAlign: "center", color: "black" },
            }}
            value={lodgingItem.endDate}
            onChange={(e) =>
              handleLodgingChange(index, "endDate", e.target.value)
            }
            InputProps={{ style: { color: "black", textAlign: "center" } }}
          />

          <Button
            variant="outlined"
            color="error"
            onClick={() => removeLodging(index)}
            sx={{ alignSelf: "center", mt: 1 }}
          >
            Remove Lodging
          </Button>
        </Box>
      ))}

      <Button variant="contained" onClick={addLodging} sx={{ mt: 2, alignSelf: "center" }}>
        Add Another Lodging
      </Button>
    </Box>
  );
};

export default TripLodgingForm;
