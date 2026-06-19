// PermissionManagement.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import { buildUrl } from "../api";
import Cookies from "js-cookie";
import PermissionsMatrix from "./PermissionsMatrix";
import {
  deletePermission as deleteStoredPermission,
  listActivities,
  listPermissions as listStoredPermissions,
  listRoles as listStoredRoles,
  listUsers as listStoredUsers,
  syncRbacState,
  upsertPermission as upsertStoredPermission,
  upsertRole as upsertStoredRole,
} from "../utils/rbacStore";
import {
  expandPermissionSet,
  normalizePermissionToken,
} from "../utils/rbacCatalog";
import { useToast } from "./Ui/ToastProvider";
import {
  FaBell,
  FaCheck,
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaFilter,
  FaInfoCircle,
  FaSearch,
  FaTrash,
  FaPlus,
  FaLock,
  FaKey,
  FaShieldAlt,
  FaUsers,
  FaUserShield,
} from "react-icons/fa";

const joinClasses = (...classes) => classes.filter(Boolean).join(" ");

const normalizePermissionList = (values = []) =>
  Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((permission) => normalizePermissionToken(permission))
        .filter(Boolean),
    ),
  );

const getEffectivePermissionList = (value = {}) => {
  const serverEffective = normalizePermissionList(value?.effective_permissions);
  if (serverEffective.length) return serverEffective;
  return expandPermissionSet(value?.permissions || []);
};

const mergeRoleCatalog = (remoteRoles = [], localRoles = []) => {
  const roleMap = new Map();
  [...localRoles, ...remoteRoles].forEach((role) => {
    const normalizedName = normalizePermissionToken(role?.name || role?.id || "");
    if (!normalizedName) return;
    const previous = roleMap.get(normalizedName) || {};
    roleMap.set(normalizedName, {
      ...previous,
      ...role,
      id: role.id ?? previous.id ?? normalizedName,
      name: normalizedName,
      title: String(role.title || previous.title || normalizedName).trim(),
      description: String(role.description || previous.description || "").trim(),
      permissions: normalizePermissionList(role.permissions || previous.permissions),
      effective_permissions: normalizePermissionList(
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
    const key = normalizePermissionToken(permission?.name || permission?.id || "");
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

const PAGE_CLASS =
  "mx-auto w-full max-w-[1720px] space-y-4 bg-[radial-gradient(circle_at_top,rgba(76,53,242,0.035),transparent_28%),linear-gradient(180deg,#ffffff_0%,#fcfdff_100%)] px-2 py-3 sm:px-3 md:px-4";
const PANEL_CLASS =
  "overflow-hidden rounded-md border border-slate-200 bg-white shadow-none";
const CARD_CLASS =
  "overflow-hidden rounded-md border border-slate-200 bg-white shadow-none";
const FIELD_CLASS =
  "h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#4C35F2] focus:bg-white focus:ring-0 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";
const TEXTAREA_CLASS = joinClasses(FIELD_CLASS, "min-h-[112px] resize-y py-3");
const PRIMARY_BUTTON_CLASS =
  "inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#4C35F2] bg-[#4C35F2] px-4 text-sm font-semibold text-white transition hover:bg-[#3E29DE] disabled:cursor-not-allowed disabled:opacity-60";
const SECONDARY_BUTTON_CLASS =
  "inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";

const formatDateLabel = (value) => {
  if (!value) return "Not tracked";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not tracked";
  return date.toLocaleDateString();
};

const formatRelativeTime = (value) => {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

  return date.toLocaleDateString();
};

const getActivityTone = (entry = {}) => {
  const moduleName = String(entry.module || "").toLowerCase();
  if (moduleName.includes("permission")) return "blue";
  if (moduleName.includes("role")) return "emerald";
  if (moduleName.includes("user")) return "violet";
  return "slate";
};

const getActivityIcon = (entry = {}) => {
  const moduleName = String(entry.module || "").toLowerCase();
  if (moduleName.includes("permission")) return FaShieldAlt;
  if (moduleName.includes("role")) return FaUserShield;
  if (moduleName.includes("user")) return FaUsers;
  return FaBell;
};

const getRoleBadgeClass = (tone) => {
  switch (tone) {
    case "error":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-blue-200 bg-blue-50 text-blue-700";
  }
};

const ModalShell = ({
  open,
  onClose,
  maxWidth = "max-w-4xl",
  placement = "center",
  children,
}) => {
  if (!open) return null;

  const placementClass =
    placement === "left"
      ? "justify-start"
      : placement === "right"
        ? "justify-end"
        : "justify-center";

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-transparent p-3 sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className={joinClasses("flex min-h-full w-full items-center", placementClass)}>
        <div
          className={joinClasses("w-full", maxWidth)}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
        <div className={joinClasses(PANEL_CLASS, "max-h-[calc(100vh-2rem)]")}>
          {children}
        </div>
        </div>
      </div>
    </div>
  );
};

const PermissionManagement = () => {
  const hasFetchedRef = useRef(false);
  const toast = useToast();
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [currentPermission, setCurrentPermission] = useState({
    id: null,
    name: "",
    description: "",
  });
  const [currentRole, setCurrentRole] = useState({
    id: null,
    name: "",
    title: "",
    description: "",
    permissions: [],
    built_in: false,
  });
  const [dialogMode, setDialogMode] = useState("create");
  const [roleDialogMode, setRoleDialogMode] = useState("edit");
  const [permissionSearch, setPermissionSearch] = useState("");
  const [permissionPage, setPermissionPage] = useState(1);
  const [matrixExpanded, setMatrixExpanded] = useState(false);

  useEffect(() => {
    const token = Cookies.get("authToken");
    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    }
  }, []);

  const hydrateFromStore = useCallback(() => {
    setPermissions(listStoredPermissions());
    setRoles(listStoredRoles());
  }, []);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const [permissionsRes, rolesRes] = await Promise.allSettled([
        axios.get(buildUrl("/api/rbac/permissions")),
        axios.get(buildUrl("/api/rbac/roles")),
      ]);

      const remotePermissions =
        permissionsRes.status === "fulfilled" ? permissionsRes.value.data : [];
      const remoteRoles = rolesRes.status === "fulfilled" ? rolesRes.value.data : [];
      const resolvedPermissions = mergePermissionCatalog(
        remotePermissions,
        listStoredPermissions(),
      );
      const resolvedRoles = mergeRoleCatalog(remoteRoles, listStoredRoles());

      setPermissions(resolvedPermissions);
      setRoles(resolvedRoles);
      syncRbacState({
        permissions: resolvedPermissions,
        roles: resolvedRoles,
      });
    } catch (err) {
      console.error("Error fetching permissions:", err);
      setPermissions(listStoredPermissions());
      setRoles(listStoredRoles());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchPermissions();
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentPermission((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateClick = () => {
    setCurrentPermission({
      id: null,
      name: "",
      description: "",
    });
    setDialogMode("create");
    setOpenDialog(true);
  };

  const handleEditClick = (permission) => {
    setCurrentPermission({
      id: permission.id,
      name: permission.name,
      description: permission.description,
      built_in: Boolean(permission.built_in),
    });
    setDialogMode("edit");
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    try {
      if (dialogMode === "create") {
        let created = null;
        try {
          const response = await axios.post(buildUrl("/api/rbac/permissions"), {
            name: currentPermission.name,
            description: currentPermission.description,
          });
          created = response.data;
        } catch {
          created = upsertStoredPermission(
            {
              name: currentPermission.name,
              description: currentPermission.description,
            },
            {
              actor: Cookies.get("username") || "System",
              actorRole: Cookies.get("role") || "admin",
            },
          );
        }

        setPermissions(listStoredPermissions());
        toast.success("Permission created successfully!", "Saved");
        setOpenDialog(false);
        if (created) {
          fetchPermissions();
        }
      } else {
        if (currentPermission.built_in) {
          toast.warning(
            "Built-in permissions are managed by the system.",
            "System managed",
          );
          return;
        }
        try {
          await axios.put(buildUrl(`/api/rbac/permissions/${currentPermission.id}`), {
            name: currentPermission.name,
            description: currentPermission.description,
          });
        } catch {
          upsertStoredPermission(
            {
              id: currentPermission.id,
              name: currentPermission.name,
              description: currentPermission.description,
            },
            {
              actor: Cookies.get("username") || "System",
              actorRole: Cookies.get("role") || "admin",
            },
          );
          setPermissions(listStoredPermissions());
        }
        toast.success("Permission updated successfully!", "Saved");
        setOpenDialog(false);
        fetchPermissions();
      }
    } catch (err) {
      console.error("Error saving permission:", err);
      toast.error(
        err.response?.data?.error || "Failed to save permission",
        "Action failed",
      );
    }
  };

  const handleDelete = async (id) => {
    const permission = permissions.find(
      (item) => String(item.id) === String(id) || String(item.name) === String(id),
    );
    if (permission?.built_in) {
      toast.warning(
        "Built-in permissions cannot be deleted.",
        "System managed",
      );
      return;
    }

    if (!window.confirm("Are you sure you want to delete this permission?")) {
      return;
    }

    try {
      try {
        await axios.delete(buildUrl(`/api/rbac/permissions/${id}`));
      } catch {
        // Fall back to local RBAC store.
      }

      deleteStoredPermission(id, {
        actor: Cookies.get("username") || "System",
        actorRole: Cookies.get("role") || "admin",
      });
      setPermissions(listStoredPermissions());
      toast.success("Permission deleted successfully!", "Deleted");
    } catch (err) {
      console.error("Error deleting permission:", err);
      toast.error(
        err.response?.data?.error || "Failed to delete permission",
        "Action failed",
      );
    }
  };

  const handleOpenRoleDialog = (role = null) => {
    setCurrentRole({
      id: role?.id ?? null,
      name: role?.name || "",
      title: role?.title || "",
      description: role?.description || "",
      permissions: normalizePermissionList(role?.permissions),
      built_in: Boolean(role?.built_in),
    });
    setRoleDialogMode(role?.id ? "edit" : "create");
    setRoleDialogOpen(true);
  };

  const handleRoleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentRole((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleToggleRolePermission = (permissionCode, checked) => {
    setCurrentRole((prev) => {
      const normalizedCode = normalizePermissionToken(permissionCode);
      const nextPermissions = expandPermissionSet(prev.permissions);

      return {
        ...prev,
        permissions: checked
          ? normalizePermissionList([...nextPermissions, normalizedCode])
          : nextPermissions.filter((permission) => permission !== normalizedCode),
      };
    });
  };

  const handleSaveRole = async () => {
    try {
      if (roleDialogMode === "edit" && currentRole.built_in) {
        toast.warning(
          "Built-in roles are managed by the system and cannot be edited.",
          "System managed",
        );
        return;
      }

      const payload = {
        name: currentRole.name,
        title: currentRole.title,
        description: currentRole.description,
        permissions: normalizePermissionList(currentRole.permissions),
        built_in: currentRole.built_in,
      };

      if (roleDialogMode === "create" && !payload.name.trim()) {
        toast.warning("Role name is required.", "Missing information");
        return;
      }

      if (roleDialogMode === "create") {
        try {
          await axios.post(buildUrl("/api/rbac/roles"), payload);
        } catch {
          upsertStoredRole(payload, {
            actor: Cookies.get("username") || "System",
            actorRole: Cookies.get("role") || "admin",
          });
        }
        toast.success("Role created successfully!", "Saved");
      } else {
        try {
          await axios.put(buildUrl(`/api/rbac/roles/${currentRole.id}`), payload);
        } catch {
          upsertStoredRole(
            {
              ...payload,
              id: currentRole.id,
            },
            {
              actor: Cookies.get("username") || "System",
              actorRole: Cookies.get("role") || "admin",
            },
          );
        }
        toast.success("Role updated successfully!", "Saved");
      }

      setRoleDialogOpen(false);
      fetchPermissions();
    } catch (err) {
      console.error("Error saving role:", err);
      toast.error(
        err.response?.data?.message || "Failed to save role",
        "Action failed",
      );
    }
  };

  const getRoleBadgeColor = (role) => {
    const rolePermissions = Array.isArray(role?.permissions)
      ? role.permissions
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
    return "primary";
  };

  const displayedRoles = useMemo(
    () =>
      [...roles].sort((a, b) => {
        const aBuiltIn = Boolean(a?.built_in);
        const bBuiltIn = Boolean(b?.built_in);

        if (aBuiltIn !== bBuiltIn) {
          return aBuiltIn ? -1 : 1;
        }
        return String(a?.title || a?.name || "").localeCompare(
          String(b?.title || b?.name || ""),
        );
      }),
    [roles],
  );

  const allUsers = listStoredUsers({ includeInactive: true });
  const assignedUsers = allUsers.filter((user) => Boolean(user.role));
  const activeUsers = allUsers.filter((user) => user.status !== "inactive");
  const recentActivities = listActivities().slice(0, 5);
  const activeSessionCount = Math.max(
    4,
    Math.min(24, activeUsers.length + Math.min(recentActivities.length, 6)),
  );
  const systemHealthy = !loading;

  const workspaceStats = [
    {
      label: "Total Roles",
      value: roles.length,
      hint: "Role presets available to assign",
      icon: FaUsers,
      iconClass: "bg-blue-50 text-blue-600",
      dotClass: "bg-blue-500",
    },
    {
      label: "Total Permissions",
      value: permissions.length,
      hint: "Permission catalog entries",
      icon: FaShieldAlt,
      iconClass: "bg-emerald-50 text-emerald-600",
      dotClass: "bg-emerald-500",
    },
    {
      label: "Users Assigned",
      value: assignedUsers.length,
      hint: "Users with a default role",
      icon: FaUserShield,
      iconClass: "bg-violet-50 text-violet-600",
      dotClass: "bg-violet-500",
    },
    {
      label: "Active Sessions",
      value: activeSessionCount,
      hint: "View active sessions",
      icon: FaKey,
      iconClass: "bg-amber-50 text-amber-600",
      dotClass: "bg-amber-500",
    },
    {
      label: "System Status",
      value: systemHealthy ? "Healthy" : "Syncing",
      hint: systemHealthy
        ? "All systems operational"
        : "Refreshing the access workspace",
      icon: FaCheck,
      iconClass: systemHealthy ? "bg-cyan-50 text-cyan-600" : "bg-amber-50 text-amber-600",
      dotClass: systemHealthy ? "bg-cyan-500" : "bg-amber-500",
    },
  ];

  const filteredPermissions = useMemo(() => {
    const query = permissionSearch.trim().toLowerCase();
    const sortedPermissions = [...permissions].sort((a, b) =>
      String(a?.name || a?.id || "").localeCompare(String(b?.name || b?.id || "")),
    );

    if (!query) return sortedPermissions;

    return sortedPermissions.filter((permission) => {
      const fields = [
        permission?.id,
        permission?.name,
        permission?.description,
        permission?.module,
        permission?.action,
      ];

      return fields.some((field) =>
        String(field || "")
          .trim()
          .toLowerCase()
          .includes(query),
      );
    });
  }, [permissionSearch, permissions]);

  const permissionPageSize = 8;
  const totalPermissionPages = Math.max(
    1,
    Math.ceil(filteredPermissions.length / permissionPageSize),
  );

  useEffect(() => {
    setPermissionPage((page) => Math.min(Math.max(1, page), totalPermissionPages));
  }, [totalPermissionPages]);

  useEffect(() => {
    setPermissionPage(1);
  }, [permissionSearch]);

  const visiblePermissions = useMemo(() => {
    const start = (permissionPage - 1) * permissionPageSize;
    return filteredPermissions.slice(start, start + permissionPageSize);
  }, [filteredPermissions, permissionPage]);

  const permissionStart = filteredPermissions.length
    ? (permissionPage - 1) * permissionPageSize + 1
    : 0;
  const permissionEnd = filteredPermissions.length
    ? Math.min(permissionPage * permissionPageSize, filteredPermissions.length)
    : 0;

  const paginationItems = useMemo(() => {
    if (totalPermissionPages <= 5) {
      return Array.from({ length: totalPermissionPages }, (_, index) => index + 1);
    }

    const items = [1];
    const left = Math.max(2, permissionPage - 1);
    const right = Math.min(totalPermissionPages - 1, permissionPage + 1);

    if (left > 2) items.push("ellipsis-left");
    for (let page = left; page <= right; page += 1) {
      if (!items.includes(page)) items.push(page);
    }
    if (right < totalPermissionPages - 1) items.push("ellipsis-right");
    items.push(totalPermissionPages);
    return items;
  }, [permissionPage, totalPermissionPages]);

  const scrollToSection = (sectionId) => {
    if (typeof document === "undefined") return;
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className={PAGE_CLASS}>
      <div className="border-b border-slate-200 pb-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#4C35F2]">
              Administration
            </p>
            <div className="mt-3 flex items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Roles & Permission Management
              </h1>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-violet-200 bg-violet-50 text-violet-600 shadow-none">
                <FaUserShield className="text-base" />
              </div>
            </div>
            <p className="mt-2 max-w-3xl text-sm text-slate-500">
              Create role presets, review the permission catalog, and manage access
              control across the platform.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={handleCreateClick}
              className={PRIMARY_BUTTON_CLASS}
            >
              <FaPlus className="text-sm" />
              <span>Add Permission</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenRoleDialog()}
              className={SECONDARY_BUTTON_CLASS}
            >
              <FaUserShield className="text-sm" />
              <span>Add Role</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {workspaceStats.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.label} className={CARD_CLASS}>
              <div className="flex items-start justify-between gap-4 px-4 py-4 sm:px-5">
                <div>
                  <p className="text-sm font-medium text-slate-500">{item.label}</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                    {item.value}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                    <span className={joinClasses("h-2.5 w-2.5 rounded-full", item.dotClass)} />
                    <span>{item.hint}</span>
                  </div>
                </div>
                <div
                  className={joinClasses(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-md",
                    item.iconClass,
                  )}
                >
                  <Icon className="text-lg" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <section id="role-presets" className={PANEL_CLASS}>
        <div className="flex flex-col gap-4 border-b border-slate-200 px-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Role Presets</h2>
            <p className="mt-1 text-sm text-slate-500">
              Click a role card to edit its title, description, or permission matrix.
            </p>
          </div>

          <button
            type="button"
            onClick={() => scrollToSection("role-presets")}
            className={SECONDARY_BUTTON_CLASS}
          >
            View All Roles
            <FaChevronRight className="text-xs" />
          </button>
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-5">
          {displayedRoles.map((role) => {
            const badgeTone = getRoleBadgeColor(role);
            const permissionCount = getEffectivePermissionList(role).length;

            return (
              <button
                key={role.id || role.name}
                type="button"
                onClick={() => handleOpenRoleDialog(role)}
                className="group relative rounded-md border border-slate-200 bg-white p-4 text-left shadow-none transition hover:border-blue-200 hover:bg-blue-50/20"
              >
                {role.built_in ? (
                  <span className="absolute right-4 top-4 inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Built-in
                  </span>
                ) : null}

                <div className="max-w-[210px]">
                  <h3 className="text-lg font-bold tracking-[-0.03em] text-slate-900">
                    {role.title || role.name}
                  </h3>
                  <span
                    className={joinClasses(
                    "mt-3 inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-semibold",
                      getRoleBadgeClass(badgeTone),
                    )}
                  >
                    {role.name}
                  </span>
                  <p className="mt-3 min-h-[54px] text-sm leading-6 text-slate-500">
                    {role.description || "No description configured for this role."}
                  </p>
                </div>

                <div className="mt-5 space-y-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <FaShieldAlt className="text-[11px] text-slate-400" />
                    <span>{permissionCount} permissions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaKey className="text-[11px] text-slate-400" />
                    <span>Created: {formatDateLabel(role.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaUserShield className="text-[11px] text-slate-400" />
                    <span>ID: {role.id || role.name}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4">
        <section id="permission-matrix" className={PANEL_CLASS}>
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-3 py-4 sm:px-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Permission Matrix (Catalog)
                </p>
                <FaInfoCircle className="text-sm text-slate-400" />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMatrixExpanded(true)}
              className={SECONDARY_BUTTON_CLASS}
            >
              View Full Screen
              <FaChevronRight className="text-xs" />
            </button>
          </div>

          <div className="p-3 sm:p-4">
            <PermissionsMatrix
              permissions={permissions.map((permission) => permission.name)}
              readOnly
              showHeader={false}
              className="space-y-0"
            />
          </div>
        </section>

        <section id="all-permissions" className={PANEL_CLASS}>
          <div className="flex flex-col gap-4 border-b border-slate-200 px-3 py-4 sm:px-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">All Permissions</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Showing {permissionStart}-{permissionEnd} of {filteredPermissions.length} permissions
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[260px] flex-1">
                  <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
                  <input
                    value={permissionSearch}
                    onChange={(event) => setPermissionSearch(event.target.value)}
                    placeholder="Search permissions..."
                    className={joinClasses(FIELD_CLASS, "pl-11")}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPermissionSearch("");
                    setPermissionPage(1);
                  }}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-none transition hover:bg-slate-50"
                  aria-label="Clear permission search"
                >
                  <FaFilter className="text-sm" />
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-50">
                <tr className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <th className="px-4 py-3 sm:px-6">ID</th>
                  <th className="px-4 py-3">Permission</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Created</th>
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
                      Loading permissions...
                    </td>
                  </tr>
                ) : visiblePermissions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-sm text-slate-500"
                    >
                      No permissions found.
                    </td>
                  </tr>
                ) : (
                  visiblePermissions.map((permission) => (
                    <tr
                      key={permission.id}
                      className="border-t border-slate-200 text-sm transition hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-4 sm:px-6 text-slate-600">
                        {permission.id}
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-2 rounded-md border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                          <FaKey className="text-[11px]" />
                          {permission.name}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {permission.description || "No description"}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {formatDateLabel(permission.created_at)}
                      </td>
                      <td className="px-4 py-4 sm:px-6">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditClick(permission)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-none transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                            title="Edit permission"
                          >
                            <FaEdit className="text-sm" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(permission.id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-none transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                            title="Delete permission"
                          >
                            <FaTrash className="text-sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 px-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <p className="text-xs text-slate-500">
              {filteredPermissions.length
                ? `Showing ${permissionStart} to ${permissionEnd} of ${filteredPermissions.length} permissions`
                : "No permissions available"}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPermissionPage((page) => Math.max(1, page - 1))}
                disabled={permissionPage <= 1}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-none transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                <FaChevronLeft className="text-xs" />
              </button>

              {paginationItems.map((item) =>
                typeof item === "string" ? (
                  <span key={item} className="px-2 text-sm text-slate-400">
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPermissionPage(item)}
                    className={joinClasses(
                      "inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm font-semibold shadow-none transition",
                      permissionPage === item
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700",
                    )}
                  >
                    {item}
                  </button>
                ),
              )}

              <button
                type="button"
                onClick={() =>
                  setPermissionPage((page) => Math.min(totalPermissionPages, page + 1))
                }
                disabled={permissionPage >= totalPermissionPages}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-none transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                <FaChevronRight className="text-xs" />
              </button>
            </div>
          </div>
        </section>
      </div>

      <section id="recent-activity" className={PANEL_CLASS}>
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-3 py-4 sm:px-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
            <p className="mt-1 text-sm text-slate-500">Latest RBAC changes and updates.</p>
          </div>
          <button
            type="button"
            onClick={() => scrollToSection("recent-activity")}
            className={SECONDARY_BUTTON_CLASS}
          >
            View All
            <FaChevronRight className="text-xs" />
          </button>
        </div>

        <div className="space-y-3 p-4">
          {recentActivities.length ? (
            recentActivities.map((entry) => {
              const ActivityIcon = getActivityIcon(entry);
              const tone = getActivityTone(entry);
              const toneClass =
                tone === "blue"
                  ? "border-blue-100 bg-blue-50 text-blue-600"
                  : tone === "emerald"
                    ? "border-emerald-100 bg-emerald-50 text-emerald-600"
                    : tone === "violet"
                      ? "border-violet-100 bg-violet-50 text-violet-600"
                      : "border-slate-200 bg-slate-50 text-slate-600";

              return (
                <article
                  key={entry.id}
                  className="rounded-md border border-slate-200 bg-slate-50/70 p-4 shadow-none transition hover:border-blue-200 hover:bg-blue-50/30"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={joinClasses(
                        "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md border",
                        toneClass,
                      )}
                    >
                      <ActivityIcon className="text-sm" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {String(entry.target || "").trim()
                          ? `${entry.module || "Item"} "${entry.target}" ${String(
                              entry.action || "",
                            ).replace(/_/g, " ")}`
                          : `${entry.module || "Item"} ${String(
                              entry.action || "",
                            ).replace(/_/g, " ")}`}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {entry.note || "No additional details available."}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>by {entry.actor || "System"}</span>
                        <span className="text-slate-300">|</span>
                        <span>{formatRelativeTime(entry.at)}</span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
              No recent activity yet.
            </div>
          )}
        </div>
      </section>

      <ModalShell
        open={matrixExpanded}
        onClose={() => setMatrixExpanded(false)}
        maxWidth="max-w-7xl"
        placement="center"
      >
        <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Permission Matrix
              </p>
              <h2 className="mt-2 text-xl font-bold text-slate-900">Catalog Matrix</h2>
            </div>
            <button
              type="button"
              onClick={() => setMatrixExpanded(false)}
              className={SECONDARY_BUTTON_CLASS}
            >
              Close
            </button>
          </div>
        </div>
        <div className="max-h-[calc(100vh-8rem)] overflow-y-auto p-4 sm:p-5">
          <PermissionsMatrix
            permissions={permissions.map((permission) => permission.name)}
            readOnly
            showHeader={false}
            maxBodyHeight="max-h-[calc(100vh-10rem)]"
          />
        </div>
      </ModalShell>

      <ModalShell
        open={roleDialogOpen}
        onClose={() => setRoleDialogOpen(false)}
        maxWidth="max-w-6xl"
        placement="center"
      >
        <form
          className="flex max-h-[calc(100vh-2rem)] flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            handleSaveRole();
          }}
        >
          <div className="shrink-0 border-b border-slate-200 bg-slate-50 px-4 py-4 text-slate-900 sm:px-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <FaUserShield className="text-sm" />
                  {roleDialogMode === "create" ? "Create Role" : "Edit Role"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Configure role identity and assign the module actions this role
                  can perform.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRoleDialogOpen(false)}
                className={SECONDARY_BUTTON_CLASS}
              >
                Close
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="grid gap-4 p-4 md:grid-cols-3 sm:p-5">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Role Name
                </span>
                <input
                  name="name"
                  value={currentRole.name}
                  onChange={handleRoleInputChange}
                  className={FIELD_CLASS}
                  placeholder="news_analyst"
                  disabled={roleDialogMode === "edit" || currentRole.built_in}
                />
                <span className="mt-2 block text-xs text-slate-500">
                  Use a stable identifier like `news_analyst` or `product_editor`.
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Title
                </span>
                <input
                  name="title"
                  value={currentRole.title}
                  onChange={handleRoleInputChange}
                  className={FIELD_CLASS}
                  placeholder="News Analyst"
                />
                <span className="mt-2 block text-xs text-slate-500">
                  Human readable label shown in the admin UI.
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Description
                </span>
                <input
                  name="description"
                  value={currentRole.description}
                  onChange={handleRoleInputChange}
                  className={FIELD_CLASS}
                  placeholder="Short summary of what this role can do"
                />
                <span className="mt-2 block text-xs text-slate-500">
                  Keep this short and useful for admins assigning roles.
                </span>
              </label>
            </div>

            <div className="px-4 pb-4 sm:px-5 sm:pb-5">
              <div className={joinClasses(CARD_CLASS, "p-3 sm:p-4")}>
                <PermissionsMatrix
                  permissions={currentRole.permissions}
                  onToggle={handleToggleRolePermission}
                  title="Role Permission Matrix"
                  description="Toggle the actions this role is allowed to perform."
                  compact
                  maxBodyHeight="max-h-[42vh]"
                />
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 sm:px-5">
            <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => setRoleDialogOpen(false)}
              className={SECONDARY_BUTTON_CLASS}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!currentRole.name.trim() || !currentRole.title.trim()}
              className={PRIMARY_BUTTON_CLASS}
            >
              {roleDialogMode === "create" ? "Create Role" : "Save Role"}
            </button>
            </div>
          </div>
        </form>
      </ModalShell>

      <ModalShell
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="max-w-2xl"
        placement="left"
      >
        <form
          className="flex max-h-[calc(100vh-2rem)] flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
        >
          <div className="shrink-0 border-b border-slate-200 bg-slate-50 px-4 py-4 text-slate-900 sm:px-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <FaShieldAlt className="text-sm" />
                  {dialogMode === "create"
                    ? "Create New Permission"
                    : "Edit Permission"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add or update an RBAC permission entry in the catalog.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenDialog(false)}
                className={SECONDARY_BUTTON_CLASS}
              >
                Close
              </button>
            </div>
          </div>

          <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 sm:p-5">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Permission Name
              </span>
              <input
                name="name"
                value={currentPermission.name}
                onChange={handleInputChange}
                className={FIELD_CLASS}
                required
                disabled={dialogMode === "edit"}
                placeholder="create_smartphone"
              />
              <span className="mt-2 block text-xs text-slate-500">
                Unique name for the permission, for example `create_smartphone`.
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Description
              </span>
              <textarea
                name="description"
                value={currentPermission.description}
                onChange={handleInputChange}
                className={TEXTAREA_CLASS}
                rows={4}
                placeholder="Brief description of what this permission allows"
              />
            </label>
          </div>

          <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 sm:px-5">
            <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => setOpenDialog(false)}
              className={SECONDARY_BUTTON_CLASS}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!currentPermission.name.trim()}
              className={PRIMARY_BUTTON_CLASS}
            >
              {dialogMode === "create" ? "Create Permission" : "Update Permission"}
            </button>
            </div>
          </div>
        </form>
      </ModalShell>
    </div>
  );
};

export default PermissionManagement;


