/**
 * Responsive Form Components
 * Professional form inputs with mobile-first design
 */

const gridCols = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

const mdGridCols = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
};

const lgGridCols = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
};

/**
 * Responsive Form Wrapper
 */
export const ResponsiveForm = ({ children, onSubmit, className = "" }) => (
  <form onSubmit={onSubmit} className={`space-y-4 md:space-y-5 ${className}`.trim()}>
    {children}
  </form>
);

/**
 * Responsive Form Group
 */
export const FormGroup = ({ children, className = "" }) => (
  <div className={`flex flex-col gap-2 ${className}`.trim()}>{children}</div>
);

/**
 * Responsive Label
 */
export const Label = ({ htmlFor, children, required = false }) => (
  <label
    htmlFor={htmlFor}
    className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-600"
  >
    {children}
    {required && <span className="ml-1 text-rose-500">*</span>}
  </label>
);

/**
 * Responsive Input
 */
export const Input = ({
  type = "text",
  placeholder,
  error,
  className = "",
  ...props
}) => (
  <div className="relative">
    <input
      type={type}
      placeholder={placeholder}
      className={`w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-none transition focus:border-blue-500 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:bg-slate-100 md:text-base ${
        error ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/10" : ""
      } ${className}`.trim()}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-rose-500 md:text-sm">{error}</p>}
  </div>
);

/**
 * Responsive Textarea
 */
export const Textarea = ({
  placeholder,
  rows = 4,
  error,
  className = "",
  ...props
}) => (
  <div className="relative">
    <textarea
      placeholder={placeholder}
      rows={rows}
      className={`w-full resize-none rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-none transition focus:border-blue-500 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:bg-slate-100 md:text-base ${
        error ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/10" : ""
      } ${className}`.trim()}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-rose-500 md:text-sm">{error}</p>}
  </div>
);

/**
 * Responsive Select
 */
export const Select = ({
  options = [],
  placeholder,
  error,
  className = "",
  ...props
}) => (
  <div className="relative">
    <select
      className={`w-full appearance-none rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-none transition focus:border-blue-500 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:bg-slate-100 md:text-base ${
        error ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/10" : ""
      } ${className}`.trim()}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {error && <p className="mt-1 text-xs text-rose-500 md:text-sm">{error}</p>}
  </div>
);

/**
 * Responsive Checkbox
 */
export const Checkbox = ({ label, id, error, className = "", ...props }) => (
  <div className="relative">
    <div className="flex items-center gap-2 md:gap-3">
      <input
        id={id}
        type="checkbox"
        className={`h-4 w-4 rounded-sm border-slate-300 text-blue-600 focus:ring-0 md:h-5 md:w-5 ${className}`.trim()}
        {...props}
      />
      {label && (
        <label
          htmlFor={id}
          className="cursor-pointer text-sm text-slate-700 md:text-base"
        >
          {label}
        </label>
      )}
    </div>
    {error && <p className="mt-1 text-xs text-rose-500 md:text-sm">{error}</p>}
  </div>
);

/**
 * Responsive Button
 */
export const Button = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  ...props
}) => {
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary:
      "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
  };

  const sizeClasses = {
    sm: "px-3 py-2 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors duration-200 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim()}
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
 * Responsive Grid Layout
 */
export const ResponsiveGrid = ({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 4,
}) => {
  const gapClass = {
    2: "gap-2",
    3: "gap-3",
    4: "gap-4",
    5: "gap-5",
    6: "gap-6",
  }[gap] || "gap-4";

  return (
    <div
      className={`grid ${gridCols[columns.mobile] || "grid-cols-1"} ${
        mdGridCols[columns.tablet] || "md:grid-cols-2"
      } ${lgGridCols[columns.desktop] || "lg:grid-cols-3"} ${gapClass}`}
    >
      {children}
    </div>
  );
};

/**
 * Responsive Card
 */
export const Card = ({ children, className = "" }) => (
  <div className={`rounded-[28px] border border-slate-200/80 bg-white/95 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm p-4 md:p-6 ${className}`.trim()}>{children}</div>
);

export default {
  ResponsiveForm,
  FormGroup,
  Label,
  Input,
  Textarea,
  Select,
  Checkbox,
  Button,
  ResponsiveGrid,
  Card,
};

