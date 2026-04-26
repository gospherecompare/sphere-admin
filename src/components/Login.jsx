import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { buildUrl } from "../api";
import HookLogo from "./Ui/hooklogo";

const AUTH_NOTICE_STORAGE_KEY = "hooksAdminAuthNotice";
const POST_LOGIN_REDIRECT_KEY = "hooksAdminPostLoginRedirect";
const POST_LOGIN_REDIRECT_MAX_AGE_MS = 1000 * 60 * 30;
const POST_LOGIN_UPDATES_POSTER_KEY = "hooksAdminShowLoginUpdatesPoster";

const STEPS = {
  credentials: "credentials",
  pin: "pin",
  pinSetup: "pin_setup",
};

const MIN_PIN_LENGTH = 4;
const MAX_PIN_LENGTH = 7;

const FIELD =
  "w-full appearance-none border-0 bg-transparent px-0 py-3 text-base text-slate-800 shadow-none outline-none placeholder:text-slate-400 ring-0 transition focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60";
const PRIMARY =
  "w-full border border-blue-700 bg-blue-600 py-3.5 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-blue-700 disabled:opacity-50";

const PinBoxesField = ({
  label,
  value,
  onChange,
  disabled,
  autoFocus = false,
}) => {
  const normalized = String(value || "")
    .replace(/\D/g, "")
    .slice(0, MAX_PIN_LENGTH);

  return (
    <div>
      {label ? (
        <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          {label}
        </label>
      ) : null}

      <div className="relative border border-slate-200 bg-slate-50 p-4">
        <div className="grid grid-cols-7 gap-2.5 sm:gap-3">
          {Array.from({ length: MAX_PIN_LENGTH }).map((_, index) => {
            const digit = normalized[index] || "";
            const filled = Boolean(digit);
            const active =
              !disabled &&
              index === Math.min(normalized.length, MAX_PIN_LENGTH - 1);

            return (
              <div
                key={`${label}-${index}`}
                className={`flex h-14 min-w-0 items-center justify-center border text-base font-semibold transition sm:h-16 sm:text-lg ${
                  filled
                    ? "border-blue-400 bg-white text-slate-950 shadow-[0_10px_20px_rgba(37,99,235,0.12)]"
                    : active
                      ? "border-blue-500 bg-white text-slate-400 ring-4 ring-blue-100"
                      : "border-slate-200 bg-white text-slate-300"
                }`}
              >
                {filled ? digit : ""}
              </div>
            );
          })}
        </div>

        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]{4,7}"
          minLength={MIN_PIN_LENGTH}
          maxLength={MAX_PIN_LENGTH}
          autoFocus={autoFocus}
          value={normalized}
          onChange={(event) =>
            onChange(
              event.target.value.replace(/\D/g, "").slice(0, MAX_PIN_LENGTH),
            )
          }
          disabled={disabled}
          className="absolute inset-0 cursor-text opacity-0"
          aria-label={label}
        />
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
      // Ignore storage access issues and continue with the login form.
    }
  }, [location.state]);

  const normalizeRedirect = (path) =>
    path &&
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.startsWith("/login")
      ? path
      : null;

  const validatePinSetup = () => {
    const newPin = String(form.newPin || "").trim();
    const confirmPin = String(form.confirmPin || "").trim();

    if (
      !new RegExp(`^\\d{${MIN_PIN_LENGTH},${MAX_PIN_LENGTH}}$`).test(newPin)
    ) {
      return `Organization PIN must be ${MIN_PIN_LENGTH} to ${MAX_PIN_LENGTH} digits.`;
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
        (nextStep === STEPS.pinSetup
          ? "Create the organization PIN to finish signing in."
          : "Enter your organization PIN to finish signing in."),
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
      Cookies.set("user", JSON.stringify(data.user), {
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

      if (rememberMe) {
        localStorage.setItem("savedEmail", String(form.email || "").trim());
      } else {
        localStorage.removeItem("savedEmail");
      }
    } catch {
      // Ignore storage access issues and fall back to the default redirect.
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
      // Ignore invalid stored redirect data and continue to the default route.
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
      // Ignore network response parsing failures and show the fallback message.
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isPinOverlayOpen = step === STEPS.pin || step === STEPS.pinSetup;
  const overlayTitle =
    step === STEPS.pin ? "Enter organization PIN" : "Create organization PIN";

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.14),transparent_24%)]" />

      <div className="relative mx-auto  flex min-h-screen max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="relative grid w-full overflow-hidden border border-white/25  bg-[linear-gradient(135deg,#1e5bff_0%,#2b67ff_34%,#4ba8ff_100%)] shadow-[0_30px_90px_rgba(16,24,40,0.28)] lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative overflow-hidden border-b border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.05)_100%)] px-6 py-8 text-white sm:px-8 sm:py-10 lg:border-b-0 lg:border-r">
            <div className="relative z-10">
              <HookLogo className="h-10 w-auto" />
              <div className="mt-10 max-w-md">
                <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-blue-100/85">
                  Hooks Admin
                </div>
                <h2 className="mt-4 text-4xl font-bold leading-tight tracking-[-0.03em]">
                  Welcome to your blue access workspace
                </h2>
                <p className="mt-4 text-sm leading-7 text-blue-50/88">
                  Sign in to manage content, products, and publishing with a
                  simple two-step admin flow designed for your Hooks team.
                </p>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3 lg:max-w-xl">
                {[
                  {
                    kicker: "01",
                    title: "Fast access",
                    copy: "Open the admin panel quickly with a clear email and password flow.",
                  },
                  {
                    kicker: "02",
                    title: "Secure step",
                    copy: "Organization PIN verification adds one focused security layer.",
                  },
                  {
                    kicker: "03",
                    title: "Team ready",
                    copy: "Shared admin access stays easier to manage across your workspace.",
                  },
                ].map((item) => {
                  return (
                    <div
                      key={item.title}
                      className="border border-white/18 bg-white/10 px-4 py-4 backdrop-blur-sm"
                    >
                      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-100/80">
                        {item.kicker}
                      </div>
                      <div className="mt-4 text-sm font-semibold text-white">
                        {item.title}
                      </div>
                      <p className="mt-2 text-xs leading-6 text-blue-50/82">
                        {item.copy}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pointer-events-none absolute -bottom-6 left-6 flex gap-5 opacity-90">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-28 w-10 -skew-x-[28deg] bg-[linear-gradient(180deg,rgba(255,161,84,0.15)_0%,rgba(255,159,67,0.9)_100%)] shadow-[0_0_24px_rgba(255,159,67,0.28)]"
                  style={{
                    transform: `translateY(${item * 18}px) skewX(-28deg)`,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="relative bg-white px-6 py-8 sm:px-8 sm:py-10">
            <div className={isPinOverlayOpen ? "opacity-50 blur-[1px]" : ""}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-600">
                    User Login
                  </div>
                  <h3 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-slate-950">
                    Welcome back
                  </h3>
                  <p className="mt-3 max-w-sm text-sm leading-7 text-slate-600">
                    Enter your credentials to continue to the Hooks admin
                    dashboard.
                  </p>
                </div>
                <HookLogo className="hidden h-10 w-auto shrink-0 sm:block" />
              </div>

              {!isPinOverlayOpen && notice ? (
                <div className="mt-6 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  {notice}
                </div>
              ) : null}

              {!isPinOverlayOpen && error ? (
                <div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              {isPinOverlayOpen ? (
                <div className="mt-6 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Password verified for{" "}
                  <span className="font-semibold text-emerald-950">
                    {form.email || "your account"}
                  </span>
                  . Complete the organization PIN step in the security panel.
                </div>
              ) : null}

              <form onSubmit={submit} className="mt-8 space-y-5">
                <div>
                  <label className="mb-2 block text-xs  font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Email
                  </label>
                  <div>
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
                      placeholder="Enter your email"
                      autoComplete="email"
                      required
                      disabled={loading || isPinOverlayOpen}
                      className={FIELD}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Password
                  </label>
                  <div className="relative">
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
                      className={`${FIELD} pr-14`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      disabled={loading || isPinOverlayOpen}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 transition hover:text-slate-700 disabled:opacity-50"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                      disabled={loading || isPinOverlayOpen}
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="font-medium text-blue-600 transition hover:text-blue-700"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading || isPinOverlayOpen}
                  className={PRIMARY}
                >
                  {loading && !isPinOverlayOpen
                    ? "Checking credentials..."
                    : "Login"}
                </button>
              </form>

              <p className="mt-8 text-center text-xs leading-6 text-slate-500">
                By signing in, you agree to our{" "}
                <a href="#" className="font-medium text-blue-600">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="font-medium text-blue-600">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>

          {isPinOverlayOpen ? (
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(5,17,55,0.82)] p-4 sm:p-6">
              <form
                onSubmit={submit}
                className="w-full max-w-lg overflow-hidden border border-slate-200 bg-white shadow-[0_30px_90px_rgba(0,0,0,0.45)]"
              >
                <div className="relative border-b border-slate-200 bg-white px-6 py-8 text-center sm:px-8">
                  <div className="pointer-events-none absolute left-0 top-0 h-1 w-full bg-[linear-gradient(90deg,#275DFF_0%,#57BCFF_100%)]" />
                  <h3 className="text-[34px] font-bold tracking-[-0.03em] text-slate-950">
                    {step === STEPS.pin
                      ? "Secure PIN Verification"
                      : "Create Security PIN"}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    {step === STEPS.pin
                      ? "Enter your 7-digit organization verification code."
                      : "Create your 7-digit organization security code."}
                  </p>
                </div>

                <div className="p-6 sm:p-8">
                  {error ? (
                    <div className="mb-4 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      {error}
                    </div>
                  ) : null}

                  <div className="space-y-5">
                    {step === STEPS.pin ? (
                      <PinBoxesField
                        label=""
                        value={form.pin}
                        onChange={(nextPin) => {
                          setForm((value) => ({ ...value, pin: nextPin }));
                          setError("");
                        }}
                        disabled={loading}
                        autoFocus
                      />
                    ) : (
                      <>
                        <PinBoxesField
                          label="New PIN"
                          value={form.newPin}
                          onChange={(nextPin) => {
                            setForm((value) => ({
                              ...value,
                              newPin: nextPin,
                            }));
                            setError("");
                          }}
                          disabled={loading}
                          autoFocus
                        />
                        <PinBoxesField
                          label="Confirm PIN"
                          value={form.confirmPin}
                          onChange={(nextPin) => {
                            setForm((value) => ({
                              ...value,
                              confirmPin: nextPin,
                            }));
                            setError("");
                          }}
                          disabled={loading}
                        />
                      </>
                    )}
                  </div>

                  <p className="mt-5 text-center text-sm text-slate-500">
                    Use the organization PIN shared with your admin team.
                  </p>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-6 w-full border border-blue-700 bg-blue-600 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading
                      ? step === STEPS.pin
                        ? "Verifying organization PIN..."
                        : "Creating organization PIN..."
                      : step === STEPS.pin
                        ? "Verify Organization PIN"
                        : "Create PIN and Sign In"}
                  </button>
                </div>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Login;
