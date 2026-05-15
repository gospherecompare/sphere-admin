import React, { useState } from "react";
import { AlertCircle, CheckCircle, Eye, EyeOff } from "react-icons/fa";

/**
 * Advanced ERP Form Component
 * Supports 1, 2, 3, or 4 column layouts with mobile responsiveness
 */
export const ERPForm = ({
  children,
  onSubmit,
  columns = 1,
  gap = "gap-6",
  className = "",
  loading = false,
}) => {
  const gridClass =
    {
      1: "grid-cols-1",
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    }[columns] || "grid-cols-1";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className={`w-full ${className}`}
    >
      <div className={`grid ${gridClass} ${gap}`}>{children}</div>
    </form>
  );
};

/**
 * Form Section Component
 * Groups related form fields with section header
 */
export const FormSection = ({
  title,
  subtitle,
  icon,
  children,
  columns = 1,
  className = "",
}) => {
  const gridClass =
    {
      1: "grid-cols-1",
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    }[columns] || "grid-cols-1";

  return (
    <div className={`w-full ${className}`}>
      {/* Section Header */}
      {(title || subtitle) && (
        <div className="mb-6 pb-4 border-b-2 border-slate-100">
          <div className="flex items-center gap-3">
            {icon && <span className="text-2xl text-blue-600">{icon}</span>}
            <div>
              {title && (
                <h3 className="text-lg font-semibold text-slate-900">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grid Layout */}
      <div className={`grid ${gridClass} gap-6`}>{children}</div>
    </div>
  );
};

/**
 * Form Field Component
 * Wrapper for form inputs with label, error, and hint
 */
export const FormField = ({
  label,
  hint,
  error,
  required = false,
  children,
  fullWidth = false,
  className = "",
  layout = "vertical",
}) => {
  return (
    <div
      className={`
        ${layout === "horizontal" ? "flex items-end gap-4" : "flex flex-col gap-2"}
        ${fullWidth ? "col-span-full" : ""}
        ${className}
      `}
    >
      {label && (
        <label className="text-sm font-medium text-slate-900 block min-w-fit">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}

      <div className="flex-1 w-full">
        {children}

        {error && (
          <div className="flex items-center gap-2 mt-2 text-red-600">
            <AlertCircle size={16} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {hint && !error && (
          <p className="text-xs text-slate-500 mt-2">{hint}</p>
        )}
      </div>
    </div>
  );
};

/**
 * Enhanced Text Input
 */
export const ERPInput = ({
  type = "text",
  placeholder,
  error,
  icon: Icon,
  showPassword = false,
  onTogglePassword,
  disabled = false,
  className = "",
  ...props
}) => {
  const [showPasswordState, setShowPasswordState] = useState(showPassword);

  const togglePassword = () => {
    setShowPasswordState(!showPasswordState);
    onTogglePassword?.(!showPasswordState);
  };

  const inputType = type === "password" && showPasswordState ? "text" : type;

  return (
    <div className="relative w-full">
      {Icon && (
        <Icon
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none"
          size={18}
        />
      )}

      <input
        type={inputType}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full px-4 py-2.5 ${Icon ? "pl-10" : "px-4"}
          border-2 border-slate-200
          rounded-lg
          text-slate-900 placeholder-slate-400
          transition-all duration-200
          focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-50
          hover:border-slate-300
          disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
          ${error ? "border-red-500 focus:border-red-500 focus:ring-red-50" : ""}
          ${type === "password" ? "pr-10" : ""}
          ${className}
        `}
        {...props}
      />

      {type === "password" && (
        <button
          type="button"
          onClick={togglePassword}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {showPasswordState ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  );
};

/**
 * Enhanced Textarea
 */
export const ERPTextarea = ({
  placeholder,
  error,
  disabled = false,
  rows = 4,
  maxLength,
  showCount = true,
  value,
  className = "",
  ...props
}) => {
  return (
    <div className="w-full">
      <textarea
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        value={value}
        className={`
          w-full px-4 py-2.5
          border-2 border-slate-200
          rounded-lg
          text-slate-900 placeholder-slate-400
          transition-all duration-200
          focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-50
          hover:border-slate-300
          disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
          resize-none
          ${error ? "border-red-500 focus:border-red-500 focus:ring-red-50" : ""}
          ${className}
        `}
        {...props}
      />
      {maxLength && showCount && (
        <div className="text-xs text-slate-500 mt-2 text-right">
          {value?.length || 0}/{maxLength}
        </div>
      )}
    </div>
  );
};

/**
 * Form Actions (Buttons Row)
 */
export const FormActions = ({
  onSubmit,
  onCancel,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  saveAndNew = false,
  onSaveAndNew,
  loading = false,
  deleteAction,
  className = "",
}) => {
  return (
    <div
      className={`
        flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t-2 border-slate-100
        ${className}
      `}
    >
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className={`
            px-6 py-2.5 rounded-lg font-medium
            text-slate-700 bg-white border-2 border-slate-200
            hover:bg-slate-50 hover:border-slate-300
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-50
          `}
        >
          {cancelLabel}
        </button>
      )}

      {deleteAction && (
        <button
          type="button"
          onClick={deleteAction.onClick}
          className={`
            px-6 py-2.5 rounded-lg font-medium
            text-white bg-red-600
            hover:bg-red-700
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-red-50
            ml-auto sm:ml-0
          `}
        >
          {deleteAction.label || "Delete"}
        </button>
      )}

      {saveAndNew && onSaveAndNew && (
        <button
          type="button"
          onClick={onSaveAndNew}
          disabled={loading}
          className={`
            px-6 py-2.5 rounded-lg font-medium
            text-blue-600 bg-blue-50 border-2 border-blue-200
            hover:bg-blue-100 hover:border-blue-300
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-50
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {loading ? "Saving..." : "+ Save & New"}
        </button>
      )}

      <button
        type="submit"
        onClick={onSubmit}
        disabled={loading}
        className={`
          px-8 py-2.5 rounded-lg font-medium
          text-white bg-blue-600
          hover:bg-blue-700
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-50
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-center gap-2
          ml-auto
        `}
      >
        {loading ? (
          <>
            <span className="animate-spin">⏳</span>
            {submitLabel}...
          </>
        ) : (
          <>💾 {submitLabel}</>
        )}
      </button>
    </div>
  );
};

/**
 * Checkbox
 */
export const ERPCheckbox = ({
  label,
  checked,
  onChange,
  error,
  disabled = false,
  className = "",
}) => {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={`
            w-5 h-5 rounded-md border-2
            transition-all duration-200
            ${checked ? "bg-blue-600 border-blue-600" : "border-slate-300 bg-white"}
            ${error ? "border-red-500" : ""}
            group-hover:border-blue-500
            disabled:bg-slate-100 disabled:cursor-not-allowed
          `}
        >
          {checked && (
            <svg
              className="w-4 h-4 text-white absolute top-0.5 left-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </div>
      {label && (
        <span className="text-slate-900 font-medium select-none">{label}</span>
      )}
    </label>
  );
};

/**
 * Radio Group
 */
export const ERPRadio = ({
  label,
  checked,
  onChange,
  disabled = false,
  className = "",
}) => {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div className="relative">
        <input
          type="radio"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={`
            w-5 h-5 rounded-full border-2
            transition-all duration-200
            ${checked ? "bg-blue-600 border-blue-600" : "border-slate-300 bg-white"}
            group-hover:border-blue-500
            disabled:bg-slate-100 disabled:cursor-not-allowed
          `}
        >
          {checked && (
            <div className="w-2 h-2 bg-white rounded-full absolute top-1.5 left-1.5" />
          )}
        </div>
      </div>
      {label && (
        <span className="text-slate-900 font-medium select-none">{label}</span>
      )}
    </label>
  );
};

export default {
  ERPForm,
  FormSection,
  FormField,
  ERPInput,
  ERPTextarea,
  FormActions,
  ERPCheckbox,
  ERPRadio,
};
