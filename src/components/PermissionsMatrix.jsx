import React from "react";
import PropTypes from "prop-types";
import { FaCheck } from "react-icons/fa";
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
  showHeader = true,
  modules = getPermissionMatrix(),
  actions = [],
  title = "Permissions Matrix",
  description = "",
  className = "",
  compact = false,
  maxBodyHeight = "",
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
      {showHeader ? (
        <div className="mb-3">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          {description ? (
            <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
          ) : null}
        </div>
      ) : null}

      <div
        className={[
          "overflow-auto rounded-md border border-slate-200 bg-white shadow-none",
          maxBodyHeight,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <table
          className={[
            "border-collapse text-left",
            compact ? "min-w-[920px] text-xs" : "min-w-full text-xs sm:text-sm",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <thead className="sticky top-0 z-20 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th
                className={[
                  "bg-slate-50",
                  compact
                    ? "sticky left-0 z-30 w-44 min-w-44 px-3 py-2"
                    : "px-4 py-3",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                Module
              </th>
              {resolvedActions.map((action) => (
                <th
                  key={action}
                  className={compact ? "min-w-14 px-2 py-2 text-center" : "px-3 py-3 text-center"}
                >
                  {ACTION_LABELS[action] || action}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map((module) => (
              <tr key={module.key} className="border-t border-slate-200">
                <td
                  className={[
                    "align-top",
                    compact
                      ? "sticky left-0 z-10 w-44 min-w-44 bg-white px-3 py-2"
                      : "px-4 py-3",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <div className={compact ? "text-sm font-semibold text-slate-900" : "font-semibold text-slate-900"}>
                    {module.label}
                  </div>
                  <div className={compact ? "mt-0.5 text-[11px] leading-4 text-slate-500" : "mt-1 text-xs leading-5 text-slate-500"}>
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
                    <td
                      key={`${module.key}:${action}`}
                      className={compact ? "px-2 py-2 text-center" : "px-3 py-3 text-center"}
                    >
                      {supported ? (
                        readOnly ? (
                          <span
                            className={`inline-flex h-5 w-5 items-center justify-center rounded border text-[10px] font-semibold ${
                              checked
                                ? "border-blue-200 bg-blue-600 text-white"
                                : "border-slate-200 bg-slate-50 text-slate-400"
                            }`}
                            title={checked ? "Enabled" : "Disabled"}
                          >
                            {checked ? <FaCheck className="text-[8px]" /> : "-"}
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
                            className="h-4 w-4 rounded border border-slate-300 text-[#4C35F2] focus:ring-[#4C35F2]"
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
  showHeader: PropTypes.bool,
  compact: PropTypes.bool,
  maxBodyHeight: PropTypes.string,
};

export default PermissionsMatrix;
