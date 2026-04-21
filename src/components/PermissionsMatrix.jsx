import React from "react";
import PropTypes from "prop-types";
import {
  RBAC_ACTIONS,
  buildPermissionCode,
  getPermissionMatrix,
  hasPermissionSet,
  isActionSupported,
  normalizePermissionToken,
} from "../utils/rbacCatalog";

const ACTION_LABELS = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
  publish: "Publish",
  schedule: "Schedule",
  approve: "Approve",
  reject: "Reject",
  feature: "Feature",
  pin: "Pin",
  manage: "Manage",
  export: "Export",
  import: "Import",
  assign: "Assign",
};

const DEFAULT_ACTIONS = RBAC_ACTIONS;

const PermissionsMatrix = ({
  permissions = [],
  onToggle,
  readOnly = false,
  modules = getPermissionMatrix(),
  actions = [],
  title = "Permissions Matrix",
  description = "",
  className = "",
}) => {
  const grantedPermissions = Array.isArray(permissions) ? permissions : [];
  const resolvedActions =
    Array.isArray(actions) && actions.length
      ? Array.from(
          new Set(
            actions
              .map((action) => normalizePermissionToken(action))
              .filter(Boolean),
          ),
        )
      : Array.from(
          new Set(
            [
              ...DEFAULT_ACTIONS,
              ...modules.flatMap((module) =>
                Array.isArray(module.actions) ? module.actions : [],
              ),
            ]
              .map((action) => normalizePermissionToken(action))
              .filter(Boolean),
          ),
        );

  return (
    <div className={className}>
      <div className="mb-3">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {description ? (
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Module</th>
              {resolvedActions.map((action) => (
                <th key={action} className="px-3 py-3 text-center">
                  {ACTION_LABELS[action] || action}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map((module) => (
              <tr key={module.key} className="border-t border-slate-200">
                <td className="px-4 py-3 align-top">
                  <div className="font-semibold text-slate-900">{module.label}</div>
                  <div className="mt-1 text-xs leading-5 text-slate-500">
                    {module.description || module.key}
                  </div>
                </td>
                {resolvedActions.map((action) => {
                  const moduleActions = Array.isArray(module.actions)
                    ? module.actions
                        .map((moduleAction) => normalizePermissionToken(moduleAction))
                        .filter(Boolean)
                    : [];
                  const supported = moduleActions.length
                    ? moduleActions.includes(normalizePermissionToken(action))
                    : isActionSupported(module.key, action);
                  const permissionCode = buildPermissionCode(module.key, action);
                  const checked = hasPermissionSet(grantedPermissions, permissionCode);

                  return (
                    <td key={`${module.key}:${action}`} className="px-3 py-3 text-center">
                      {supported ? (
                        readOnly ? (
                          <span
                            className={`inline-flex h-5 w-5 items-center justify-center rounded border text-[11px] font-semibold ${
                              checked
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-slate-50 text-slate-400"
                            }`}
                            title={checked ? "Enabled" : "Disabled"}
                          >
                            {checked ? "+" : "-"}
                          </span>
                        ) : (
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) =>
                              onToggle?.(permissionCode, event.target.checked, {
                                module,
                                action,
                              })
                            }
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        )
                      ) : (
                        <span className="text-[11px] text-slate-300">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

PermissionsMatrix.propTypes = {
  permissions: PropTypes.arrayOf(PropTypes.string),
  onToggle: PropTypes.func,
  readOnly: PropTypes.bool,
  modules: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
      actions: PropTypes.arrayOf(PropTypes.string),
    }),
  ),
  actions: PropTypes.arrayOf(PropTypes.string),
  title: PropTypes.string,
  description: PropTypes.string,
  className: PropTypes.string,
};

export default PermissionsMatrix;
