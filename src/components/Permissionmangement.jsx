// PermissionManagement.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { buildUrl } from "../api";
import Cookies from "js-cookie";
import PermissionsMatrix from "./PermissionsMatrix";
import {
  deletePermission as deleteStoredPermission,
  listPermissions as listStoredPermissions,
  listRoles as listStoredRoles,
  syncRbacState,
  upsertPermission as upsertStoredPermission,
  upsertRole as upsertStoredRole,
} from "../utils/rbacStore";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaLock,
  FaKey,
  FaShieldAlt,
  FaUserShield,
} from "react-icons/fa";

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

const formatDateLabel = (value) => {
  if (!value) return "Not tracked";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not tracked";
  return date.toLocaleDateString();
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

const PermissionManagement = () => {
  const hasFetchedRef = useRef(false);
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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

      const nextPermissions =
        permissionsRes.status === "fulfilled"
          ? permissionsRes.value.data
          : listStoredPermissions();
      const nextRoles =
        rolesRes.status === "fulfilled" ? rolesRes.value.data : listStoredRoles();

      const resolvedPermissions = Array.isArray(nextPermissions)
        ? nextPermissions
        : [];
      const resolvedRoles = Array.isArray(nextRoles) ? nextRoles : [];

      setPermissions(resolvedPermissions);
      setRoles(resolvedRoles);
      syncRbacState({
        permissions: resolvedPermissions,
        roles: resolvedRoles,
      });
      setError("");
    } catch (err) {
      console.error("Error fetching permissions:", err);
      setPermissions(listStoredPermissions());
      setRoles(listStoredRoles());
      setError("");
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
        setSuccess("Permission created successfully!");
        setOpenDialog(false);
        if (created) {
          fetchPermissions();
        }
      } else {
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
        setSuccess("Permission updated successfully!");
        setOpenDialog(false);
      }
    } catch (err) {
      console.error("Error saving permission:", err);
      setError(err.response?.data?.error || "Failed to save permission");
    }
  };

  const handleDelete = async (id) => {
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
      setSuccess("Permission deleted successfully!");
    } catch (err) {
      console.error("Error deleting permission:", err);
      setError(err.response?.data?.error || "Failed to delete permission");
    }
  };

  const handleOpenRoleDialog = (role = null) => {
    setCurrentRole({
      id: role?.id ?? null,
      name: role?.name || "",
      title: role?.title || "",
      description: role?.description || "",
      permissions: Array.isArray(role?.permissions) ? role.permissions : [],
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
      const nextPermissions = Array.isArray(prev.permissions)
        ? [...prev.permissions]
        : [];

      return {
        ...prev,
        permissions: checked
          ? Array.from(new Set([...nextPermissions, permissionCode]))
          : nextPermissions.filter((permission) => permission !== permissionCode),
      };
    });
  };

  const handleSaveRole = async () => {
    try {
      const payload = {
        name: currentRole.name,
        title: currentRole.title,
        description: currentRole.description,
        permissions: currentRole.permissions,
        built_in: currentRole.built_in,
      };

      if (roleDialogMode === "create" && !payload.name.trim()) {
        setError("Role name is required");
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
        setSuccess("Role created successfully!");
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
        setSuccess("Role updated successfully!");
      }

      setRoleDialogOpen(false);
      fetchPermissions();
    } catch (err) {
      console.error("Error saving role:", err);
      setError(err.response?.data?.message || "Failed to save role");
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

  const summaryCards = [
    {
      label: "Roles",
      value: roles.length,
      hint: "Access profiles available to assign",
    },
    {
      label: "Permissions",
      value: permissions.length,
      hint: "Catalog rules available in the RBAC matrix",
    },
    {
      label: "Elevated Roles",
      value: roles.filter((role) => getRoleBadgeColor(role) !== "primary").length,
      hint: "Roles containing wildcard or manage-level access",
    },
  ];

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
              <h1 className="page-title mt-2">Roles & Permission Management</h1>
              <p className="page-copy mt-3 max-w-2xl">
                Create role presets, review the permission catalog, and manage the
                access matrix from one Tailwind-styled admin workspace.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCreateClick}
                className={PRIMARY_BUTTON_CLASS}
              >
                <FaPlus className="text-xs" />
                Add Permission
              </button>
              <button
                type="button"
                onClick={() => handleOpenRoleDialog()}
                className={SECONDARY_BUTTON_CLASS}
              >
                <FaUserShield className="text-xs" />
                Add Role
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {summaryCards.map((item) => (
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

      <section className={PANEL_CLASS}>
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Role Presets</h2>
            <p className="mt-1 text-sm text-slate-500">
              Click a role card to edit its title, description, or permission
              matrix.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleOpenRoleDialog()}
            className={PRIMARY_BUTTON_CLASS}
          >
            <FaPlus className="text-xs" />
            Add Role
          </button>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3 sm:p-6">
          {roles.map((role) => {
            const badgeTone = getRoleBadgeColor(role);
            const permissionCount = Array.isArray(role.permissions)
              ? role.permissions.length
              : 0;

            return (
              <button
                key={role.id || role.name}
                type="button"
                onClick={() => handleOpenRoleDialog(role)}
                className="rounded-[24px] border border-slate-200 bg-white p-5 text-left transition hover:border-blue-200 hover:bg-blue-50/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {role.title || role.name}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {role.description || "No description configured for this role."}
                    </p>
                  </div>
                  <span
                    className={joinClasses(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                      getRoleBadgeClass(badgeTone),
                    )}
                  >
                    <FaUserShield className="text-[11px]" />
                    {role.name}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Permissions
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {permissionCount}
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

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500">
                    <FaKey className="text-[10px]" />
                    ID: {role.id || role.name}
                  </span>
                  {role.built_in ? (
                    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                      Built-in
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className={PANEL_CLASS}>
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <h2 className="text-lg font-bold text-slate-900">Permission Matrix</h2>
          <p className="mt-1 text-sm text-slate-500">
            This matrix shows the module actions available in the current
            permission catalog.
          </p>
        </div>
        <div className="p-5 sm:p-6">
          <PermissionsMatrix
            permissions={permissions.map((permission) => permission.name)}
            readOnly
            title="Catalog Matrix"
            description="Available module actions derived from the permission catalog."
            className={CARD_CLASS}
          />
        </div>
      </section>

      <section className={PANEL_CLASS}>
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              All Permissions ({permissions.length})
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Review, edit, and remove permission records from the catalog.
            </p>
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
              ) : permissions.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-sm text-slate-500"
                  >
                    No permissions found.
                  </td>
                </tr>
              ) : (
                permissions.map((permission) => (
                  <tr
                    key={permission.id}
                    className="border-t border-slate-200 text-sm transition hover:bg-slate-50/80"
                  >
                    <td className="px-4 py-4 sm:px-6 text-slate-600">
                      {permission.id}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
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
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-blue-700 transition hover:border-blue-200 hover:bg-blue-50"
                          title="Edit permission"
                        >
                          <FaEdit className="text-sm" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(permission.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-rose-700 transition hover:border-rose-200 hover:bg-rose-50"
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
      </section>

      <ModalShell
        open={roleDialogOpen}
        onClose={() => setRoleDialogOpen(false)}
        maxWidth="max-w-6xl"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSaveRole();
          }}
        >
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-5 text-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-bold">
                  <FaUserShield className="text-sm" />
                  {roleDialogMode === "create" ? "Create Role" : "Edit Role"}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
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

          <div className="grid gap-5 p-6 md:grid-cols-3">
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

          <div className="px-6 pb-6">
            <div className={CARD_CLASS}>
              <PermissionsMatrix
                permissions={currentRole.permissions}
                onToggle={handleToggleRolePermission}
                title="Role Permission Matrix"
                description="Toggle the actions this role is allowed to perform."
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 px-6 py-5">
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
        </form>
      </ModalShell>

      <ModalShell
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="max-w-2xl"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
        >
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-5 text-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-bold">
                  <FaShieldAlt className="text-sm" />
                  {dialogMode === "create"
                    ? "Create New Permission"
                    : "Edit Permission"}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
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

          <div className="grid gap-5 p-6">
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

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 px-6 py-5">
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
        </form>
      </ModalShell>
    </div>
  );
};

export default PermissionManagement;
