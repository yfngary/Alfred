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
  DialogActions
} from "@mui/material";
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const GuestRelationship = ({ formData, updateFormData }) => {
  // Determine number of adults and kids.
  const numAdults = formData.adults || 0;
  const numKids = formData.kids || 0;

  // Build the initial guest list.
  const initialGuests =
    formData.guests && formData.guests.length > 0
      ? formData.guests
      : [
          ...Array.from({ length: numAdults }, (_, i) => ({
            id: `adult-${i}`,
            name: formData.adultNames?.[i]?.name || `Adult ${i + 1}`,
            type: "adult"
          })),
          ...Array.from({ length: numKids }, (_, i) => ({
            id: `child-${i}`,
            name: formData.childNames?.[i]?.name || `Child ${i + 1}`,
            type: "child"
          })),
        ];

  // State management
  const [availableGuests, setAvailableGuests] = useState(initialGuests);
  const [groups, setGroups] = useState(formData.relationships || []);
  const [groupName, setGroupName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedRole, setSelectedRole] = useState("level1");
  
  // New state for editing group name
  const [editGroupDialog, setEditGroupDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [newGroupName, setNewGroupName] = useState("");
  
  // New state for delete confirmation
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);

  // Get all assigned guests (those in groups)
  const getAllAssignedGuests = () => {
    let assignedGuests = [];
    groups.forEach(group => {
      assignedGuests = [...assignedGuests, ...group.level1, ...group.level2];
    });
    return assignedGuests;
  };

  // Whenever availableGuests or groups change, update the parent form data.
  useEffect(() => {
    const allGuests = [...availableGuests, ...getAllAssignedGuests()];
    updateFormData({ 
      ...formData, 
      guests: allGuests, 
      relationships: groups 
    });
  }, [availableGuests, groups]);

  // Create a new group.
  const createGroup = () => {
    if (!groupName.trim()) return;
    const newGroup = {
      id: `group-${Date.now()}`,
      name: groupName,
      level1: [],
      level2: []
    };
    setGroups(prev => [...prev, newGroup]);
    setGroupName("");
  };

  // When a guest is clicked, add them to the chosen group and role.
  const handleGuestClick = (guest) => {
    if (!selectedGroup) {
      alert("Please select a group first.");
      return;
    }
    
    // Find the group to update.
    const updatedGroups = groups.map((group) => {
      if (group.id === selectedGroup) {
        return {
          ...group,
          [selectedRole]: [...group[selectedRole], guest]
        };
      }
      return group;
    });
    
    // Remove ONLY the selected guest from availableGuests.
    const updatedAvailable = availableGuests.filter(g => g.name !== guest.name);
    setGroups(updatedGroups);
    setAvailableGuests(updatedAvailable);
  };

  // Remove a guest from a group and return them to available
  const removeGuestFromGroup = (groupId, roleLevel, guestName) => {
    // Find the group and guest
    const targetGroup = groups.find(g => g.id === groupId);
    const removedGuest = targetGroup[roleLevel].find(g => g.name === guestName);
    
    // Remove the guest from the group
    const updatedGroups = groups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          [roleLevel]: group[roleLevel].filter(g => g.name !== guestName)
        };
      }
      return group;
    });
    
    // Add the guest back to available
    setAvailableGuests(prev => [...prev, removedGuest]);
    setGroups(updatedGroups);
  };

  // Handle opening the edit group dialog
  const handleEditGroup = (group) => {
    setEditingGroup(group);
    setNewGroupName(group.name);
    setEditGroupDialog(true);
  };

  // Save edited group name
  const saveGroupName = () => {
    if (!newGroupName.trim()) return;
    
    const updatedGroups = groups.map(group => {
      if (group.id === editingGroup.id) {
        return { ...group, name: newGroupName };
      }
      return group;
    });
    
    setGroups(updatedGroups);
    setEditGroupDialog(false);
  };

  // Handle delete group confirmation
  const confirmDeleteGroup = (group) => {
    setGroupToDelete(group);
    setDeleteDialog(true);
  };

  // Delete a group and return all its members to available
  const deleteGroup = () => {
    const groupToRemove = groups.find(g => g.id === groupToDelete.id);
    const guestsToReturn = [...groupToRemove.level1, ...groupToRemove.level2];
    
    setAvailableGuests(prev => [...prev, ...guestsToReturn]);
    setGroups(prev => prev.filter(g => g.id !== groupToDelete.id));
    
    if (selectedGroup === groupToDelete.id) {
      setSelectedGroup("");
    }
    
    setDeleteDialog(false);
  };

  return (
    <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography 
        variant="h5" 
        sx={{ fontWeight: "bold", textAlign: "center", color: "black" }}
      >
        Organize Guest Relationships
      </Typography>

      {/* Group Creation */}
      <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
        <TextField 
          label="Group Name" 
          variant="outlined" 
          value={groupName} 
          onChange={(e) => setGroupName(e.target.value)}
          InputLabelProps={{ style: { color: "black" } }}
          sx={{ input: { color: "black" } }}
        />
        <Button 
          variant="contained" 
          onClick={createGroup}
          disabled={!groupName.trim()}
        >
          Create Group
        </Button>
      </Box>

      {/* Selection Controls */}
      <Box sx={{ display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap" }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="group-select-label">Select Group</InputLabel>
          <Select
            labelId="group-select-label"
            value={selectedGroup}
            label="Select Group"
            onChange={(e) => setSelectedGroup(e.target.value)}
          >
            {groups.map((group) => (
              <MenuItem key={group.id} value={group.id}>
                {group.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Typography variant="subtitle1">Select Guest Role</Typography>
          <ToggleButtonGroup
            value={selectedRole}
            exclusive
            onChange={(event, newRole) => {
              if (newRole !== null) {
                setSelectedRole(newRole);
              }
            }}
            aria-label="guest role selection"
            sx={{ mt: 1 }}
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

      {/* Available Guests */}
      <Box>
        <Typography variant="subtitle1" sx={{ textAlign: "center", color: "black", mb: 1 }}>
          Available Guests (Click to assign)
        </Typography>
        <Paper 
          elevation={2}
          sx={{
            p: 2,
            backgroundColor: "#f5f5f5",
            border: "1px dashed #ccc",
            minHeight: "100px"
          }}
        >
          <Box sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            justifyContent: "center"
          }}>
            {availableGuests.length === 0 ? (
              <Typography sx={{ color: "gray" }}>All guests have been assigned</Typography>
            ) : (
              availableGuests.map((guest) => (
                <Paper
                  key={guest.id}
                  onClick={() => handleGuestClick(guest)}
                  sx={{
                    p: 1,
                    backgroundColor: guest.type === "adult" ? "#e3f2fd" : "#fff3e0",
                    border: "1px solid #ccc",
                    cursor: "pointer",
                    minWidth: "100px",
                    textAlign: "center",
                    color: "black",
                    transition: "all 0.2s",
                    "&:hover": {
                      transform: "scale(1.05)",
                      boxShadow: 2
                    }
                  }}
                >
                  {guest.name}
                </Paper>
              ))
            )}
          </Box>
        </Paper>
      </Box>

      {/* Display Groups */}
      <Typography variant="h6" sx={{ textAlign: "center", color: "black", mt: 2 }}>
        Guest Groups
      </Typography>
      
      {groups.length === 0 ? (
        <Typography sx={{ color: "gray", textAlign: "center" }}>
          No groups created. Create a group and then assign guests.
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {groups.map((group) => (
            <Paper
              key={group.id}
              elevation={3}
              sx={{ 
                p: 2, 
                backgroundColor: "#e8f5e9", 
                border: "1px solid #66bb6a", 
                borderRadius: "8px"
              }}
            >
              <Box sx={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                mb: 1,
                borderBottom: "1px solid #66bb6a",
                pb: 1
              }}>
                <Typography variant="h6" sx={{ fontWeight: "bold", color: "black" }}>
                  {group.name}
                </Typography>
                <Box>
                  <Tooltip title="Edit Group Name">
                    <IconButton 
                      size="small" 
                      onClick={() => handleEditGroup(group)}
                      sx={{ color: "#2196f3" }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Group">
                    <IconButton 
                      size="small" 
                      onClick={() => confirmDeleteGroup(group)}
                      sx={{ color: "#f44336" }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              <Box sx={{ display: "flex", gap: 2, mt: 2, flexWrap: { xs: "wrap", md: "nowrap" } }}>
                {/* Level 1 (Adults) */}
                <Box sx={{ flex: 1, minWidth: { xs: "100%", md: "45%" } }}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      textAlign: "center", 
                      color: "black", 
                      backgroundColor: "#81c784", 
                      p: 1,
                      borderRadius: "4px 4px 0 0"
                    }}
                  >
                    Level 1 (Adults)
                  </Typography>
                  <Box sx={{ 
                    p: 1, 
                    backgroundColor: "#f1f8e9", 
                    minHeight: "100px",
                    borderRadius: "0 0 4px 4px",
                    border: "1px solid #81c784",
                    borderTop: "none"
                  }}>
                    {group.level1.length === 0 ? (
                      <Typography sx={{ color: "gray", textAlign: "center", py: 2 }}>
                        No adults assigned
                      </Typography>
                    ) : (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        {group.level1.map((guest) => (
                          <Paper
                            key={guest.id}
                            sx={{
                              p: 1,
                              backgroundColor: "#e3f2fd",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center"
                            }}
                          >
                            <Typography sx={{ color: "black", fontWeight: "medium" }}>
                              {guest.name}
                            </Typography>
                            <Tooltip title="Remove from group">
                              <IconButton 
                                size="small"
                                onClick={() => removeGuestFromGroup(group.id, "level1", guest.name)}
                                sx={{ color: "#f44336" }}
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

                {/* Level 2 (Dependents/Kids) */}
                <Box sx={{ flex: 1, minWidth: { xs: "100%", md: "45%" } }}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      textAlign: "center", 
                      color: "black", 
                      backgroundColor: "#ffb74d", 
                      p: 1,
                      borderRadius: "4px 4px 0 0"
                    }}
                  >
                    Level 2 (Dependents/Kids)
                  </Typography>
                  <Box sx={{ 
                    p: 1, 
                    backgroundColor: "#fff3e0", 
                    minHeight: "100px",
                    borderRadius: "0 0 4px 4px",
                    border: "1px solid #ffb74d",
                    borderTop: "none"
                  }}>
                    {group.level2.length === 0 ? (
                      <Typography sx={{ color: "gray", textAlign: "center", py: 2 }}>
                        No dependents/kids assigned
                      </Typography>
                    ) : (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        {group.level2.map((guest) => (
                          <Paper
                            key={guest.id}
                            sx={{
                              p: 1,
                              backgroundColor: "#fff",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center"
                            }}
                          >
                            <Typography sx={{ color: "black", fontWeight: "medium" }}>
                              {guest.name}
                            </Typography>
                            <Tooltip title="Remove from group">
                              <IconButton 
                                size="small"
                                onClick={() => removeGuestFromGroup(group.id, "level2", guest.name)}
                                sx={{ color: "#f44336" }}
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
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* Edit Group Dialog */}
      <Dialog open={editGroupDialog} onClose={() => setEditGroupDialog(false)}>
        <DialogTitle>Edit Group Name</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Group Name"
            fullWidth
            variant="outlined"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditGroupDialog(false)}>Cancel</Button>
          <Button onClick={saveGroupName} variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the group "{groupToDelete?.name}"? All guests will be returned to the available pool.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={deleteGroup} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GuestRelationship;