// PermissionManagement.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import {
  Box,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Alert,
  Snackbar,
  Tooltip,
  Chip,
  Card,
  CardContent,
} from "@mui/material";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaEye,
  FaLock,
  FaKey,
  FaShieldAlt,
  FaUserShield,
} from "react-icons/fa";

const PermissionManagement = () => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [currentPermission, setCurrentPermission] = useState({
    id: null,
    name: "",
    description: "",
  });
  const [dialogMode, setDialogMode] = useState("create");

  // Get token from cookies
  const getAuthToken = () => {
    return Cookies.get("auth_token");
  };

  // Set up axios defaults
  useEffect(() => {
    const token = Cookies.get("authToken");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, []);

  // Fetch permissions
  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "http://localhost:5000/api/rbac/permissions"
      );
      setPermissions(response.data);
      setError("");
    } catch (err) {
      console.error("Error fetching permissions:", err);
      setError(err.response?.data?.error || "Failed to fetch permissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentPermission((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Open create dialog
  const handleCreateClick = () => {
    setCurrentPermission({
      id: null,
      name: "",
      description: "",
    });
    setDialogMode("create");
    setOpenDialog(true);
  };

  // Open edit dialog
  const handleEditClick = (permission) => {
    setCurrentPermission({
      id: permission.id,
      name: permission.name,
      description: permission.description,
    });
    setDialogMode("edit");
    setOpenDialog(true);
  };

  // Handle permission creation
  const handleSubmit = async () => {
    try {
      if (dialogMode === "create") {
        const response = await axios.post(
          "http://localhost:5000/api/rbac/permissions",
          {
            name: currentPermission.name,
            description: currentPermission.description,
          }
        );
        setPermissions((prev) => [...prev, response.data]);
        setSuccess("Permission created successfully!");
        setOpenDialog(false);
        fetchPermissions(); // Refresh list
      } else {
        // Update functionality if API supports it
        setError("Update functionality not available in current API");
      }
    } catch (err) {
      console.error("Error saving permission:", err);
      setError(err.response?.data?.error || "Failed to save permission");
    }
  };

  // Handle permission deletion
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this permission?")) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/rbac/permissions/${id}`);
      setPermissions((prev) => prev.filter((p) => p.id !== id));
      setSuccess("Permission deleted successfully!");
    } catch (err) {
      console.error("Error deleting permission:", err);
      setError(err.response?.data?.error || "Failed to delete permission");
    }
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setError("");
    setSuccess("");
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          <FaLock style={{ marginRight: 8, verticalAlign: "middle" }} />
          Permission Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<FaPlus />}
          onClick={handleCreateClick}
        >
          Add Permission
        </Button>
      </Box>

      {/* Error/Success Messages */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert severity="error" onClose={handleCloseSnackbar}>
          {error}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert severity="success" onClose={handleCloseSnackbar}>
          {success}
        </Alert>
      </Snackbar>

      {/* Permissions Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            All Permissions ({permissions.length})
          </Typography>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell>
                    <strong>ID</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Permission Name</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Description</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Created At</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Actions</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Loading permissions...
                    </TableCell>
                  </TableRow>
                ) : permissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No permissions found
                    </TableCell>
                  </TableRow>
                ) : (
                  permissions.map((permission) => (
                    <TableRow key={permission.id} hover>
                      <TableCell>{permission.id}</TableCell>
                      <TableCell>
                        <Chip
                          label={permission.name}
                          color="primary"
                          variant="outlined"
                          size="small"
                          icon={<FaKey size={12} />}
                        />
                      </TableCell>
                      <TableCell>
                        {permission.description || "No description"}
                      </TableCell>
                      <TableCell>
                        {new Date(permission.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Edit Permission">
                          <IconButton
                            color="primary"
                            onClick={() => handleEditClick(permission)}
                            size="small"
                            sx={{ mr: 1 }}
                          >
                            <FaEdit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Permission">
                          <IconButton
                            color="error"
                            onClick={() => handleDelete(permission.id)}
                            size="small"
                          >
                            <FaTrash />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <FaShieldAlt style={{ marginRight: 8 }} />
            {dialogMode === "create"
              ? "Create New Permission"
              : "Edit Permission"}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Permission Name"
              name="name"
              value={currentPermission.name}
              onChange={handleInputChange}
              margin="normal"
              required
              helperText="Unique name for the permission (e.g., 'create_smartphone')"
              disabled={dialogMode === "edit"}
            />
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={currentPermission.description}
              onChange={handleInputChange}
              margin="normal"
              multiline
              rows={3}
              helperText="Brief description of what this permission allows"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={!currentPermission.name.trim()}
          >
            {dialogMode === "create" ? "Create" : "Update"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PermissionManagement;
