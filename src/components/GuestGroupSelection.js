import React from 'react';
import {
  Box,
  Typography,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
  IconButton,
  Avatar,
} from '@mui/material';
import {
  ExpandLess,
  ExpandMore,
  Group,
  Person,
} from '@mui/icons-material';

const GuestGroupSelection = ({ guestRelationships, selectedGuests, onGuestSelection }) => {
  const [expandedGroups, setExpandedGroups] = React.useState({});

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const handleGroupSelection = (groupName, level1Guests, level2Guests) => {
    const allGuests = [...level1Guests, ...level2Guests];
    const allSelected = allGuests.every(guest => selectedGuests.includes(guest.name));
    
    if (allSelected) {
      // Deselect all guests in the group
      allGuests.forEach(guest => {
        if (selectedGuests.includes(guest.name)) {
          onGuestSelection(guest.name);
        }
      });
    } else {
      // Select all guests in the group
      allGuests.forEach(guest => {
        if (!selectedGuests.includes(guest.name)) {
          onGuestSelection(guest.name);
        }
      });
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <FormGroup>
        {guestRelationships.map((group) => (
          <Paper key={group.name} sx={{ mb: 2, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={[...group.level1, ...group.level2].every(guest => 
                      selectedGuests.includes(guest.name)
                    )}
                    indeterminate={[...group.level1, ...group.level2].some(guest => 
                      selectedGuests.includes(guest.name)
                    )}
                    onChange={() => handleGroupSelection(group.name, group.level1, group.level2)}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Group sx={{ mr: 1 }} />
                    <Typography variant="subtitle1">{group.name}</Typography>
                  </Box>
                }
              />
              <IconButton onClick={() => toggleGroup(group.name)}>
                {expandedGroups[group.name] ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
            
            <Collapse in={expandedGroups[group.name]} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {/* Level 1 Guests */}
                {group.level1.map((guest) => (
                  <ListItem 
                    key={guest._id} 
                    sx={{ 
                      pl: 4,
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                    onClick={() => onGuestSelection(guest.name)}
                  >
                    <ListItemIcon>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: selectedGuests.includes(guest.name) ? 'primary.main' : 'grey.400' }}>
                        {guest.name.charAt(0)}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText 
                      primary={guest.name}
                      sx={{
                        color: selectedGuests.includes(guest.name) ? 'primary.main' : 'text.primary',
                        fontWeight: selectedGuests.includes(guest.name) ? 600 : 400,
                      }}
                    />
                    <Checkbox
                      checked={selectedGuests.includes(guest.name)}
                      onChange={() => onGuestSelection(guest.name)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </ListItem>
                ))}
                
                {/* Level 2 Guests */}
                {group.level2.length > 0 && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        pl: 4, 
                        color: 'text.secondary',
                        mt: 1,
                        mb: 1
                      }}
                    >
                      Extended Family
                    </Typography>
                    {group.level2.map((guest) => (
                      <ListItem 
                        key={guest._id} 
                        sx={{ 
                          pl: 4,
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        }}
                        onClick={() => onGuestSelection(guest.name)}
                      >
                        <ListItemIcon>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: selectedGuests.includes(guest.name) ? 'primary.main' : 'grey.400' }}>
                            {guest.name.charAt(0)}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText 
                          primary={guest.name}
                          sx={{
                            color: selectedGuests.includes(guest.name) ? 'primary.main' : 'text.primary',
                            fontWeight: selectedGuests.includes(guest.name) ? 600 : 400,
                          }}
                        />
                        <Checkbox
                          checked={selectedGuests.includes(guest.name)}
                          onChange={() => onGuestSelection(guest.name)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </ListItem>
                    ))}
                  </>
                )}
              </List>
            </Collapse>
          </Paper>
        ))}
      </FormGroup>
    </Box>
  );
};

export default GuestGroupSelection; 