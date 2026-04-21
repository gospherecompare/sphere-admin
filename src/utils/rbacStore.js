import Cookies from "js-cookie";
import {
  getDefaultPermissionsForRole,
  getPermissionMatrix,
  getRolePreset,
  normalizePermissionToken,
  normalizeRole,
} from "./rbacCatalog";

const STORAGE_KEY = "hooksAdminRbacState";
const ACTIVITY_LIMIT = 250;
const RBAC_STATE_VERSION = 2;
const DEFAULT_ROLE_NAMES = [
  "ceo",
  "admin",
  "content_admin",
  "editor",
  "author",
  "product_manager",
  "analyst",
  "seo",
  "moderator",
  "viewer",
];
const DEMO_USER_IDS = new Set([
  "seed-newsroom",
  "seed-sagnik",
  "seed-siddhartha",
  "seed-abubakar",
]);

const nowIso = () => new Date().toISOString();

const makeId = (prefix = "id") =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const safeParse = (value, fallback = null) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const storage = () => {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
};

const readState = () => {
  const store = storage();
  if (!store) return null;
  return safeParse(store.getItem(STORAGE_KEY), null);
};

const writeState = (nextState) => {
  const store = storage();
  if (!store) return nextState;
  store.setItem(STORAGE_KEY, JSON.stringify(nextState));
  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hooks-rbac-updated"));
    }
  } catch {
    // Ignore event dispatch failures.
  }
  return nextState;
};

const inferDepartmentFromRole = (role = "") => {
  const normalized = normalizeRole(role);
  if (["ceo", "admin", "content_admin"].includes(normalized)) return "System";
  if (["editor", "author", "seo", "moderator"].includes(normalized)) return "Editorial";
  if (normalized === "product_manager") return "Products";
  if (normalized === "analyst") return "Analytics";
  return "General";
};

const deriveUserNames = (value = {}) => {
  const firstName = String(value.first_name || "").trim();
  const lastName = String(value.last_name || "").trim();
  const fullName = String(value.full_name || value.display_name || value.author_name || "").trim();
  const userName = String(
    value.user_name || value.username || value.email || value.name || "",
  ).trim();

  const displayName =
    fullName || [firstName, lastName].filter(Boolean).join(" ").trim() || userName || "User";

  return { firstName, lastName, fullName, userName, displayName };
};

const normalizeUserRecord = (value = {}) => {
  const rawRole = String(value.role || value.default_role || "").trim();
  const role = rawRole ? normalizeRole(rawRole) : "";
  const { firstName, lastName, fullName, userName, displayName } = deriveUserNames(
    value,
  );

  const rawPermissions = Array.isArray(value.permissions_override)
    ? value.permissions_override
    : Array.isArray(value.permissions)
      ? value.permissions
      : [];

  return {
    id: value.id ?? makeId("user"),
    user_name: userName,
    username: userName,
    first_name: firstName,
    last_name: lastName,
    full_name: fullName || displayName,
    display_name: displayName,
    author_name: String(value.author_name || displayName).trim(),
    email: String(value.email || "").trim(),
    phone: String(value.phone || "").trim(),
    gender: String(value.gender || "").trim(),
    bio: String(value.bio || "").trim(),
    avatar: String(value.avatar || value.avatar_url || "").trim(),
    role,
    status: String(value.status || "active").trim().toLowerCase() === "inactive" ? "inactive" : "active",
    department: String(value.department || inferDepartmentFromRole(role)).trim(),
    permissions_override: Array.from(
      new Set(rawPermissions.map((permission) => normalizePermissionToken(permission)).filter(Boolean)),
    ),
    effective_permissions: Array.from(
      new Set(
        (Array.isArray(value.effective_permissions)
          ? value.effective_permissions
          : Array.isArray(value.permissions)
            ? value.permissions
            : []
        )
          .map((permission) => normalizePermissionToken(permission))
          .filter(Boolean),
      ),
    ),
    last_login: String(value.last_login || value.login_at || "").trim(),
    created_at: String(value.created_at || nowIso()).trim(),
    updated_at: String(value.updated_at || nowIso()).trim(),
    notes: String(value.notes || "").trim(),
    source: String(value.source || "").trim().toLowerCase(),
  };
};

const currentSessionUser = () => {
  const raw = Cookies.get("user");
  const parsed = safeParse(raw, {}) || {};
  const role = normalizeRole(parsed.role || Cookies.get("role"));
  const { firstName, lastName, fullName, userName, displayName } = deriveUserNames({
    first_name: parsed.first_name,
    last_name: parsed.last_name,
    full_name: parsed.full_name,
    display_name: parsed.display_name,
    author_name: parsed.author_name,
    user_name: parsed.user_name || parsed.username || Cookies.get("username"),
    email: parsed.email || "",
  });

  const hasIdentity =
    Boolean(parsed.id) ||
    Boolean(parsed.email) ||
    Boolean(userName) ||
    Boolean(firstName) ||
    Boolean(lastName);

  if (!hasIdentity) return null;

  return normalizeUserRecord({
    id: parsed.id || parsed.user_id || parsed.email || userName || makeId("session"),
    user_name: userName || Cookies.get("username") || "admin",
    first_name: firstName,
    last_name: lastName,
    full_name: fullName || displayName,
    display_name: displayName,
    author_name: displayName,
    email: parsed.email || "",
    phone: parsed.phone || "",
    gender: parsed.gender || "",
    bio: parsed.bio || "",
    avatar: parsed.avatar || "",
    department: parsed.department || inferDepartmentFromRole(role),
    role,
    status: "active",
    last_login: Cookies.get("loginAt") || "",
    permissions_override: parsed.permissions_override || parsed.permissions || [],
    effective_permissions:
      parsed.effective_permissions || parsed.permissions || parsed.permissions_override || [],
    source: "session",
  });
};

const buildPermissionRecords = () =>
  getPermissionMatrix().flatMap((module) =>
    module.permissions.map((permission) => ({
      id: permission.code,
      name: permission.code,
      description: `Allows ${permission.action} on ${module.label}`,
      module: module.key,
      module_label: module.label,
      action: permission.action,
      created_at: nowIso(),
    })),
  );

const dedupeUsers = (users = []) => {
  const seen = new Set();
  return users
    .map((user) => normalizeUserRecord(user))
    .filter((user) => {
      const key = String(user.email || user.username || user.id).trim().toLowerCase();
      if (!key) return true;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const getPermissionSignature = (values = []) =>
  Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((permission) => normalizePermissionToken(permission))
        .filter(Boolean),
    ),
  )
    .sort()
    .join("|");

const normalizeRoleRecord = (value = {}) => {
  const roleName = normalizeRole(value.name || value.id || "");

  return {
    id: value.id ?? roleName,
    name: roleName,
    title: String(value.title || roleName || "Role").trim(),
    description: String(value.description || "").trim(),
    permissions: Array.from(
      new Set(
        (Array.isArray(value.permissions) ? value.permissions : [])
          .map((permission) => normalizePermissionToken(permission))
          .filter(Boolean),
      ),
    ),
    built_in: Boolean(value.built_in),
    created_at: String(value.created_at || nowIso()).trim(),
    updated_at: String(value.updated_at || nowIso()).trim(),
    source: String(value.source || "").trim().toLowerCase(),
  };
};

const isLegacySeedRole = (value = {}) => {
  const role = normalizeRoleRecord(value);
  if (!DEFAULT_ROLE_NAMES.includes(role.name)) return false;
  if (role.source === "server" || role.source === "local") return false;

  const preset = getRolePreset(role.name);
  return (
    role.title === String(preset.label || "").trim() &&
    role.description === String(preset.description || "").trim() &&
    getPermissionSignature(role.permissions) ===
      getPermissionSignature(getDefaultPermissionsForRole(role.name))
  );
};

const buildDefaultState = () => {
  const sessionUser = currentSessionUser();
  const users = dedupeUsers([sessionUser].filter(Boolean));

  return {
    version: RBAC_STATE_VERSION,
    users,
    roles: [],
    permissions: buildPermissionRecords(),
    activities: sessionUser
      ? [
          {
            id: makeId("activity"),
            at: nowIso(),
            actor: sessionUser.display_name,
            actor_role: sessionUser.role,
            module: "auth",
            action: "login",
            target: "Current session",
            status: "success",
            note: "Seeded RBAC store from the current authenticated session.",
          },
        ]
      : [],
  };
};

const mergeSeedState = (storedState) => {
  const defaults = buildDefaultState();
  const stored = storedState && typeof storedState === "object" ? storedState : {};

  const users = dedupeUsers([
    ...((Array.isArray(stored.users) ? stored.users : []).filter(
      (user) => !DEMO_USER_IDS.has(String(user?.id || "").trim()),
    )),
    ...defaults.users,
  ]);
  const roles = (Array.isArray(stored.roles) ? stored.roles : [])
    .filter((role) => !isLegacySeedRole(role))
    .map((role) => normalizeRoleRecord(role));
  const permissions =
    Array.isArray(stored.permissions) && stored.permissions.length
      ? stored.permissions
      : defaults.permissions;
  const activities = Array.isArray(stored.activities)
    ? stored.activities.slice(0, ACTIVITY_LIMIT)
    : defaults.activities;

  return {
    version: RBAC_STATE_VERSION,
    users,
    roles,
    permissions,
    activities,
  };
};

export const loadRbacState = () => {
  const storedState = readState();
  const nextState = mergeSeedState(storedState);
  if (
    !storedState ||
    storedState?.version !== RBAC_STATE_VERSION ||
    JSON.stringify(storedState) !== JSON.stringify(nextState)
  ) {
    writeState(nextState);
  }
  return nextState;
};

export const saveRbacState = (nextState) => writeState(nextState);

export const getCurrentSessionUser = () => {
  const sessionUser = currentSessionUser();
  const state = loadRbacState();
  const username = String(
    sessionUser?.user_name || sessionUser?.username || Cookies.get("username") || "",
  )
    .trim()
    .toLowerCase();
  const email = String(sessionUser?.email || Cookies.get("user_email") || "")
    .trim()
    .toLowerCase();
  const id = String(sessionUser?.id || "").trim();
  const role = normalizeRole(Cookies.get("role"));

  const matchedUser = state.users.find((user) =>
    [user.id, user.username, user.user_name, user.email]
      .map((value) => String(value || "").trim().toLowerCase())
      .some(
        (value) =>
          value &&
          (value === id.toLowerCase() || value === username || value === email),
      ),
  );

  if (matchedUser) {
    return normalizeUserRecord({
      ...(sessionUser || {}),
      ...matchedUser,
      last_login: sessionUser?.last_login || matchedUser.last_login || "",
    });
  }

  if (sessionUser) return sessionUser;

  if (role) {
    return normalizeUserRecord({
      id: makeId("session"),
      user_name: username || "session-user",
      display_name: username || "Session User",
      author_name: username || "Session User",
      role,
      status: "active",
    });
  }

  return null;
};

export const getCurrentSessionPermissions = () => {
  const user = getCurrentSessionUser();
  const normalizedRole = normalizeRole(user?.role || Cookies.get("role"));
  const hasRoleRecord = listRoles().some(
    (role) => normalizeRole(role?.name || role?.id || "") === normalizedRole,
  );
  const rolePermissions = hasRoleRecord
    ? getRoleSummary(normalizedRole).permissions
    : getDefaultPermissionsForRole(normalizedRole);
  const customPermissions = Array.isArray(user?.permissions_override)
    ? user.permissions_override
    : [];
  const derivedPermissions = Array.from(
    new Set([...rolePermissions, ...customPermissions].map((permission) => normalizePermissionToken(permission))),
  );
  if (derivedPermissions.length) return derivedPermissions;

  if (Array.isArray(user?.effective_permissions) && user.effective_permissions.length) {
    return Array.from(
      new Set(
        user.effective_permissions
          .map((permission) => normalizePermissionToken(permission))
          .filter(Boolean),
      ),
    );
  }
  return [];
};

export const syncRbacState = (snapshot = {}) => {
  const state = loadRbacState();
  const nextState = {
    ...state,
  };

  if (Array.isArray(snapshot.users)) {
    nextState.users = dedupeUsers(
      snapshot.users.map((user) => ({
        ...user,
        source: user?.source || "server",
      })),
    );
  }

  if (Array.isArray(snapshot.roles)) {
    nextState.roles = snapshot.roles.map((role) =>
      normalizeRoleRecord({
        ...role,
        source: role?.source || "server",
      }),
    );
  }

  if (Array.isArray(snapshot.permissions)) {
    nextState.permissions = snapshot.permissions;
  }

  if (Array.isArray(snapshot.activities)) {
    nextState.activities = snapshot.activities.slice(0, ACTIVITY_LIMIT);
  }

  saveRbacState(nextState);
  return nextState;
};

export const listUsers = ({ includeInactive = true } = {}) => {
  const state = loadRbacState();
  const rows = state.users.map(normalizeUserRecord);
  const filtered = includeInactive
    ? rows
    : rows.filter((user) => user.status !== "inactive");
  return filtered.sort((a, b) =>
    String(a.display_name || "").localeCompare(String(b.display_name || "")),
  );
};

export const getAuthorOptions = ({ includeInactive = false } = {}) =>
  listUsers({ includeInactive }).map((user) => ({
    value: String(user.id),
    label: user.display_name || user.full_name || user.username || "User",
    secondary: user.role || "",
    user,
  }));

export const getUserById = (id) => {
  if (id === null || typeof id === "undefined") return null;
  const target = String(id);
  return listUsers({ includeInactive: true }).find((user) => String(user.id) === target) || null;
};

export const upsertUser = (input = {}, meta = {}) => {
  const state = loadRbacState();
  const normalized = normalizeUserRecord(input);
  const targetKey = String(input.id || normalized.id || "").trim();
  const byIdentity = (user) => {
    const userKey = String(user.id || "").trim();
    const email = String(user.email || "").trim().toLowerCase();
    const username = String(user.username || user.user_name || "").trim().toLowerCase();
    const incomingEmail = String(normalized.email || "").trim().toLowerCase();
    const incomingUsername = String(normalized.username || normalized.user_name || "").trim().toLowerCase();
    return (
      (targetKey && userKey === targetKey) ||
      (incomingEmail && email === incomingEmail) ||
      (incomingUsername && username === incomingUsername)
    );
  };

  const existingIndex = state.users.findIndex(byIdentity);
  const nextRecord = {
    ...(existingIndex >= 0 ? state.users[existingIndex] : {}),
    ...normalized,
    id: existingIndex >= 0 ? state.users[existingIndex].id : normalized.id,
    created_at:
      existingIndex >= 0
        ? state.users[existingIndex].created_at || normalized.created_at
        : normalized.created_at,
    updated_at: nowIso(),
    source:
      existingIndex >= 0
        ? state.users[existingIndex].source || normalized.source || "local"
        : normalized.source || "local",
  };

  const nextUsers = [...state.users];
  if (existingIndex >= 0) {
    nextUsers.splice(existingIndex, 1, nextRecord);
  } else {
    nextUsers.unshift(nextRecord);
  }

  const nextState = {
    ...state,
    users: dedupeUsers(nextUsers),
    activities: [
      {
        id: makeId("activity"),
        at: nowIso(),
        actor: String(meta.actor || getCurrentSessionUser()?.display_name || "System"),
        actor_role: String(meta.actorRole || getCurrentSessionUser()?.role || "admin"),
        module: "users",
        action: existingIndex >= 0 ? "updated" : "created",
        target: nextRecord.display_name,
        status: "success",
        note: meta.note || `User ${existingIndex >= 0 ? "updated" : "created"} locally.`,
      },
      ...state.activities,
    ].slice(0, ACTIVITY_LIMIT),
  };

  saveRbacState(nextState);
  return nextRecord;
};

export const setUserRole = (userId, role, meta = {}) => {
  const state = loadRbacState();
  const targetId = String(userId);
  const nextUsers = state.users.map((user) =>
    String(user.id) === targetId
      ? {
          ...normalizeUserRecord(user),
          role: normalizeRole(role),
          updated_at: nowIso(),
        }
      : user,
  );

  const updatedUser = nextUsers.find((user) => String(user.id) === targetId) || null;
  const nextState = {
    ...state,
    users: nextUsers,
    activities: updatedUser
      ? [
          {
            id: makeId("activity"),
            at: nowIso(),
            actor: String(meta.actor || getCurrentSessionUser()?.display_name || "System"),
            actor_role: String(meta.actorRole || getCurrentSessionUser()?.role || "admin"),
            module: "users",
            action: "role_assigned",
            target: updatedUser.display_name,
            status: "success",
            note: `Assigned ${normalizeRole(role)} role.`,
          },
          ...state.activities,
        ].slice(0, ACTIVITY_LIMIT)
      : state.activities,
  };

  saveRbacState(nextState);
  return updatedUser;
};

export const setUserPermissions = (userId, permissions = [], meta = {}) => {
  const state = loadRbacState();
  const targetId = String(userId);
  const nextUsers = state.users.map((user) =>
    String(user.id) === targetId
      ? {
          ...normalizeUserRecord(user),
          permissions_override: Array.from(
            new Set(
              permissions
                .map((permission) => normalizePermissionToken(permission))
                .filter(Boolean),
            ),
          ),
          updated_at: nowIso(),
        }
      : user,
  );

  const updatedUser = nextUsers.find((user) => String(user.id) === targetId) || null;
  const nextState = {
    ...state,
    users: nextUsers,
    activities: updatedUser
      ? [
          {
            id: makeId("activity"),
            at: nowIso(),
            actor: String(meta.actor || getCurrentSessionUser()?.display_name || "System"),
            actor_role: String(meta.actorRole || getCurrentSessionUser()?.role || "admin"),
            module: "permissions",
            action: "updated",
            target: updatedUser.display_name,
            status: "success",
            note: meta.note || "Updated user-specific permissions.",
          },
          ...state.activities,
        ].slice(0, ACTIVITY_LIMIT)
      : state.activities,
  };

  saveRbacState(nextState);
  return updatedUser;
};

export const deleteUser = (userId, meta = {}) => {
  const state = loadRbacState();
  const target = getUserById(userId);
  const nextState = {
    ...state,
    users: state.users.filter((user) => String(user.id) !== String(userId)),
    activities: [
      {
        id: makeId("activity"),
        at: nowIso(),
        actor: String(meta.actor || getCurrentSessionUser()?.display_name || "System"),
        actor_role: String(meta.actorRole || getCurrentSessionUser()?.role || "admin"),
        module: "users",
        action: "deleted",
        target: target?.display_name || String(userId),
        status: "success",
        note: meta.note || "Deleted a user from the local RBAC store.",
      },
      ...state.activities,
    ].slice(0, ACTIVITY_LIMIT),
  };

  saveRbacState(nextState);
  return target;
};

export const listRoles = () => {
  const state = loadRbacState();
  const roleMap = new Map();

  state.roles.forEach((role) => {
    const normalized = normalizeRoleRecord(role);
    if (!normalized.name) return;
    roleMap.set(String(normalized.name || normalized.id).toLowerCase(), normalized);
  });

  return Array.from(roleMap.values()).sort((a, b) =>
    String(a.title || a.name).localeCompare(String(b.title || b.name)),
  );
};

export const upsertRole = (input = {}, meta = {}) => {
  const state = loadRbacState();
  const rawRoleName = String(input.name || input.id || "").trim();
  const roleName = rawRoleName ? normalizeRole(rawRoleName) : "";
  if (!roleName) return null;
  const normalized = {
    id: roleName,
    name: roleName,
    title: String(input.title || roleName).trim(),
    description: String(input.description || "").trim(),
    permissions: Array.from(
      new Set(
        (Array.isArray(input.permissions) ? input.permissions : [])
          .map((permission) => normalizePermissionToken(permission))
          .filter(Boolean),
      ),
    ),
    built_in: Boolean(input.built_in),
    created_at: input.created_at || nowIso(),
    updated_at: nowIso(),
    source: String(input.source || "local").trim().toLowerCase(),
  };

  const index = state.roles.findIndex(
    (role) => normalizeRole(role.name || role.id) === roleName,
  );

  const nextRoles =
    index >= 0
      ? state.roles.map((role, idx) => (idx === index ? normalized : role))
      : [normalized, ...state.roles];

  saveRbacState({
    ...state,
    roles: nextRoles,
    activities: [
      {
        id: makeId("activity"),
        at: nowIso(),
        actor: String(meta.actor || getCurrentSessionUser()?.display_name || "System"),
        actor_role: String(meta.actorRole || getCurrentSessionUser()?.role || "admin"),
        module: "roles",
        action: index >= 0 ? "updated" : "created",
        target: normalized.title,
        status: "success",
        note: meta.note || `Role ${index >= 0 ? "updated" : "created"}.`,
      },
      ...state.activities,
    ].slice(0, ACTIVITY_LIMIT),
  });

  return normalized;
};

export const deleteRole = (roleName, meta = {}) => {
  const state = loadRbacState();
  const normalizedName = normalizeRole(roleName);
  const filtered = state.roles.filter(
    (role) => normalizeRole(role.name || role.id) !== normalizedName,
  );
  saveRbacState({
    ...state,
    roles: filtered,
    activities: [
      {
        id: makeId("activity"),
        at: nowIso(),
        actor: String(meta.actor || getCurrentSessionUser()?.display_name || "System"),
        actor_role: String(meta.actorRole || getCurrentSessionUser()?.role || "admin"),
        module: "roles",
        action: "deleted",
        target: normalizedName,
        status: "success",
        note: meta.note || "Role removed from local store.",
      },
      ...state.activities,
    ].slice(0, ACTIVITY_LIMIT),
  });
};

export const listPermissions = () => {
  const state = loadRbacState();
  const catalog = getPermissionMatrix().flatMap((module) =>
    module.permissions.map((permission) => ({
      id: permission.code,
      name: permission.code,
      description: `Allows ${permission.action} on ${module.label}`,
      module: module.key,
      module_label: module.label,
      action: permission.action,
      built_in: true,
      created_at: nowIso(),
    })),
  );

  const custom = Array.isArray(state.permissions) ? state.permissions : [];
  const merged = new Map();

  [...catalog, ...custom].forEach((permission) => {
    const key = String(permission.name || permission.id).toLowerCase();
    merged.set(key, {
      ...permission,
      name: permission.name || permission.id,
      id: permission.id || permission.name,
    });
  });

  return Array.from(merged.values()).sort((a, b) =>
    String(a.name).localeCompare(String(b.name)),
  );
};

export const upsertPermission = (input = {}, meta = {}) => {
  const state = loadRbacState();
  const normalized = {
    id: input.id || normalizePermissionToken(input.name || makeId("permission")),
    name: normalizePermissionToken(input.name || input.id || ""),
    description: String(input.description || "").trim(),
    module: String(input.module || "").trim(),
    module_label: String(input.module_label || input.module || "").trim(),
    action: String(input.action || "").trim(),
    built_in: Boolean(input.built_in),
    created_at: input.created_at || nowIso(),
    updated_at: nowIso(),
  };

  const permissions = Array.isArray(state.permissions) ? [...state.permissions] : [];
  const index = permissions.findIndex(
    (permission) =>
      normalizePermissionToken(permission.name || permission.id) ===
      normalizePermissionToken(normalized.name || normalized.id),
  );

  if (index >= 0) {
    permissions.splice(index, 1, normalized);
  } else {
    permissions.unshift(normalized);
  }

  saveRbacState({
    ...state,
    permissions,
    activities: [
      {
        id: makeId("activity"),
        at: nowIso(),
        actor: String(meta.actor || getCurrentSessionUser()?.display_name || "System"),
        actor_role: String(meta.actorRole || getCurrentSessionUser()?.role || "admin"),
        module: "permissions",
        action: index >= 0 ? "updated" : "created",
        target: normalized.name,
        status: "success",
        note: meta.note || `Permission ${index >= 0 ? "updated" : "created"}.`,
      },
      ...state.activities,
    ].slice(0, ACTIVITY_LIMIT),
  });

  return normalized;
};

export const deletePermission = (permissionId, meta = {}) => {
  const state = loadRbacState();
  const target = String(permissionId || "").trim();
  const filtered = (Array.isArray(state.permissions) ? state.permissions : []).filter(
    (permission) =>
      String(permission.id || permission.name).toLowerCase() !== target.toLowerCase(),
  );

  saveRbacState({
    ...state,
    permissions: filtered,
    activities: [
      {
        id: makeId("activity"),
        at: nowIso(),
        actor: String(meta.actor || getCurrentSessionUser()?.display_name || "System"),
        actor_role: String(meta.actorRole || getCurrentSessionUser()?.role || "admin"),
        module: "permissions",
        action: "deleted",
        target,
        status: "success",
        note: meta.note || "Permission removed from local store.",
      },
      ...state.activities,
    ].slice(0, ACTIVITY_LIMIT),
  });
};

export const listActivities = () => {
  const state = loadRbacState();
  return Array.isArray(state.activities) ? state.activities : [];
};

export const recordActivity = (entry = {}) => {
  const state = loadRbacState();
  const nextActivity = {
    id: entry.id || makeId("activity"),
    at: entry.at || nowIso(),
    actor: String(entry.actor || getCurrentSessionUser()?.display_name || "System"),
    actor_role: String(entry.actor_role || getCurrentSessionUser()?.role || "admin"),
    module: String(entry.module || "").trim(),
    action: String(entry.action || "").trim(),
    target: String(entry.target || "").trim(),
    status: String(entry.status || "success").trim(),
    note: String(entry.note || "").trim(),
  };

  saveRbacState({
    ...state,
    activities: [nextActivity, ...state.activities].slice(0, ACTIVITY_LIMIT),
  });

  return nextActivity;
};

export const getRoleSummary = (role = "") => {
  const rawRole = String(role || "").trim();
  const normalizedRole = rawRole ? normalizeRole(rawRole) : "";
  const storedRole = listRoles().find(
    (entry) => normalizeRole(entry.name || entry.id) === normalizedRole,
  );
  return {
    name: normalizedRole,
    title: storedRole?.title || normalizedRole || "",
    description: storedRole?.description || "",
    permissions:
      Array.isArray(storedRole?.permissions) && storedRole.permissions.length
        ? storedRole.permissions
        : [],
  };
};

export const getUserPermissionSummary = (user = {}) => {
  const rolePermissions = getRoleSummary(user.role).permissions;
  const customPermissions = Array.isArray(user.permissions_override)
    ? user.permissions_override
    : [];
  const derivedPermissions = Array.from(
    new Set(
      [...rolePermissions, ...customPermissions]
        .map((permission) => normalizePermissionToken(permission))
        .filter(Boolean),
    ),
  );

  if (derivedPermissions.length) return derivedPermissions;

  if (Array.isArray(user.effective_permissions) && user.effective_permissions.length) {
    return Array.from(
      new Set(
        user.effective_permissions
          .map((permission) => normalizePermissionToken(permission))
          .filter(Boolean),
      ),
    );
  }

  return [];
};

export const getPermissionCatalog = () => listPermissions();

export const getPermissionMatrixRows = () => getPermissionMatrix();

export const getSeedAuthors = () => getAuthorOptions({ includeInactive: false });

export default {
  loadRbacState,
  saveRbacState,
  getCurrentSessionUser,
  getCurrentSessionPermissions,
  syncRbacState,
  listUsers,
  getAuthorOptions,
  getUserById,
  upsertUser,
  setUserRole,
  setUserPermissions,
  deleteUser,
  listRoles,
  upsertRole,
  deleteRole,
  listPermissions,
  upsertPermission,
  deletePermission,
  listActivities,
  recordActivity,
  getRoleSummary,
  getUserPermissionSummary,
  getPermissionCatalog,
  getPermissionMatrixRows,
  getSeedAuthors,
};
