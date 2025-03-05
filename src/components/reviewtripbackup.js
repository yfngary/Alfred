import React, { useState } from "react";
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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Tooltip
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
  RestaurantMenu as FoodIcon,
  Note as NoteIcon,
  Thermostat as WeatherIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  PersonAdd as InviteIcon,
  Share as ShareIcon,
  Edit as EditIcon
} from "@mui/icons-material";

const ReviewTripForm = ({ formData = {}, onEdit }) => {
  const [expandGuests, setExpandGuests] = useState(false);
  const [expandGroups, setExpandGroups] = useState(false);
  
  // Format dates nicely
  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };
  
  // Get guest count
  const guestCount = formData.guests?.length || 0;
  
  // Get invited guest count
  const invitedGuestCount = formData.guests?.filter(guest => guest.invitationSent)?.length || 0;
  
  // Get relationships/groups
  const groups = formData.relationships || [];
  
  // Helper function to render card section with edit button
  const SectionCard = ({ title, icon, content, editSection }) => (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {icon}
            <Typography variant="h6" component="h2" sx={{ ml: 1 }}>
              {title}
            </Typography>
          </Box>
          {onEdit && (
            <Tooltip title={`Edit ${title}`}>
              <IconButton 
                size="small" 
                onClick={() => onEdit(editSection)}
                sx={{ color: "primary.main" }}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        {content}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", p: 3 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: "bold", mb: 1 }}>
            {formData.tripName || "Your Trip"}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Review your trip details before finalizing
          </Typography>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Main Trip Information */}
        <SectionCard
          title="Trip Details"
          icon={<CalendarIcon color="primary" />}
          editSection="basic"
          content={
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
                  Location
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {typeof formData.location === 'object' 
                    ? JSON.stringify(formData.location) 
                    : (formData.location || "Not specified")}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Start Date
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {formatDate(formData.startDate)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  End Date
                </Typography>
                <Typography variant="body1">
                  {formatDate(formData.endDate)}
                </Typography>
              </Grid>
            </Grid>
          }
        />

        {/* Lodging Information */}
        <SectionCard
          title="Lodging Information"
          icon={<LodgingIcon color="primary" />}
          editSection="lodging"
          content={
            <Box>
              {formData.lodging && (Array.isArray(formData.lodging) ? formData.lodging.length > 0 : formData.lodging) ? (
                <Box>
                  {Array.isArray(formData.lodging) ? (
                    formData.lodging.map((lodge, index) => (
                      <Card key={index} variant="outlined" sx={{ mb: index < formData.lodging.length - 1 ? 2 : 0 }}>
                        <CardContent>
                          <Typography variant="subtitle2" gutterBottom>
                            {lodge.location || "Location not specified"}
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2" color="text.secondary">
                                Check-in
                              </Typography>
                              <Typography variant="body1">
                                {formatDate(lodge.startDate)}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2" color="text.secondary">
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
                      {typeof formData.lodging === 'string' 
                        ? formData.lodging 
                        : JSON.stringify(formData.lodging)}
                    </Typography>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                  No lodging information added
                </Typography>
              )}
            </Box>
          }
        />

        {/* Guests Information */}
        <SectionCard
          title="Guests"
          icon={<PeopleIcon color="primary" />}
          editSection="guests"
          content={
            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography component="div">
                  Total Guests: <Chip label={guestCount} size="small" color="primary" />
                </Typography>
                <Typography component="div">
                  Invited: <Chip label={`${invitedGuestCount} of ${guestCount}`} size="small" color="secondary" />
                </Typography>
              </Box>
              
              {guestCount > 0 ? (
                <>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
                    <Typography variant="subtitle2">
                      Guest List
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => setExpandGuests(!expandGuests)}
                      endIcon={expandGuests ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    >
                      {expandGuests ? "Hide" : "Show"} Guest List
                    </Button>
                  </Box>
                  
                  <Collapse in={expandGuests}>
                    <Box sx={{ mt: 2, maxHeight: "200px", overflow: "auto" }}>
                      <Grid container spacing={1}>
                        {formData.guests.map((guest, index) => (
                          <Grid item xs={12} sm={6} md={4} key={guest.id || index}>
                            <Card variant="outlined" sx={{ mb: 1 }}>
                              <CardContent sx={{ py: 1, px: 2, "&:last-child": { pb: 1 } }}>
                                <Box sx={{ display: "flex", alignItems: "center" }}>
                                  <Avatar 
                                    sx={{ 
                                      width: 32, 
                                      height: 32, 
                                      mr: 1,
                                      bgcolor: guest.type === "adult" ? "primary.main" : "secondary.main" 
                                    }}
                                  >
                                    {(guest.name || "").charAt(0).toUpperCase()}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                                      {guest.name}
                                    </Typography>
                                    <Box sx={{ display: "flex", gap: 0.5 }}>
                                      <Chip 
                                        label={guest.type || "adult"} 
                                        size="small" 
                                        variant="outlined"
                                        sx={{ height: 20, fontSize: '0.7rem' }}
                                      />
                                      {guest.invitationSent && (
                                        <Chip 
                                          icon={<InviteIcon sx={{ fontSize: '0.8rem !important' }} />}
                                          label="Invited" 
                                          size="small"
                                          color="success"
                                          variant="outlined"
                                          sx={{ height: 20, fontSize: '0.7rem' }}
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
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                  No guests added to this trip yet
                </Typography>
              )}
              
              {/* Guest Groups/Relationships */}
              {groups.length > 0 && (
                <>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 3, mb: 1 }}>
                    <Typography variant="subtitle2">
                      Guest Groups
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => setExpandGroups(!expandGroups)}
                      endIcon={expandGroups ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    >
                      {expandGroups ? "Hide" : "Show"} Groups
                    </Button>
                  </Box>
                  
                  <Collapse in={expandGroups}>
                    <Box sx={{ mt: 1 }}>
                      {groups.map((group) => (
                        <Card key={group.id} variant="outlined" sx={{ mb: 2 }}>
                          <CardContent sx={{ py: 1, px: 2, "&:last-child": { pb: 1 } }}>
                            <Typography variant="subtitle2">{group.name}</Typography>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}>
                              {group.level1?.map((member, i) => (
                                <Chip 
                                  key={`adult-${i}`}
                                  label={member.name} 
                                  size="small" 
                                  color="primary"
                                  variant="outlined"
                                  sx={{ fontSize: '0.75rem' }}
                                />
                              ))}
                              {group.level2?.map((member, i) => (
                                <Chip 
                                  key={`child-${i}`}
                                  label={member.name} 
                                  size="small" 
                                  color="secondary"
                                  variant="outlined"
                                  sx={{ fontSize: '0.75rem' }}
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
                    {formData.guests.some(g => g.invitationMethod === "email") && (
                      <Chip icon={<EmailIcon />} label="Email" size="small" color="info" />
                    )}
                    {formData.guests.some(g => g.invitationMethod === "sms") && (
                      <Chip icon={<SmsIcon />} label="SMS" size="small" color="info" />
                    )}
                    {formData.shareableLink && (
                      <Chip icon={<ShareIcon />} label="Shareable Link" size="small" color="info" />
                    )}
                  </Stack>
                  
                  {formData.shareableLink && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                        Shareable Link:
                      </Typography>
                      <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                        {formData.shareableLink}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          }
        />

        {/* Optional Sections (if data exists) */}
        {formData.activities && (
          <SectionCard
            title="Activities"
            icon={<ActivityIcon color="primary" />}
            editSection="activities"
            content={
              <Typography variant="body1" component="div">
                {typeof formData.activities === 'object' 
                  ? JSON.stringify(formData.activities) 
                  : formData.activities}
              </Typography>
            }
          />
        )}

        {formData.packingList && (
          <SectionCard
            title="Packing List"
            icon={<PackingIcon color="primary" />}
            editSection="packing"
            content={
              <Typography variant="body1" component="div">
                {typeof formData.packingList === 'object' 
                  ? JSON.stringify(formData.packingList) 
                  : formData.packingList}
              </Typography>
            }
          />
        )}

        {formData.budget && (
          <SectionCard
            title="Budget Information"
            icon={<BudgetIcon color="primary" />}
            editSection="budget"
            content={
              <Typography variant="body1" component="div">
                {typeof formData.budget === 'object' 
                  ? JSON.stringify(formData.budget) 
                  : formData.budget}
              </Typography>
            }
          />
        )}

        {formData.notes && (
          <SectionCard
            title="Additional Notes"
            icon={<NoteIcon color="primary" />}
            editSection="notes"
            content={
              <Typography variant="body1" component="div">
                {typeof formData.notes === 'object' 
                  ? JSON.stringify(formData.notes) 
                  : formData.notes}
              </Typography>
            }
          />
        )}
        
        {/* Summary Action Buttons */}
        <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            sx={{ px: 4 }}
          >
            Finalize Trip
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ReviewTripForm;