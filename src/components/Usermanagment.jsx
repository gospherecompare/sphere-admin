// UserManagement.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import axios from "axios";
import { buildUrl } from "../api";
import Cookies from "js-cookie";
import PermissionsMatrix from "./PermissionsMatrix";
import {
  getCurrentPermissions,
  hasAnyPermissions,
} from "../utils/access";
import {
  RBAC_ACTIONS,
  getPermissionMatrix,
  normalizePermissionToken,
} from "../utils/rbacCatalog";
import {
  deleteUser as removeStoredUser,
  getCurrentSessionUser,
  getUserPermissionSummary,
  listActivities,
  listPermissions as listStoredPermissions,
  listRoles as listStoredRoles,
  listUsers as listStoredUsers,
  setUserRole as setStoredUserRole,
  setUserPermissions as setStoredUserPermissions,
  syncRbacState,
  upsertUser as upsertStoredUser,
} from "../utils/rbacStore";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaEye,
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
} from "react-icons/fa";

const DEFAULT_PERMISSION_MODULES = getPermissionMatrix();
const DEFAULT_PERMISSION_ACTION_ORDER = RBAC_ACTIONS.map((action) =>
  normalizePermissionToken(action),
);
const DEFAULT_MODULE_ORDER = new Map(
  DEFAULT_PERMISSION_MODULES.map((module, index) => [
    normalizePermissionToken(module.key),
    index,
  ]),
);

const normalizeLookupKey = (value = "") => normalizePermissionToken(value);

const dedupePermissions = (values = []) =>
  Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((permission) => normalizePermissionToken(permission))
        .filter(Boolean),
    ),
  );

const getPermissionSignature = (values = []) =>
  dedupePermissions(values).sort().join("|");

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.response?.data?.error || fallback;

const buildPermissionMatrixConfig = (permissionRecords = []) => {
  const moduleMap = new Map(
    DEFAULT_PERMISSION_MODULES.map((module) => [
      normalizeLookupKey(module.key),
      {
        key: module.key,
        label: module.label,
        description: module.description || module.label || module.key,
        actions: dedupePermissions(module.actions),
      },
    ]),
  );

  (Array.isArray(permissionRecords) ? permissionRecords : []).forEach(
    (permission) => {
      const permissionToken = normalizePermissionToken(
        permission?.name || permission?.id || "",
      );
      const permissionParts = permissionToken.split(".").filter(Boolean);
      const fallbackAction =
        permissionParts[permissionParts.length - 1] || "";
      const fallbackModule = permissionParts.slice(0, -1).join(".");
      const moduleKey = normalizePermissionToken(
        permission?.module || fallbackModule,
      );
      const actionKey = normalizePermissionToken(
        permission?.action || fallbackAction,
      );

      if (!moduleKey || !actionKey) return;

      const existing = moduleMap.get(normalizeLookupKey(moduleKey));
      moduleMap.set(normalizeLookupKey(moduleKey), {
        key: existing?.key || permission?.module || fallbackModule || moduleKey,
        label:
          existing?.label ||
          permission?.module_label ||
          permission?.module ||
          fallbackModule ||
          moduleKey,
        description:
          existing?.description ||
          permission?.module_label ||
          permission?.description ||
          permission?.module ||
          fallbackModule ||
          moduleKey,
        actions: dedupePermissions([...(existing?.actions || []), actionKey]),
      });
    },
  );

  const modules = Array.from(moduleMap.values())
    .filter((module) => Array.isArray(module.actions) && module.actions.length)
    .sort((a, b) => {
      const aIndex = DEFAULT_MODULE_ORDER.get(normalizeLookupKey(a.key));
      const bIndex = DEFAULT_MODULE_ORDER.get(normalizeLookupKey(b.key));

      if (typeof aIndex === "number" && typeof bIndex === "number") {
        return aIndex - bIndex;
      }
      if (typeof aIndex === "number") return -1;
      if (typeof bIndex === "number") return 1;
      return String(a.label || a.key).localeCompare(String(b.label || b.key));
    });

  const actions = Array.from(
    new Set([
      ...DEFAULT_PERMISSION_ACTION_ORDER,
      ...modules.flatMap((module) =>
        Array.isArray(module.actions) ? module.actions : [],
      ),
    ]),
  ).sort((a, b) => {
    const aIndex = DEFAULT_PERMISSION_ACTION_ORDER.indexOf(a);
    const bIndex = DEFAULT_PERMISSION_ACTION_ORDER.indexOf(b);

    if (aIndex >= 0 && bIndex >= 0) return aIndex - bIndex;
    if (aIndex >= 0) return -1;
    if (bIndex >= 0) return 1;
    return a.localeCompare(b);
  });

  return { modules, actions };
};

const joinClasses = (...classes) => classes.filter(Boolean).join(" ");

const PANEL_CLASS =
  "overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm";
const CARD_CLASS =
  "rounded-[24px] border border-slate-200 bg-white/95 p-5 shadow-sm";
const FIELD_CLASS =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";
const TEXTAREA_CLASS = joinClasses(FIELD_CLASS, "min-h-[112px] resize-y");
const PRIMARY_BUTTON_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 hover:text-white disabled:cursor-not-allowed disabled:bg-slate-300";
const SECONDARY_BUTTON_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400";
const TAB_BUTTON_CLASS =
  "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition";

const MANAGEMENT_TABS = [
  { id: 0, label: "Users", icon: FaUser },
  { id: 1, label: "Roles", icon: FaUsers },
  { id: 2, label: "Permissions", icon: FaLock },
];

const USER_DETAILS_TABS = ["Profile", "Permissions", "Activity"];

const getDisplayName = (user) =>
  user?.display_name ||
  [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
  user?.user_name ||
  user?.username ||
  user?.email ||
  "Unknown user";

const getUserHandle = (user) =>
  user?.user_name || user?.username || user?.email || "n/a";

const getUserInitial = (user) =>
  String(getDisplayName(user) || "U").trim().charAt(0).toUpperCase() || "U";

const formatDateLabel = (value, options = {}) => {
  if (!value) return "Not tracked";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not tracked";
  return date.toLocaleDateString(undefined, options);
};

const formatDateTimeLabel = (value) => {
  if (!value) return "Not tracked";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not tracked";
  return date.toLocaleString();
};

const getRoleBadgeClass = (tone) => {
  switch (tone) {
    case "error":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "primary":
      return "border-blue-200 bg-blue-50 text-blue-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
};

const getStatusBadgeClass = (status) =>
  String(status || "").toLowerCase() === "inactive"
    ? "border-slate-200 bg-slate-100 text-slate-600"
    : "border-emerald-200 bg-emerald-50 text-emerald-700";

const ModalShell = ({ open, onClose, maxWidth = "max-w-4xl", children }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-4 sm:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className={joinClasses("mx-auto my-6 w-full", maxWidth)}>
        <div
          className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl"
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          {children}
        </div>
      </div>
    </div>
  );
};

const UserManagement = () => {
  const hasFetchedRef = useRef(false);
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
  const [userDetailsDialogOpen, setUserDetailsDialogOpen] = useState(false);
  const [userDetailsTab, setUserDetailsTab] = useState(0);
  const [userPermissionDraft, setUserPermissionDraft] = useState([]);
  const [savingUserPermissions, setSavingUserPermissions] = useState(false);
  const [authSnapshot, setAuthSnapshot] = useState(() => ({
    permissions: getCurrentPermissions(),
  }));

  // User form state
  const [userForm, setUserForm] = useState({
    id: null,
    user_name: "",
    display_name: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone: "",
    gender: "",
    bio: "",
    department: "",
    status: "active",
    avatar: "",
    role: "",
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

  useEffect(() => {
    const syncAuthSnapshot = () => {
      setAuthSnapshot({
        permissions: getCurrentPermissions(),
      });
    };

    syncAuthSnapshot();
    window.addEventListener("storage", syncAuthSnapshot);
    window.addEventListener("hooks-rbac-updated", syncAuthSnapshot);
    return () => {
      window.removeEventListener("storage", syncAuthSnapshot);
      window.removeEventListener("hooks-rbac-updated", syncAuthSnapshot);
    };
  }, []);

  const hydrateFromStore = useCallback(() => {
    const nextUsers = listStoredUsers({ includeInactive: true });
    const nextRoles = listStoredRoles();
    const nextPermissions = listStoredPermissions();

    setUsers(nextUsers);
    setRoles(nextRoles);
    setPermissions(nextPermissions);
    setSelectedUser((current) => {
      if (!current) return current;
      return (
        nextUsers.find((user) => String(user.id) === String(current.id)) || current
      );
    });
  }, []);

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes, permissionsRes, activitiesRes] = await Promise.allSettled([
        axios.get(buildUrl("/api/users")),
        axios.get(buildUrl("/api/rbac/roles")),
        axios.get(buildUrl("/api/rbac/permissions")),
        axios.get(buildUrl("/api/rbac/activity?limit=200")),
      ]);

      const nextUsers =
        usersRes.status === "fulfilled"
          ? usersRes.value.data
          : listStoredUsers({ includeInactive: true });
      const nextRoles =
        rolesRes.status === "fulfilled"
          ? rolesRes.value.data
          : listStoredRoles();
      const nextPermissions =
        permissionsRes.status === "fulfilled"
          ? permissionsRes.value.data
          : listStoredPermissions();
      const nextActivities =
        activitiesRes.status === "fulfilled" ? activitiesRes.value.data : listActivities();
      const resolvedUsers = Array.isArray(nextUsers) ? nextUsers : [];
      const resolvedRoles = Array.isArray(nextRoles) ? nextRoles : [];
      const resolvedPermissions = Array.isArray(nextPermissions) ? nextPermissions : [];
      const resolvedActivities = Array.isArray(nextActivities) ? nextActivities : [];

      setUsers(resolvedUsers);
      setRoles(resolvedRoles);
      setPermissions(resolvedPermissions);
      setSelectedUser((current) => {
        if (!current) return current;
        return (
          resolvedUsers.find((user) => String(user.id) === String(current.id)) ||
          current
        );
      });
      syncRbacState({
        users: resolvedUsers,
        roles: resolvedRoles,
        permissions: resolvedPermissions,
        activities: resolvedActivities,
      });
      setError("");
    } catch (err) {
      console.error("Error fetching data:", err);
      const fallbackUsers = listStoredUsers({ includeInactive: true });
      setUsers(fallbackUsers);
      setRoles(listStoredRoles());
      setPermissions(listStoredPermissions());
      setSelectedUser((current) => {
        if (!current) return current;
        return (
          fallbackUsers.find((user) => String(user.id) === String(current.id)) ||
          current
        );
      });
      setError("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchData();
  }, []);

  useEffect(() => {
    hydrateFromStore();
    window.addEventListener("storage", hydrateFromStore);
    window.addEventListener("hooks-rbac-updated", hydrateFromStore);
    return () => {
      window.removeEventListener("storage", hydrateFromStore);
      window.removeEventListener("hooks-rbac-updated", hydrateFromStore);
    };
  }, [hydrateFromStore]);

  useEffect(() => {
    if (!error) return undefined;
    const timer = window.setTimeout(() => setError(""), 5000);
    return () => window.clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    if (!success) return undefined;
    const timer = window.setTimeout(() => setSuccess(""), 4000);
    return () => window.clearTimeout(timer);
  }, [success]);

  const canCreateUsers = hasAnyPermissions(
    ["users.create", "users.manage"],
    authSnapshot.permissions,
  );
  const canEditUsers = hasAnyPermissions(
    ["users.edit", "users.manage"],
    authSnapshot.permissions,
  );
  const canDeleteUsers = hasAnyPermissions(
    ["users.delete", "users.manage"],
    authSnapshot.permissions,
  );
  const canAssignRoles = hasAnyPermissions(
    ["users.assign", "roles.manage", "users.manage"],
    authSnapshot.permissions,
  );
  const canEditUserOverrides = hasAnyPermissions(
    ["users.edit", "users.manage"],
    authSnapshot.permissions,
  );

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
        display_name:
          user.display_name ||
          [user.first_name, user.last_name].filter(Boolean).join(" ") ||
          user.user_name ||
          "",
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        password: "",
        phone: user.phone || "",
        gender: user.gender || "",
        bio: user.bio || "",
        department: user.department || "",
        status: user.status || "active",
        avatar: user.avatar || "",
        role: user.role || roles[0]?.name || "",
      });
    } else {
      setUserForm({
        id: null,
        user_name: "",
        display_name: "",
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        phone: "",
        gender: "",
        bio: "",
        department: "",
        status: "active",
        avatar: "",
        role: roles[0]?.name || "",
      });
    }
    setUserDialogOpen(true);
  };

  // Handle user save
  const handleSaveUser = async () => {
    const canSave = userForm.id ? canEditUsers : canCreateUsers;
    if (!canSave) {
      setError("You do not have permission to perform this action.");
      return;
    }

    try {
      const payload = {
        ...userForm,
        display_name:
          userForm.display_name ||
          [userForm.first_name, userForm.last_name].filter(Boolean).join(" ") ||
          userForm.user_name ||
          userForm.email,
      };

      let savedUser = null;

      if (userForm.id) {
        try {
          const response = await axios.put(
            buildUrl(`/api/users/${userForm.id}`),
            payload,
          );
          savedUser = response?.data?.user || null;
        } catch {
          // fall back to local RBAC store
        }
        savedUser = upsertStoredUser(
          savedUser || { ...payload, id: userForm.id },
          {
            actor: getCurrentSessionUser()?.display_name || "System",
            actorRole: getCurrentSessionUser()?.role || "admin",
          },
        );
        setSuccess("User updated successfully!");
      } else {
        try {
          const response = await axios.post(
            buildUrl("/api/auth/register"),
            payload,
          );
          savedUser = response?.data?.user || null;
          if (savedUser?.id) {
            payload.id = savedUser.id;
          }
        } catch {
          // fall back to local RBAC store
        }
        savedUser = upsertStoredUser(
          savedUser || payload,
          {
            actor: getCurrentSessionUser()?.display_name || "System",
            actorRole: getCurrentSessionUser()?.role || "admin",
          },
        );
        setSuccess("User created successfully!");
      }

      setUserDialogOpen(false);
      fetchData();
      if (savedUser) {
        setSelectedUser(savedUser);
        setUserDetailsTab(userForm.id ? 0 : 1);
        setUserDetailsDialogOpen(true);
      }
    } catch (err) {
      console.error("Error saving user:", err);
      setError(getErrorMessage(err, "Failed to save user"));
    }
  };

  // Handle user delete
  const handleDeleteUser = async (id) => {
    if (!canDeleteUsers) {
      setError("You do not have permission to delete users.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      try {
        await axios.delete(buildUrl(`/api/users/${id}`));
      } catch {
        // fall back to local RBAC store
      }
      removeStoredUser(id, {
        actor: getCurrentSessionUser()?.display_name || "System",
        actorRole: getCurrentSessionUser()?.role || "admin",
      });
      setUsers((prev) => prev.filter((user) => user.id !== id));
      setSuccess("User deleted successfully!");
    } catch (err) {
      console.error("Error deleting user:", err);
      setError(getErrorMessage(err, "Failed to delete user"));
    }
  };

  // Open role assignment dialog
  const handleOpenRoleAssignment = (user) => {
    if (!canAssignRoles) {
      setError("You do not have permission to assign roles.");
      return;
    }

    setSelectedUser(user);
    setRoleAssignmentDialog(true);
  };

  const handleOpenUserDetails = (user) => {
    setSelectedUser(user);
    setUserDetailsDialogOpen(true);
    setUserDetailsTab(0);
  };

  useEffect(() => {
    if (!selectedUser) {
      setUserPermissionDraft([]);
      return;
    }
    setUserPermissionDraft(dedupePermissions(selectedUser.permissions_override));
  }, [selectedUser]);

  // Handle role assignment
  const handleAssignRole = async (roleId) => {
    if (!canAssignRoles) {
      setError("You do not have permission to assign roles.");
      return;
    }

    try {
      let nextUser = null;
      try {
        const response = await axios.post(buildUrl(`/api/rbac/users/${selectedUser.id}/roles`), {
          role_id: roleId,
        });
        if (response?.data?.user) {
          nextUser = upsertStoredUser(response.data.user, {
            actor: getCurrentSessionUser()?.display_name || "System",
            actorRole: getCurrentSessionUser()?.role || "admin",
          });
        }
      } catch {
        // fall back to local RBAC store
      }
      const nextUserFallback =
        selectedUser &&
        setStoredUserRole(
          selectedUser.id,
          roles.find((role) => String(role.id) === String(roleId))?.name ||
            roleId,
          {
            actor: getCurrentSessionUser()?.display_name || "System",
            actorRole: getCurrentSessionUser()?.role || "admin",
          },
        );
      if (nextUser) {
        setSelectedUser(nextUser);
      } else if (nextUserFallback) {
        setSelectedUser(nextUserFallback);
      }
      setSuccess("Role assigned successfully!");
      setRoleAssignmentDialog(false);
      fetchData();
    } catch (err) {
      console.error("Error assigning role:", err);
      setError(getErrorMessage(err, "Failed to assign role"));
    }
  };

  const roleLookup = useMemo(
    () =>
      new Map(
        roles.map((role) => [
          normalizeLookupKey(role.name || role.id || ""),
          role,
        ]),
      ),
    [roles],
  );

  const permissionMatrixConfig = useMemo(
    () => buildPermissionMatrixConfig(permissions),
    [permissions],
  );

  const selectedUserRoleSummary = useMemo(
    () => {
      if (!selectedUser) return null;
      const matchedRole = roleLookup.get(
        normalizeLookupKey(selectedUser.role || ""),
      );

      return {
        name: matchedRole?.name || selectedUser.role || "",
        title:
          selectedUser.role_title ||
          matchedRole?.title ||
          selectedUser.role ||
          "No role assigned",
        description:
          selectedUser.role_description ||
          matchedRole?.description ||
          (selectedUser.role
            ? "Role record not found in the current catalog."
            : "No role assigned to this user."),
        permissions: dedupePermissions(matchedRole?.permissions || []),
      };
    },
    [roleLookup, selectedUser],
  );

  const selectedUserRolePermissions = useMemo(
    () => dedupePermissions(selectedUserRoleSummary?.permissions),
    [selectedUserRoleSummary],
  );

  const selectedUserOverridePermissions = useMemo(
    () => dedupePermissions(selectedUser?.permissions_override),
    [selectedUser],
  );

  const selectedUserEffectivePermissions = useMemo(
    () => {
      if (!selectedUser) return [];

      const serverPermissions = dedupePermissions(
        selectedUser.effective_permissions || selectedUser.permissions,
      );
      if (serverPermissions.length) return serverPermissions;

      return dedupePermissions([
        ...selectedUserRolePermissions,
        ...selectedUserOverridePermissions,
        ...getUserPermissionSummary(selectedUser),
      ]);
    },
    [
      selectedUser,
      selectedUserOverridePermissions,
      selectedUserRolePermissions,
    ],
  );

  const selectedUserPreviewPermissions = useMemo(
    () => {
      if (!selectedUser) return [];
      if (selectedUserRolePermissions.length) {
        return dedupePermissions([
          ...selectedUserRolePermissions,
          ...userPermissionDraft,
        ]);
      }
      return dedupePermissions([
        ...selectedUserEffectivePermissions,
        ...userPermissionDraft,
      ]);
    },
    [
      selectedUser,
      selectedUserEffectivePermissions,
      selectedUserRolePermissions,
      userPermissionDraft,
    ],
  );

  const hasPendingPermissionChanges = useMemo(
    () =>
      getPermissionSignature(userPermissionDraft) !==
      getPermissionSignature(selectedUserOverridePermissions),
    [selectedUserOverridePermissions, userPermissionDraft],
  );

  const displayedEffectivePermissions = useMemo(
    () =>
      hasPendingPermissionChanges
        ? selectedUserPreviewPermissions
        : selectedUserEffectivePermissions,
    [
      hasPendingPermissionChanges,
      selectedUserEffectivePermissions,
      selectedUserPreviewPermissions,
    ],
  );

  const handleToggleUserPermissionOverride = (permissionCode, checked) => {
    setUserPermissionDraft((prev) => {
      const current = dedupePermissions(prev);
      if (checked) return dedupePermissions([...current, permissionCode]);
      return current.filter((permission) => permission !== permissionCode);
    });
  };

  const handleSaveUserPermissions = async () => {
    if (!canEditUserOverrides) {
      setError("You do not have permission to update user permissions.");
      return;
    }

    if (!selectedUser?.id) return;
    try {
      setSavingUserPermissions(true);
      const overridePermissions = dedupePermissions(userPermissionDraft);
      let nextUser = null;

      try {
        const response = await axios.put(
          buildUrl(`/api/users/${selectedUser.id}`),
          {
            permissions_override: overridePermissions,
          },
        );
        nextUser = response?.data?.user || null;
      } catch {
        // fall back to local RBAC store
      }

      const storedUser =
        nextUser
          ? upsertStoredUser(nextUser, {
              actor: getCurrentSessionUser()?.display_name || "System",
              actorRole: getCurrentSessionUser()?.role || "admin",
            })
          : setStoredUserPermissions(selectedUser.id, overridePermissions, {
              actor: getCurrentSessionUser()?.display_name || "System",
              actorRole: getCurrentSessionUser()?.role || "admin",
              note: "Updated user permission overrides.",
            });

      if (storedUser) {
        setSelectedUser(storedUser);
      }

      setSuccess("User permissions updated successfully!");
      fetchData();
    } catch (err) {
      console.error("Error saving user permissions:", err);
      setError(getErrorMessage(err, "Failed to save user permissions"));
    } finally {
      setSavingUserPermissions(false);
    }
  };

  const selectedUserActivity = useMemo(() => {
    if (!selectedUser) return [];
    const label = String(
      selectedUser.display_name ||
        selectedUser.first_name ||
        selectedUser.user_name ||
        selectedUser.email ||
        "",
    )
      .trim()
      .toLowerCase();
    return listActivities()
      .filter((entry) => {
        const target = String(entry.target || "").toLowerCase();
        const actor = String(entry.actor || "").toLowerCase();
        return target.includes(label) || actor.includes(label);
      })
      .slice(0, 8);
  }, [selectedUser]);

  const getRoleChipColor = (roleName) => {
    const roleRecord = roleLookup.get(normalizeLookupKey(roleName));
    const rolePermissions = Array.isArray(roleRecord?.permissions)
      ? roleRecord.permissions
      : [];
    if (
      rolePermissions.some((permission) => String(permission || "").trim() === "*")
    ) {
      return "error";
    }
    if (
      rolePermissions.some((permission) =>
        String(permission || "").trim().toLowerCase().endsWith(".manage"),
      )
    ) {
      return "warning";
    }
    if (rolePermissions.length > 0) return "primary";
    return "default";
  };

  const managementSummary = useMemo(
    () => [
      {
        label: "Directory",
        value: users.length,
        hint: "Accounts available in the admin workspace",
      },
      {
        label: "Active Users",
        value: users.filter((user) => user.status !== "inactive").length,
        hint: "Currently enabled identities",
      },
      {
        label: "Role Sets",
        value: roles.length,
        hint: "Access profiles available for assignment",
      },
      {
        label: "Permission Catalog",
        value: permissions.length,
        hint: "Server-backed action rules in this workspace",
      },
    ],
    [permissions.length, roles.length, users],
  );

  // Render user row
  const renderUserRow = (user) => {
    const roleTone = getRoleChipColor(user.role);

    return (
      <tr key={user.id} className="border-t border-slate-200 text-sm transition hover:bg-slate-50/80">
        <td className="px-4 py-4">
          <div className="flex min-w-[220px] items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-sm font-semibold text-blue-700">
              {getUserInitial(user)}
            </div>
            <div className="min-w-0">
              <div className="truncate font-semibold text-slate-900">
                {getDisplayName(user)}
              </div>
              <div className="mt-1 flex items-center gap-2 truncate text-xs text-slate-500">
                <FaEnvelope className="shrink-0 text-[10px]" />
                <span className="truncate">{user.email || "No email configured"}</span>
              </div>
            </div>
          </div>
        </td>
        <td className="px-4 py-4 text-slate-600">
          <div className="flex items-center gap-2">
            <FaPhone className="text-xs text-slate-400" />
            <span>{user.phone || "N/A"}</span>
          </div>
        </td>
        <td className="px-4 py-4">
          <span
            className={joinClasses(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
              getRoleBadgeClass(roleTone),
            )}
          >
            {roleTone === "error" ? (
              <FaUserShield className="text-[11px]" />
            ) : (
              <FaUserTag className="text-[11px]" />
            )}
            {user.role || "No role"}
          </span>
        </td>
        <td className="px-4 py-4 text-slate-600">
          <div className="flex items-center gap-2">
            <FaCalendar className="text-xs text-slate-400" />
            <span>{formatDateLabel(user.created_at)}</span>
          </div>
        </td>
        <td className="px-4 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              title="View details"
              onClick={() => handleOpenUserDetails(user)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-sky-700 transition hover:border-sky-200 hover:bg-sky-50"
            >
              <FaEye className="text-sm" />
            </button>
            {canEditUsers ? (
              <button
                type="button"
                title="Edit user"
                onClick={() => handleOpenUserDialog(user)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-blue-700 transition hover:border-blue-200 hover:bg-blue-50"
              >
                <FaEdit className="text-sm" />
              </button>
            ) : null}
            {canAssignRoles ? (
              <button
                type="button"
                title="Assign roles"
                onClick={() => handleOpenRoleAssignment(user)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-violet-700 transition hover:border-violet-200 hover:bg-violet-50"
              >
                <FaUserShield className="text-sm" />
              </button>
            ) : null}
            {canDeleteUsers ? (
              <button
                type="button"
                title="Delete user"
                onClick={() => handleDeleteUser(user.id)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-rose-700 transition hover:border-rose-200 hover:bg-rose-50"
              >
                <FaTrash className="text-sm" />
              </button>
            ) : null}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="page-shell page-stack py-2 sm:py-3">
      <div className="fixed right-4 top-4 z-40 space-y-3">
        {error ? (
          <div className="w-full max-w-sm rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm shadow-lg">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <FaShieldAlt className="text-sm" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-rose-700">Action failed</p>
                <p className="mt-1 text-rose-600">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => setError("")}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close error message"
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
        {success ? (
          <div className="w-full max-w-sm rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm shadow-lg">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <FaUserShield className="text-sm" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-emerald-700">Saved</p>
                <p className="mt-1 text-emerald-600">{success}</p>
              </div>
              <button
                type="button"
                onClick={() => setSuccess("")}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close success message"
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <section
        className={joinClasses(
          PANEL_CLASS,
          "bg-slate-50",
        )}
      >
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="page-kicker">Administration</p>
              <h1 className="page-title mt-2">User & Access Management</h1>
              <p className="page-copy mt-3 max-w-2xl">
                Manage people, role coverage, and permission overrides from one
                Tailwind-styled workspace built for quick access reviews.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full border border-blue-200 bg-white/90 px-3 py-1 text-xs font-semibold text-blue-700">
                Server-backed permissions
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-600">
                Tailwind admin UI
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {managementSummary.map((item) => (
              <div key={item.label} className={CARD_CLASS}>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                  {item.label}
                </p>
                <p className="mt-3 text-3xl font-bold tracking-[-0.04em] text-slate-900">
                  {item.value}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.hint}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={joinClasses(PANEL_CLASS, "p-2")}>
        <div className="flex flex-wrap gap-2">
          {MANAGEMENT_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = selectedTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedTab(tab.id)}
                className={joinClasses(
                  TAB_BUTTON_CLASS,
                  active
                    ? "bg-blue-600 text-white hover:text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                <Icon className="text-sm" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {selectedTab === 0 ? (
        <section className={PANEL_CLASS}>
          <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <FaUser className="text-slate-500" />
                User Management
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {users.length} account{users.length === 1 ? "" : "s"} in the
                current workspace.
              </p>
            </div>
            {canCreateUsers ? (
              <button
                type="button"
                onClick={() => handleOpenUserDialog()}
                className={PRIMARY_BUTTON_CLASS}
              >
                <FaPlus className="text-xs" />
                Add User
              </button>
            ) : null}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-50">
                <tr className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <th className="px-4 py-3 sm:px-6">User</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3 sm:px-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-sm text-slate-500"
                    >
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-sm text-slate-500"
                    >
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map(renderUserRow)
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {selectedTab === 1 ? (
        <section className={PANEL_CLASS}>
          <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <FaUsers className="text-slate-500" />
              Role Management
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {roles.length} role profile{roles.length === 1 ? "" : "s"} with
              inherited access defaults.
            </p>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3 sm:p-6">
            {roles.map((role) => {
              const roleTone = getRoleChipColor(role.name);
              const rolePermissionCount = Array.isArray(role.permissions)
                ? role.permissions.length
                : 0;

              return (
                <article key={role.id || role.name} className={CARD_CLASS}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {role.title || role.name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {role.description || "No description configured for this role."}
                      </p>
                    </div>
                    <span
                      className={joinClasses(
                        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                        getRoleBadgeClass(roleTone),
                      )}
                    >
                      {roleTone === "error" ? (
                        <FaUserShield className="text-[11px]" />
                      ) : (
                        <FaUserTag className="text-[11px]" />
                      )}
                      {role.name}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Permission Count
                      </p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">
                        {rolePermissionCount}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Created
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {formatDateLabel(role.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1">
                      <FaKey className="text-[10px]" />
                      ID: {role.id || role.name}
                    </span>
                    {role.built_in ? (
                      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-semibold text-amber-700">
                        Built-in
                      </span>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {selectedTab === 2 ? (
        <section className={PANEL_CLASS}>
          <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <FaLock className="text-slate-500" />
              System Permissions
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {permissions.length} permission rule
              {permissions.length === 1 ? "" : "s"} available to roles and user
              overrides.
            </p>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3 sm:p-6">
            {permissions.map((permission) => {
              const permissionCode = permission.name || permission.id || "permission";
              const permissionParts = String(permissionCode).split(".");
              const permissionModule =
                permission.module || permissionParts[0] || "general";
              const permissionAction =
                permission.action ||
                permissionParts[permissionParts.length - 1] ||
                "rule";

              return (
                <article
                  key={permission.id || permission.name}
                  className={CARD_CLASS}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                      <FaShieldAlt className="text-base" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="break-words text-base font-bold text-slate-900">
                        {permissionCode}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {permission.description || "No description available."}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      Module: {permissionModule}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      Action: {permissionAction}
                    </span>
                  </div>

                  <div className="mt-4 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1">
                      <FaKey className="text-[10px]" />
                      ID: {permission.id || permissionCode}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      <ModalShell
        open={userDialogOpen}
        onClose={() => setUserDialogOpen(false)}
        maxWidth="max-w-5xl"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSaveUser();
          }}
        >
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-5 text-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-bold">
                  <FaUser className="text-sm" />
                  {userForm.id ? "Edit User" : "Create New User"}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Configure core identity details and the default role for this
                  account.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUserDialogOpen(false)}
                className={SECONDARY_BUTTON_CLASS}
              >
                Close
              </button>
            </div>
          </div>

          <div className="grid gap-5 p-6 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Username
              </span>
              <input
                name="user_name"
                value={userForm.user_name}
                onChange={handleUserInputChange}
                className={FIELD_CLASS}
                placeholder="e.g. jdoe"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Email
              </span>
              <input
                name="email"
                type="email"
                value={userForm.email}
                onChange={handleUserInputChange}
                className={FIELD_CLASS}
                placeholder="name@company.com"
                required
                disabled={!!userForm.id}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                First Name
              </span>
              <input
                name="first_name"
                value={userForm.first_name}
                onChange={handleUserInputChange}
                className={FIELD_CLASS}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Last Name
              </span>
              <input
                name="last_name"
                value={userForm.last_name}
                onChange={handleUserInputChange}
                className={FIELD_CLASS}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Password
              </span>
              <input
                name="password"
                type="password"
                value={userForm.password}
                onChange={handleUserInputChange}
                className={FIELD_CLASS}
                required={!userForm.id}
                placeholder={userForm.id ? "Leave blank to keep current password" : ""}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Phone
              </span>
              <input
                name="phone"
                value={userForm.phone}
                onChange={handleUserInputChange}
                className={FIELD_CLASS}
                placeholder="+91 98765 43210"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Gender
              </span>
              <select
                name="gender"
                value={userForm.gender}
                onChange={handleUserInputChange}
                className={FIELD_CLASS}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Default Role
              </span>
              <select
                name="role"
                value={userForm.role}
                onChange={handleUserInputChange}
                className={FIELD_CLASS}
              >
                {roles.length ? (
                  roles.map((role) => (
                    <option key={role.id || role.name} value={role.name || role.id}>
                      {role.title || role.name}
                    </option>
                  ))
                ) : (
                  <option value="">No roles available</option>
                )}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Display Name
              </span>
              <input
                name="display_name"
                value={userForm.display_name}
                onChange={handleUserInputChange}
                className={FIELD_CLASS}
              />
              <span className="mt-2 block text-xs text-slate-500">
                Name shown in bylines and author dropdowns.
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Department
              </span>
              <input
                name="department"
                value={userForm.department}
                onChange={handleUserInputChange}
                className={FIELD_CLASS}
              />
            </label>

            <label className="block md:col-span-1">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Status
              </span>
              <select
                name="status"
                value={userForm.status}
                onChange={handleUserInputChange}
                className={FIELD_CLASS}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Bio / Notes
              </span>
              <textarea
                name="bio"
                value={userForm.bio}
                onChange={handleUserInputChange}
                className={TEXTAREA_CLASS}
                rows={4}
                placeholder="Add onboarding context, role notes, or profile details."
              />
            </label>
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 px-6 py-5">
            <button
              type="button"
              onClick={() => setUserDialogOpen(false)}
              className={SECONDARY_BUTTON_CLASS}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!userForm.email || (!userForm.id && !userForm.password)}
              className={PRIMARY_BUTTON_CLASS}
            >
              {userForm.id ? "Update User" : "Create User"}
            </button>
          </div>
        </form>
      </ModalShell>

      <ModalShell
        open={roleAssignmentDialog}
        onClose={() => setRoleAssignmentDialog(false)}
        maxWidth="max-w-3xl"
      >
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
                <FaUserShield className="text-slate-500" />
                Assign Role to {getDisplayName(selectedUser)}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Choose the access profile this user should inherit by default.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRoleAssignmentDialog(false)}
              className={SECONDARY_BUTTON_CLASS}
            >
              Close
            </button>
          </div>
        </div>

        <div className="space-y-3 p-6">
          {roles.map((role) => {
            const roleTone = getRoleChipColor(role.name);

            return (
              <div
                key={role.id || role.name}
                className="flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-base font-bold text-slate-900">
                      {role.title || role.name}
                    </h3>
                    <span
                      className={joinClasses(
                        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                        getRoleBadgeClass(roleTone),
                      )}
                    >
                      {role.name}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {role.description || "No description configured for this role."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleAssignRole(role.id)}
                  className={PRIMARY_BUTTON_CLASS}
                >
                  <FaUserTag className="text-xs" />
                  Assign
                </button>
              </div>
            );
          })}
        </div>
      </ModalShell>

      <ModalShell
        open={userDetailsDialogOpen}
        onClose={() => setUserDetailsDialogOpen(false)}
        maxWidth="max-w-6xl"
      >
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-6 text-slate-900">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-xl font-bold text-blue-700">
                {getUserInitial(selectedUser)}
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-[-0.03em]">
                  {getDisplayName(selectedUser)}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedUser?.email || "No email configured"}
                </p>
              </div>
            </div>
            <span
              className={joinClasses(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                getRoleBadgeClass(getRoleChipColor(selectedUser?.role)),
              )}
            >
              {getRoleChipColor(selectedUser?.role) === "error" ? (
                <FaUserShield className="text-[11px]" />
              ) : (
                <FaUserTag className="text-[11px]" />
              )}
              {selectedUser?.role || "No role"}
            </span>
          </div>
        </div>

        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex flex-wrap gap-2">
            {USER_DETAILS_TABS.map((tabLabel, index) => (
              <button
                key={tabLabel}
                type="button"
                onClick={() => setUserDetailsTab(index)}
                className={joinClasses(
                  TAB_BUTTON_CLASS,
                  userDetailsTab === index
                    ? "bg-blue-600 text-white hover:text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                {tabLabel}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6 p-6">
          {userDetailsTab === 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <section className={CARD_CLASS}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Identity
                </p>
                <h3 className="mt-3 text-xl font-bold text-slate-900">
                  {getDisplayName(selectedUser)}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  @{getUserHandle(selectedUser)}
                </p>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {selectedUser?.bio || "No bio available."}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Phone
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {selectedUser?.phone || "Not provided"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Department
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {selectedUser?.department || "General"}
                    </p>
                  </div>
                </div>
              </section>

              <section className={CARD_CLASS}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Access Summary
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {selectedUserRoleSummary?.title ||
                      selectedUser?.role ||
                      "No role"}
                  </span>
                  <span
                    className={joinClasses(
                      "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                      getStatusBadgeClass(selectedUser?.status),
                    )}
                  >
                    {selectedUser?.status || "active"}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {selectedUser?.department || "General"}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {selectedUserRoleSummary?.description ||
                    "This user inherits permissions from the currently assigned role configuration."}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Created
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {formatDateTimeLabel(selectedUser?.created_at)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Last Login
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {formatDateTimeLabel(selectedUser?.last_login)}
                    </p>
                  </div>
                </div>
              </section>
            </div>
          ) : null}

          {userDetailsTab === 1 ? (
            <div>
              <p className="text-sm leading-7 text-slate-600">
                This view separates role defaults from user-specific overrides so
                the access UI matches the underlying RBAC model for this account.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  Role defaults: {selectedUserRolePermissions.length}
                </span>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                  User overrides: {userPermissionDraft.length}
                </span>
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Effective access: {displayedEffectivePermissions.length}
                </span>
              </div>

              <div className="mt-5 space-y-5">
                <section className={CARD_CLASS}>
                  <PermissionsMatrix
                    permissions={selectedUserRolePermissions}
                    readOnly
                    modules={permissionMatrixConfig.modules}
                    actions={permissionMatrixConfig.actions}
                    title="Role Permissions"
                    description="Permissions inherited from the currently assigned role."
                  />
                </section>

                <section className={CARD_CLASS}>
                  <PermissionsMatrix
                    permissions={userPermissionDraft}
                    onToggle={
                      canEditUserOverrides
                        ? handleToggleUserPermissionOverride
                        : undefined
                    }
                    readOnly={!canEditUserOverrides}
                    modules={permissionMatrixConfig.modules}
                    actions={permissionMatrixConfig.actions}
                    title="User Permission Overrides"
                    description="Extra permissions stored directly on this user record. These are sent to the backend as `permissions_override`."
                  />
                </section>

                <section className={CARD_CLASS}>
                  <PermissionsMatrix
                    permissions={displayedEffectivePermissions}
                    readOnly
                    modules={permissionMatrixConfig.modules}
                    actions={permissionMatrixConfig.actions}
                    title={
                      hasPendingPermissionChanges
                        ? "Effective Permissions Preview"
                        : "Effective Permissions"
                    }
                    description={
                      hasPendingPermissionChanges
                        ? "Preview of role permissions plus the unsaved override changes in this dialog."
                        : "Server-backed effective permissions returned for this user."
                    }
                  />
                </section>
              </div>

              {canEditUserOverrides ? (
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setUserPermissionDraft(selectedUserOverridePermissions)
                    }
                    disabled={!hasPendingPermissionChanges}
                    className={SECONDARY_BUTTON_CLASS}
                  >
                    Reset Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserPermissionDraft([])}
                    disabled={!userPermissionDraft.length}
                    className={SECONDARY_BUTTON_CLASS}
                  >
                    Clear Overrides
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveUserPermissions}
                    disabled={
                      savingUserPermissions ||
                      !selectedUser?.id ||
                      !hasPendingPermissionChanges
                    }
                    className={PRIMARY_BUTTON_CLASS}
                  >
                    {savingUserPermissions ? "Saving..." : "Save Overrides"}
                  </button>
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-2">
                {displayedEffectivePermissions.length ? (
                  displayedEffectivePermissions.map((permission) => (
                    <span
                      key={permission}
                      className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
                    >
                      {permission}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    No effective permission data found.
                  </p>
                )}
              </div>
            </div>
          ) : null}

          {userDetailsTab === 2 ? (
            <div>
              <p className="text-sm leading-7 text-slate-600">
                Recent activity associated with this user.
              </p>

              <div className="mt-5 space-y-3">
                {selectedUserActivity.length ? (
                  selectedUserActivity.map((entry) => (
                    <article
                      key={entry.id}
                      className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">
                            {entry.module || "system"} | {entry.action || "activity"}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {entry.note || entry.target || "No details"}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          {formatDateTimeLabel(entry.at)}
                        </span>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
                    No activity logged for this user yet.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 px-6 py-5">
          <button
            type="button"
            onClick={() => setUserDetailsDialogOpen(false)}
            className={SECONDARY_BUTTON_CLASS}
          >
            Close
          </button>
          {canEditUsers ? (
            <button
              type="button"
              onClick={() => {
                setUserDetailsDialogOpen(false);
                if (selectedUser) {
                  handleOpenUserDialog(selectedUser);
                }
              }}
              className={SECONDARY_BUTTON_CLASS}
            >
              Edit User
            </button>
          ) : null}
          {canAssignRoles ? (
            <button
              type="button"
              onClick={() => {
                setUserDetailsDialogOpen(false);
                if (selectedUser) {
                  handleOpenRoleAssignment(selectedUser);
                }
              }}
              className={PRIMARY_BUTTON_CLASS}
            >
              Change Role
            </button>
          ) : null}
        </div>
      </ModalShell>
    </div>
  );
};

export default UserManagement;
