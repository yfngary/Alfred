import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Alert,
  MenuItem,
  Select,
  FormControl,
  Divider,
} from "@mui/material";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

const MAX_TOTAL_GUESTS = 50;

const GuestSelection = ({ formData, updateFormData, userName }) => {
  const [adults, setAdults] = useState(formData.adults || 4);
  const [kids, setKids] = useState(formData.kids || 4);
  const [adultNames, setAdultNames] = useState(() => {
    // Initialize the first adult as the user
    const adultArray = Array.from({ length: adults }, (_, i) => ({
      name: i === 0 ? (userName || "You") : `adult-${i + 1}`,
      contact: "",
      contactType: "",
    }));
    return adultArray;
  });
  const [childNames, setChildNames] = useState(
    Array.from({ length: kids }, (_, i) => ({
      name: `child-${i + 1}`,
      contact: "",
      contactType: "",
    }))
  );
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const guests = adultNames.concat(childNames).map((guest, index) => ({
      name: index === 0 && adults > 0 ? userName || "You" : guest.name,
      email: guest.contactType === 'Email' ? guest.contact : '',
      phone: guest.contactType === 'Phone' ? guest.contact : '',
      type: index < adults ? 'adult' : 'child'  // Determine type based on array position
    }));

    updateFormData({...formData, adults, kids, guests });
  }, [adults, kids, adultNames, childNames, userName]);

  // Update adultNames when userName changes
  useEffect(() => {
    if (userName && adultNames.length > 0) {
      const updatedAdultNames = [...adultNames];
      updatedAdultNames[0] = { ...updatedAdultNames[0], name: userName };
      setAdultNames(updatedAdultNames);
    }
  }, [userName]);

  const handleGuestChange = (type, newValue) => {
    newValue = Math.max(0, parseInt(newValue, 10) || 0);
    const otherValue = type === "adults" ? kids : adults;

    if (newValue + otherValue > MAX_TOTAL_GUESTS) {
      setShowWarning(true);
      return;
    } else {
      setShowWarning(false);
    }

    if (type === "adults") {
      setAdults(newValue);
      // Ensure the first adult is always the user
      setAdultNames(
        Array.from(
          { length: newValue },
          (_, i) => {
            if (i === 0) {
              return adultNames[0] || { name: userName || "You", contact: "", contactType: "" };
            }
            return adultNames[i] || { name: "", contact: "", contactType: "" };
          }
        )
      );
    } else {
      setKids(newValue);
      setChildNames(
        Array.from(
          { length: newValue },
          (_, i) => childNames[i] || { name: "", contact: "", contactType: "" }
        )
      );
    }
  };

  const handleContactChange = (type, index, field, value) => {
    // Prevent changing the name of the first adult
    if (type === "adults" && index === 0 && field === "name") {
      return;
    }
    
    const updatedList = type === "adults" ? [...adultNames] : [...childNames];

    if (field === "contactType") {
      updatedList[index].contactType = value;
      updatedList[index].contact = ""; // Reset contact field when switching type
    } else {
      updatedList[index][field] = value;
    }

    if (type === "adults") setAdultNames(updatedList);
    else setChildNames(updatedList);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        p: 2,
        color: "white",
        textAlign: "center",
      }}
    >
      {showWarning && (
        <Alert severity="warning" sx={{ textAlign: "center", mb: 1, color: "white" }}>
          The maximum number of guests allowed is <strong>{MAX_TOTAL_GUESTS}</strong>.
        </Alert>
      )}

      <Typography
        variant="h6"
        sx={{ fontWeight: "bold", textAlign: "center", mt: 1, color: "white" }}
      >
        Add Guests
      </Typography>
      <Typography variant="body1" sx={{ textAlign: "center", mb: 2, color: "white" }}>
        Please specify the number of adults and children joining your trip.
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        {/* Adults Section */}
        <Box sx={{ display: "flex", flexDirection: "column", flex: 1, color: "white" }}>
          <Typography sx={{ fontWeight: "bold", textAlign: "center", color: "white" }}>
            Adults
          </Typography>
          <Typography variant="body2" sx={{ color: "gray", textAlign: "center" }}>
            Ages 13 or above
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mt: 1,
            }}
          >
            <IconButton
              onClick={() => handleGuestChange("adults", adults - 1)}
              disabled={adults <= 1}
            >
              <RemoveCircleOutlineIcon fontSize="small" />
            </IconButton>
            <TextField
              type="number"
              variant="standard"
              size="small"
              value={adults}
              onChange={(e) => handleGuestChange("adults", e.target.value)}
              inputProps={{
                min: 1,
                max: MAX_TOTAL_GUESTS - kids,
                style: { textAlign: "center", fontSize: "14px", width: "40px", color: "white" },
              }}
              sx={{ input: { color: "white", textAlign: "center" } }}
            />
            <IconButton
              onClick={() => handleGuestChange("adults", adults + 1)}
              disabled={adults + kids >= MAX_TOTAL_GUESTS}
            >
              <AddCircleOutlineIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Box
          sx={{
            width: "1px",
            height: "100%",
            backgroundColor: "#ccc",
            alignSelf: "stretch",
          }}
        />

        {/* Children Section */}
        <Box sx={{ display: "flex", flexDirection: "column", flex: 1, color: "white" }}>
          <Typography sx={{ fontWeight: "bold", textAlign: "center", color: "white" }}>
            Children
          </Typography>
          <Typography variant="body2" sx={{ color: "gray", textAlign: "center" }}>
            Ages 2 - 12
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mt: 1,
            }}
          >
            <IconButton
              onClick={() => handleGuestChange("kids", kids - 1)}
              disabled={kids <= 0}
            >
              <RemoveCircleOutlineIcon fontSize="small" />
            </IconButton>
            <TextField
              type="number"
              variant="standard"
              size="small"
              value={kids}
              onChange={(e) => handleGuestChange("kids", e.target.value)}
              inputProps={{
                min: 0,
                max: MAX_TOTAL_GUESTS - adults,
                style: { textAlign: "center", fontSize: "14px", width: "40px", color: "white" },
              }}
              sx={{ input: { color: "white", textAlign: "center" } }}
            />
            <IconButton
              onClick={() => handleGuestChange("kids", kids + 1)}
              disabled={adults + kids >= MAX_TOTAL_GUESTS}
            >
              <AddCircleOutlineIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ my: 2, textAlign: "center", color: "white" }}>Adults</Divider>

      {/* Adult Guest Input Fields */}
      {adultNames.map((guest, index) => (
        <Box
          key={index}
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 1,
            mt: 1,
            color: "white",
          }}
        >
          <TextField
            label={index === 0 ? "You (Primary Guest)" : `Adult ${index + 1}`}
            fullWidth
            variant="outlined"
            size="small"
            sx={{
              maxWidth: "180px",
              input: { color: "white", textAlign: "center" },
              label: { color: "white", textAlign: "center" },
            }}
            value={guest.name}
            onChange={(e) =>
              handleContactChange("adults", index, "name", e.target.value)
            }
            disabled={index === 0}
          />
          {(guest.name.trim() || index === 0) && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 1,
                width: "100%",
              }}
            >
              <FormControl sx={{ minWidth: 80 }}>
                <Select
                  value={guest.contactType}
                  size="small"
                  onChange={(e) =>
                    handleContactChange("adults", index, "contactType", e.target.value)
                  }
                  displayEmpty
                  sx={{ color: "white", textAlign: "center" }}
                >
                  <MenuItem value="">Select</MenuItem>
                  <MenuItem value="Email">Email</MenuItem>
                  <MenuItem value="Phone">Phone</MenuItem>
                </Select>
              </FormControl>
              {guest.contactType && (
                <TextField
                  label={guest.contactType === "Email" ? "Email Address" : "Phone Number"}
                  fullWidth
                  variant="outlined"
                  size="small"
                  value={guest.contact}
                  onChange={(e) =>
                    handleContactChange("adults", index, "contact", e.target.value)
                  }
                  sx={{
                    maxWidth: "180px",
                    input: { color: "white", textAlign: "center" },
                    label: { color: "white", textAlign: "center" },
                  }}
                />
              )}
            </Box>
          )}
        </Box>
      ))}

      <Divider sx={{ my: 2, textAlign: "center", color: "white" }}>Children</Divider>

      {/* Children Guest Input Fields */}
      {childNames.map((guest, index) => (
        <Box
          key={index}
          sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1, color: "white" }}
        >
          <TextField
            label={`Child ${index + 1}`}
            fullWidth
            variant="outlined"
            size="small"
            sx={{
              maxWidth: "180px",
              input: { color: "white", textAlign: "center" },
              label: { color: "white", textAlign: "center" },
            }}
            value={guest.name}
            onChange={(e) =>
              handleContactChange("kids", index, "name", e.target.value)
            }
          />
        </Box>
      ))}
    </Box>
  );
};

export default GuestSelection;

