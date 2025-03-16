import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import useOnclickOutside from "react-cool-onclickoutside";
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  TextField,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  Paper,
  Grid,
  IconButton,
  Card,
  CardContent,
  Divider,
  Container,
  FormHelperText
} from "@mui/material";
import {
  ArrowBack,
  ArrowForward,
  Check,
  Close,
  AccessTime,
  Place,
  LocalDining,
  DirectionsRun,
  FileUpload,
  AttachFile,
  PersonAdd,
  Event,
  CategoryOutlined,
  Note,
  Save
} from "@mui/icons-material";

export default function CreateExperience() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  // Form state
  const [activeStep, setActiveStep] = useState(0);
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Experience data
  const [formData, setFormData] = useState({
    title: "",
    selectedGuests: [],
    date: null,
    startTime: "",
    endTime: "",
    isMultiDay: false,
    endDate: null,
    experienceType: "activity",
    location: "",
    mealType: "restaurant",
    useCustomLocation: false,
    notes: "",
    attachments: []
  });

  // Validation state
  const [errors, setErrors] = useState({});

  // Places autocomplete setup
  const {
    ready,
    value,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete({ debounce: 300 });

  const ref = useOnclickOutside(() => {
    clearSuggestions();
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (storedUser && token) {
      fetchTripData(tripId);
    } else {
      setError("You must be logged in to create an experience.");
      setLoading(false);
    }
  }, [tripId]);

  // Set title based on experience type
  useEffect(() => {
    if (!formData.title || formData.title === "Activity" || formData.title === "Meal" || formData.title === "Other") {
      setFormData(prev => ({
        ...prev,
        title: formData.experienceType.charAt(0).toUpperCase() + formData.experienceType.slice(1)
      }));
    }
  }, [formData.experienceType]);

  const fetchTripData = async (tripId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch(`http://localhost:5001/api/trips/${tripId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch trip data.");
      }

      const tripData = await response.json();
      setTrip(tripData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching trip:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleGuestSelection = (guestName) => {
    setFormData(prev => ({
      ...prev,
      selectedGuests: prev.selectedGuests.includes(guestName)
        ? prev.selectedGuests.filter((name) => name !== guestName)
        : [...prev.selectedGuests, guestName]
    }));
    
    // Clear guest validation error
    if (errors.selectedGuests) {
      setErrors(prev => ({ ...prev, selectedGuests: "" }));
    }
  };

  const handleLocationSelect = (address) => {
    setValue(address, false);
    clearSuggestions();
    setFormData(prev => ({
      ...prev,
      location: address
    }));
    
    // Clear location validation error
    if (errors.location) {
      setErrors(prev => ({ ...prev, location: "" }));
    }
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    
    // Validate file size (limit to 5MB per file)
    const validFiles = files.filter(file => file.size <= 5 * 1024 * 1024);
    
    if (validFiles.length !== files.length) {
      setError("Some files exceeded the 5MB size limit and were not added");
    }
    
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...validFiles]
    }));
  };

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 0: // Guests selection
        if (formData.selectedGuests.length === 0) {
          newErrors.selectedGuests = "Please select at least one guest";
        }
        break;
        
      case 1: // Date & Time
        if (!formData.date) {
          newErrors.date = "Please select a date";
        }
        if (!formData.startTime) {
          newErrors.startTime = "Please select a start time";
        }
        if (!formData.isMultiDay && !formData.endTime) {
          newErrors.endTime = "Please select an end time";
        }
        if (formData.isMultiDay && !formData.endDate) {
          newErrors.endDate = "Please select an end date";
        }
        if (formData.isMultiDay && formData.date && formData.endDate && 
            new Date(formData.endDate) <= new Date(formData.date)) {
          newErrors.endDate = "End date must be after start date";
        }
        break;
        
      case 2: // Experience Type
        if (!formData.experienceType) {
          newErrors.experienceType = "Please select an experience type";
        }
        if (formData.experienceType === "meal" && !formData.mealType) {
          newErrors.mealType = "Please select a meal type";
        }
        break;
        
      case 3: // Title & Notes
        if (!formData.title || formData.title.trim() === "") {
          newErrors.title = "Please provide a title for the experience";
        }
        break;
        
      case 4: // Location
        if (!formData.location || formData.location.trim() === "") {
          newErrors.location = "Please select or enter a location";
        }
        break;
        
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) {
      return;
    }
    
    setSubmitting(true);
    setError("");
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      // Create FormData object
      const formDataObj = new FormData();
      
      // Add files to FormData
      formData.attachments.forEach((file, index) => {
        formDataObj.append(`attachments`, file);
      });

      // Format dates for JSON serialization
      const formattedDate = formData.date ? formData.date.toISOString() : null;
      const formattedEndDate = formData.endDate ? formData.endDate.toISOString() : null;

      // Create experience data object
      const experienceData = {
        title: formData.title,
        date: formattedDate,
        startTime: formData.startTime,
        endTime: formData.isMultiDay ? null : formData.endTime,
        isMultiDay: formData.isMultiDay,
        endDate: formattedEndDate,
        type: formData.experienceType,
        location: formData.location,
        details: formData.notes,
        guests: formData.selectedGuests
      };

      // Add meal type if applicable
      if (formData.experienceType === 'meal') {
        experienceData.mealType = formData.mealType;
      }

      // Add the experience data as a string
      formDataObj.append('experienceData', JSON.stringify(experienceData));

      const response = await fetch(`http://localhost:5001/api/${tripId}/experiences`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Do NOT set Content-Type when using FormData
          // The browser will set it with the correct boundary
        },
        body: formDataObj
      });
  
      const result = await response.json();
      
      if (response.ok) {
        setSuccess("Experience created successfully!");
        setTimeout(() => {
          if (result.chatId) {
            navigate(`/chat/${result.chatId}`);
          } else {
            navigate(`/trips/${tripId}`);
          }
        }, 2000);
      } else {
        throw new Error(result.error || "Failed to create experience");
      }
    } catch (error) {
      console.error("Error submitting experience:", error);
      setError(error.message || "Error connecting to the server");
    } finally {
      setSubmitting(false);
    }
  };

  // Define steps
  const steps = [
    "Select Guests",
    "Date & Time",
    "Experience Type",
    "Title & Notes",
    "Location",
    "Review & Submit"
  ];

  // Get an icon for the experience type
  const getExperienceTypeIcon = (type) => {
    switch (type) {
      case "activity":
        return <DirectionsRun />;
      case "meal":
        return <LocalDining />;
      default:
        return <CategoryOutlined />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4, mb: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Create Experience
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}
        
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Box sx={{ mt: 4, mb: 4 }}>
          {/* Step 1: Select Guests */}
          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                <PersonAdd sx={{ mr: 1, verticalAlign: "middle" }} />
                Who's participating?
              </Typography>
              
              {errors.selectedGuests && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errors.selectedGuests}
                </Alert>
              )}
              
              {trip?.guests && trip.guests.length > 0 ? (
                <Grid container spacing={2}>
                  {trip.guests.map((guest) => (
                    <Grid item xs={6} sm={4} key={guest._id}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          cursor: "pointer",
                          bgcolor: formData.selectedGuests.includes(guest.name) ? "primary.light" : "background.paper",
                          transition: "all 0.3s"
                        }}
                        onClick={() => handleGuestSelection(guest.name)}
                      >
                        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                          <Box display="flex" alignItems="center">
                            <Avatar sx={{ mr: 1, bgcolor: formData.selectedGuests.includes(guest.name) ? "primary.dark" : "grey.400" }}>
                              {guest.name.charAt(0)}
                            </Avatar>
                            <Typography>
                              {guest.name}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Alert severity="info">
                  No guests found for this trip. Please add guests to the trip first.
                </Alert>
              )}
            </Box>
          )}
          
          {/* Step 2: Date & Time */}
          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                <Event sx={{ mr: 1, verticalAlign: "middle" }} />
                When is it happening?
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Date
                  </Typography>
                  <DatePicker
                    selected={formData.date}
                    onChange={(date) => {
                      setFormData(prev => ({ ...prev, date }));
                      if (errors.date) setErrors(prev => ({ ...prev, date: "" }));
                    }}
                    customInput={
                      <TextField 
                        fullWidth 
                        variant="outlined"
                        error={!!errors.date}
                        helperText={errors.date}
                      />
                    }
                    minDate={new Date()}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Start Time
                  </Typography>
                  <TextField
                    type="time"
                    fullWidth
                    variant="outlined"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    error={!!errors.startTime}
                    helperText={errors.startTime}
                    InputProps={{
                      startAdornment: <AccessTime color="action" sx={{ mr: 1 }} />,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.isMultiDay}
                        onChange={() => {
                          setFormData(prev => ({ 
                            ...prev, 
                            isMultiDay: !prev.isMultiDay,
                            endTime: !prev.isMultiDay ? "" : prev.endTime,
                            endDate: !prev.isMultiDay ? null : prev.endDate
                          }));
                        }}
                        color="primary"
                      />
                    }
                    label="This is a multi-day experience"
                  />
                </Grid>
                
                {formData.isMultiDay ? (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      End Date
                    </Typography>
                    <DatePicker
                      selected={formData.endDate}
                      onChange={(date) => {
                        setFormData(prev => ({ ...prev, endDate: date }));
                        if (errors.endDate) setErrors(prev => ({ ...prev, endDate: "" }));
                      }}
                      customInput={
                        <TextField 
                          fullWidth 
                          variant="outlined"
                          error={!!errors.endDate}
                          helperText={errors.endDate}
                        />
                      }
                      minDate={formData.date || new Date()}
                    />
                  </Grid>
                ) : (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      End Time
                    </Typography>
                    <TextField
                      type="time"
                      fullWidth
                      variant="outlined"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleChange}
                      error={!!errors.endTime}
                      helperText={errors.endTime}
                      InputProps={{
                        startAdornment: <AccessTime color="action" sx={{ mr: 1 }} />,
                      }}
                    />
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
          
          {/* Step 3: Experience Type */}
          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                <CategoryOutlined sx={{ mr: 1, verticalAlign: "middle" }} />
                What type of experience is this?
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControl fullWidth error={!!errors.experienceType}>
                    <InputLabel>Experience Type</InputLabel>
                    <Select
                      name="experienceType"
                      value={formData.experienceType}
                      onChange={handleChange}
                      label="Experience Type"
                    >
                      <MenuItem value="activity">
                        <DirectionsRun sx={{ mr: 1 }} /> Activity
                      </MenuItem>
                      <MenuItem value="meal">
                        <LocalDining sx={{ mr: 1 }} /> Meal
                      </MenuItem>
                      <MenuItem value="other">
                        <CategoryOutlined sx={{ mr: 1 }} /> Other
                      </MenuItem>
                    </Select>
                    {errors.experienceType && (
                      <FormHelperText>{errors.experienceType}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                
                {formData.experienceType === "meal" && (
                  <Grid item xs={12}>
                    <FormControl fullWidth error={!!errors.mealType}>
                      <InputLabel>Meal Type</InputLabel>
                      <Select
                        name="mealType"
                        value={formData.mealType}
                        onChange={handleChange}
                        label="Meal Type"
                      >
                        <MenuItem value="restaurant">Restaurant</MenuItem>
                        <MenuItem value="home">Home Cooked</MenuItem>
                        <MenuItem value="picnic">Picnic</MenuItem>
                        <MenuItem value="delivery">Delivery</MenuItem>
                      </Select>
                      {errors.mealType && (
                        <FormHelperText>{errors.mealType}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
          
          {/* Step 4: Title & Notes */}
          {activeStep === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                <Note sx={{ mr: 1, verticalAlign: "middle" }} />
                Title & Details
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Experience Title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    variant="outlined"
                    error={!!errors.title}
                    helperText={errors.title || "Give your experience a memorable name"}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes & Details"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    variant="outlined"
                    multiline
                    rows={4}
                    placeholder="Add any details about this experience (e.g., what to bring, dress code, reservations needed)"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    <AttachFile sx={{ mr: 1, verticalAlign: "middle" }} />
                    Attachments
                  </Typography>
                  
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<FileUpload />}
                    sx={{ mb: 2 }}
                  >
                    Upload Files
                    <input
                      type="file"
                      multiple
                      hidden
                      onChange={handleFileUpload}
                    />
                  </Button>
                  
                  {formData.attachments.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        {formData.attachments.length} file(s) selected
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        {formData.attachments.map((file, index) => (
                          <Box 
                            key={index} 
                            sx={{ 
                              display: "flex", 
                              justifyContent: "space-between", 
                              alignItems: "center",
                              mb: 1,
                              pb: 1,
                              borderBottom: index < formData.attachments.length - 1 ? "1px solid #eee" : "none"
                            }}
                          >
                            <Typography variant="body2" noWrap sx={{ maxWidth: "80%" }}>
                              {file.name} ({(file.size / 1024).toFixed(1)} KB)
                            </Typography>
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => removeFile(index)}
                            >
                              <Close fontSize="small" />
                            </IconButton>
                          </Box>
                        ))}
                      </Paper>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
          
          {/* Step 5: Location */}
          {activeStep === 4 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                <Place sx={{ mr: 1, verticalAlign: "middle" }} />
                Where is it happening?
              </Typography>
              
              {errors.location && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errors.location}
                </Alert>
              )}
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.useCustomLocation}
                    onChange={() => {
                      setFormData(prev => ({ 
                        ...prev, 
                        useCustomLocation: !prev.useCustomLocation,
                        location: ""
                      }));
                      setValue("");
                    }}
                    color="primary"
                  />
                }
                label="Enter custom location instead of searching"
              />
              
              {formData.useCustomLocation ? (
                <TextField
                  fullWidth
                  label="Custom Location"
                  name="location"
                  value={formData.location}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, location: e.target.value }));
                    if (errors.location) setErrors(prev => ({ ...prev, location: "" }));
                  }}
                  variant="outlined"
                  sx={{ mt: 2 }}
                />
              ) : (
                <div ref={ref} style={{ position: 'relative', marginTop: '16px' }}>
                  <TextField
                    fullWidth
                    label="Search for a location"
                    value={value}
                    onChange={(e) => {
                      setValue(e.target.value);
                      if (errors.location) setErrors(prev => ({ ...prev, location: "" }));
                    }}
                    variant="outlined"
                    InputProps={{
                      startAdornment: <Place color="action" sx={{ mr: 1 }} />,
                    }}
                  />
                  
                  {status === "OK" && (
                    <Paper 
                      sx={{ 
                        position: 'absolute', 
                        width: '100%', 
                        zIndex: 1000,
                        mt: 1,
                        maxHeight: '200px',
                        overflow: 'auto'
                      }}
                    >
                      {data.map(({ place_id, description }) => (
                        <Typography
                          key={place_id}
                          onClick={() => handleLocationSelect(description)}
                          sx={{
                            p: 2,
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.04)',
                            },
                          }}
                        >
                          {description}
                        </Typography>
                      ))}
                    </Paper>
                  )}
                </div>
              )}
            </Box>
          )}
          
          {/* Step 6: Review & Submit */}
          {activeStep === 5 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Review & Confirm
              </Typography>
              
              <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Avatar sx={{ bgcolor: "primary.main", mr: 2 }}>
                    {getExperienceTypeIcon(formData.experienceType)}
                  </Avatar>
                  <Typography variant="h5">{formData.title}</Typography>
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      <Event fontSize="small" sx={{ mr: 0.5, verticalAlign: "middle" }} />
                      Date & Time
                    </Typography>
                    <Typography variant="body1">
                      {formData.date ? formData.date.toLocaleDateString() : 'Not set'} 
                      {formData.startTime && ` at ${formData.startTime}`}
                      {!formData.isMultiDay && formData.endTime && ` - ${formData.endTime}`}
                    </Typography>
                    {formData.isMultiDay && formData.endDate && (
                      <Typography variant="body2">
                        Until: {formData.endDate.toLocaleDateString()}
                      </Typography>
                    )}
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      <Place fontSize="small" sx={{ mr: 0.5, verticalAlign: "middle" }} />
                      Location
                    </Typography>
                    <Typography variant="body1">
                      {formData.location || 'Not specified'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      <PersonAdd fontSize="small" sx={{ mr: 0.5, verticalAlign: "middle" }} />
                      Participants
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                      {formData.selectedGuests.map((guest, index) => (
                        <Chip
                          key={index}
                          avatar={<Avatar>{guest.charAt(0)}</Avatar>}
                          label={guest}
                          size="small"
                        />
                      ))}
                    </Box>
                  </Grid>
                  
                  {formData.notes && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        <Note fontSize="small" sx={{ mr: 0.5, verticalAlign: "middle" }} />
                        Notes
                      </Typography>
                      <Typography variant="body1">
                        {formData.notes}
                      </Typography>
                    </Grid>
                  )}
                  
                  {formData.attachments.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        <AttachFile fontSize="small" sx={{ mr: 0.5, verticalAlign: "middle" }} />
                        Attachments
                      </Typography>
                      <Typography variant="body2">
                        {formData.attachments.length} file(s) attached
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Box>
          )}
        </Box>
        
        <Divider sx={{ mt: 2, mb: 2 }} />
        
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Button
            disabled={activeStep === 0 || submitting}
            onClick={handleBack}
            startIcon={<ArrowBack />}
          >
            Back
          </Button>
          
          {activeStep === steps.length - 1 ? (
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="primary"
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={24} /> : <Save />}
            >
              {submitting ? "Creating..." : "Create Experience"}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              variant="contained"
              color="primary"
              endIcon={<ArrowForward />}
            >
              Next
            </Button>
          )}
        </Box>
        
      </Paper>
    </Container>
  );
}