import Cookies from "js-cookie";
import {
  getCurrentSessionPermissions,
  getCurrentSessionUser,
} from "./rbacStore";
import {
  getDefaultPermissionsForRole,
  hasAllPermissionsSet,
  hasAnyPermissionSet,
  hasPermissionSet,
  normalizePermissionToken,
  normalizeRole,
} from "./rbacCatalog";

const normalizeRoleValue = (value = "") => normalizeRole(value);

export const getCurrentRole = () => {
  const sessionUser = getCurrentSessionUser();
  const sessionRole = normalizeRoleValue(sessionUser?.role);
  if (sessionRole) return sessionRole;

  try {
    const cookieRole = normalizeRoleValue(Cookies.get("role"));
    if (cookieRole) return cookieRole;
  } catch {
    // ignore cookie read issues
  }
  return "";
};

export const getCurrentPermissions = () => {
  try {
    const permissions = getCurrentSessionPermissions();
    if (Array.isArray(permissions) && permissions.length) return permissions;
  } catch {
    // ignore store lookup errors
  }

  return getDefaultPermissionsForRole(getCurrentRole());
};

export const hasPermission = (
  permission,
  permissions = getCurrentPermissions(),
) => hasPermissionSet(permissions, permission);

export const hasAnyPermissions = (
  requestedPermissions = [],
  permissions = getCurrentPermissions(),
) => hasAnyPermissionSet(permissions, requestedPermissions);

export const hasAllPermissions = (
  requestedPermissions = [],
  permissions = getCurrentPermissions(),
) => hasAllPermissionsSet(permissions, requestedPermissions);

export const canAccessModule = (
  moduleKey,
  action = "view",
  permissions = getCurrentPermissions(),
) => {
  const code = `${normalizePermissionToken(moduleKey)}.${normalizePermissionToken(action)}`;
  return hasPermission(code, permissions);
};

export const hasBlogAccess = (
  role = getCurrentRole(),
  permissions = getCurrentPermissions(),
) => {
  const canViewNews = hasAnyPermissions(
    ["content.news.view", "content.news.*"],
    permissions,
  );
  const canWriteNews = hasAnyPermissions(
    [
      "content.news.create",
      "content.news.edit",
      "content.news.publish",
      "content.news.schedule",
      "content.news.manage",
      "content.news.*",
    ],
    permissions,
  );

  if (canViewNews && canWriteNews) {
    return true;
  }

  if (
    hasAnyPermissions(["roles.manage", "permissions.manage", "users.manage"], permissions)
  ) {
    return true;
  }

  const session = getCurrentUserSnapshot();
  const hasEffectivePermissions =
    Array.isArray(session?.effective_permissions) &&
    session.effective_permissions.length > 0;
  if (hasEffectivePermissions) return false;

  const normalizedRole = normalizeRoleValue(role);
  return normalizedRole === "admin" || normalizedRole === "ceo";
};

export const hasAdminAccess = (
  role = getCurrentRole(),
  permissions = getCurrentPermissions(),
) => {
  if (
    hasAnyPermissions(
      ["roles.manage", "permissions.manage", "users.manage"],
      permissions,
    )
  ) {
    return true;
  }

  const session = getCurrentUserSnapshot();
  const hasEffectivePermissions =
    Array.isArray(session?.effective_permissions) &&
    session.effective_permissions.length > 0;
  if (hasEffectivePermissions) return false;

  const normalizedRole = normalizeRoleValue(role);
  return normalizedRole === "admin" || normalizedRole === "ceo";
};

export const canAccessRoute = ({
  allowedRoles = [],
  requiredPermissions = [],
  requiredAnyPermissions = [],
  moduleKey = "",
  action = "view",
  role = getCurrentRole(),
  permissions = getCurrentPermissions(),
} = {}) => {
  const normalizedRole = normalizeRoleValue(role);
  const normalizedAllowedRoles = Array.isArray(allowedRoles)
    ? allowedRoles.map((value) => normalizeRoleValue(value))
    : [];

  if (normalizedAllowedRoles.length && !normalizedAllowedRoles.includes(normalizedRole)) {
    return false;
  }

  if (requiredPermissions.length && !hasAllPermissions(requiredPermissions, permissions)) {
    return false;
  }

  if (
    requiredAnyPermissions.length &&
    !hasAnyPermissions(requiredAnyPermissions, permissions)
  ) {
    return false;
  }

  if (moduleKey) {
    return canAccessModule(moduleKey, action, permissions);
  }

  return true;
};

export const getCurrentUserSnapshot = () => getCurrentSessionUser();

export default {
  getCurrentRole,
  getCurrentPermissions,
  hasPermission,
  hasAnyPermissions,
  hasAllPermissions,
  canAccessModule,
  hasBlogAccess,
  hasAdminAccess,
  canAccessRoute,
  getCurrentUserSnapshot,
};
