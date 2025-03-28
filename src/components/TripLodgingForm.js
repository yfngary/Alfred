import React, { useState, useEffect } from "react";
import { Box, TextField, Typography, Button, Paper, InputAdornment, IconButton } from "@mui/material";
import { LocationOn as LocationIcon, CalendarToday as CalendarIcon, Hotel as HotelIcon, Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";

const TripLodgingForm = ({ formData, updateFormData }) => {
  const [lodgings, setLodgings] = useState(formData.lodgings || []);
  const tripStartDate = formData.startDate;
  const tripEndDate = formData.endDate;
  const [activeIndex, setActiveIndex] = useState(null);

  // Initialize usePlacesAutocomplete for suggestions
  const { suggestions, setValue, clearSuggestions } = usePlacesAutocomplete({
    debounce: 300,
  });

  const handleLodgingChange = (index, field, value) => {
    const updatedLodging = [...lodgings];
    updatedLodging[index] = { ...updatedLodging[index], [field]: value };
    setLodgings(updatedLodging);
  };

  const handleSelect = async (address, index) => {
    setValue(address, false);
    clearSuggestions();
    handleLodgingChange(index, "name", address);
    setActiveIndex(null);

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
    setLodgings([
      ...lodgings,
      { name: "", checkIn: tripStartDate, checkOut: tripEndDate },
    ]);
  };

  const removeLodging = (index) => {
    const updatedLodging = lodgings.filter((_, i) => i !== index);
    setLodgings(updatedLodging);
  };

  useEffect(() => {
    updateFormData({ lodgings });
  }, [lodgings]);

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
        Lodging Details
      </Typography>
      <Typography variant="body1" sx={{ mb: 2, color: "text.secondary" }}>
        Please enter the details for your lodging. You can add multiple lodging locations if needed.
      </Typography>

      {lodgings.map((lodgingItem, index) => (
        <Paper
          key={index}
          elevation={2}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "8px",
            p: 3,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(10px)",
            position: "relative",
          }}
        >
          <Box sx={{ position: "absolute", top: 10, right: 10 }}>
            <IconButton 
              color="error" 
              onClick={() => removeLodging(index)}
              size="small"
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                }
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Box>

          <Typography variant="h6" sx={{ fontWeight: "bold", color: "primary.main", mb: 1 }}>
            Lodging {index + 1}
          </Typography>

          <TextField
            label="Location"
            fullWidth
            variant="outlined"
            value={lodgingItem.name}
            onChange={(e) => {
              handleLodgingChange(index, "name", e.target.value);
              setValue(e.target.value);
              setActiveIndex(index);
            }}
            onFocus={() => setActiveIndex(index)}
            InputLabelProps={{ shrink: true }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocationIcon color="primary" />
                </InputAdornment>
              ),
            }}
          />

          {suggestions.status === "OK" && activeIndex === index && (
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
              {suggestions.data.map((suggestion, i) => (
                <Typography
                  key={i}
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
                  onClick={() => handleSelect(suggestion.description, index)}
                >
                  {suggestion.description}
                </Typography>
              ))}
            </Box>
          )}

          <TextField
            label="Start Date"
            type="date"
            fullWidth
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarIcon color="primary" />
                </InputAdornment>
              ),
              sx: {
                "& input::-webkit-calendar-picker-indicator": {
                  opacity: 1,
                  cursor: "pointer",
                  filter: "invert(0.7)",
                  width: "24px",
                  height: "24px",
                }
              }
            }}
            inputProps={{
              min: tripStartDate,
              max: tripEndDate,
            }}
            value={lodgingItem.checkIn}
            onChange={(e) => {
              const newStartDate = e.target.value;
              handleLodgingChange(index, "checkIn", newStartDate);
              if (newStartDate > lodgingItem.checkOut) {
                handleLodgingChange(index, "checkOut", newStartDate);
              }
            }}
            onClick={(e) => e.target.showPicker()}
          />

          <TextField
            label="End Date"
            type="date"
            fullWidth
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarIcon color="primary" />
                </InputAdornment>
              ),
              sx: {
                "& input::-webkit-calendar-picker-indicator": {
                  opacity: 1,
                  cursor: "pointer",
                  filter: "invert(0.7)",
                  width: "24px",
                  height: "24px",
                }
              }
            }}
            inputProps={{
              min: tripStartDate,
              max: tripEndDate,
            }}
            value={lodgingItem.checkOut}
            onChange={(e) =>
              handleLodgingChange(index, "checkOut", e.target.value)
            }
            onClick={(e) => e.target.showPicker()}
          />
        </Paper>
      ))}

      <Button 
        variant="contained" 
        onClick={addLodging} 
        startIcon={<AddIcon />}
        sx={{ 
          mt: 2, 
          alignSelf: "center",
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
        }}
      >
        Add Lodging
      </Button>
    </Box>
  );
};

export default TripLodgingForm;
