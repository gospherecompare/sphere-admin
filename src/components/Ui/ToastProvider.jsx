import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FaCheck,
  FaExclamation,
  FaExclamationTriangle,
  FaInfo,
  FaTimes,
} from "react-icons/fa";

const ToastContext = createContext(null);

const DEFAULT_DURATION = 4200;
const TOAST_LIMIT = 5;

const TOAST_TYPES = {
  success: {
    title: "Success",
    accent: "bg-[linear-gradient(180deg,#3458ff_0%,#c13bf8_100%)]",
    icon: "bg-[linear-gradient(135deg,#3458ff_0%,#7a4dff_52%,#c13bf8_100%)] text-white shadow-[0_10px_22px_rgba(76,53,242,0.28)]",
    titleClass: "text-[#10162f]",
    Icon: FaCheck,
  },
  info: {
    title: "Info",
    accent: "bg-[linear-gradient(180deg,#3458ff_0%,#c13bf8_100%)]",
    icon: "bg-[linear-gradient(135deg,#3458ff_0%,#7a4dff_52%,#c13bf8_100%)] text-white shadow-[0_10px_22px_rgba(76,53,242,0.28)]",
    titleClass: "text-[#10162f]",
    Icon: FaInfo,
  },
  warning: {
    title: "Warning",
    accent: "bg-[linear-gradient(180deg,#3458ff_0%,#c13bf8_100%)]",
    icon: "bg-[linear-gradient(135deg,#3458ff_0%,#7a4dff_52%,#c13bf8_100%)] text-white shadow-[0_10px_22px_rgba(76,53,242,0.28)]",
    titleClass: "text-[#10162f]",
    Icon: FaExclamation,
  },
  error: {
    title: "Error",
    accent: "bg-[linear-gradient(180deg,#3458ff_0%,#c13bf8_100%)]",
    icon: "bg-[linear-gradient(135deg,#3458ff_0%,#7a4dff_52%,#c13bf8_100%)] text-white shadow-[0_10px_22px_rgba(76,53,242,0.28)]",
    titleClass: "text-[#10162f]",
    Icon: FaExclamationTriangle,
  },
};

const getToastType = (type) => (TOAST_TYPES[type] ? type : "info");

const normalizeToastOptions = (type, message, titleOrOptions, maybeOptions) => {
  const safeType = getToastType(type);
  let options = maybeOptions || {};
  let title = TOAST_TYPES[safeType].title;

  if (typeof titleOrOptions === "string") {
    title = titleOrOptions;
  } else if (titleOrOptions && typeof titleOrOptions === "object") {
    options = titleOrOptions;
    title = titleOrOptions.title || title;
  }

  return {
    ...options,
    type: safeType,
    title,
    message,
  };
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const dismiss = useCallback((id) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (toast) => {
      const safeType = getToastType(toast?.type);
      const message = String(toast?.message || "").trim();
      const title = String(toast?.title || TOAST_TYPES[safeType].title).trim();

      if (!message && !title) return null;

      const id =
        toast?.id ||
        `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const nextToast = {
        id,
        type: safeType,
        title,
        message,
      };

      setToasts((current) => [...current, nextToast].slice(-TOAST_LIMIT));

      const duration =
        Number.isFinite(toast?.duration) && toast.duration >= 0
          ? toast.duration
          : DEFAULT_DURATION;

      if (duration > 0) {
        const timer = window.setTimeout(() => dismiss(id), duration);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      show,
      dismiss,
      success: (message, titleOrOptions, options) =>
        show(normalizeToastOptions("success", message, titleOrOptions, options)),
      info: (message, titleOrOptions, options) =>
        show(normalizeToastOptions("info", message, titleOrOptions, options)),
      warning: (message, titleOrOptions, options) =>
        show(normalizeToastOptions("warning", message, titleOrOptions, options)),
      error: (message, titleOrOptions, options) =>
        show(normalizeToastOptions("error", message, titleOrOptions, options)),
    }),
    [dismiss, show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-3 top-4 z-[10000] flex flex-col items-stretch gap-3 sm:inset-x-auto sm:right-5 sm:w-[min(420px,calc(100vw-2rem))]"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => {
          const config = TOAST_TYPES[toast.type] || TOAST_TYPES.info;
          const Icon = config.Icon;

          return (
            <div
              key={toast.id}
              role={toast.type === "error" ? "alert" : "status"}
              className="pointer-events-auto flex min-h-[92px] overflow-hidden rounded-md border border-[#dfe3ff] bg-[linear-gradient(135deg,#ffffff_0%,#f7f8ff_62%,#fbf5ff_100%)] shadow-[0_18px_55px_rgba(52,88,255,0.22)]"
            >
              <span className={`w-1 shrink-0 ${config.accent}`} />
              <div className="flex min-w-0 flex-1 items-start gap-4 px-5 py-5">
                <span
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${config.icon}`}
                >
                  <Icon />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-base font-bold ${config.titleClass}`}>
                    {toast.title}
                  </p>
                  {toast.message ? (
                    <p className="mt-1 text-sm leading-5 text-[#596175]">
                      {toast.message}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  className="mt-0.5 rounded p-1 text-[#98a1bd] transition hover:bg-[#eef2ff] hover:text-[#3458ff]"
                  aria-label="Dismiss notification"
                >
                  <FaTimes className="text-lg" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
};
