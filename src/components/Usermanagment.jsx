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
import { useToast } from "./Ui/ToastProvider";
import {
  RBAC_ACTIONS,
  expandPermissionSet,
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
  FaChevronLeft,
  FaChevronRight,
  FaEllipsisV,
  FaFilter,
  FaSearch,
  FaSyncAlt,
  FaUpload,
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

const expandPermissions = (values = []) =>
  expandPermissionSet(dedupePermissions(values));

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

const mergeRoleCatalog = (remoteRoles = [], localRoles = []) => {
  const roleMap = new Map();
  [...localRoles, ...remoteRoles].forEach((role) => {
    const normalizedName = normalizeLookupKey(role?.name || role?.id || "");
    if (!normalizedName) return;
    const previous = roleMap.get(normalizedName) || {};
    roleMap.set(normalizedName, {
      ...previous,
      ...role,
      id: role.id ?? previous.id ?? normalizedName,
      name: normalizedName,
      title: String(role.title || previous.title || normalizedName).trim(),
      description: String(role.description || previous.description || "").trim(),
      permissions: dedupePermissions(role.permissions || previous.permissions),
      effective_permissions: dedupePermissions(
        role.effective_permissions || previous.effective_permissions || role.permissions,
      ),
      built_in: Boolean(role.built_in || previous.built_in),
      source: role.source || previous.source || "local",
    });
  });

  return Array.from(roleMap.values()).sort((a, b) => {
    if (Boolean(a?.built_in) !== Boolean(b?.built_in)) {
      return Boolean(a?.built_in) ? -1 : 1;
    }
    return String(a?.title || a?.name || "").localeCompare(
      String(b?.title || b?.name || ""),
    );
  });
};

const mergePermissionCatalog = (remotePermissions = [], localPermissions = []) => {
  const permissionMap = new Map();
  [...localPermissions, ...remotePermissions].forEach((permission) => {
    const key = normalizeLookupKey(permission?.name || permission?.id || "");
    if (!key) return;
    const previous = permissionMap.get(key) || {};
    permissionMap.set(key, {
      ...previous,
      ...permission,
      id: permission.id ?? previous.id ?? key,
      name: key,
      description: String(permission.description || previous.description || "").trim(),
      module: String(permission.module || previous.module || "").trim(),
      module_label: String(permission.module_label || previous.module_label || "").trim(),
      action: String(permission.action || previous.action || "").trim(),
      built_in: Boolean(permission.built_in || previous.built_in),
      source: permission.source || previous.source || "local",
    });
  });

  return Array.from(permissionMap.values()).sort((a, b) =>
    String(a.name || a.id || "").localeCompare(String(b.name || b.id || "")),
  );
};

const joinClasses = (...classes) => classes.filter(Boolean).join(" ");

const PAGE_CLASS =
  "mx-auto w-full max-w-[1720px] space-y-4 bg-[radial-gradient(circle_at_top,rgba(76,53,242,0.035),transparent_28%),linear-gradient(180deg,#ffffff_0%,#fcfdff_100%)] px-2 py-3 sm:px-3 md:px-4";
const PANEL_CLASS =
  "overflow-hidden rounded-md border border-slate-200 bg-white shadow-none";
const CARD_CLASS =
  "rounded-md border border-slate-200 bg-white p-4 shadow-none";
const FIELD_CLASS =
  "h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#345CFF] focus:bg-white focus:ring-0 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";
const TEXTAREA_CLASS = joinClasses(FIELD_CLASS, "min-h-[112px] resize-y");
const PRIMARY_BUTTON_CLASS =
  "inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#4C35F2] bg-[#4C35F2] px-4 text-sm font-semibold text-white shadow-none transition hover:bg-[#3f2fcb] hover:text-white disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-300";
const SECONDARY_BUTTON_CLASS =
  "inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-none transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:text-slate-400";
const TAB_BUTTON_CLASS =
  "inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold shadow-none transition";
const TABLE_ICON_BUTTON_CLASS =
  "inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-none transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700";
const TABLE_DANGER_BUTTON_CLASS =
  "inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-none transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700";

const MANAGEMENT_TABS = [
  { id: 0, label: "Users", icon: FaUser },
  { id: 1, label: "Roles", icon: FaUsers },
  { id: 2, label: "Permissions", icon: FaLock },
];

const USER_DETAILS_TABS = ["Profile", "Permissions", "Activity"];
const USER_PAGE_SIZE_OPTIONS = [5, 10, 20];

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

const getCreatedAtValue = (item = {}) =>
  item?.created_at || item?.createdAt || item?.created || null;

const countRecentEntries = (items = [], days = 30) => {
  const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
  return (Array.isArray(items) ? items : []).filter((item) => {
    const date = new Date(getCreatedAtValue(item));
    return !Number.isNaN(date.getTime()) && date.getTime() >= threshold;
  }).length;
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
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
};

const getRoleIconClass = (tone) => {
  switch (tone) {
    case "error":
      return "bg-rose-50 text-rose-600";
    case "warning":
      return "bg-amber-50 text-amber-600";
    case "primary":
      return "bg-blue-50 text-blue-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
};

const getStatusBadgeClass = (status) =>
  String(status || "").toLowerCase() === "inactive"
    ? "border-slate-200 bg-slate-50 text-slate-600"
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
          className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-none"
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
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [roleAssignmentDialog, setRoleAssignmentDialog] = useState(false);
  const [userDetailsDialogOpen, setUserDetailsDialogOpen] = useState(false);
  const [userDetailsTab, setUserDetailsTab] = useState(0);
  const [userPermissionDraft, setUserPermissionDraft] = useState([]);
  const [savingUserPermissions, setSavingUserPermissions] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(10);
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
      setRoles(mergeRoleCatalog(resolvedRoles, listStoredRoles()));
      setPermissions(mergePermissionCatalog(resolvedPermissions, listStoredPermissions()));
      setSelectedUser((current) => {
        if (!current) return current;
        return (
          resolvedUsers.find((user) => String(user.id) === String(current.id)) ||
          current
        );
      });
      syncRbacState({
        users: resolvedUsers,
        roles: mergeRoleCatalog(resolvedRoles, listStoredRoles()),
        permissions: mergePermissionCatalog(
          resolvedPermissions,
          listStoredPermissions(),
        ),
        activities: resolvedActivities,
      });
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
      toast.warning(
        "You do not have permission to perform this action.",
        "Permission required",
      );
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
        toast.success("User updated successfully!", "Saved");
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
        toast.success("User created successfully!", "Saved");
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
      toast.error(getErrorMessage(err, "Failed to save user"), "Action failed");
    }
  };

  // Handle user delete
  const handleDeleteUser = async (id) => {
    if (!canDeleteUsers) {
      toast.warning(
        "You do not have permission to delete users.",
        "Permission required",
      );
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
      toast.success("User deleted successfully!", "Deleted");
    } catch (err) {
      console.error("Error deleting user:", err);
      toast.error(
        getErrorMessage(err, "Failed to delete user"),
        "Action failed",
      );
    }
  };

  // Open role assignment dialog
  const handleOpenRoleAssignment = (user) => {
    if (!canAssignRoles) {
      toast.warning(
        "You do not have permission to assign roles.",
        "Permission required",
      );
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
      toast.warning(
        "You do not have permission to assign roles.",
        "Permission required",
      );
      return;
    }
    if (!selectedUser?.id) {
      toast.warning("Select a user before assigning a role.", "Selection needed");
      return;
    }

    try {
      const selectedRole =
        roles.find((role) => String(role.id) === String(roleId)) || null;
      const roleName = selectedRole?.name || roleId;
      let assignedUser = null;

      try {
        const response = await axios.post(buildUrl(`/api/rbac/users/${selectedUser.id}/roles`), {
          role_id: roleId,
        });
        if (response?.data?.user) {
          assignedUser = upsertStoredUser(response.data.user, {
            actor: getCurrentSessionUser()?.display_name || "System",
            actorRole: getCurrentSessionUser()?.role || "admin",
          });
        }
      } catch {
        // fall back to local RBAC store
      }

      if (!assignedUser) {
        assignedUser = setStoredUserRole(
          selectedUser.id,
          roleName,
          {
            actor: getCurrentSessionUser()?.display_name || "System",
            actorRole: getCurrentSessionUser()?.role || "admin",
          },
        );
      }

      if (assignedUser) {
        setSelectedUser(assignedUser);
        setUsers((prev) =>
          prev.map((user) =>
            String(user.id) === String(assignedUser.id) ? assignedUser : user,
          ),
        );
      }

      toast.success("Role assigned successfully!", "Saved");
      setRoleAssignmentDialog(false);
      fetchData();
    } catch (err) {
      console.error("Error assigning role:", err);
      toast.error(
        getErrorMessage(err, "Failed to assign role"),
        "Action failed",
      );
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
    () => expandPermissions(selectedUserRoleSummary?.permissions),
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
      if (serverPermissions.length) return expandPermissions(serverPermissions);

      return expandPermissions([
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
        return expandPermissions([
          ...selectedUserRolePermissions,
          ...userPermissionDraft,
        ]);
      }
      return expandPermissions([
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
      const normalizedCode = normalizePermissionToken(permissionCode);
      const current = expandPermissions(prev);
      if (checked) return dedupePermissions([...current, normalizedCode]);
      return current.filter((permission) => permission !== normalizedCode);
    });
  };

  const handleSaveUserPermissions = async () => {
    if (!canEditUserOverrides) {
      toast.warning(
        "You do not have permission to update user permissions.",
        "Permission required",
      );
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

      toast.success("User permissions updated successfully!", "Saved");
      fetchData();
    } catch (err) {
      console.error("Error saving user permissions:", err);
      toast.error(
        getErrorMessage(err, "Failed to save user permissions"),
        "Action failed",
      );
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
        icon: FaUsers,
        iconClass: "bg-blue-50 text-blue-700",
        recent: countRecentEntries(users),
      },
      {
        label: "Active Users",
        value: users.filter((user) => user.status !== "inactive").length,
        hint: "Currently enabled identities",
        icon: FaUser,
        iconClass: "bg-emerald-50 text-emerald-700",
        recent: countRecentEntries(
          users.filter((user) => user.status !== "inactive"),
        ),
      },
      {
        label: "Role Sets",
        value: roles.length,
        hint: "Access profiles available for assignment",
        icon: FaShieldAlt,
        iconClass: "bg-violet-50 text-violet-700",
        recent: countRecentEntries(roles),
      },
      {
        label: "Permission Catalog",
        value: permissions.length,
        hint: "Server-backed action rules in this workspace",
        icon: FaLock,
        iconClass: "bg-orange-50 text-orange-700",
        recent: countRecentEntries(permissions),
      },
    ],
    [permissions.length, roles.length, users],
  );

  const filteredUsers = useMemo(() => {
    const query = String(userSearch || "").trim().toLowerCase();

    return users.filter((user) => {
      const roleName = normalizeLookupKey(user.role || "");
      const statusValue = normalizeLookupKey(user.status || "active");
      const haystack = [
        getDisplayName(user),
        getUserHandle(user),
        user.email,
        user.phone,
        user.role,
        user.role_title,
        user.department,
        user.status,
      ]
        .map((value) => String(value || "").trim().toLowerCase())
        .join(" ");

      if (query && !haystack.includes(query)) return false;
      if (userRoleFilter !== "all" && roleName !== userRoleFilter) return false;
      if (userStatusFilter !== "all" && statusValue !== userStatusFilter)
        return false;
      return true;
    });
  }, [userRoleFilter, userSearch, userStatusFilter, users]);

  const userPageCount = Math.max(
    1,
    Math.ceil(filteredUsers.length / userPageSize),
  );

  useEffect(() => {
    setUserPage((page) => Math.min(Math.max(1, page), userPageCount));
  }, [userPageCount]);

  useEffect(() => {
    setUserPage(1);
  }, [userRoleFilter, userSearch, userStatusFilter, userPageSize]);

  const visibleUsers = useMemo(() => {
    const start = (userPage - 1) * userPageSize;
    return filteredUsers.slice(start, start + userPageSize);
  }, [filteredUsers, userPage, userPageSize]);

  const userStart = filteredUsers.length
    ? (userPage - 1) * userPageSize + 1
    : 0;
  const userEnd = filteredUsers.length
    ? Math.min(userPage * userPageSize, filteredUsers.length)
    : 0;

  const userPaginationItems = useMemo(() => {
    if (userPageCount <= 5) {
      return Array.from({ length: userPageCount }, (_, index) => index + 1);
    }

    const items = [1];
    const left = Math.max(2, userPage - 1);
    const right = Math.min(userPageCount - 1, userPage + 1);

    if (left > 2) items.push("ellipsis-left");
    for (let page = left; page <= right; page += 1) {
      if (!items.includes(page)) items.push(page);
    }
    if (right < userPageCount - 1) items.push("ellipsis-right");
    items.push(userPageCount);
    return items;
  }, [userPage, userPageCount]);

  const clearUserFilters = useCallback(() => {
    setUserSearch("");
    setUserRoleFilter("all");
    setUserStatusFilter("all");
    setUserPage(1);
  }, []);

  // Render user row
  const renderUserRow = (user) => {
    const roleTone = getRoleChipColor(user.role);

    return (
      <tr key={user.id} className="border-t border-slate-200 text-sm transition hover:bg-slate-50/70">
        <td className="px-4 py-4">
          <div className="flex min-w-[220px] items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-sm font-semibold text-blue-700">
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
              className={TABLE_ICON_BUTTON_CLASS}
            >
              <FaEye className="text-sm" />
            </button>
            {canEditUsers ? (
              <button
                type="button"
                title="Edit user"
                onClick={() => handleOpenUserDialog(user)}
                className={TABLE_ICON_BUTTON_CLASS}
              >
                <FaEdit className="text-sm" />
              </button>
            ) : null}
            {canAssignRoles ? (
              <button
                type="button"
                title="Assign roles"
                onClick={() => handleOpenRoleAssignment(user)}
                className={TABLE_ICON_BUTTON_CLASS}
              >
                <FaUserShield className="text-sm" />
              </button>
            ) : null}
            {canDeleteUsers ? (
              <button
                type="button"
                title="Delete user"
                onClick={() => handleDeleteUser(user.id)}
                className={TABLE_DANGER_BUTTON_CLASS}
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
    <div className={PAGE_CLASS}>
      <div className="border-b border-slate-200 pb-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold text-slate-950">
                User & Access Management
              </h1>
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-violet-200 bg-violet-50 text-violet-600 shadow-none">
                <FaUserShield className="text-base" />
              </div>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Manage people, role coverage, and permission overrides across the
              platform.
            </p>
          </div>

          {canCreateUsers ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                className={SECONDARY_BUTTON_CLASS}
                title="Import users"
              >
                <FaUpload className="text-sm" />
                <span>Import Users</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenUserDialog()}
                className={PRIMARY_BUTTON_CLASS}
              >
                <FaPlus className="text-sm" />
                <span>Create User</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <section>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {managementSummary.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className={joinClasses(
                  CARD_CLASS,
                  "flex min-h-[112px] items-start gap-4",
                )}
              >
                <div
                  className={joinClasses(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-md",
                    item.iconClass,
                  )}
                >
                  <Icon className="text-lg" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">
                    {item.value}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {item.hint}
                  </p>
                  <p className="mt-3 text-xs font-semibold text-emerald-600">
                    {item.recent
                      ? `+ ${item.recent} this month`
                      : "No recent additions"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className={joinClasses(PANEL_CLASS, "p-2 shadow-none")}>
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
                    ? "bg-[#4C35F2] text-white hover:text-white"
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
          <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
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
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold">
                {filteredUsers.length} visible
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold">
                {roles.length} roles
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold">
                {permissions.length} permissions
              </span>
            </div>
          </div>

          <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.65fr)_minmax(180px,0.7fr)_minmax(180px,0.7fr)_auto_auto]">
              <label className="relative block">
                <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
                <input
                  type="search"
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                  className={joinClasses(FIELD_CLASS, "pl-11")}
                  placeholder="Search users..."
                />
              </label>

              <label className="block">
                <span className="sr-only">Role filter</span>
                <select
                  value={userRoleFilter}
                  onChange={(event) => setUserRoleFilter(event.target.value)}
                  className={FIELD_CLASS}
                >
                  <option value="all">Role: All</option>
                  {roles.map((role) => (
                    <option
                      key={role.id || role.name}
                      value={normalizeLookupKey(role.name || role.id || "")}
                    >
                      {role.title || role.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="sr-only">Status filter</span>
                <select
                  value={userStatusFilter}
                  onChange={(event) => setUserStatusFilter(event.target.value)}
                  className={FIELD_CLASS}
                >
                  <option value="all">Status: All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>

              <button
                type="button"
                onClick={clearUserFilters}
                className={SECONDARY_BUTTON_CLASS}
                title="Reset filters"
              >
                <FaFilter className="text-xs" />
                Filters
              </button>

              <button
                type="button"
                onClick={() => fetchData()}
                className={SECONDARY_BUTTON_CLASS}
                title="Refresh users"
              >
                <FaSyncAlt className={loading ? "animate-spin text-xs" : "text-xs"} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-50">
                <tr className="text-xs font-semibold uppercase text-slate-500">
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
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-sm text-slate-500"
                    >
                      {users.length === 0
                        ? "No users found."
                        : "No users match the current search or filters."}
                    </td>
                  </tr>
                ) : (
                  visibleUsers.map(renderUserRow)
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm text-slate-500">
              Showing {userStart} to {userEnd} of {filteredUsers.length} user
              {filteredUsers.length === 1 ? "" : "s"}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white p-1">
                <button
                  type="button"
                  onClick={() => setUserPage((page) => Math.max(1, page - 1))}
                  disabled={userPage <= 1 || filteredUsers.length === 0}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <FaChevronLeft className="text-xs" />
                </button>

                {userPaginationItems.map((item) =>
                  typeof item === "number" ? (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setUserPage(item)}
                      className={joinClasses(
                        "inline-flex h-9 min-w-9 items-center justify-center rounded-md px-3 text-sm font-semibold transition",
                        userPage === item
                          ? "bg-[#4C35F2] text-white shadow-none"
                          : "text-slate-600 hover:bg-slate-100",
                      )}
                    >
                      {item}
                    </button>
                  ) : (
                    <span
                      key={item}
                      className="inline-flex h-9 min-w-9 items-center justify-center rounded-md px-3 text-sm font-semibold text-slate-400"
                    >
                      ...
                    </span>
                  ),
                )}

                <button
                  type="button"
                  onClick={() =>
                    setUserPage((page) => Math.min(userPageCount, page + 1))
                  }
                  disabled={userPage >= userPageCount || filteredUsers.length === 0}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Next page"
                >
                  <FaChevronRight className="text-xs" />
                </button>
              </div>

              <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
                <span>Per page</span>
                <select
                  value={userPageSize}
                  onChange={(event) =>
                    setUserPageSize(Number(event.target.value) || 10)
                  }
                  className={joinClasses(FIELD_CLASS, "min-w-[110px] w-auto py-2.5")}
                >
                  {USER_PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size} / page
                    </option>
                  ))}
                </select>
              </label>
            </div>
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
              const rolePermissionCount = expandPermissions(role.permissions).length;

              return (
                <article
                  key={role.id || role.name}
                  className={joinClasses(CARD_CLASS, "relative")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div
                        className={joinClasses(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
                          getRoleIconClass(roleTone),
                        )}
                      >
                        {roleTone === "error" ? (
                          <FaUserShield className="text-base" />
                        ) : (
                          <FaUserTag className="text-base" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold text-slate-900">
                          {role.title || role.name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {role.description ||
                            "No description configured for this role."}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <span
                          className={joinClasses(
                            "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                            getRoleBadgeClass(roleTone),
                          )}
                        >
                          {role.name}
                        </span>
                        {role.built_in ? (
                          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase text-emerald-700">
                            Built-in
                          </span>
                        ) : null}
                      </div>
                      <span className="text-slate-400">
                        <FaEllipsisV className="text-xs" />
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase text-slate-500">
                        Permission Count
                      </p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">
                        {rolePermissionCount}
                      </p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase text-slate-500">
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

          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4 sm:p-6">
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
                  className={joinClasses(CARD_CLASS, "relative")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                      <FaShieldAlt className="text-base" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-base font-bold text-slate-900">
                        {permissionCode}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {permission.description || "No description available."}
                      </p>
                    </div>
                    <span className="text-slate-400">
                      <FaEllipsisV className="text-xs" />
                    </span>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      Module: {permissionModule}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
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
          <div className="border-b border-slate-200 bg-white px-6 py-5 text-slate-900">
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
            const rolePermissionCount = expandPermissions(role.permissions).length;

            return (
              <div
                key={role.id || role.name}
                className="flex flex-col gap-4 rounded-md border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
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
                  <p className="mt-3 text-xs font-semibold uppercase text-slate-400">
                    {rolePermissionCount} permissions
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
        <div className="border-b border-slate-200 bg-white px-6 py-6 text-slate-900">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">
                {getUserInitial(selectedUser)}
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {getDisplayName(selectedUser)}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedUser?.email || "No email configured"}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-3 lg:items-end">
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
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Status: {selectedUser?.status || "active"}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                  Joined: {formatDateLabel(selectedUser?.created_at)}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                  Last login: {formatDateTimeLabel(selectedUser?.last_login)}
                </span>
              </div>
            </div>
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
                    ? "bg-[#4C35F2] text-white hover:text-white"
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
                <p className="text-xs font-semibold uppercase text-slate-500">
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
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Phone
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {selectedUser?.phone || "Not provided"}
                    </p>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Department
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {selectedUser?.department || "General"}
                    </p>
                  </div>
                </div>
              </section>

              <section className={CARD_CLASS}>
                <p className="text-xs font-semibold uppercase text-slate-500">
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
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                    {selectedUser?.department || "General"}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {selectedUserRoleSummary?.description ||
                    "This user inherits permissions from the currently assigned role configuration."}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Created
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {formatDateTimeLabel(selectedUser?.created_at)}
                    </p>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase text-slate-500">
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
                  User overrides: {expandPermissions(userPermissionDraft).length}
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
                      className="rounded-md border border-slate-200 bg-slate-50 p-4"
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
                        <span className="shrink-0 text-xs font-semibold uppercase text-slate-500">
                          {formatDateTimeLabel(entry.at)}
                        </span>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
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


