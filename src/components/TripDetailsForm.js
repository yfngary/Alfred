import React, { useState, useEffect } from "react";
import { Box, TextField, Typography } from "@mui/material";

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
        color: "black",
        textAlign: "center",
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: "bold", color: "black" }}>
        Trip Details
      </Typography>
      <Typography variant="body1" sx={{ color: "black" }}>
        Please enter your trip name and select the dates for your trip.
      </Typography>

      <TextField
        label="Trip Name"
        fullWidth
        variant="outlined"
        value={tripDetails.tripName}
        onChange={(e) => handleChange("tripName", e.target.value)}
        InputLabelProps={{ style: { color: "black", textAlign: "center" } }}
        InputProps={{ style: { color: "black", textAlign: "center" } }}
      />

      <TextField
        label="Start Date"
        type="date"
        fullWidth
        variant="outlined"
        InputLabelProps={{
          shrink: true,
          style: { color: "black", textAlign: "center" },
        }}
        inputProps={{
          min: today,
          style: { textAlign: "center", color: "black" },
        }}
        value={tripDetails.startDate}
        onChange={(e) => {
          const newStartDate = e.target.value;
          handleChange("startDate", newStartDate);
          if (newStartDate > tripDetails.endDate) {
            handleChange("endDate", newStartDate);
          }
        }}
        InputProps={{ style: { color: "black", textAlign: "center" } }}
      />

      <TextField
        label="End Date"
        type="date"
        fullWidth
        variant="outlined"
        InputLabelProps={{
          shrink: true,
          style: { color: "black", textAlign: "center" },
        }}
        inputProps={{
          min: tripDetails.startDate,
          style: { textAlign: "center", color: "black" },
        }}
        value={tripDetails.endDate}
        onChange={(e) => handleChange("endDate", e.target.value)}
        InputProps={{ style: { color: "black", textAlign: "center" } }}
      />
    </Box>
  );
};

export default TripDetailsForm;
