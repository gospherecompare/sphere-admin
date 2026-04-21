import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { FaLock, FaArrowLeft } from "react-icons/fa";
import {
  canAccessRoute,
  getCurrentPermissions,
  getCurrentRole,
} from "../utils/access";

const AccessGate = ({
  allowedRoles,
  requiredPermissions = [],
  requiredAnyPermissions = [],
  moduleKey = "",
  action = "view",
  title,
  message,
  fallbackPath = "/dashboard",
  children,
}) => {
  const [authSnapshot, setAuthSnapshot] = useState(() => ({
    role: getCurrentRole(),
    permissions: getCurrentPermissions(),
  }));
  const role = authSnapshot.role;
  const permissions = authSnapshot.permissions;

  useEffect(() => {
    const syncAuthSnapshot = () => {
      setAuthSnapshot({
        role: getCurrentRole(),
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
  const normalizedAllowed = Array.isArray(allowedRoles)
    ? allowedRoles.map((value) => String(value || "").trim().toLowerCase())
    : [];
  const roleAllowed = normalizedAllowed.length
    ? normalizedAllowed.includes(role)
    : true;
  const permissionAllowed = canAccessRoute({
    allowedRoles: [],
    requiredPermissions,
    requiredAnyPermissions,
    moduleKey,
    action,
    permissions,
    role,
  });
  const allowed = roleAllowed && permissionAllowed;

  if (allowed) return children;

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl items-center px-4 py-10">
      <div className="w-full rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <FaLock className="text-base" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-[-0.03em] text-slate-900">
              {title || "Access restricted"}
            </h1>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              {message ||
                "Your account does not have access to this workspace section."}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Current role: {role || "unknown"}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to={fallbackPath}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <FaArrowLeft className="text-xs" />
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

AccessGate.propTypes = {
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
  requiredPermissions: PropTypes.arrayOf(PropTypes.string),
  requiredAnyPermissions: PropTypes.arrayOf(PropTypes.string),
  moduleKey: PropTypes.string,
  action: PropTypes.string,
  title: PropTypes.string,
  message: PropTypes.string,
  fallbackPath: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export default AccessGate;
