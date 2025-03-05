import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  Chip,
  Card,
  CardContent,
  Avatar,
  Collapse,
  IconButton,
  Button,
  Stack,
  Tooltip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  CalendarMonth as CalendarIcon,
  LocationOn as LocationIcon,
  Home as LodgingIcon,
  People as PeopleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  DirectionsWalk as ActivityIcon,
  Luggage as PackingIcon,
  AttachMoney as BudgetIcon,
  Note as NoteIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  PersonAdd as InviteIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";

// Define SectionCard outside your main component
const SectionCard = ({
  title,
  icon,
  content,
  editSection,
  editMode,
  formData,
  onSave,
  onCancel,
  onStartEdit,
}) => (
  <Card variant="outlined" sx={{ mb: 3 }}>
    <CardContent>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          {icon}
          <Typography variant="h6" component="h2" sx={{ ml: 1 }}>
            {title}
          </Typography>
        </Box>
        <Box>
          {editMode[editSection] ? (
            <>
              <Tooltip title="Save Changes">
                <IconButton
                  size="small"
                  onClick={() => onSave(editSection)}
                  sx={{ color: "success.main", mr: 1 }}
                >
                  <SaveIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Cancel">
                <IconButton
                  size="small"
                  onClick={() => onCancel(editSection)}
                  sx={{ color: "error.main" }}
                >
                  <CancelIcon />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <Tooltip title={`Edit ${title}`}>
              <IconButton
                size="small"
                onClick={() => onStartEdit(editSection)}
                sx={{ color: "primary.main" }}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
      {content}
    </CardContent>
  </Card>
);

// This prevents the form from being recreated on every keystroke
const BasicDetailsForm = React.memo(({ formData, onChange }) => (
  <Grid container spacing={2}>
    <Grid item xs={12} sm={6}>
      <TextField
        name="tripName"
        label="Trip Name"
        fullWidth
        value={formData.tripName || ""}
        onChange={onChange}
        InputLabelProps={{ shrink: true }}
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        name="location"
        label="Location"
        fullWidth
        value={formData.location || ""}
        onChange={onChange}
        InputLabelProps={{ shrink: true }}
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        name="startDate"
        label="Start Date"
        type="date"
        fullWidth
        value={formData.startDate || ""}
        onChange={onChange}
        InputLabelProps={{ shrink: true }}
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        name="endDate"
        label="End Date"
        type="date"
        fullWidth
        value={formData.endDate || ""}
        onChange={onChange}
        InputLabelProps={{ shrink: true }}
      />
    </Grid>
  </Grid>
));

const ReviewTripForm = ({ formData = {}, updateFormData }) => {
  const [expandGuests, setExpandGuests] = useState(false);
  const [expandGroups, setExpandGroups] = useState(false);

  // Edit mode states
  const [editMode, setEditMode] = useState({
    basic: false,
    lodging: false,
    guests: false,
    activities: false,
    packing: false,
    budget: false,
    notes: false,
  });
  const [basicFormData, setBasicFormData] = useState({
    tripName: "",
    location: "",
    startDate: "",
    endDate: "",
  });
  const [activitiesFormData, setActivitiesFormData] = useState("");
  const [packingFormData, setPackingFormData] = useState("");
  const [budgetFormData, setBudgetFormData] = useState("");
  const [notesFormData, setNotesFormData] = useState("");
  // Dialog states
  const [lodgingDialogOpen, setLodgingDialogOpen] = useState(false);
  const [currentLodging, setCurrentLodging] = useState(null);
  const [currentLodgingIndex, setCurrentLodgingIndex] = useState(-1);
  const [lodgingFormData, setLodgingFormData] = useState([]);
  // Format dates nicely
  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (error) {
      return dateString;
    }
  };
  // Get guest count
  const guestCount = formData.guests?.length || 0;
  // Get invited guest count
  const invitedGuestCount =
    formData.guests?.filter((guest) => guest.invitationSent)?.length || 0;
  // Get relationships/groups
  const groups = formData.relationships || [];
  // Initialize section data when edit mode is activated
  const startEdit = (section) => {
    const newEditMode = { ...editMode };
    newEditMode[section] = true;
    setEditMode(newEditMode);

    // Initialize the corresponding section's form data
    if (section === "basic") {
      setBasicFormData({
        tripName: formData.tripName || "",
        location: formData.location || "",
        startDate: formData.startDate || "",
        endDate: formData.endDate || "",
      });
    } else if (section === "lodging") {
      setLodgingFormData(
        Array.isArray(formData.lodging) ? [...formData.lodging] : []
      );
    } else if (section === "activities") {
      setActivitiesFormData(formData.activities || "");
    } else if (section === "packing") {
      setPackingFormData(formData.packingList || "");
    } else if (section === "budget") {
      setBudgetFormData(formData.budget || "");
    } else if (section === "notes") {
      setNotesFormData(formData.notes || "");
    }
  };

  // Cancel editing
  const cancelEdit = (section) => {
    const newEditMode = { ...editMode };
    newEditMode[section] = false;
    setEditMode(newEditMode);
  };

  // Handle field change for basic form data - FIXED to avoid recreating objects on every keystroke
  const handleBasicFieldChange = (e) => {
    const { name, value } = e.target;
    setBasicFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Save changes for basic info
  const saveBasicChanges = () => {
    updateFormData({
      ...formData,
      ...basicFormData,
    });

    cancelEdit("basic");
  };

  // Open lodging edit dialog
  const openLodgingDialog = (lodge, index) => {
    setCurrentLodging(
      lodge
        ? { ...lodge }
        : {
            location: "",
            startDate: formData.startDate || "",
            endDate: formData.endDate || "",
          }
    );
    setCurrentLodgingIndex(index);
    setLodgingDialogOpen(true);
  };

  // Handle lodging input change - FIXED to use event object
  const handleLodgingChange = (e) => {
    const { name, value } = e.target;
    setCurrentLodging((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Save lodging
  const saveLodging = () => {
    const updatedLodging = [...lodgingFormData];

    if (currentLodgingIndex === -1) {
      // Add new lodging
      updatedLodging.push(currentLodging);
    } else {
      // Update existing lodging
      updatedLodging[currentLodgingIndex] = currentLodging;
    }

    // Update local form data
    setLodgingFormData(updatedLodging);

    setLodgingDialogOpen(false);
  };

  // Delete lodging
  const deleteLodging = (index) => {
    const updatedLodging = [...lodgingFormData];
    updatedLodging.splice(index, 1);

    // Update local form data
    setLodgingFormData(updatedLodging);
  };

  // Save lodging changes
  const saveLodgingChanges = () => {
    updateFormData({
      ...formData,
      lodging: lodgingFormData,
    });

    cancelEdit("lodging");
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", p: 3 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: "bold", mb: 1 }}
          >
            {formData.tripName || "Your Trip"}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Review your trip details before finalizing
          </Typography>
        </Box>

        <Divider sx={{ mb: 4 }} />

        <SectionCard
          title="Trip Details"
          icon={<CalendarIcon color="primary" />}
          editSection="basic"
          editMode={editMode}
          onSave={saveBasicChanges}
          onCancel={cancelEdit}
          onStartEdit={startEdit}
          formData={formData}
          content={
            editMode.basic ? (
              <BasicDetailsForm
                formData={basicFormData}
                onChange={handleBasicFieldChange}
              />
            ) : (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Trip Name
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    {formData.tripName || "Not specified"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Trip Location
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    {formData.location || "Not specified"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Trip Start Date
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    {formData.startDate || "Not specified"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Trip End Date
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    {formData.endDate || "Not specified"}
                  </Typography>
                </Grid>
                {/* Other display fields */}
              </Grid>
            )
          }
        />

        {/* Lodging Information */}
        <SectionCard
          title="Lodging Information"
          icon={<LodgingIcon color="primary" />}
          editSection="lodging"
          editMode={editMode}
          formData={formData} // Add this prop
          onSave={saveLodgingChanges}
          onCancel={cancelEdit}
          onStartEdit={startEdit}
          content={
            editMode.lodging ? (
              <Box>
                {lodgingFormData && lodgingFormData.length > 0 ? (
                  <>
                    {lodgingFormData.map((lodge, index) => (
                      <Card
                        key={index}
                        variant="outlined"
                        sx={{ mb: 2, position: "relative" }}
                      >
                        <CardContent>
                          <Typography variant="subtitle2" gutterBottom>
                            {lodge.location || "Location not specified"}
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Check-in
                              </Typography>
                              <Typography variant="body1">
                                {formatDate(lodge.startDate)}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Check-out
                              </Typography>
                              <Typography variant="body1">
                                {formatDate(lodge.endDate)}
                              </Typography>
                            </Grid>
                          </Grid>
                          <Box sx={{ position: "absolute", top: 8, right: 8 }}>
                            <Tooltip title="Edit Lodging">
                              <IconButton
                                size="small"
                                onClick={() => openLodgingDialog(lodge, index)}
                                color="primary"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Lodging">
                              <IconButton
                                size="small"
                                onClick={() => deleteLodging(index)}
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontStyle: "italic", mb: 2 }}
                  >
                    No lodging information added
                  </Typography>
                )}
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => openLodgingDialog(null, -1)}
                >
                  Add Lodging
                </Button>
              </Box>
            ) : (
              <Box>
                {formData.lodging &&
                (Array.isArray(formData.lodging)
                  ? formData.lodging.length > 0
                  : formData.lodging) ? (
                  <Box>
                    {Array.isArray(formData.lodging) ? (
                      formData.lodging.map((lodge, index) => (
                        <Card
                          key={index}
                          variant="outlined"
                          sx={{
                            mb: index < formData.lodging.length - 1 ? 2 : 0,
                          }}
                        >
                          <CardContent>
                            <Typography variant="subtitle2" gutterBottom>
                              {lodge.location || "Location not specified"}
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={6}>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  Check-in
                                </Typography>
                                <Typography variant="body1">
                                  {formatDate(lodge.startDate)}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  Check-out
                                </Typography>
                                <Typography variant="body1">
                                  {formatDate(lodge.endDate)}
                                </Typography>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <Typography variant="body1" component="div">
                        {typeof formData.lodging === "string"
                          ? formData.lodging
                          : JSON.stringify(formData.lodging)}
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontStyle: "italic" }}
                  >
                    No lodging information added
                  </Typography>
                )}
              </Box>
            )
          }
        />

        {/* Guests Information */}
        <SectionCard
          title="Guests"
          icon={<PeopleIcon color="primary" />}
          editSection="guests"
          editMode={editMode}
          onCancel={cancelEdit}
          onStartEdit={startEdit}
          content={
            <Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1,
                }}
              >
                <Typography component="div">
                  Total Guests:{" "}
                  <Chip label={guestCount} size="small" color="primary" />
                </Typography>
                <Typography component="div">
                  Invited:{" "}
                  <Chip
                    label={`${invitedGuestCount} of ${guestCount}`}
                    size="small"
                    color="secondary"
                  />
                </Typography>
              </Box>

              {guestCount > 0 ? (
                <>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mt: 2,
                    }}
                  >
                    <Typography variant="subtitle2">Guest List</Typography>
                    <Button
                      size="small"
                      onClick={() => setExpandGuests(!expandGuests)}
                      endIcon={
                        expandGuests ? <ExpandLessIcon /> : <ExpandMoreIcon />
                      }
                    >
                      {expandGuests ? "Hide" : "Show"} Guest List
                    </Button>
                  </Box>

                  <Collapse in={expandGuests}>
                    <Box sx={{ mt: 2, maxHeight: "200px", overflow: "auto" }}>
                      <Grid container spacing={1}>
                        {formData.guests.map((guest, index) => (
                          <Grid
                            item
                            xs={12}
                            sm={6}
                            md={4}
                            key={guest.id || index}
                          >
                            <Card variant="outlined" sx={{ mb: 1 }}>
                              <CardContent
                                sx={{ py: 1, px: 2, "&:last-child": { pb: 1 } }}
                              >
                                <Box
                                  sx={{ display: "flex", alignItems: "center" }}
                                >
                                  <Avatar
                                    sx={{
                                      width: 32,
                                      height: 32,
                                      mr: 1,
                                      bgcolor:
                                        guest.type === "adult"
                                          ? "primary.main"
                                          : "secondary.main",
                                    }}
                                  >
                                    {(guest.name || "").charAt(0).toUpperCase()}
                                  </Avatar>
                                  <Box>
                                    <Typography
                                      variant="body2"
                                      sx={{ fontWeight: "medium" }}
                                    >
                                      {guest.name}
                                    </Typography>
                                    <Box sx={{ display: "flex", gap: 0.5 }}>
                                      <Chip
                                        label={guest.type || "adult"}
                                        size="small"
                                        variant="outlined"
                                        sx={{ height: 20, fontSize: "0.7rem" }}
                                      />
                                      {guest.invitationSent && (
                                        <Chip
                                          icon={
                                            <InviteIcon
                                              sx={{
                                                fontSize: "0.8rem !important",
                                              }}
                                            />
                                          }
                                          label="Invited"
                                          size="small"
                                          color="success"
                                          variant="outlined"
                                          sx={{
                                            height: 20,
                                            fontSize: "0.7rem",
                                          }}
                                        />
                                      )}
                                    </Box>
                                  </Box>
                                </Box>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  </Collapse>
                </>
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontStyle: "italic" }}
                >
                  No guests added to this trip yet
                </Typography>
              )}

              {/* Guest Groups/Relationships */}
              {groups.length > 0 && (
                <>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mt: 3,
                      mb: 1,
                    }}
                  >
                    <Typography variant="subtitle2">Guest Groups</Typography>
                    <Button
                      size="small"
                      onClick={() => setExpandGroups(!expandGroups)}
                      endIcon={
                        expandGroups ? <ExpandLessIcon /> : <ExpandMoreIcon />
                      }
                    >
                      {expandGroups ? "Hide" : "Show"} Groups
                    </Button>
                  </Box>

                  <Collapse in={expandGroups}>
                    <Box sx={{ mt: 1 }}>
                      {groups.map((group) => (
                        <Card key={group.id} variant="outlined" sx={{ mb: 2 }}>
                          <CardContent
                            sx={{ py: 1, px: 2, "&:last-child": { pb: 1 } }}
                          >
                            <Typography variant="subtitle2">
                              {group.name}
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 0.5,
                                mt: 1,
                              }}
                            >
                              {group.level1?.map((member, i) => (
                                <Chip
                                  key={`adult-${i}`}
                                  label={member.name}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                  sx={{ fontSize: "0.75rem" }}
                                />
                              ))}
                              {group.level2?.map((member, i) => (
                                <Chip
                                  key={`child-${i}`}
                                  label={member.name}
                                  size="small"
                                  color="secondary"
                                  variant="outlined"
                                  sx={{ fontSize: "0.75rem" }}
                                />
                              ))}
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  </Collapse>
                </>
              )}

              {/* Invitation Information */}
              {invitedGuestCount > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Invitation Methods Used
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    {formData.guests.some(
                      (g) => g.invitationMethod === "email"
                    ) && (
                      <Chip
                        icon={<EmailIcon />}
                        label="Email"
                        size="small"
                        color="info"
                      />
                    )}
                    {formData.guests.some(
                      (g) => g.invitationMethod === "sms"
                    ) && (
                      <Chip
                        icon={<SmsIcon />}
                        label="SMS"
                        size="small"
                        color="info"
                      />
                    )}
                    {formData.shareableLink && (
                      <Chip
                        icon={<ShareIcon />}
                        label="Shareable Link"
                        size="small"
                        color="info"
                      />
                    )}
                  </Stack>

                  {formData.shareableLink && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                        Shareable Link:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ wordBreak: "break-all" }}
                      >
                        {formData.shareableLink}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          }
        />
      </Paper>

      {/* Lodging Edit Dialog */}
      <Dialog
        open={lodgingDialogOpen}
        onClose={() => setLodgingDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {currentLodgingIndex === -1 ? "Add Lodging" : "Edit Lodging"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              name="location"
              label="Location"
              fullWidth
              value={currentLodging?.location || ""}
              onChange={handleLodgingChange}
            />
            <TextField
              name="startDate"
              label="Check-in Date"
              type="date"
              fullWidth
              value={currentLodging?.startDate || ""}
              onChange={handleLodgingChange}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              name="endDate"
              label="Check-out Date"
              type="date"
              fullWidth
              value={currentLodging?.endDate || ""}
              onChange={handleLodgingChange}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLodgingDialogOpen(false)} color="error">
            Cancel
          </Button>
          <Button onClick={saveLodging} color="primary" variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReviewTripForm;
