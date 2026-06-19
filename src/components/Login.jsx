import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import {
  HiOutlineArrowRight,
  HiOutlineBackspace,
  HiOutlineCheckBadge,
  HiOutlineClock,
  HiOutlineEnvelope,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineLockClosed,
  HiOutlinePresentationChartLine,
  HiOutlineShieldCheck,
} from "react-icons/hi2";
import { buildUrl } from "../api";

const AUTH_NOTICE_STORAGE_KEY = "hooksAdminAuthNotice";
const POST_LOGIN_REDIRECT_KEY = "hooksAdminPostLoginRedirect";
const POST_LOGIN_REDIRECT_MAX_AGE_MS = 1000 * 60 * 30;
const POST_LOGIN_UPDATES_POSTER_KEY = "hooksAdminShowLoginUpdatesPoster";
const SESSION_USER_STORAGE_KEY = "hooksAdminSessionUser";

const STEPS = {
  credentials: "credentials",
  pin: "pin",
  pinSetup: "pin_setup",
};

const MIN_PIN_LENGTH = 7;
const MAX_PIN_LENGTH = 7;

const INPUT_WRAPPER =
  "group relative overflow-hidden rounded-2xl border border-transparent bg-white/10 transition duration-200 focus-within:border-[#4b61ff]";
const INPUT_ICON =
  "pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#98a1bd] transition group-focus-within:text-[#4b61ff]";
const INPUT_FIELD =
  "h-[46px] w-full bg-transparent pl-12 pr-4 text-[15px] text-slate-100 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:text-slate-400";
const PRIMARY_BUTTON =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#3458ff] via-[#5d58ff] to-[#c13bf8] px-5 text-[15px] font-semibold text-white transition duration-200 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60";
const PIN_PRIMARY_BUTTON =
  "inline-flex h-[64px] w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#4c2fff] via-[#5a27ff] to-[#7a1fff] px-6 text-[1.05rem] font-semibold text-white transition duration-200 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60";

const promoFeatures = [
  {
    icon: HiOutlinePresentationChartLine,
    title: "Data-driven insights",
    description: "Get accurate analytics and trends to guide better decisions.",
    iconClass:
      "bg-[linear-gradient(135deg,rgba(109,83,255,0.14)_0%,rgba(75,112,255,0.08)_100%)] text-[#5b38ff]",
  },
  {
    icon: HiOutlineShieldCheck,
    title: "Secure & reliable",
    description: "Enterprise-grade protection to keep your workflows safe.",
    iconClass:
      "bg-[linear-gradient(135deg,rgba(70,119,255,0.14)_0%,rgba(127,97,255,0.08)_100%)] text-[#3458ff]",
  },
];

const pinAccessFeatures = [
  {
    icon: HiOutlineLockClosed,
    title: "Secure",
    description: "Protected admin area with 7-digit PIN",
  },
  {
    icon: HiOutlineCheckBadge,
    title: "Fast Access",
    description: "Quick & secure authentication",
  },
  {
    icon: HiOutlineClock,
    title: "Session Protected",
    description: "Auto-logout for inactivity",
  },
];

const pinAccessBadges = ["Encrypted", "Verified", "Admin Only"];
const pinPadLayout = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["empty", "0", "backspace"],
];

const StatusMessage = ({ tone = "info", children }) => {
  const tones = {
    info: "border-blue-200 bg-blue-50 text-blue-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    error: "border-rose-200 bg-rose-50 text-rose-700",
  };

  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${tones[tone]}`}
    >
      {children}
    </div>
  );
};

const HeroBrand = ({ dark = true, compact = false }) => (
  <div className="flex items-center gap-3">
    <div>
      <div
        className={`${compact ? "text-[2rem]" : "text-[2.35rem]"} font-semibold leading-none tracking-[-0.01em] "
        } uppercase`}
      >
        HOOKS
      </div>
      <div
        className={`mt-1 text-[10px] uppercase tracking-[0.24em] ${
          dark ? "text-[#6f7897]" : "text-white/75"
        }`}
      >
        Gadget Intelligence
      </div>
    </div>
  </div>
);

const PinAccessBrand = () => <HeroBrand dark={false} />;

const PromoFeature = ({
  icon,
  title,
  description,
  iconClass,
  darkSurface = false,
}) => {
  const Icon = icon;

  return (
    <div className="flex items-start gap-4">
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
          darkSurface
            ? "border border-white/12 shadow-[0_16px_32px_rgba(0,0,0,0.22)]"
            : "shadow-[0_14px_28px_rgba(77,92,152,0.08)]"
        } ${iconClass}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div
          className={`text-[15px] font-semibold leading-6 ${
            darkSurface ? "text-white" : "text-[#111936]"
          }`}
        >
          {title}
        </div>
        <p
          className={`mt-1 text-[14px] leading-6 ${
            darkSurface ? "text-white/72" : "text-[#66708f]"
          }`}
        >
          {description}
        </p>
      </div>
    </div>
  );
};

const PinAccessFeatureCard = ({ icon, title, description }) => {
  const Icon = icon;

  return (
    <div className="rounded-md  bg-white/[0.04] px-4 py-5 sm:px-5 sm:py-6">
      <div className="mx-auto flex h-[52px] w-[52px] items-center justify-center rounded-md bg-[linear-gradient(180deg,rgba(121,91,255,0.24)_0%,rgba(105,75,255,0.10)_100%)] text-[#8f7bff]">
        <Icon className="h-8 w-8" />
      </div>
      <div className="mt-4 text-center text-[0.98rem] font-semibold text-white">
        {title}
      </div>
      <p className="mt-2 text-center text-[14px] leading-6 text-white/66">
        {description}
      </p>
    </div>
  );
};

const PinPadButton = ({ children, onClick, disabled, className = "" }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`flex h-14 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-[1.5rem] font-semibold text-white transition duration-150 hover:border-white/20 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50 sm:h-[60px] sm:text-[1.7rem] ${className}`}
  >
    {children}
  </button>
);

const HeroDeviceArt = () => (
  <div className="mt-auto flex justify-center pt-3 md:pt-4 lg:pt-5">
    <svg
      viewBox="0 0 760 420"
      aria-hidden="true"
      className="h-[120px] w-full max-w-[420px] md:h-[150px] md:max-w-[500px] lg:h-[170px] lg:max-w-[560px]"
    >
      <defs>
        <linearGradient
          id="hooks-login-platform"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#23164f" />
          <stop offset="100%" stopColor="#090d24" />
        </linearGradient>
        <linearGradient
          id="hooks-login-platform-ring"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor="#3b6dff" />
          <stop offset="60%" stopColor="#8b5cff" />
          <stop offset="100%" stopColor="#d14cff" />
        </linearGradient>
        <linearGradient
          id="hooks-login-laptop-body"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#1f233d" />
          <stop offset="45%" stopColor="#746da2" />
          <stop offset="100%" stopColor="#12172b" />
        </linearGradient>
        <linearGradient
          id="hooks-login-screen"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#040814" />
          <stop offset="45%" stopColor="#15123c" />
          <stop offset="100%" stopColor="#351377" />
        </linearGradient>
        <linearGradient
          id="hooks-login-phone-metal"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#68577f" />
          <stop offset="55%" stopColor="#2c203f" />
          <stop offset="100%" stopColor="#19182a" />
        </linearGradient>
        <linearGradient
          id="hooks-login-phone-screen"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#120c27" />
          <stop offset="55%" stopColor="#361266" />
          <stop offset="100%" stopColor="#7b3cff" />
        </linearGradient>
        <radialGradient id="hooks-login-wave" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#7c8fff" />
          <stop offset="35%" stopColor="#b35cff" />
          <stop offset="100%" stopColor="rgba(28,14,64,0)" />
        </radialGradient>
        <radialGradient id="hooks-login-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(177,98,255,0.46)" />
          <stop offset="55%" stopColor="rgba(26,16,66,0.85)" />
          <stop offset="100%" stopColor="rgba(5,7,22,0)" />
        </radialGradient>
      </defs>

      <ellipse
        cx="380"
        cy="396"
        rx="286"
        ry="22"
        fill="url(#hooks-login-shadow)"
      />
      <ellipse
        cx="380"
        cy="360"
        rx="328"
        ry="54"
        fill="url(#hooks-login-platform)"
      />
      <ellipse
        cx="380"
        cy="336"
        rx="312"
        ry="43"
        fill="#12152d"
        stroke="rgba(255,255,255,0.08)"
      />
      <ellipse
        cx="380"
        cy="342"
        rx="300"
        ry="9"
        fill="url(#hooks-login-platform-ring)"
      />

      <g transform="translate(146 160)">
        <rect
          x="0"
          y="0"
          width="300"
          height="166"
          rx="14"
          fill="#0a0f1f"
          stroke="rgba(255,255,255,0.18)"
        />
        <rect
          x="8"
          y="8"
          width="284"
          height="150"
          rx="10"
          fill="url(#hooks-login-screen)"
        />
        <path
          d="M42 102C88 66 125 74 164 109C206 144 239 115 260 82"
          fill="none"
          stroke="#9066ff"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M54 113C96 82 134 92 170 124C199 151 230 137 259 104"
          fill="none"
          stroke="#4b72ff"
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.92"
        />
        <path
          d="M-28 170H328L294 190H8Z"
          fill="url(#hooks-login-laptop-body)"
          stroke="rgba(255,255,255,0.12)"
        />
        <rect
          x="114"
          y="174"
          width="76"
          height="7"
          rx="3.5"
          fill="#d5d7e4"
          opacity="0.95"
        />
      </g>

      <g transform="translate(516 72)">
        <rect
          x="0"
          y="0"
          width="104"
          height="206"
          rx="26"
          fill="url(#hooks-login-phone-metal)"
          stroke="rgba(255,255,255,0.16)"
        />
        <circle
          cx="24"
          cy="34"
          r="11"
          fill="#171b31"
          stroke="rgba(255,255,255,0.24)"
        />
        <circle
          cx="24"
          cy="67"
          r="11"
          fill="#171b31"
          stroke="rgba(255,255,255,0.24)"
        />
        <circle
          cx="57"
          cy="34"
          r="11"
          fill="#171b31"
          stroke="rgba(255,255,255,0.24)"
        />
        <circle
          cx="57"
          cy="67"
          r="11"
          fill="#171b31"
          stroke="rgba(255,255,255,0.24)"
        />
        <circle cx="78" cy="49" r="6" fill="rgba(255,255,255,0.46)" />
      </g>

      <g transform="translate(582 122)">
        <rect
          x="0"
          y="0"
          width="118"
          height="212"
          rx="30"
          fill="#0a0e22"
          stroke="rgba(255,255,255,0.18)"
        />
        <rect
          x="8"
          y="10"
          width="102"
          height="192"
          rx="24"
          fill="url(#hooks-login-phone-screen)"
        />
        <rect
          x="40"
          y="14"
          width="38"
          height="5"
          rx="2.5"
          fill="rgba(255,255,255,0.18)"
        />
        <path
          d="M22 122C38 87 76 80 92 58C96 50 101 40 108 28"
          fill="none"
          stroke="#a758ff"
          strokeWidth="7"
          strokeLinecap="round"
          opacity="0.94"
        />
        <path
          d="M18 152C39 136 58 138 76 114C89 96 98 84 111 72"
          fill="none"
          stroke="#5a7cff"
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.95"
        />
      </g>

      <g transform="translate(492 258)">
        <rect
          x="0"
          y="0"
          width="58"
          height="96"
          rx="20"
          fill="#111628"
          stroke="rgba(255,255,255,0.12)"
        />
        <rect x="5" y="6" width="48" height="84" rx="16" fill="#080d1b" />
        <text
          x="29"
          y="42"
          fill="white"
          fontSize="18"
          fontWeight="700"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
        >
          10
        </text>
        <text
          x="29"
          y="62"
          fill="#b76dff"
          fontSize="18"
          fontWeight="700"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
        >
          09
        </text>
      </g>

      <g transform="translate(574 314)">
        <rect
          x="0"
          y="18"
          width="66"
          height="42"
          rx="18"
          fill="#f4f6ff"
          stroke="rgba(42,42,56,0.15)"
        />
        <rect
          x="4"
          y="0"
          width="34"
          height="50"
          rx="16"
          fill="#f5f7ff"
          stroke="rgba(42,42,56,0.15)"
        />
        <circle cx="21" cy="21" r="9" fill="#171b2f" />
        <circle cx="22" cy="22" r="4" fill="#29345b" />
        <rect x="11" y="32" width="18" height="14" rx="7" fill="#d4d8f4" />
        <circle cx="17" cy="39" r="3.2" fill="#ffffff" />
        <circle cx="23" cy="39" r="3.2" fill="#ffffff" />
        <circle cx="17" cy="39" r="1.2" fill="#171b2f" />
        <circle cx="23" cy="39" r="1.2" fill="#171b2f" />
        <circle cx="48" cy="38" r="8" fill="#171b2f" />
        <circle cx="48" cy="38" r="3.6" fill="#29345b" />
      </g>
    </svg>
  </div>
);

const PinBoxesField = ({
  label,
  value,
  onChange,
  disabled,
  autoFocus = false,
  masked = false,
  isActive = true,
  onActivate,
}) => {
  const inputRef = useRef(null);
  const normalized = String(value || "")
    .replace(/\D/g, "")
    .slice(0, MAX_PIN_LENGTH);

  const focusInput = () => {
    if (disabled) return;
    if (typeof onActivate === "function") {
      onActivate();
    }

    const node = inputRef.current;
    if (!node) return;

    node.focus({ preventScroll: true });

    try {
      const caret = String(node.value || "").length;
      node.setSelectionRange(caret, caret);
    } catch {
      // Ignore browsers that do not support selection ranges here.
    }
  };

  useEffect(() => {
    if (!autoFocus || disabled) return;

    const timer = setTimeout(() => {
      focusInput();
    }, 0);

    return () => clearTimeout(timer);
  }, [autoFocus, disabled]);

  return (
    <div>
      {label ? (
        <button
          type="button"
          onClick={focusInput}
          className={`mb-3 block text-left text-sm font-semibold transition ${
            isActive ? "text-[#8d7dff]" : "text-white/58"
          }`}
        >
          {label}
        </button>
      ) : null}

      <div className="relative" onClick={focusInput}>
        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          minLength={MIN_PIN_LENGTH}
          maxLength={MAX_PIN_LENGTH}
          autoComplete="one-time-code"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          autoFocus={autoFocus}
          value={normalized}
          onChange={(event) =>
            onChange(
              event.target.value.replace(/\D/g, "").slice(0, MAX_PIN_LENGTH),
            )
          }
          onFocus={onActivate}
          disabled={disabled}
          className="absolute inset-0 z-10 h-full w-full cursor-text appearance-none rounded-md border-0 bg-transparent text-transparent caret-transparent outline-none disabled:cursor-not-allowed"
          style={{ WebkitTextFillColor: "transparent" }}
          aria-label={label || "Organization PIN"}
        />

        <div className="pointer-events-none mx-auto grid w-full max-w-[392px] grid-cols-7 gap-1.5 sm:max-w-[462px] sm:gap-2.5">
          {Array.from({ length: MAX_PIN_LENGTH }).map((_, index) => {
            const digit = normalized[index] || "";
            const filled = Boolean(digit);
            const active =
              isActive &&
              !disabled &&
              index === Math.min(normalized.length, MAX_PIN_LENGTH - 1);

            return (
              <div
                key={`${label || "pin"}-${index}`}
                className={`flex aspect-square w-full items-center justify-center rounded-md border text-[1.2rem] font-semibold transition sm:text-[1.55rem] ${
                  filled
                    ? "border-white/20 bg-white text-[#101734]"
                    : active
                      ? "border-[#6e58ff] bg-white/[0.08] text-white"
                      : "border-white/10 bg-white/[0.04] text-transparent"
                }`}
              >
                {digit ? (masked ? "\u2022" : digit) : active ? "|" : ""}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const Login = ({ onLogin }) => {
  const [form, setForm] = useState({
    email: "",
    password: "",
    pin: "",
    newPin: "",
    confirmPin: "",
  });
  const [step, setStep] = useState(STEPS.credentials);
  const [loginTicket, setLoginTicket] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showPinValue, setShowPinValue] = useState(false);
  const [activePinField, setActivePinField] = useState("pin");

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    try {
      const saved = localStorage.getItem("savedEmail");
      if (saved) {
        setForm((value) => ({ ...value, email: saved }));
        setRememberMe(true);
      }

      const storedNotice = sessionStorage.getItem(AUTH_NOTICE_STORAGE_KEY);
      if (location.state?.reason === "session_expired") {
        setNotice("Session timed out. Please log in again.");
      } else if (storedNotice) {
        setNotice(storedNotice);
      }

      if (storedNotice) {
        sessionStorage.removeItem(AUTH_NOTICE_STORAGE_KEY);
      }
    } catch {
      // Continue with the login form when storage access is unavailable.
    }
  }, [location.state]);

  useEffect(() => {
    if (step === STEPS.pin) {
      setActivePinField("pin");
      setShowPinValue(false);
    } else if (step === STEPS.pinSetup) {
      setActivePinField("newPin");
      setShowPinValue(false);
    }
  }, [step]);

  const normalizeRedirect = (path) =>
    path &&
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.startsWith("/login")
      ? path
      : null;

  const normalizePinValue = (nextValue) =>
    String(nextValue || "")
      .replace(/\D/g, "")
      .slice(0, MAX_PIN_LENGTH);

  const updatePinField = (field, nextValue) => {
    const normalized = normalizePinValue(nextValue);

    setForm((value) => ({
      ...value,
      [field]: normalized,
    }));
    setError("");
  };

  const currentPinField = step === STEPS.pin ? "pin" : activePinField;

  const appendPinDigit = (digit) => {
    if (loading) return;

    const field = currentPinField || "pin";
    const currentValue = String(form[field] || "");
    if (currentValue.length >= MAX_PIN_LENGTH) return;

    updatePinField(field, `${currentValue}${digit}`);

    if (
      step === STEPS.pinSetup &&
      field === "newPin" &&
      currentValue.length + 1 >= MAX_PIN_LENGTH &&
      !String(form.confirmPin || "").length
    ) {
      setActivePinField("confirmPin");
    }
  };

  const removePinDigit = () => {
    if (loading) return;

    const field = currentPinField || "pin";
    const currentValue = String(form[field] || "");
    updatePinField(field, currentValue.slice(0, -1));
  };

  const validatePinSetup = () => {
    const newPin = String(form.newPin || "").trim();
    const confirmPin = String(form.confirmPin || "").trim();

    if (
      !new RegExp(`^\\d{${MIN_PIN_LENGTH},${MAX_PIN_LENGTH}}$`).test(newPin)
    ) {
      return "Organization PIN must be exactly 7 digits.";
    }

    if (newPin !== confirmPin) {
      return "Organization PIN confirmation does not match.";
    }

    return "";
  };

  const clearAll = (keepEmail = true) => {
    setStep(STEPS.credentials);
    setLoginTicket("");
    setShowPassword(false);
    setError("");

    if (keepEmail) {
      setForm((value) => ({
        ...value,
        password: "",
        pin: "",
        newPin: "",
        confirmPin: "",
      }));
    } else {
      setForm({
        email: "",
        password: "",
        pin: "",
        newPin: "",
        confirmPin: "",
      });
      setRememberMe(false);
    }
  };

  const startPending = (data) => {
    const nextStep = String(data?.nextStep || "");
    setStep(nextStep);
    setLoginTicket(String(data?.loginTicket || ""));
    setNotice(
      String(data?.message || "").trim() ||
        (nextStep === STEPS.pinSetup &&
          "Create the organization PIN to finish signing in."),
    );
    setForm((value) => ({
      ...value,
      password: "",
      pin: "",
      newPin: "",
      confirmPin: "",
    }));
  };

  const finish = (data) => {
    const user = data?.user || {};
    const cookieUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      username: user.username || user.user_name,
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      display_name: user.display_name || user.username || user.email || "",
    };

    if (data?.token) {
      Cookies.set("authToken", data.token, {
        expires: rememberMe ? 7 : 1,
        secure: false,
        sameSite: "strict",
        path: "/",
      });
    }

    if (user.username) {
      Cookies.set("username", user.username, {
        expires: rememberMe ? 7 : 1,
        secure: false,
        sameSite: "strict",
        path: "/",
      });
    }

    if (user.role) {
      Cookies.set("role", user.role, {
        expires: rememberMe ? 7 : 1,
        secure: false,
        sameSite: "strict",
        path: "/",
      });
    }

    Cookies.set("loginAt", new Date().toISOString(), {
      expires: rememberMe ? 7 : 1,
      secure: false,
      sameSite: "strict",
      path: "/",
    });

    if (data?.user) {
      Cookies.set("user", JSON.stringify(cookieUser), {
        expires: rememberMe ? 7 : 1,
        secure: false,
        sameSite: "strict",
        path: "/",
      });
    }

    if (typeof onLogin === "function") {
      onLogin(data);
    }

    try {
      sessionStorage.setItem(POST_LOGIN_UPDATES_POSTER_KEY, "1");
      localStorage.setItem(SESSION_USER_STORAGE_KEY, JSON.stringify(data.user));
      if (data?.token) {
        localStorage.setItem("authToken", data.token);
      }

      if (rememberMe) {
        localStorage.setItem("savedEmail", String(form.email || "").trim());
      } else {
        localStorage.removeItem("savedEmail");
      }
    } catch {
      // Fall back to the default redirect when storage writes fail.
    }

    let redirect = normalizeRedirect(location.state?.from) || "/dashboard";

    try {
      const raw = sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY);
      if (raw && redirect === "/dashboard") {
        const parsed = JSON.parse(raw);
        if (
          !parsed?.savedAt ||
          Date.now() - Number(parsed.savedAt) <= POST_LOGIN_REDIRECT_MAX_AGE_MS
        ) {
          redirect = normalizeRedirect(parsed?.path) || redirect;
        }
      }
      sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
      sessionStorage.removeItem(AUTH_NOTICE_STORAGE_KEY);
    } catch {
      // Ignore invalid stored redirect data and continue normally.
    }

    clearAll(true);
    setNotice("");
    navigate(redirect, { replace: true });
  };

  const submitCredentials = async () => {
    const res = await fetch(buildUrl("/api/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: String(form.email || "").trim(),
        password: form.password,
      }),
    });
    const data = await res.json().catch(() => ({}));

    if (
      res.ok &&
      (data?.nextStep === STEPS.pin || data?.nextStep === STEPS.pinSetup)
    ) {
      startPending(data);
      return;
    }

    if (res.ok && data?.token) {
      finish(data);
      return;
    }

    setError(data.message || "Login failed. Please try again.");
  };

  const submitPin = async () => {
    if (!loginTicket) {
      setError("Your sign-in session expired. Please log in again.");
      return;
    }

    const res = await fetch(buildUrl("/api/auth/login/pin"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        loginTicket,
        pin: String(form.pin || "").trim(),
      }),
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok && data?.token) {
      finish(data);
      return;
    }

    setError(data.message || "Organization PIN verification failed.");
    if (res.status === 401 || res.status === 410) {
      clearAll(true);
    }
  };

  const submitPinSetup = async () => {
    if (!loginTicket) {
      setError("Your sign-in session expired. Please log in again.");
      return;
    }

    const validationError = validatePinSetup();
    if (validationError) {
      setError(validationError);
      return;
    }

    const res = await fetch(buildUrl("/api/auth/login/pin/setup/verify"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        loginTicket,
        newPin: String(form.newPin || "").trim(),
      }),
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok && data?.token) {
      finish(data);
      return;
    }

    setError(data.message || "Unable to create the organization PIN.");
    if (res.status === 401 || res.status === 410) {
      clearAll(true);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      sessionStorage.removeItem(AUTH_NOTICE_STORAGE_KEY);
    } catch {
      // Ignore storage failures.
    }

    setLoading(true);
    try {
      if (step === STEPS.pin) {
        await submitPin();
      } else if (step === STEPS.pinSetup) {
        await submitPinSetup();
      } else {
        await submitCredentials();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isPinStep = step === STEPS.pin || step === STEPS.pinSetup;
  const isPinOverlayOpen = false;
  const isPinSetupStep = step === STEPS.pinSetup;
  const pinStepTitle = isPinSetupStep
    ? "Create 7-Digit PIN"
    : "Enter 7-Digit PIN";
  const pinStepSubtitle = isPinSetupStep
    ? "Create and confirm your admin PIN to finish securing dashboard access"
    : "Please enter your admin PIN to access the dashboard";
  const pinStepButtonLabel = loading
    ? step === STEPS.pin
      ? "Verifying admin PIN..."
      : "Creating admin PIN..."
    : step === STEPS.pin
      ? "Access Admin Dashboard"
      : "Create PIN and Sign In";

  const rightPanelContent = isPinStep ? (
    <div>
      <p className="text-[14px] font-semibold text-[#3458ff] sm:text-[15px]">
        {isPinSetupStep ? "Create admin PIN" : "Secure access"}
      </p>
      <h2 className="mt-2 text-[1.8rem] font-semibold leading-tight tracking-[-0.045em] text-white sm:mt-3 sm:text-[2.25rem]">
        {pinStepTitle}
      </h2>
      <p className="mt-2 text-[14px] leading-6 text-white/66 sm:text-[15px] sm:leading-7">
        {pinStepSubtitle}
      </p>

      <div className="mt-4 space-y-3">
        {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
      </div>

      <form onSubmit={submit} className="mt-5 space-y-4">
        {step === STEPS.pin ? (
          <PinBoxesField
            value={form.pin}
            onChange={(nextPin) => updatePinField("pin", nextPin)}
            disabled={loading}
            autoFocus
            masked={!showPinValue}
            onActivate={() => setActivePinField("pin")}
          />
        ) : (
          <div className="space-y-4">
            <PinBoxesField
              label="New PIN"
              value={form.newPin}
              onChange={(nextPin) => updatePinField("newPin", nextPin)}
              disabled={loading}
              autoFocus
              masked={!showPinValue}
              isActive={activePinField === "newPin"}
              onActivate={() => setActivePinField("newPin")}
            />

            <PinBoxesField
              label="Confirm PIN"
              value={form.confirmPin}
              onChange={(nextPin) => updatePinField("confirmPin", nextPin)}
              disabled={loading}
              masked={!showPinValue}
              isActive={activePinField === "confirmPin"}
              onActivate={() => setActivePinField("confirmPin")}
            />
          </div>
        )}

        <div className="flex flex-col gap-3 text-[14px] text-white/66 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => setShowPinValue((value) => !value)}
            className="inline-flex items-center gap-2 font-medium transition hover:text-white"
          >
            {showPinValue ? (
              <HiOutlineEyeSlash className="h-5 w-5" />
            ) : (
              <HiOutlineEye className="h-5 w-5" />
            )}
            <span>{showPinValue ? "Hide PIN" : "Show PIN"}</span>
          </button>

          <button
            type="button"
            onClick={() => clearAll(true)}
            className="text-left font-medium text-[#7f8fff] transition hover:text-white"
          >
            Use another account
          </button>
        </div>

        <div className="text-[14px] text-white/62">
          Signing in as{" "}
          <span className="font-semibold text-white">
            {form.email || "your account"}
          </span>
          {isPinSetupStep ? (
            <span className="block pt-1 text-[13px] text-white/48">
              Active field:{" "}
              {activePinField === "confirmPin" ? "Confirm PIN" : "New PIN"}
            </span>
          ) : null}
        </div>

        <button type="submit" disabled={loading} className={PRIMARY_BUTTON}>
          <span>{pinStepButtonLabel}</span>
          <HiOutlineArrowRight className="h-4 w-4" />
        </button>
      </form>

      <p className="mt-5 text-center text-[14px] text-white/62">
        Need help?{" "}
        <a
          href="#"
          className="font-semibold text-[#7f8fff] transition hover:text-white"
        >
          Contact support
        </a>
      </p>
    </div>
  ) : (
    <div>
      <p className="text-[14px] font-semibold text-[#3458ff] sm:text-[15px]">
        Welcome back! <span className="align-middle">Hi</span>
      </p>
      <h2 className="mt-2 text-[1.8rem] font-semibold leading-tight tracking-[-0.045em] text-white sm:mt-3 sm:text-[2.25rem]">
        Sign in to your account
      </h2>
      <p className="mt-2 text-[14px] leading-6 text-white/66 sm:text-[15px] sm:leading-7">
        Enter your credentials to access your dashboard.
      </p>

      <div className="mt-4 space-y-3">
        {notice ? <StatusMessage tone="warning">{notice}</StatusMessage> : null}
        {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
      </div>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <div>
          <label className="mb-2 block text-[14px] font-semibold text-slate-100">
            Email address
          </label>
          <div className={INPUT_WRAPPER}>
            <HiOutlineEnvelope className={INPUT_ICON} />
            <input
              type="email"
              value={form.email}
              onChange={(event) => {
                setForm((value) => ({
                  ...value,
                  email: event.target.value,
                }));
                setError("");
              }}
              placeholder="admin@hooks.com"
              autoComplete="email"
              required
              disabled={loading}
              className={INPUT_FIELD}
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[14px] font-semibold text-slate-100">
            Password
          </label>
          <div className={INPUT_WRAPPER}>
            <HiOutlineLockClosed className={INPUT_ICON} />
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(event) => {
                setForm((value) => ({
                  ...value,
                  password: event.target.value,
                }));
                setError("");
              }}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              disabled={loading}
              className="h-12 w-full bg-transparent pl-12 pr-12 text-[15px] text-slate-100 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:text-slate-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              disabled={loading}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#98a1bd] transition hover:text-[#4b61ff] disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <HiOutlineEyeSlash className="h-5 w-5" />
              ) : (
                <HiOutlineEye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 text-[14px] text-slate-100 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              disabled={loading}
              className="h-4 w-4 rounded border-slate-300 accent-[#4560ff] disabled:cursor-not-allowed"
            />
            <span className="font-medium text-slate-100">Remember me</span>
          </label>

          <button
            type="button"
            className="text-left font-medium text-[#3458ff] transition hover:text-[#253ee3]"
          >
            Forgot password?
          </button>
        </div>

        <button type="submit" disabled={loading} className={PRIMARY_BUTTON}>
          <span>{loading ? "Checking credentials..." : "Sign in"}</span>
          <HiOutlineArrowRight className="h-4 w-4" />
        </button>
      </form>

      <p className="mt-5 text-center text-[14px] text-white/62">
        Need help?{" "}
        <a
          href="#"
          className="font-semibold text-[#7f8fff] transition hover:text-white"
        >
          Contact support
        </a>
      </p>
    </div>
  );

  return (
    <div className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#020617_0%,#050816_38%,#0B1120_100%)] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(124,58,237,0.16),transparent_22%),radial-gradient(circle_at_82%_24%,rgba(37,99,235,0.16),transparent_24%),radial-gradient(circle_at_90%_82%,rgba(124,58,237,0.18),transparent_18%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.06)_1px,transparent_1px)] [background-size:24px_24px] opacity-35 [mask-image:radial-gradient(circle_at_center,white,transparent_88%)]" />
      <div className="pointer-events-none absolute inset-y-0 left-[26%] hidden w-[380px] bg-[radial-gradient(circle,rgba(124,58,237,0.12)_1px,transparent_1px)] [background-size:10px_10px] opacity-50 [mask-image:radial-gradient(circle_at_center,white,transparent_76%)] lg:block" />
      <div className="pointer-events-none absolute inset-y-0 right-[-4%] hidden w-[360px] bg-[radial-gradient(circle,rgba(37,99,235,0.2)_1px,transparent_1px)] [background-size:10px_10px] opacity-55 [mask-image:radial-gradient(circle_at_center,white,transparent_78%)] lg:block" />
      <div className="pointer-events-none absolute inset-x-0 top-[34%] hidden lg:block">
        <svg
          viewBox="0 0 1440 260"
          className="h-[260px] w-full opacity-95"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="hooksLoginHeroWave"
              x1="0"
              y1="0"
              x2="1440"
              y2="0"
            >
              <stop offset="0%" stopColor="rgba(124,58,237,0)" />
              <stop offset="34%" stopColor="#7C3AED" />
              <stop offset="68%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="rgba(37,99,235,0)" />
            </linearGradient>
            <filter
              id="hooksLoginHeroGlow"
              x="-20%"
              y="-80%"
              width="140%"
              height="260%"
            >
              <feGaussianBlur stdDeviation="7" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d="M-40 178C108 217 194 224 308 188C431 150 503 67 652 90C794 113 868 226 1010 214C1145 203 1250 120 1480 146"
            stroke="url(#hooksLoginHeroWave)"
            strokeWidth="3"
            strokeLinecap="round"
            filter="url(#hooksLoginHeroGlow)"
          />
          <path
            d="M18 194C154 217 249 208 348 163C454 114 546 85 663 111C783 137 855 224 983 215C1112 206 1238 123 1454 137"
            stroke="rgba(124,58,237,0.46)"
            strokeWidth="1.5"
            strokeDasharray="2 10"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="relative mx-auto flex w-full max-w-[1080px] flex-1 flex-col justify-center px-2 sm:px-4 md:px-5 lg:px-6">
        <div className="grid w-full items-center overflow-hidden bg-transparent md:grid-rows-[auto_1fr] lg:grid-cols-[2.7fr_2fr] lg:grid-rows-1 xl:grid-cols-[2.85fr_1.9fr]">
          <section className="relative hidden overflow-hidden bg-transparent md:flex md:flex-col md:justify-between md:px-8 md:py-5 lg:px-10 lg:py-6">
            <div className="relative z-10">
              <HeroBrand dark={false} />

              <div className="mt-7 max-w-[470px]">
                <h1 className="text-[2.35rem] font-semibold leading-[1.08] tracking-[-0.05em] text-white lg:text-[3rem]">
                  Intelligent insights.
                  <span className="block bg-gradient-to-r from-[#5A35FF] via-[#7E4CFF] to-[#4F7BFF] bg-clip-text text-transparent">
                    Smarter decisions.
                  </span>
                </h1>
                <p className="mt-4 max-w-[390px] text-[15px] leading-7 text-white/72 lg:text-base">
                  Hooks helps you discover, compare and analyze gadgets with
                  powerful insights.
                </p>
              </div>

              <div className="mt-7 grid max-w-[480px] gap-5 lg:mt-8">
                {promoFeatures.map((item) => (
                  <PromoFeature key={item.title} {...item} darkSurface />
                ))}
              </div>
            </div>

            <div className="relative z-10 mt-7 md:mt-5 lg:mt-6">
              <HeroDeviceArt />
            </div>
          </section>

          <section className="relative flex flex-col bg-transparent px-2 py-3 sm:px-4 sm:py-4 md:px-6 md:py-5 lg:px-8 lg:py-6">
            <div className="relative z-10 mx-auto flex w-full max-w-[460px] flex-1 flex-col justify-center lg:max-w-[460px] xl:max-w-[460px]">
              <div className="mb-3 block md:hidden">
                <HeroBrand dark={false} compact />
              </div>
              <div className="w-full bg-transparent px-0 py-0">
                {rightPanelContent}
                {false ? (
                  <div
                    className={
                      isPinOverlayOpen
                        ? "pointer-events-none opacity-50 blur-[1px]"
                        : ""
                    }
                  >
                    <p className="text-[14px] font-semibold text-[#3458ff] sm:text-[15px]">
                      Welcome back! <span className="align-middle">👋</span>
                    </p>

                    <div className="mt-4 space-y-3">
                      {!isPinOverlayOpen && notice ? (
                        <StatusMessage tone="warning">{notice}</StatusMessage>
                      ) : null}

                      {!isPinOverlayOpen && error ? (
                        <StatusMessage tone="error">{error}</StatusMessage>
                      ) : null}

                      {isPinOverlayOpen ? (
                        <StatusMessage tone="success">
                          Password verified for{" "}
                          <span className="font-semibold text-emerald-900">
                            {form.email || "your account"}
                          </span>
                          . Complete the organization PIN step in the security
                          window.
                        </StatusMessage>
                      ) : null}
                    </div>

                    <form onSubmit={submit} className="mt-5 space-y-4">
                      <div>
                        <label className="mb-2 block text-[14px] font-semibold text-slate-100">
                          Email address
                        </label>
                        <div className={INPUT_WRAPPER}>
                          <HiOutlineEnvelope className={INPUT_ICON} />
                          <input
                            type="email"
                            value={form.email}
                            onChange={(event) => {
                              setForm((value) => ({
                                ...value,
                                email: event.target.value,
                              }));
                              setError("");
                            }}
                            placeholder="admin@hooks.com"
                            autoComplete="email"
                            required
                            disabled={loading || isPinOverlayOpen}
                            className={INPUT_FIELD}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-[14px] font-semibold text-slate-100">
                          Password
                        </label>
                        <div className={INPUT_WRAPPER}>
                          <HiOutlineLockClosed className={INPUT_ICON} />
                          <input
                            type={showPassword ? "text" : "password"}
                            value={form.password}
                            onChange={(event) => {
                              setForm((value) => ({
                                ...value,
                                password: event.target.value,
                              }));
                              setError("");
                            }}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            required
                            disabled={loading || isPinOverlayOpen}
                            className="h-12 w-full bg-transparent pl-12 pr-12 text-[15px] text-slate-100 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:text-slate-400"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((value) => !value)}
                            disabled={loading || isPinOverlayOpen}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#98a1bd] transition hover:text-[#4b61ff] disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={
                              showPassword ? "Hide password" : "Show password"
                            }
                          >
                            {showPassword ? (
                              <HiOutlineEyeSlash className="h-5 w-5" />
                            ) : (
                              <HiOutlineEye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 text-[14px] text-slate-100 sm:flex-row sm:items-center sm:justify-between">
                        <label className="inline-flex cursor-pointer items-center gap-3">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(event) =>
                              setRememberMe(event.target.checked)
                            }
                            disabled={loading || isPinOverlayOpen}
                            className="h-4 w-4 rounded border-slate-300 accent-[#4560ff] disabled:cursor-not-allowed"
                          />
                          <span className="font-medium text-slate-100">
                            Remember me
                          </span>
                        </label>

                        <button
                          type="button"
                          className="text-left font-medium text-[#3458ff] transition hover:text-[#253ee3]"
                        >
                          Forgot password?
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={loading || isPinOverlayOpen}
                        className={PRIMARY_BUTTON}
                      >
                        <span>
                          {loading && !isPinOverlayOpen
                            ? "Checking credentials..."
                            : "Sign in"}
                        </span>
                        <HiOutlineArrowRight className="h-4 w-4" />
                      </button>
                    </form>

                    <p className="mt-5 text-center text-[14px] text-white/62">
                      Need help?{" "}
                      <a
                        href="#"
                        className="font-semibold text-[#7f8fff] transition hover:text-white"
                      >
                        Contact support
                      </a>
                    </p>
                  </div>
                ) : null}
              </div>

              <p className="mt-2 px-2 text-center text-[13px] text-white/48 sm:mt-3 sm:text-[14px]">
                &copy; 2024{" "}
                <span className="font-semibold text-[#3458ff]">Hooks</span>. All
                rights reserved.
              </p>
            </div>
          </section>
        </div>
      </div>

      {isPinOverlayOpen ? (
        <div className="fixed inset-0 z-[120] overflow-x-hidden overflow-y-auto bg-[linear-gradient(180deg,#020617_0%,#050816_38%,#0B1120_100%)] text-white lg:overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(124,58,237,0.16),transparent_22%),radial-gradient(circle_at_82%_24%,rgba(37,99,235,0.16),transparent_24%),radial-gradient(circle_at_90%_82%,rgba(124,58,237,0.18),transparent_18%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.06)_1px,transparent_1px)] [background-size:24px_24px] opacity-35 [mask-image:radial-gradient(circle_at_center,white,transparent_88%)]" />
          <div className="pointer-events-none absolute inset-y-0 left-[24%] hidden w-[320px] bg-[radial-gradient(circle,rgba(124,58,237,0.12)_1px,transparent_1px)] [background-size:10px_10px] opacity-45 [mask-image:radial-gradient(circle_at_center,white,transparent_76%)] lg:block" />
          <div className="pointer-events-none absolute inset-y-0 right-[-4%] hidden w-[340px] bg-[radial-gradient(circle,rgba(37,99,235,0.18)_1px,transparent_1px)] [background-size:10px_10px] opacity-50 [mask-image:radial-gradient(circle_at_center,white,transparent_78%)] lg:block" />

          <div className="relative mx-auto flex min-h-dvh w-full max-w-[1040px] flex-col justify-center px-2 py-3 sm:px-4 sm:py-4 md:px-5 lg:h-full lg:min-h-0 lg:px-6 lg:py-4">
            <form
              onSubmit={submit}
              className="grid w-full items-center bg-transparent lg:h-full lg:grid-cols-[2.1fr_1.4fr]"
            >
              <section className="relative hidden bg-transparent md:flex md:flex-col md:justify-center md:px-8 md:py-5 lg:px-10 lg:py-6">
                <div className="relative z-10">
                  <PinAccessBrand />

                  <div className="mt-7 max-w-[470px]">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#7f8fff]">
                      {isPinSetupStep ? "PIN Setup" : "PIN Verification"}
                    </p>
                    <h2 className="mt-3 text-[2.2rem] font-semibold leading-[1.08] tracking-[-0.05em] text-white lg:text-[2.9rem]">
                      {isPinSetupStep
                        ? "Create your secure admin PIN."
                        : "Finish sign-in with your admin PIN."}
                    </h2>
                    <p className="mt-4 max-w-[410px] text-[15px] leading-7 text-white/68 lg:text-base">
                      {pinStepSubtitle}
                    </p>
                  </div>

                  <div className="mt-6 grid gap-4 xl:grid-cols-3">
                    {pinAccessFeatures.map((item) => (
                      <PinAccessFeatureCard key={item.title} {...item} />
                    ))}
                  </div>
                </div>

                <div className="relative z-10 mt-6">
                  <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-white/72">
                    {pinAccessBadges.map((item) => (
                      <div
                        key={item}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2"
                      >
                        <HiOutlineCheckBadge className="h-4 w-4 text-[#7f8fff]" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="relative flex flex-col bg-transparent px-2 py-3 sm:px-4 sm:py-4 md:px-6 md:py-5 lg:px-7 lg:py-6">
                <div className="relative z-10 mx-auto flex w-full max-w-[500px] flex-1 flex-col justify-center">
                  <div className="mb-4 md:hidden">
                    <HeroBrand dark={false} compact />
                  </div>

                  <div className="bg-transparent px-0 py-0">
                    <div className="inline-flex items-center gap-2 px-0 py-0 text-[12px] font-semibold uppercase tracking-[0.18em] text-white/72">
                      <HiOutlineShieldCheck className="h-4 w-4 text-[#7f8fff]" />
                      <span>Secure Access</span>
                    </div>

                    <div className="mx-auto mt-5 flex h-16 w-16 items-center justify-center rounded-md bg-[linear-gradient(180deg,rgba(111,75,255,0.20)_0%,rgba(102,63,255,0.06)_100%)] text-[#8f7bff] sm:h-20 sm:w-20">
                      <HiOutlineLockClosed className="h-8 w-8 sm:h-10 sm:w-10" />
                    </div>

                    <h3 className="mt-5 text-center text-[1.85rem] font-semibold tracking-[-0.05em] text-white sm:text-[2.35rem]">
                      {pinStepTitle}
                    </h3>
                    <p className="mt-3 text-center text-[14px] leading-6 text-white/66 sm:text-[15px] sm:leading-7">
                      {pinStepSubtitle}
                    </p>

                    <div className="mt-5 space-y-3">
                      {notice ? (
                        <StatusMessage tone="info">{notice}</StatusMessage>
                      ) : null}
                      {error ? (
                        <StatusMessage tone="error">{error}</StatusMessage>
                      ) : null}
                    </div>

                    <div className="mt-6 space-y-4 sm:space-y-5">
                      {step === STEPS.pin ? (
                        <PinBoxesField
                          value={form.pin}
                          onChange={(nextPin) => updatePinField("pin", nextPin)}
                          disabled={loading}
                          autoFocus
                          masked={!showPinValue}
                          onActivate={() => setActivePinField("pin")}
                        />
                      ) : (
                        <div className="space-y-4 sm:space-y-5">
                          <PinBoxesField
                            label="New PIN"
                            value={form.newPin}
                            onChange={(nextPin) =>
                              updatePinField("newPin", nextPin)
                            }
                            disabled={loading}
                            autoFocus
                            masked={!showPinValue}
                            isActive={activePinField === "newPin"}
                            onActivate={() => setActivePinField("newPin")}
                          />

                          <PinBoxesField
                            label="Confirm PIN"
                            value={form.confirmPin}
                            onChange={(nextPin) =>
                              updatePinField("confirmPin", nextPin)
                            }
                            disabled={loading}
                            masked={!showPinValue}
                            isActive={activePinField === "confirmPin"}
                            onActivate={() => setActivePinField("confirmPin")}
                          />
                        </div>
                      )}
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
                      {pinPadLayout.flat().map((key, index) => {
                        if (key === "empty") {
                          return (
                            <div
                              key={`empty-${index}`}
                              className="invisible hidden sm:block"
                            />
                          );
                        }

                        if (key === "backspace") {
                          return (
                            <PinPadButton
                              key={key}
                              onClick={removePinDigit}
                              disabled={loading}
                              className="text-[#9e8cff]"
                            >
                              <HiOutlineBackspace className="h-7 w-7 sm:h-8 sm:w-8" />
                            </PinPadButton>
                          );
                        }

                        return (
                          <PinPadButton
                            key={key}
                            onClick={() => appendPinDigit(key)}
                            disabled={loading}
                          >
                            {key}
                          </PinPadButton>
                        );
                      })}
                    </div>

                    <div className="mt-5 flex flex-col gap-3 text-[14px] text-white/66 sm:flex-row sm:items-center sm:justify-between">
                      <button
                        type="button"
                        onClick={() => setShowPinValue((value) => !value)}
                        className="inline-flex items-center gap-2 font-medium transition hover:text-white"
                      >
                        {showPinValue ? (
                          <HiOutlineEyeSlash className="h-5 w-5" />
                        ) : (
                          <HiOutlineEye className="h-5 w-5" />
                        )}
                        <span>{showPinValue ? "Hide PIN" : "Show PIN"}</span>
                      </button>

                      <button
                        type="button"
                        className="font-semibold text-[#7f8fff] transition hover:text-white"
                      >
                        Forgot PIN?
                      </button>
                    </div>

                    <div className="mt-5 px-0 py-0 text-[14px] text-white/68">
                      Signing in as{" "}
                      <span className="font-semibold text-white">
                        {form.email || "your account"}
                      </span>
                      {isPinSetupStep ? (
                        <span className="block pt-1 text-[13px] text-white/52">
                          Active field:{" "}
                          {activePinField === "confirmPin"
                            ? "Confirm PIN"
                            : "New PIN"}
                        </span>
                      ) : null}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className={`mt-6 ${PIN_PRIMARY_BUTTON}`}
                    >
                      <HiOutlineLockClosed className="h-5 w-5 sm:h-6 sm:w-6" />
                      <span>{pinStepButtonLabel}</span>
                      <HiOutlineArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </section>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Login;
