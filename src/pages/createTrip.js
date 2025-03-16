import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import TripDetailsForm from "../components/TripDetailsForm";
import TripLocationForm from "../components/TripLocationForm";
import TripLodgingForm from "../components/TripLodgingForm";
import GuestSelection from "../components/GuestSelection";
import GuestRelationship from "../components/GuestRelationship"; // New Step Added
import InviteGuestsForm from "../components/InviteGuestsForm";
import ReviewTripForm from "../components/ReviewTripForm";
import {
  Box,
  Button,
  Stepper,
  Step,
  StepLabel,
  Typography,
  CircularProgress,
} from "@mui/material";

const steps = [
  "Trip Details",
  "Location",
  "Lodging",
  "Guests",
  "Relationships", // Added Guest Relationship Step
  "Invite",
  "Review & Confirm",
];

const CreateTrip = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    tripName: "",
    startDate: "",
    endDate: "",
    tripLocation: "",
    selectedLocation: null,
    lodgings: [],
    guests: [],
    relationships: [], // For Guest Relationships
    adults: 4, // Default to 4 adults
    kids: 4, // Default to 4 kids
  });

  const updateFormData = (newData) => {
    setFormData((prevData) => ({ ...prevData, ...newData }));
  };

  const handleNext = async () => {
    if (activeStep === steps.length - 1) {
      // Final step: submit the formData
      setIsSubmitting(true);
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:5001/api/trips", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          const data = await response.json();
          navigate(`/trip/${data.trip._id}`);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create trip.");
        }
      } catch (error) {
        console.error("Error submitting trip:", error);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <TripDetailsForm
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 1:
        return (
          <TripLocationForm
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 2:
        return (
          <TripLodgingForm
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 3:
        return (
          <GuestSelection formData={formData} updateFormData={updateFormData} />
        );
      case 4:
        return (
          <GuestRelationship
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 5:
        return (
          <InviteGuestsForm
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 6:
        return (
          <ReviewTripForm formData={formData} updateFormData={updateFormData} />
        );
      default:
        return <Typography variant="h6">Unknown Step</Typography>;
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 800,
        mx: "auto",
        mt: 4,
        p: 4,
        backgroundColor: "white",
        borderRadius: 2,
        boxShadow: 3,
      }}
    >
      <Typography
        variant="h4"
        align="center"
        gutterBottom
        sx={{ fontWeight: "bold", mb: 3 }}
      >
        Create a New Trip
      </Typography>

      {/* Stepper Navigation */}
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel sx={{ fontWeight: "medium" }}>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Content Area */}
      <Box sx={{ mt: 3, minHeight: "300px" }}>
        {renderStepContent(activeStep)}
      </Box>

      {/* Navigation Buttons */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mt: 4,
          pt: 2,
          borderTop: "1px solid #e0e0e0",
        }}
      >
        <Button
          variant="outlined"
          onClick={handleBack}
          disabled={activeStep === 0}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <CircularProgress size={24} color="inherit" />
          ) : activeStep === steps.length - 1 ? (
            "Finish"
          ) : (
            "Next"
          )}
        </Button>
      </Box>
    </Box>
  );
};

export default CreateTrip;
