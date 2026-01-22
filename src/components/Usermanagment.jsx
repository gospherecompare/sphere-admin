// UserManagement.jsx
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  Grid,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from "@mui/material";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaUser,
  FaUsers,
  FaLock,
  FaKey,
  FaShieldAlt,
  FaUserShield,
  FaUserTag,
  FaPhone,
  FaEnvelope,
  FaCalendar,
  FaCog,
} from "react-icons/fa";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [roleAssignmentDialog, setRoleAssignmentDialog] = useState(false);

  // User form state
  const [userForm, setUserForm] = useState({
    id: null,
    user_name: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone: "",
    gender: "",
    role: "viewer",
  });

  // Get token from cookies
  const getAuthToken = () => {
    return Cookies.get("authToken");
  };

  // Set up axios defaults
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, []);

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes, permissionsRes] = await Promise.all([
        axios.get("http://apishpere.duckdns.org/api/users"), // You need to create this endpoint
        axios.get("http://apishpere.duckdns.org/api/rbac/roles"),
        axios.get("http://apishpere.duckdns.org/api/rbac/permissions"),
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
      setPermissions(permissionsRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  // Handle user form input changes
  const handleUserInputChange = (e) => {
    const { name, value } = e.target;
    setUserForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Open user dialog
  const handleOpenUserDialog = (user = null) => {
    if (user) {
      setUserForm({
        id: user.id,
        user_name: user.user_name || "",
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        password: "",
        phone: user.phone || "",
        gender: user.gender || "",
        role: user.role || "viewer",
      });
    } else {
      setUserForm({
        id: null,
        user_name: "",
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        phone: "",
        gender: "",
        role: "viewer",
      });
    }
    setUserDialogOpen(true);
  };

  // Handle user save
  const handleSaveUser = async () => {
    try {
      if (userForm.id) {
        // Update existing user
        await axios.put(
          `/http://apishpere.duckdns.org/api/users/${userForm.id}`,
          userForm
        );
        setSuccess("User updated successfully!");
      } else {
        // Create new user
        await axios.post("http://apishpere.duckdns.org/api/auth/register", userForm);
        setSuccess("User created successfully!");
      }
      setUserDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error("Error saving user:", err);
      setError(err.response?.data?.error || "Failed to save user");
    }
  };

  // Handle user delete
  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      await axios.delete(`http://apishpere.duckdns.org/api/users/${id}`);
      setUsers((prev) => prev.filter((user) => user.id !== id));
      setSuccess("User deleted successfully!");
    } catch (err) {
      console.error("Error deleting user:", err);
      setError(err.response?.data?.error || "Failed to delete user");
    }
  };

  // Open role assignment dialog
  const handleOpenRoleAssignment = (user) => {
    setSelectedUser(user);
    setRoleAssignmentDialog(true);
  };

  // Handle role assignment
  const handleAssignRole = async (roleId) => {
    try {
      await axios.post(
        `http://apishpere.duckdns.org/api/rbac/users/${selectedUser.id}/roles`,
        {
          role_id: roleId,
        }
      );
      setSuccess("Role assigned successfully!");
      setRoleAssignmentDialog(false);
      fetchData();
    } catch (err) {
      console.error("Error assigning role:", err);
      setError(err.response?.data?.error || "Failed to assign role");
    }
  };

  // Render user row
  const renderUserRow = (user) => (
    <TableRow key={user.id} hover>
      <TableCell>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Avatar sx={{ mr: 2, bgcolor: "primary.main" }}>
            {user.first_name?.[0] || user.user_name?.[0] || <FaUser />}
          </Avatar>
          <Box>
            <Typography variant="body1">
              {user.first_name && user.last_name
                ? `${user.first_name} ${user.last_name}`
                : user.user_name || "No Name"}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              <FaEnvelope size={10} style={{ marginRight: 4 }} />
              {user.email}
            </Typography>
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <FaPhone size={12} style={{ marginRight: 8, color: "#666" }} />
          {user.phone || "N/A"}
        </Box>
      </TableCell>
      <TableCell>
        <Chip
          label={user.role || "No Role"}
          color={
            user.role === "admin"
              ? "error"
              : user.role === "editor"
              ? "warning"
              : "default"
          }
          size="small"
          icon={
            user.role === "admin" ? (
              <FaUserShield size={12} />
            ) : (
              <FaUserTag size={12} />
            )
          }
        />
      </TableCell>
      <TableCell>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <FaCalendar size={12} style={{ marginRight: 8, color: "#666" }} />
          {new Date(user.created_at).toLocaleDateString()}
        </Box>
      </TableCell>
      <TableCell>
        <Tooltip title="Edit User">
          <IconButton
            color="primary"
            onClick={() => handleOpenUserDialog(user)}
            size="small"
            sx={{ mr: 1 }}
          >
            <FaEdit />
          </IconButton>
        </Tooltip>
        <Tooltip title="Assign Roles">
          <IconButton
            color="secondary"
            onClick={() => handleOpenRoleAssignment(user)}
            size="small"
            sx={{ mr: 1 }}
          >
            <FaUserShield />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete User">
          <IconButton
            color="error"
            onClick={() => handleDeleteUser(user.id)}
            size="small"
          >
            <FaTrash />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={selectedTab} onChange={handleTabChange}>
          <Tab icon={<FaUser />} label="Users" />
          <Tab icon={<FaUsers />} label="Roles" />
          <Tab icon={<FaLock />} label="Permissions" />
        </Tabs>
      </Box>

      {/* Error/Success Messages */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError("")}
      >
        <Alert severity="error" onClose={() => setError("")}>
          {error}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess("")}
      >
        <Alert severity="success" onClose={() => setSuccess("")}>
          {success}
        </Alert>
      </Snackbar>

      {/* Users Tab */}
      {selectedTab === 0 && (
        <Card>
          <CardContent>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}
            >
              <Typography variant="h6">
                <FaUser style={{ marginRight: 8, verticalAlign: "middle" }} />
                User Management ({users.length} users)
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<FaPlus />}
                onClick={() => handleOpenUserDialog()}
              >
                Add User
              </Button>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell>
                      <strong>User</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Phone</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Role</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Joined</strong>
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
                        Loading users...
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map(renderUserRow)
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Roles Tab */}
      {selectedTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <FaUsers style={{ marginRight: 8, verticalAlign: "middle" }} />
              Role Management ({roles.length} roles)
            </Typography>
            <Grid container spacing={3}>
              {roles.map((role) => (
                <Grid item xs={12} md={6} lg={4} key={role.id}>
                  <Card variant="outlined" sx={{ height: "100%" }}>
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 2,
                        }}
                      >
                        <Typography variant="h6">
                          {role.title || role.name}
                        </Typography>
                        <Chip
                          label={role.name}
                          color={role.name === "admin" ? "error" : "primary"}
                          size="small"
                          icon={
                            role.name === "admin" ? (
                              <FaUserShield size={12} />
                            ) : (
                              <FaUserTag size={12} />
                            )
                          }
                        />
                      </Box>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        gutterBottom
                      >
                        <FaKey size={10} style={{ marginRight: 4 }} />
                        ID: {role.id}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <FaCalendar size={10} style={{ marginRight: 4 }} />
                        Created:{" "}
                        {new Date(role.created_at).toLocaleDateString()}
                      </Typography>
                      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        <Button
                          size="small"
                          color="primary"
                          startIcon={<FaLock />}
                        >
                          View Permissions
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Permissions Tab */}
      {selectedTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <FaLock style={{ marginRight: 8, verticalAlign: "middle" }} />
              System Permissions ({permissions.length} permissions)
            </Typography>
            <Grid container spacing={2}>
              {permissions.map((permission) => (
                <Grid item xs={12} sm={6} md={4} key={permission.id}>
                  <Card variant="outlined" sx={{ height: "100%" }}>
                    <CardContent>
                      <Typography
                        variant="subtitle1"
                        gutterBottom
                        sx={{ display: "flex", alignItems: "center" }}
                      >
                        <FaShieldAlt
                          style={{ marginRight: 8, color: "#1976d2" }}
                        />
                        {permission.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {permission.description || "No description"}
                      </Typography>
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ mt: 1, display: "flex", alignItems: "center" }}
                      >
                        <FaKey size={10} style={{ marginRight: 4 }} />
                        ID: {permission.id}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* User Dialog */}
      <Dialog
        open={userDialogOpen}
        onClose={() => setUserDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <FaUser style={{ marginRight: 8 }} />
            {userForm.id ? "Edit User" : "Create New User"}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Username"
                name="user_name"
                value={userForm.user_name}
                onChange={handleUserInputChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={userForm.email}
                onChange={handleUserInputChange}
                margin="normal"
                required
                disabled={!!userForm.id}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                name="first_name"
                value={userForm.first_name}
                onChange={handleUserInputChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="last_name"
                value={userForm.last_name}
                onChange={handleUserInputChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={userForm.password}
                onChange={handleUserInputChange}
                margin="normal"
                required={!userForm.id}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={userForm.phone}
                onChange={handleUserInputChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Gender</InputLabel>
                <Select
                  name="gender"
                  value={userForm.gender}
                  onChange={handleUserInputChange}
                  label="Gender"
                >
                  <MenuItem value="">Select Gender</MenuItem>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Default Role</InputLabel>
                <Select
                  name="role"
                  value={userForm.role}
                  onChange={handleUserInputChange}
                  label="Default Role"
                >
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="editor">Editor</MenuItem>
                  <MenuItem value="viewer">Viewer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveUser}
            variant="contained"
            color="primary"
            disabled={!userForm.email || (!userForm.id && !userForm.password)}
          >
            {userForm.id ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Role Assignment Dialog */}
      <Dialog
        open={roleAssignmentDialog}
        onClose={() => setRoleAssignmentDialog(false)}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <FaUserShield style={{ marginRight: 8 }} />
            Assign Roles to{" "}
            {selectedUser?.first_name || selectedUser?.user_name}
          </Box>
        </DialogTitle>
        <DialogContent>
          <List>
            {roles.map((role) => (
              <ListItem key={role.id} button>
                <ListItemText
                  primary={role.title || role.name}
                  secondary={role.description}
                />
                <ListItemSecondaryAction>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleAssignRole(role.id)}
                    startIcon={<FaUserTag />}
                  >
                    Assign
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleAssignmentDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
