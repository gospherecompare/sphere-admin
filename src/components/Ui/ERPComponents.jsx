import React from "react";
import { CheckCircle, AlertCircle, Info, X } from "react-icons/fa";

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
    primary: "bg-purple-600 hover:bg-purple-700 text-white",
    secondary: "bg-blue-600 hover:bg-blue-700 text-white",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50",
    ghost: "text-gray-700 hover:bg-gray-100",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    success: "bg-green-600 hover:bg-green-700 text-white",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const baseClass =
    "btn-responsive font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <button
      className={`${baseClass} ${variants[variant]} ${sizes[size]} ${
        fullWidth ? "w-full" : ""
      } ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="animate-spin">⏳</span>
          Loading...
        </span>
      ) : (
        children
      )}
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
    <div className="form-group w-full">
      {label && (
        <label className="text-sm font-medium text-gray-900">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        className={`form-input ${error ? "border-red-500" : ""} ${className}`}
        disabled={disabled}
        {...props}
      />
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
      {hint && !error && <p className="text-sm text-gray-500 mt-1">{hint}</p>}
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
    <div className="form-group w-full">
      {label && (
        <label className="text-sm font-medium text-gray-900">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        className={`form-select ${error ? "border-red-500" : ""} ${className}`}
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
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
      {hint && !error && <p className="text-sm text-gray-500 mt-1">{hint}</p>}
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
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-800",
      icon: CheckCircle,
      iconColor: "text-green-600",
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      icon: AlertCircle,
      iconColor: "text-red-600",
    },
    warning: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-800",
      icon: AlertCircle,
      iconColor: "text-amber-600",
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-800",
      icon: Info,
      iconColor: "text-blue-600",
    },
  };

  const config = types[type];
  const Icon = config.icon;

  return (
    <div
      className={`${config.bg} border ${config.border} ${config.text} px-4 py-3 rounded-lg flex items-start gap-3 ${className}`}
      role="alert"
    >
      <Icon className={`${config.iconColor} mt-0.5 flex-shrink-0`} size={20} />
      <div className="flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {message && <p className="text-sm mt-1">{message}</p>}
      </div>
      {closeable && (
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 flex-shrink-0"
          aria-label="Close alert"
        >
          <X size={16} />
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
    default: "bg-gray-100 text-gray-900",
    primary: "bg-purple-100 text-purple-900",
    secondary: "bg-blue-100 text-blue-900",
    success: "bg-green-100 text-green-900",
    warning: "bg-amber-100 text-amber-900",
    error: "bg-red-100 text-red-900",
  };

  const sizes = {
    sm: "px-2 py-1 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${variants[variant]} ${sizes[size]} ${className}`}
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
  color = "purple",
}) => {
  const colorClass = {
    purple: "bg-purple-50 text-purple-600",
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
  }[color];

  return (
    <div className="card-responsive">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        {Icon && (
          <div className={`${colorClass} p-3 rounded-lg`}>
            <Icon size={24} />
          </div>
        )}
      </div>
      {change && (
        <p
          className={`text-sm font-medium ${change.positive ? "text-green-600" : "text-red-600"}`}
        >
          {change.positive ? "↑" : "↓"} {change.value} {change.label}
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
  color = "purple",
  size = "md",
}) => {
  const percentage = (value / max) * 100;

  const colorClass = {
    purple: "bg-purple-600",
    blue: "bg-blue-600",
    green: "bg-green-600",
    red: "bg-red-600",
  }[color];

  const sizeClass = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-3.5",
  }[size];

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-medium text-gray-700">{label}</p>
          {showValue && (
            <p className="text-sm text-gray-600">{percentage.toFixed(0)}%</p>
          )}
        </div>
      )}
      <div
        className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClass}`}
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
export const Spinner = ({ size = "md", color = "purple", label }) => {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const colorClass = {
    purple: "text-purple-600",
    blue: "text-blue-600",
    gray: "text-gray-400",
  }[color];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`${sizes[size]} ${colorClass} animate-spin`}>
        <svg
          className="w-full h-full"
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
      {label && <p className="text-gray-600 text-sm">{label}</p>}
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
