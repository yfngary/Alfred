import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Checkbox,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Grid,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Tooltip,
  Alert,
  Switch,
  Snackbar,
} from "@mui/material";
import {
  Email as EmailIcon,
  Sms as SmsIcon,
  ContactPhone as ContactPhoneIcon,
  ContentCopy as ContentCopyIcon,
  Check as CheckIcon,
  PersonAdd as PersonAddIcon,
  Send as SendIcon,
  Group as GroupIcon,
} from "@mui/icons-material";
import axios from "axios";

const InviteGuestsPage = ({ formData, updateFormData }) => {
  // States for guest selection and invitation options
  const [selectedGuests, setSelectedGuests] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [inviteMethod, setInviteMethod] = useState("email");
  const [customMessage, setCustomMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [shareableLink, setShareableLink] = useState("");
  const [showGroups, setShowGroups] = useState(false);

  // Extract all guests from formData
  const allGuests = formData.guests || [];

  // Get all relationships/groups
  const groups = formData.relationships || [];
  
  // Log for debugging
  useEffect(() => {
    console.log("InviteGuestsForm - formData:", formData);
    console.log("InviteGuestsForm - all guests:", allGuests);
  }, [formData, allGuests]);

  // Use effect to initialize selected guests from formData if available
  useEffect(() => {
    if (formData.selectedInvitees && formData.selectedInvitees.length > 0) {
      setSelectedGuests(formData.selectedInvitees);
    }
    
    if (formData.inviteMethod) {
      setInviteMethod(formData.inviteMethod);
    }
    
    if (formData.inviteMessage) {
      setCustomMessage(formData.inviteMessage);
    }
  }, [formData.selectedInvitees, formData.inviteMethod, formData.inviteMessage]);

  // Set a default custom message based on the trip details
  useEffect(() => {
    const tripName = formData.tripName || "";
    const startDate = formData.startDate || "";
    const endDate = formData.endDate || "";

    setCustomMessage(
      `Hi! I'm inviting you to join my trip${
        tripName ? ` to ${tripName}` : ""
      }${startDate ? ` from ${startDate}` : ""}${
        endDate ? ` to ${endDate}` : ""
      }. Please join and let me know if you can make it!`
    );
  }, [formData]);

  // Handle select all toggle
  const handleToggleSelectAll = () => {
    if (!selectAll) {
      // Select all guests
      setSelectedGuests(eligibleGuests.map((guest) => guest.name || ""));
    } else {
      // Deselect all guests
      setSelectedGuests([]);
    }
    setSelectAll(!selectAll);
  };

  // Check if a guest has the required contact info for the selected invitation method
  const hasRequiredContactInfo = (guest) => {
    // Log each guest's contact info for debugging
    console.log(`Guest ${guest.name} email:`, guest.email, "phone:", guest.phone, "contactType:", guest.contactType);
    
    if (inviteMethod === "email") {
      // Check for email in various possible locations
      const hasEmail = !!(
        guest.email || 
        guest.contact || 
        (guest.contactInfo && guest.contactInfo.email) ||
        (typeof guest.contact === "string" && guest.contact.includes("@"))
      );
      console.log(`Guest ${guest.name} has email:`, hasEmail);
      return hasEmail;
    } else if (inviteMethod === "sms") {
      // Check for phone in various possible locations
      const hasPhone = !!(
        guest.phone ||
        guest.phoneNumber ||
        guest.mobile ||
        (guest.contactInfo && guest.contactInfo.phone)
      );
      console.log(`Guest ${guest.name} has phone:`, hasPhone);
      return hasPhone;
    }
    return true; // For link method, no specific contact info needed
  };

  const getEligibleGuests = () => {
    const filtered = allGuests.filter((guest) => hasRequiredContactInfo(guest));
    
    // If no eligible guests are found, but we have guests, show a warning and return all guests
    if (filtered.length === 0 && allGuests.length > 0) {
      console.warn("No eligible guests found with required contact info. Consider reviewing your guest data or using the link method instead.");
      
      // For debugging, let's still return all guests so we can see what we're working with
      if (inviteMethod === "link") {
        return allGuests;
      }
    }
    
    return filtered;
  };
  const eligibleGuests = getEligibleGuests();
  
  // Log eligible guests for debugging
  useEffect(() => {
    console.log("InviteGuestsForm - eligible guests:", eligibleGuests);
    console.log("InviteGuestsForm - invite method:", inviteMethod);
  }, [eligibleGuests, inviteMethod]);

  // Update selectAll checkbox state when selectedGuests changes
  useEffect(() => {
    // Only update if not triggered by the selectAll toggle itself
    const allGuestNames = eligibleGuests.map((guest) => guest.name || "");
    const allSelected =
      allGuestNames.length > 0 &&
      allGuestNames.every((name) => selectedGuests.includes(name));

    if (allSelected) {
      if (!selectAll) setSelectAll(true);
    } else {
      if (selectAll) setSelectAll(false);
    }
  }, [selectedGuests, eligibleGuests]);

  // Toggle individual guest selection
  const handleToggleSelect = (guestName) => {
    // Make sure we're working with the specific name only
    if (!guestName) return;

    setSelectedGuests((prev) => {
      if (prev.includes(guestName)) {
        // If already selected, remove it
        return prev.filter((name) => name !== guestName);
      } else {
        // If not selected, add only this specific name
        return [...prev, guestName];
      }
    });
  };

  // Select all guests in a group
  const handleSelectGroup = (groupId) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;

    // Get all guests in the group (both level1 and level2)
    // Make sure we handle different data structures
    const groupGuests = [...(group.level1 || []), ...(group.level2 || [])];

    // Extract names properly
    const groupGuestNames = groupGuests
      .map((guest) => guest.name)
      .filter(Boolean); // Remove any undefined or null values

    // Add all guests from the group to selected
    setSelectedGuests((prev) => {
      const newSelection = [...prev];
      groupGuestNames.forEach((name) => {
        if (!newSelection.includes(name)) {
          newSelection.push(name);
        }
      });
      return newSelection;
    });
  };

  // Create a shareable link
  const generateShareableLink = async () => {
    setIsCreatingLink(true);
    
    try {
      // Call backend API to generate or retrieve invite code
      const response = await axios.post(`/api/trips/${formData.tripId}/invite-code`);
      const { inviteCode } = response.data;
      
      // Create the shareable link
      const link = `${window.location.origin}/join-trip/${inviteCode}`;
      setShareableLink(link);
      
      // Update formData if needed
      if (updateFormData) {
        updateFormData({
          ...formData,
          inviteCode,
          shareableLink: link,
        });
      }
    } catch (error) {
      console.error("Error generating invite link:", error);
      setSnackbarMessage(`Failed to generate link: ${error.response?.data?.error || error.message}`);
      setSnackbarOpen(true);
    } finally {
      setIsCreatingLink(false);
    }
  };

  // Copy link to clipboard
  const copyLinkToClipboard = () => {
    if (navigator.clipboard && shareableLink) {
      navigator.clipboard
        .writeText(shareableLink)
        .then(() => {
          setSnackbarMessage("Link copied to clipboard!");
          setSnackbarOpen(true);
        })
        .catch((err) => {
          console.error("Failed to copy: ", err);
          setSnackbarMessage("Failed to copy link");
          setSnackbarOpen(true);
        });
    }
  };

  // Save invitation preferences (replacing the sendInvitations function)
  const saveInvitationPreferences = () => {
    if (selectedGuests.length === 0) {
      setSnackbarMessage("Please select at least one guest to invite");
      setSnackbarOpen(true);
      return;
    }

    // Filter guests by the selected names and required contact info
    const guestsToInvite = allGuests.filter(
      (guest) =>
        selectedGuests.includes(guest.name) && hasRequiredContactInfo(guest)
    );

    if (guestsToInvite.length === 0) {
      setSnackbarMessage(
        `No guests have the required contact info for ${inviteMethod} invitations`
      );
      setSnackbarOpen(true);
      return;
    }

    // Update formData with invitation preferences
    updateFormData({
      ...formData,
      selectedInvitees: selectedGuests,
      inviteMethod: inviteMethod,
      inviteMessage: customMessage,
      guestsToInvite: guestsToInvite,
    });

    // Show confirmation message
    setSnackbarMessage(
      `${selectedGuests.length} guest(s) selected for invitation upon trip submission`
    );
    setSnackbarOpen(true);
  };

  // Get guest contact info and display appropriate icons
  const getGuestContactInfo = (guest) => {
    // Helper to extract email from various possible locations
    const getEmail = (guest) => {
      return (
        guest.email ||
        guest.contact ||
        (guest.contactInfo && guest.contactInfo.email) ||
        (typeof guest.contact === "string" && guest.contact.includes("@")
          ? guest.contact
          : null)
      );
    };

    // Helper to extract phone from various possible locations
    const getPhone = (guest) => {
      return (
        guest.phone ||
        guest.phoneNumber ||
        guest.mobile ||
        (guest.contactInfo && guest.contactInfo.phone)
      );
    };

    const email = getEmail(guest);
    const phone = getPhone(guest);
    const hasEmail = !!email;
    const hasPhone = !!phone;

    if (hasEmail && hasPhone) {
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title={email}>
            <EmailIcon fontSize="small" color="primary" />
          </Tooltip>
          <Tooltip title={phone}>
            <SmsIcon fontSize="small" color="secondary" />
          </Tooltip>
        </Box>
      );
    } else if (hasEmail) {
      return (
        <Tooltip title={email}>
          <EmailIcon fontSize="small" color="primary" />
        </Tooltip>
      );
    } else if (hasPhone) {
      return (
        <Tooltip title={phone}>
          <SmsIcon fontSize="small" color="secondary" />
        </Tooltip>
      );
    }
    return (
      <Tooltip title="No contact info">
        <ContactPhoneIcon fontSize="small" color="disabled" />
      </Tooltip>
    );
  };

  // Handle snackbar close
  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  // Check if we have eligible guests for the current invitation method
  //const eligibleGuests = getEligibleGuests();
  const hasEligibleGuests = eligibleGuests.length > 0;

  return (
    <Box sx={{ p: 3, maxWidth: "1000px", mx: "auto" }}>
      <Typography
        variant="h4"
        sx={{
          mb: 3,
          textAlign: "center",
          fontWeight: "bold",
          color: "primary.main",
        }}
      >
        Invite Guests to Your Trip
      </Typography>

      {/* Top section with options */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="invite-method-label">
                Invitation Method
              </InputLabel>
              <Select
                labelId="invite-method-label"
                value={inviteMethod}
                label="Invitation Method"
                onChange={(e) => {
                  setInviteMethod(e.target.value);
                  // Reset selected guests when changing method
                  setSelectedGuests([]);
                  setSelectAll(false);
                }}
              >
                <MenuItem value="email">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <EmailIcon fontSize="small" />
                    <span>Email</span>
                  </Box>
                </MenuItem>
                <MenuItem value="sms">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <SmsIcon fontSize="small" />
                    <span>SMS</span>
                  </Box>
                </MenuItem>
                <MenuItem value="link">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <ContentCopyIcon fontSize="small" />
                    <span>Shareable Link</span>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showGroups}
                    onChange={() => setShowGroups(!showGroups)}
                    color="primary"
                  />
                }
                label="Show Guest Groups"
              />
              <Tooltip title="Select guests by group">
                <GroupIcon
                  color={showGroups ? "primary" : "disabled"}
                  sx={{ ml: 1 }}
                />
              </Tooltip>
            </Box>
          </Grid>

          {inviteMethod !== "link" && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Customize Your Invitation Message"
                multiline
                rows={3}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                variant="outlined"
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                A join link will be automatically added to this message when the trip is submitted.
              </Typography>
            </Grid>
          )}

          {inviteMethod === "link" && (
            <Grid item xs={12}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                {!shareableLink ? (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={generateShareableLink}
                    disabled={isCreatingLink}
                    startIcon={<PersonAddIcon />}
                    fullWidth
                  >
                    {isCreatingLink
                      ? "Creating Link..."
                      : "Generate Shareable Link"}
                  </Button>
                ) : (
                  <>
                    <TextField
                      fullWidth
                      value={shareableLink}
                      variant="outlined"
                      InputProps={{
                        readOnly: true,
                      }}
                    />
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={copyLinkToClipboard}
                      startIcon={<ContentCopyIcon />}
                    >
                      Copy
                    </Button>
                  </>
                )}
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Guest Groups Section (conditionally rendered) */}
      {showGroups && groups.length > 0 && (
        <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Select by Group:
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {groups.map((group) => {
              const level1Count = Array.isArray(group.level1)
                ? group.level1.length
                : 0;
              const level2Count = Array.isArray(group.level2)
                ? group.level2.length
                : 0;
              const totalGuests = level1Count + level2Count;

              return (
                <Chip
                  key={group.id}
                  label={`${group.name} (${totalGuests})`}
                  onClick={() => handleSelectGroup(group.id)}
                  color="primary"
                  variant="outlined"
                  sx={{ m: 0.5 }}
                />
              );
            })}
          </Box>
        </Paper>
      )}

      {/* No guests alert */}
      {allGuests.length === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          No guests have been added yet. Please add guests before sending
          invitations.
        </Alert>
      )}

      {/* No eligible guests alert */}
      {allGuests.length > 0 && !hasEligibleGuests && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          None of your guests have{" "}
          {inviteMethod === "email" ? "email addresses" : "phone numbers"}
          required for {inviteMethod} invitations. Please choose a different
          invitation method.
        </Alert>
      )}

      {/* Guest selection section */}
      {hasEligibleGuests && (
        <>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6">
              Select Guests to Invite ({selectedGuests.length}/
              {eligibleGuests.length})
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectAll}
                  onChange={handleToggleSelectAll}
                  color="primary"
                />
              }
              label="Select All"
            />
          </Box>

          <Grid container spacing={2} sx={{ mb: 4 }}>
            {eligibleGuests.map((guest) => {
              const guestType = guest.type || "adult"; // Default to adult if type not specified
              const isSelected = selectedGuests.includes(guest.name);

              return (
                <Grid item xs={12} sm={6} md={4} key={guest.id}>
                  <Card
                    variant="outlined"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent event bubbling
                      handleToggleSelect(guest.name);
                    }}
                    sx={{
                      bgcolor: isSelected
                        ? "rgba(25, 118, 210, 0.08)"
                        : "white",
                      transition: "background-color 0.3s",
                      cursor: "pointer",
                      "&:hover": {
                        boxShadow: 3,
                      },
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 1 }}
                      >
                        <Avatar
                          sx={{
                            bgcolor:
                              guestType === "adult"
                                ? "primary.main"
                                : "secondary.main",
                            width: 36,
                            height: 36,
                            mr: 1,
                          }}
                        >
                          {(guest.name || "").charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: "medium" }}
                        >
                          {guest.name || "Guest"}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Chip
                          size="small"
                          label={guestType === "adult" ? "Adult" : "Child"}
                          color={
                            guestType === "adult" ? "primary" : "secondary"
                          }
                          variant="outlined"
                        />
                        {getGuestContactInfo(guest)}
                      </Box>
                      
                      {/* Debug info - will be removed in production */}
                      <Box sx={{ mt: 1, fontSize: '0.75rem', color: 'text.secondary' }}>
                        <div>Email: {guest.email || "none"}</div>
                        <div>Phone: {guest.phone || "none"}</div>
                      </Box>
                    </CardContent>
                    <CardActions>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation(); // Prevent event bubbling
                              handleToggleSelect(guest.name);
                            }}
                            color="primary"
                          />
                        }
                        label="Select"
                        sx={{ ml: 0 }}
                        onClick={(e) => e.stopPropagation()} // Prevent card click from affecting checkbox
                      />
                      {guest.invitationSent && (
                        <Chip
                          size="small"
                          label="Invited"
                          color="success"
                          variant="outlined"
                          sx={{ ml: "auto" }}
                        />
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </>
      )}

      {/* Action button */}
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        {inviteMethod !== "link" && (
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<SendIcon />}
            onClick={saveInvitationPreferences}
            disabled={selectedGuests.length === 0 || !hasEligibleGuests}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 2,
              boxShadow: 3,
            }}
          >
            Select {selectedGuests.length} Guest
            {selectedGuests.length !== 1 ? "s" : ""} for Invitation
          </Button>
        )}
      </Box>

      {/* Info card about options */}
      <Paper sx={{ p: 2, mt: 4, bgcolor: "background.paper", borderRadius: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
          Invitation Options:
        </Typography>
        <Typography variant="body2" component="div">
          <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
            <li>
              <strong>Email:</strong> Invitations will be sent to guest email
              addresses when you submit the trip. Each invitation will include a personal join link.
            </li>
            <li>
              <strong>SMS:</strong> Text messages will be sent to guest phone
              numbers when you submit the trip. Each message will include a personal join link.
            </li>
            <li>
              <strong>Shareable Link:</strong> Generate a link that can be
              shared with guests manually. This single link can be used by multiple guests.
            </li>
          </ul>
        </Typography>
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
        action={
          <Button color="primary" size="small" onClick={handleSnackbarClose}>
            <CheckIcon />
          </Button>
        }
      />
    </Box>
  );
};

export default InviteGuestsPage;
