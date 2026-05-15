import React from "react";
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaInfoCircle,
  FaTimes,
} from "react-icons/fa";

const shellClass =
  "rounded-[24px] border border-slate-200/80 bg-white/95 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur-sm";

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100";

/**
 * ERP Button Component
 */
export const Button = ({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick = null,
  className = "",
  ...props
}) => {
  const variants = {
    primary:
      "bg-slate-950 text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800",
    secondary:
      "bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500",
    outline:
      "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
    ghost: "text-slate-700 hover:bg-slate-100",
    danger: "bg-rose-600 text-white hover:bg-rose-500",
    success: "bg-emerald-600 text-white hover:bg-emerald-500",
  };

  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const baseClass =
    "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <button
      className={`${baseClass} ${variants[variant]} ${sizes[size]} ${
        fullWidth ? "w-full" : ""
      } ${className}`.trim()}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
      )}
      {children}
    </button>
  );
};

/**
 * ERP Input Component
 */
export const Input = ({
  label,
  error,
  hint,
  disabled = false,
  required = false,
  className = "",
  ...props
}) => {
  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="text-sm font-semibold text-slate-800">
          {label}
          {required && <span className="ml-1 text-rose-500">*</span>}
        </label>
      )}
      <input
        className={`${inputClass} ${
          error
            ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10"
            : ""
        } ${className}`.trim()}
        disabled={disabled}
        {...props}
      />
      {error && <p className="text-sm text-rose-600">{error}</p>}
      {hint && !error && <p className="text-sm text-slate-500">{hint}</p>}
    </div>
  );
};

/**
 * ERP Select Component
 */
export const Select = ({
  label,
  options = [],
  error,
  hint,
  disabled = false,
  required = false,
  className = "",
  ...props
}) => {
  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="text-sm font-semibold text-slate-800">
          {label}
          {required && <span className="ml-1 text-rose-500">*</span>}
        </label>
      )}
      <select
        className={`${inputClass} appearance-none ${
          error
            ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10"
            : ""
        } ${className}`.trim()}
        disabled={disabled}
        {...props}
      >
        <option value="">Select {label || "option"}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      {hint && !error && <p className="text-sm text-slate-500">{hint}</p>}
    </div>
  );
};

/**
 * ERP Alert Component
 */
export const Alert = ({
  type = "info",
  title,
  message,
  onClose,
  closeable = true,
  className = "",
}) => {
  const types = {
    success: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-900",
      icon: FaCheckCircle,
      iconColor: "text-emerald-600",
    },
    error: {
      bg: "bg-rose-50",
      border: "border-rose-200",
      text: "text-rose-900",
      icon: FaExclamationCircle,
      iconColor: "text-rose-600",
    },
    warning: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-900",
      icon: FaExclamationCircle,
      iconColor: "text-amber-600",
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-900",
      icon: FaInfoCircle,
      iconColor: "text-blue-600",
    },
  };

  const config = types[type];
  const Icon = config.icon;

  return (
    <div
      className={`${config.bg} ${config.border} ${config.text} flex items-start gap-3 rounded-2xl border px-4 py-3 ${className}`.trim()}
      role="alert"
    >
      <Icon className={`${config.iconColor} mt-0.5 shrink-0`} size={18} />
      <div className="flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {message && <p className="mt-1 text-sm">{message}</p>}
      </div>
      {closeable && (
        <button
          onClick={onClose}
          className="shrink-0 text-slate-400 transition-colors hover:text-slate-700"
          aria-label="Close alert"
        >
          <FaTimes size={14} />
        </button>
      )}
    </div>
  );
};

/**
 * ERP Badge Component
 */
export const Badge = ({
  children,
  variant = "default",
  size = "md",
  className = "",
}) => {
  const variants = {
    default: "border border-slate-200 bg-slate-100 text-slate-700",
    primary: "border border-blue-200 bg-blue-50 text-blue-800",
    secondary: "border border-blue-200 bg-blue-50 text-blue-800",
    success: "border border-emerald-200 bg-emerald-50 text-emerald-800",
    warning: "border border-amber-200 bg-amber-50 text-amber-800",
    error: "border border-rose-200 bg-rose-50 text-rose-800",
  };

  const sizes = {
    sm: "px-2 py-1 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${variants[variant]} ${sizes[size]} ${className}`.trim()}
    >
      {children}
    </span>
  );
};

/**
 * ERP Stat Card Component
 */
export const StatCard = ({
  title,
  value,
  change,
  icon: Icon,
  color = "primary",
}) => {
  const colorClass = {
    primary: "bg-blue-50 text-blue-600 ring-blue-100",
    cyan: "bg-blue-50 text-blue-600 ring-blue-100",
    blue: "bg-blue-50 text-blue-600 ring-blue-100",
    green: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    red: "bg-rose-50 text-rose-600 ring-rose-100",
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
    purple: "bg-indigo-50 text-indigo-600 ring-indigo-100",
  }[color];

  return (
    <div className={`${shellClass} p-5`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-[-0.03em] text-slate-950">
            {value}
          </p>
        </div>
        {Icon && (
          <div className={`rounded-2xl p-3 ring-1 ${colorClass}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
      {change && (
        <p
          className={`text-sm font-semibold ${
            change.positive ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {change.positive ? "+ " : "- "}
          {change.value} {change.label}
        </p>
      )}
    </div>
  );
};

/**
 * ERP Progress Bar Component
 */
export const ProgressBar = ({
  value,
  max = 100,
  label,
  showValue = true,
  color = "primary",
  size = "md",
}) => {
  const percentage = (value / max) * 100;

  const colorClass = {
    primary: "bg-blue-500",
    cyan: "bg-blue-500",
    blue: "bg-blue-500",
    green: "bg-emerald-500",
    red: "bg-rose-500",
    purple: "bg-indigo-500",
  }[color];

  const sizeClass = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-3.5",
  }[size];

  return (
    <div className="w-full">
      {label && (
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-slate-700">{label}</p>
          {showValue && (
            <p className="text-sm font-medium text-slate-500">
              {percentage.toFixed(0)}%
            </p>
          )}
        </div>
      )}
      <div
        className={`w-full overflow-hidden rounded-full bg-slate-100 ${sizeClass}`}
      >
        <div
          className={`${colorClass} h-full rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

/**
 * ERP Loading Spinner Component
 */
export const Spinner = ({ size = "md", color = "primary", label }) => {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const colorClass = {
    primary: "text-blue-600",
    cyan: "text-blue-600",
    blue: "text-blue-600",
    gray: "text-slate-400",
    purple: "text-indigo-600",
  }[color];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`${sizes[size]} ${colorClass} animate-spin`}>
        <svg
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
      {label && <p className="text-sm text-slate-500">{label}</p>}
    </div>
  );
};

export default {
  Button,
  Input,
  Select,
  Alert,
  Badge,
  StatCard,
  ProgressBar,
  Spinner,
};

