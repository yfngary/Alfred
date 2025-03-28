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
import { useTrips } from '../context/TripContext';

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
  const { refreshTrips } = useTrips();
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
    relationships: [], // Ensure this is initialized as an empty array
    adults: 4, // Default to 4 adults
    kids: 4, // Default to 4 kids
    selectedInvitees: [], // Add this to track selected guests for invitation
    inviteMethod: "email", // Default invitation method
    inviteMessage: "", // Custom invitation message
    guestsToInvite: [], // Guests with contact info for invitations
  });

  const updateFormData = (newData) => {
    setFormData((prevData) => {
      const updatedData = { ...prevData, ...newData };
      return updatedData;
    });
  };

  const handleNext = async () => {
    // Log data when leaving the relationships step
    if (activeStep === steps.length - 1) {
      // Final step: submit the formData
      setIsSubmitting(true);
      try {
        const token = localStorage.getItem("token");
        
        // Prepare the data to send to the server
        const tripData = {
          ...formData,
          guests: formData.guests.map(guest => ({
            name: guest.name,
            email: guest.email || '',
            phone: guest.phone || '',
            type: guest.type || 'adult'
          })),
          guestRelationships: (formData.relationships || []).map(group => ({
            name: group.name || 'Unnamed Group',
            level1: (group.level1 || []).map(guest => ({
              id: guest._id,
              name: guest.name,
              email: guest.email || '',
              phone: guest.phone || '',
              type: guest.type || 'adult'
            })),
            level2: (group.level2 || []).map(guest => ({
              id: guest._id,
              name: guest.name,
              email: guest.email || '',
              phone: guest.phone || '',
              type: guest.type || 'adult'
            }))
          }))
        };
        const response = await fetch("http://localhost:5001/api/trips", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify(tripData),
        });

        if (response.ok) {
          const data = await response.json();
          refreshTrips(); // Refresh trips in NavBar
          
          // Check if we have guests to invite
          if (formData.selectedInvitees && formData.selectedInvitees.length > 0 && formData.guestsToInvite) {
            try {
              // Get or generate an invite code for the trip
              const inviteCodeResponse = await fetch(`http://localhost:5001/api/trips/${data.trip._id}/invite-code`, {
                method: "POST",
                headers: { 
                  "Content-Type": "application/json", 
                  Authorization: `Bearer ${token}`,
                },
                credentials: "include",
              });
              
              if (!inviteCodeResponse.ok) {
                console.error("❌ Failed to get invite code:", await inviteCodeResponse.text());
                throw new Error("Failed to generate invite code");
              }
              
              const inviteCodeData = await inviteCodeResponse.json();
              const inviteCode = inviteCodeData.inviteCode;
              
              // Create the join link
              const joinLink = `${window.location.origin}/join-trip/${inviteCode}`;
              
              // Update the invitation message to include the join link
              let enhancedMessage = formData.inviteMessage;
              if (!enhancedMessage.includes("Click here to join")) {
                enhancedMessage += `\n\nClick here to join the trip: ${joinLink}`;
              }
              
              // Prepare invitation data
              const invitationData = {
                guests: formData.guestsToInvite,
                inviteMethod: formData.inviteMethod,
                customMessage: enhancedMessage,
                inviteCode: inviteCode,
                joinLink: joinLink
              };
              
              // Send invitations for the newly created trip
              const inviteResponse = await fetch(`http://localhost:5001/api/trips/${data.trip._id}/send-invitations`, {
                method: "POST",
                headers: { 
                  "Content-Type": "application/json", 
                  Authorization: `Bearer ${token}`,
                },
                credentials: "include",
                body: JSON.stringify(invitationData),
              });
              
              if (!inviteResponse.ok) {
                console.error("❌ Error sending invitations:", await inviteResponse.text());
              } else {
                const inviteResult = await inviteResponse.json();
              }
            } catch (inviteError) {
              console.error("❌ Exception sending invitations:", inviteError);
            }
          } else {
            console.log("ℹ️ No guests selected for invitation");
          }
          
          navigate(`/trips/${data.trip._id}`);
        } else {
          const errorData = await response.json();
          console.error("❌ Error creating trip:", errorData);
          throw new Error(errorData.error || "Failed to create trip.");
        }
      } catch (error) {
        console.error("❌ Error in submission process:", error);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      console.log(formData.lodgings)
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const user = JSON.parse(localStorage.getItem("user"));

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
          <GuestSelection 
            formData={formData} 
            updateFormData={updateFormData}
            userName={user.name}
          />
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
        backgroundColor: "background.paper",
        backdropFilter: "blur(10px)",
        borderRadius: 2,
        boxShadow: 3,
        border: "1px solid rgba(255, 255, 255, 0.1)",
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
      <Stepper 
        activeStep={activeStep} 
        alternativeLabel 
        sx={{ 
          mb: 4,
          '& .MuiStepLabel-root .Mui-completed': {
            color: 'secondary.main', // completed icon color
          },
          '& .MuiStepLabel-root .Mui-active': {
            color: 'primary.main', // active icon color
          }
        }}
      >
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
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <Button
          variant="outlined"
          onClick={handleBack}
          disabled={activeStep === 0}
          sx={{
            borderRadius: 2,
            fontWeight: 600,
            textTransform: 'none',
          }}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={isSubmitting}
          sx={{
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
