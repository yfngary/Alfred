import React, { useState, useEffect } from "react";
import { Box, TextField, Typography, InputAdornment } from "@mui/material";
import { CalendarToday as CalendarIcon } from "@mui/icons-material";

const TripDetailsForm = ({ formData, updateFormData }) => {
  const today = new Date().toISOString().split("T")[0];

  const [tripDetails, setTripDetails] = useState({
    tripName: formData.tripName || "",
    startDate: formData.startDate || today,
    endDate: formData.endDate || today,
  });

  useEffect(() => {
    updateFormData(tripDetails);
  }, [tripDetails]);

  const handleChange = (field, value) => {
    setTripDetails((prev) => ({
      ...prev,
      [field]: value,
    }));
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
        Trip Details
      </Typography>
      <Typography variant="body1" sx={{ mb: 2, color: "text.secondary" }}>
        Please enter your trip name and select the dates for your trip.
      </Typography>

      <TextField
        label="Trip Name"
        fullWidth
        variant="outlined"
        value={tripDetails.tripName}
        onChange={(e) => handleChange("tripName", e.target.value)}
        InputLabelProps={{ shrink: true }}
      />

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
          min: today,
        }}
        value={tripDetails.startDate}
        onChange={(e) => {
          const newStartDate = e.target.value;
          handleChange("startDate", newStartDate);
          if (newStartDate > tripDetails.endDate) {
            handleChange("endDate", newStartDate);
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
          min: tripDetails.startDate,
        }}
        value={tripDetails.endDate}
        onChange={(e) => handleChange("endDate", e.target.value)}
        onClick={(e) => e.target.showPicker()}
      />
    </Box>
  );
};

export default TripDetailsForm;
