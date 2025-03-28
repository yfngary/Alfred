import React, { useState, useEffect } from "react";
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar
} from "@mui/material";
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

// Helper function to generate unique IDs
const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const GuestRelationship = ({ formData, updateFormData }) => {
  
  // Local state management 
  const [guests, setGuests] = useState([]);
  const [availableGuests, setAvailableGuests] = useState([]);
  const [relationshipGroups, setRelationshipGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedRole, setSelectedRole] = useState("level1");
  const [newGroupName, setNewGroupName] = useState("");
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastSyncedRelationships, setLastSyncedRelationships] = useState([]);
  
  // Modal states
  const [editGroupDialog, setEditGroupDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [editedGroupName, setEditedGroupName] = useState("");
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);

  // *** CRITICAL FIX: Only initialize ONCE ***
  useEffect(() => {
    // Skip if already initialized or if formData is empty
    if (isInitialized) {
      return;
    }
    
    // Create initial guests list
    let initialGuests = [];
    
    if (formData.guests && formData.guests.length > 0) {
      initialGuests = formData.guests.map(guest => ({
        ...guest,
        _id: guest._id || generateId() // Ensure each guest has an ID
      }));
    } 
    else if (formData.adults > 0 || formData.kids > 0) {
      // Generate adult guests
      const adultGuests = Array.from({ length: formData.adults || 0 }, (_, i) => ({
        _id: generateId(),
        name: formData.adultNames?.[i]?.name || `adult-${i + 1}`,
        type: "adult",
        email: formData.adultNames?.[i]?.email || "",
        phone: formData.adultNames?.[i]?.phone || ""
      }));
      
      // Generate child guests
      const kidGuests = Array.from({ length: formData.kids || 0 }, (_, i) => ({
        _id: generateId(),
        name: formData.childNames?.[i]?.name || `child-${i + 1}`,
        type: "child",
        email: formData.childNames?.[i]?.email || "",
        phone: formData.childNames?.[i]?.phone || ""
      }));
      
      initialGuests = [...adultGuests, ...kidGuests];
    }
    
    setGuests(initialGuests);
    
    // Initialize groups if any exist in formData
    let initialGroups = [];
    if (formData.relationships && formData.relationships.length > 0) {
      
      initialGroups = formData.relationships.map(rel => {
        const groupId = rel.id || generateId();
        
        // Map guest IDs to actual guest objects
        const level1Guests = Array.isArray(rel.level1) ? rel.level1
          .map(guestId => {
            const guest = initialGuests.find(g => g._id === guestId);
            return guest ? { ...guest } : null;
          })
          .filter(Boolean) : [];
        
        const level2Guests = Array.isArray(rel.level2) ? rel.level2
          .map(guestId => {
            const guest = initialGuests.find(g => g._id === guestId);
            return guest ? { ...guest } : null;
          })
          .filter(Boolean) : [];
        
        return {
          id: groupId,
          name: rel.name,
          level1: level1Guests,
          level2: level2Guests
        };
      });
      
      setRelationshipGroups(initialGroups);
      setLastSyncedRelationships(JSON.stringify(initialGroups));
    }
    
    // Calculate initial available guests
    const assignedIds = new Set();
    initialGroups.forEach(group => {
      group.level1.forEach(guest => guest && guest._id && assignedIds.add(guest._id));
      group.level2.forEach(guest => guest && guest._id && assignedIds.add(guest._id));
    });
    
    const initialAvailable = initialGuests.filter(guest => 
      guest && guest._id && !assignedIds.has(guest._id)
    );
    
    setAvailableGuests(initialAvailable);
    
    // Mark as initialized to prevent re-initialization
    setIsInitialized(true);
  }, [formData, isInitialized]);

  // Updated effect to filter available guests
  useEffect(() => {
    // Skip if not initialized yet
    if (!isInitialized) return;
    
    // Get all assigned guests (those in groups)
    const assignedGuestIds = new Set();
    
    relationshipGroups.forEach(group => {
      if (Array.isArray(group.level1)) {
        group.level1.forEach(guest => {
          if (guest && guest._id) assignedGuestIds.add(guest._id);
        });
      }
      
      if (Array.isArray(group.level2)) {
        group.level2.forEach(guest => {
          if (guest && guest._id) assignedGuestIds.add(guest._id);
        });
      }
    });
    
    // Filter out assigned guests to get available ones
    const available = guests.filter(guest => {
      return guest && guest._id && !assignedGuestIds.has(guest._id);
    });
    
    setAvailableGuests(available);
  }, [guests, relationshipGroups, isInitialized]);

  // Modified sync effect to ensure proper data structure
  useEffect(() => {
    // Skip if not initialized
    if (!isInitialized) return;
    
    // Format relationships properly
    const formattedRelationships = relationshipGroups.map(group => {
      return {
        name: group.name,
        level1: Array.isArray(group.level1) 
          ? group.level1.map(guest => ({ 
              _id: guest._id,
              name: guest.name,
              email: guest.email || '',
              phone: guest.phone || '',
              type: guest.type || 'adult'
            }))
          : [],
        level2: Array.isArray(group.level2)
          ? group.level2.map(guest => ({
              _id: guest._id,
              name: guest.name,
              email: guest.email || '',
              phone: guest.phone || '',
              type: guest.type || 'adult'
            }))
          : []
      };
    });
    
    // Update parent form data directly
    updateFormData({
      ...formData,
      relationships: formattedRelationships
    });
    
  }, [relationshipGroups, isInitialized]);

  // Add an explicit save function that's called when the component unmounts
  useEffect(() => {
    return () => {
      if (isInitialized && relationshipGroups.length > 0) {
        
        const finalRelationships = relationshipGroups.map(group => ({
          name: group.name,
          level1: Array.isArray(group.level1) 
            ? group.level1.map(guest => ({ 
                _id: guest._id,
                name: guest.name, 
                email: guest.email || '', 
                phone: guest.phone || '',
                type: guest.type || 'adult'
              }))
            : [],
          level2: Array.isArray(group.level2)
            ? group.level2.map(guest => ({
                _id: guest._id,
                name: guest.name,
                email: guest.email || '',
                phone: guest.phone || '',
                type: guest.type || 'adult'
              }))
            : []
        }));
        
        // Final direct update to parent
        updateFormData(currentFormData => ({
          ...currentFormData,
          relationships: finalRelationships
        }));
      }
    };
  }, [isInitialized, relationshipGroups, updateFormData]);

  // Create a new group
  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      setError("Please enter a group name");
      return;
    }

    const newGroup = {
      id: generateId(),
      name: newGroupName.trim(),
      level1: [],
      level2: []
    };

    setRelationshipGroups(prev => [...prev, newGroup]);
    setNewGroupName("");
  };

  // Fixed handler for adding guests
  const handleAddGuestToGroup = (guest) => {
    
    if (!selectedGroup) {
      setError("Please select a group first");
      return;
    }

    // Find the target group
    const targetGroup = relationshipGroups.find(g => g.id === selectedGroup);
    if (!targetGroup) {
      setError("Selected group not found");
      return;
    }

    // Create a deep copy of the guest to avoid reference issues
    const guestCopy = JSON.parse(JSON.stringify(guest));
    
    // Create updated groups array with the new guest added
    const updatedGroups = relationshipGroups.map(group => {
      if (group.id === selectedGroup) {
        return {
          ...group,
          [selectedRole]: [...(group[selectedRole] || []), guestCopy]
        };
      }
      return group;
    });
    
    setRelationshipGroups(updatedGroups);
  };

  // Remove a guest from a group
  const handleRemoveGuestFromGroup = (groupId, role, guestId) => {
    const updatedGroups = relationshipGroups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          [role]: group[role].filter(guest => guest._id !== guestId)
        };
      }
      return group;
    });

    setRelationshipGroups(updatedGroups);
  };

  // Open the edit group dialog
  const handleEditGroupClick = (group) => {
    setEditingGroup(group);
    setEditedGroupName(group.name);
    setEditGroupDialog(true);
  };

  // Save the edited group name
  const handleSaveGroupName = () => {
    if (!editedGroupName.trim()) {
      setError("Group name cannot be empty");
      return;
    }

    const updatedGroups = relationshipGroups.map(group => {
      if (group.id === editingGroup.id) {
        return { ...group, name: editedGroupName.trim() };
      }
      return group;
    });

    setRelationshipGroups(updatedGroups);
    setEditGroupDialog(false);
  };

  // Open the delete group confirmation dialog
  const handleDeleteGroupClick = (group) => {
    setGroupToDelete(group);
    setDeleteDialog(true);
  };

  // Delete a group and return its guests to available
  const handleDeleteGroup = () => {
    setRelationshipGroups(relationshipGroups.filter(group => group.id !== groupToDelete.id));
    setDeleteDialog(false);
    
    // Reset selected group if it was the deleted one
    if (selectedGroup === groupToDelete.id) {
      setSelectedGroup("");
    }
  };

  return (
    <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography 
        variant="h5" 
        sx={{ fontWeight: "bold", textAlign: "center", color: "white" }}
      >
        Organize Guest Relationships
      </Typography>

      {/* Error Snackbar */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      {/* Group Creation */}
      <Paper 
        sx={{ 
          p: 3,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap" }}>
          <TextField 
            label="Group Name" 
            variant="outlined" 
            value={newGroupName} 
            onChange={(e) => setNewGroupName(e.target.value)}
            InputLabelProps={{ sx: { color: "rgba(255, 255, 255, 0.7)" } }}
            InputProps={{ 
              style: { color: "white" },
              sx: {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.23)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.4)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                }
              } 
            }}
            sx={{ flexGrow: 1 }}
          />
          <Button 
            variant="contained" 
            onClick={handleCreateGroup}
            disabled={!newGroupName.trim()}
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
              '&.Mui-disabled': {
                backgroundImage: 'none',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
              }
            }}
          >
            Create Group
          </Button>
        </Box>
      </Paper>

      {/* Selection Controls */}
      <Paper 
        sx={{ 
          p: 3,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap" }}>
          <FormControl sx={{ minWidth: 200, flexGrow: 1 }}>
            <InputLabel id="group-select-label" sx={{ color: "rgba(255, 255, 255, 0.7)" }}>Select Group</InputLabel>
            <Select
              labelId="group-select-label"
              value={selectedGroup}
              label="Select Group"
              onChange={(e) => setSelectedGroup(e.target.value)}
              sx={{ 
                color: "white",
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.23)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.4)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                },
                '& .MuiSelect-icon': {
                  color: 'rgba(255, 255, 255, 0.7)'
                }
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: 'rgba(0, 0, 0, 0.8)',
                    '& .MuiMenuItem-root': {
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'rgba(71, 118, 230, 0.1)',
                      },
                      '&.Mui-selected': {
                        bgcolor: 'rgba(71, 118, 230, 0.2)',
                      },
                    },
                  },
                },
              }}
            >
              {relationshipGroups.map((group) => (
                <MenuItem key={group.id} value={group.id}>
                  {group.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Typography variant="subtitle1" sx={{ color: "white" }}>Select Guest Role</Typography>
            <ToggleButtonGroup
              value={selectedRole}
              exclusive
              onChange={(event, newRole) => {
                if (newRole !== null) {
                  setSelectedRole(newRole);
                }
              }}
              aria-label="guest role selection"
              sx={{ 
                mt: 1,
                '& .MuiToggleButtonGroup-grouped': {
                  border: '1px solid rgba(255, 255, 255, 0.2) !important',
                  color: 'white',
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(71, 118, 230, 0.2)',
                    color: 'white',
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(71, 118, 230, 0.1)',
                  }
                }
              }}
            >
              <ToggleButton value="level1" aria-label="Adult" sx={{ textTransform: 'none' }}>
                Adults (Level 1)
              </ToggleButton>
              <ToggleButton value="level2" aria-label="Dependent/Kid" sx={{ textTransform: 'none' }}>
                Dependents / Kids (Level 2)
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
      </Paper>

      {/* Available Guests */}
      <Paper 
        sx={{ 
          p: 3,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, color: "white", fontWeight: "bold" }}>
          Available Guests ({availableGuests.length})
        </Typography>

        {availableGuests.length === 0 ? (
          <Typography sx={{ color: "rgba(255, 255, 255, 0.7)", textAlign: "center" }}>
            All guests have been assigned to groups.
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {availableGuests.map((guest) => (
              <Button
                key={guest._id}
                variant="outlined"
                onClick={() => handleAddGuestToGroup(guest)}
                disabled={!selectedGroup}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  borderColor: guest.type === 'adult' ? 'rgba(71, 118, 230, 0.5)' : 'rgba(142, 84, 233, 0.5)',
                  color: 'white',
                  backgroundColor: guest.type === 'adult' ? 'rgba(71, 118, 230, 0.1)' : 'rgba(142, 84, 233, 0.1)',
                  '&:hover': {
                    backgroundColor: guest.type === 'adult' ? 'rgba(71, 118, 230, 0.2)' : 'rgba(142, 84, 233, 0.2)',
                    borderColor: guest.type === 'adult' ? 'rgba(71, 118, 230, 0.8)' : 'rgba(142, 84, 233, 0.8)',
                  },
                  '&.Mui-disabled': {
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    borderColor: 'rgba(255, 255, 255, 0.12)',
                    color: 'rgba(255, 255, 255, 0.3)'
                  }
                }}
              >
                {guest.name}
              </Button>
            ))}
          </Box>
        )}
      </Paper>
      
      {relationshipGroups.length === 0 ? (
        <Typography sx={{ color: "rgba(255, 255, 255, 0.7)", textAlign: "center" }}>
          No groups created. Create a group and then assign guests.
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {relationshipGroups.map((group) => (
            <Paper
              key={group.id}
              elevation={3}
              sx={{ 
                p: 2, 
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              <Box sx={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                mb: 1,
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                pb: 1
              }}>
                <Typography variant="h6" sx={{ fontWeight: "bold", color: "white" }}>
                  {group.name}
                </Typography>
                <Box>
                  <Tooltip title="Edit Group Name">
                    <IconButton 
                      size="small" 
                      onClick={() => handleEditGroupClick(group)}
                      sx={{ 
                        color: "#4776E6",
                        '&:hover': {
                          backgroundColor: 'rgba(71, 118, 230, 0.1)'
                        }
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Group">
                    <IconButton 
                      size="small" 
                      onClick={() => handleDeleteGroupClick(group)}
                      sx={{ 
                        color: "#f44336",
                        '&:hover': {
                          backgroundColor: 'rgba(244, 67, 54, 0.1)'
                        }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              
              <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
                {/* Level 1 (Adults) */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ color: "#4776E6", fontWeight: "bold", mb: 1 }}>
                    Adults
                  </Typography>
                  
                  {group.level1.length === 0 ? (
                    <Typography sx={{ color: "rgba(255, 255, 255, 0.7)", textAlign: "center", py: 2 }}>
                      No adults assigned
                    </Typography>
                  ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      {group.level1.map((guest) => (
                        <Paper
                          key={guest._id}
                          sx={{
                            p: 1,
                            backgroundColor: 'rgba(71, 118, 230, 0.1)',
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            borderRadius: 1,
                            border: '1px solid rgba(71, 118, 230, 0.2)',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: 'rgba(71, 118, 230, 0.2)',
                              border: '1px solid rgba(71, 118, 230, 0.3)'
                            }
                          }}
                        >
                          <Typography sx={{ color: "white", fontWeight: "medium" }}>
                            {guest.name}
                          </Typography>
                          <Tooltip title="Remove from group">
                            <IconButton 
                              size="small"
                              onClick={() => handleRemoveGuestFromGroup(group.id, "level1", guest._id)}
                              sx={{ 
                                color: "#f44336",
                                '&:hover': {
                                  backgroundColor: 'rgba(244, 67, 54, 0.1)'
                                }
                              }}
                            >
                              <PersonRemoveIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Paper>
                      ))}
                    </Box>
                  )}
                </Box>

                {/* Level 2 (Dependents/Kids) */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ color: "#8E54E9", fontWeight: "bold", mb: 1 }}>
                    Dependents / Kids
                  </Typography>
                  
                  {group.level2.length === 0 ? (
                    <Typography sx={{ color: "rgba(255, 255, 255, 0.7)", textAlign: "center", py: 2 }}>
                      No dependents/kids assigned
                    </Typography>
                  ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      {group.level2.map((guest) => (
                        <Paper
                          key={guest._id}
                          sx={{
                            p: 1,
                            backgroundColor: 'rgba(142, 84, 233, 0.1)',
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            borderRadius: 1,
                            border: '1px solid rgba(142, 84, 233, 0.2)',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: 'rgba(142, 84, 233, 0.2)',
                              border: '1px solid rgba(142, 84, 233, 0.3)'
                            }
                          }}
                        >
                          <Typography sx={{ color: "white", fontWeight: "medium" }}>
                            {guest.name}
                          </Typography>
                          <Tooltip title="Remove from group">
                            <IconButton 
                              size="small"
                              onClick={() => handleRemoveGuestFromGroup(group.id, "level2", guest._id)}
                              sx={{ 
                                color: "#f44336",
                                '&:hover': {
                                  backgroundColor: 'rgba(244, 67, 54, 0.1)'
                                }
                              }}
                            >
                              <PersonRemoveIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Paper>
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* Edit Group Dialog */}
      <Dialog open={editGroupDialog} onClose={() => setEditGroupDialog(false)}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>Edit Group Name</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Group Name"
            type="text"
            fullWidth
            value={editedGroupName}
            onChange={(e) => setEditedGroupName(e.target.value)}
            InputLabelProps={{ sx: { color: "rgba(255, 255, 255, 0.7)" } }}
            InputProps={{ 
              style: { color: "white" },
              sx: {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.23)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.4)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                }
              } 
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setEditGroupDialog(false)} 
            sx={{ 
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveGroupName} 
            disabled={!editedGroupName.trim()}
            sx={{
              color: 'white',
              backgroundImage: 'linear-gradient(90deg, #4776E6 0%, #8E54E9 100%)',
              '&:hover': {
                backgroundImage: 'linear-gradient(90deg, #8E54E9 0%, #4776E6 100%)',
              },
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Group Dialog */}
      <Dialog
        open={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>Delete Group</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'white' }}>
            Are you sure you want to delete the group "{groupToDelete?.name}"? All guests will be unassigned from this group.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialog(false)}
            sx={{ 
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteGroup} 
            color="error" 
            sx={{
              backgroundColor: 'rgba(211, 47, 47, 0.8)',
              color: 'white',
              '&:hover': {
                backgroundColor: '#d32f2f'
              }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GuestRelationship;