import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { buildUrl } from "../api";
import {
  FaEye,
  FaEyeSlash,
  FaEnvelope,
  FaExclamationCircle,
  FaInfoCircle,
  FaLock,
  FaRocket,
  FaShieldAlt,
  FaSignInAlt,
  FaSpinner,
  FaUser,
} from "react-icons/fa";
import HookLogo from "./Ui/hooklogo";

const AUTH_NOTICE_STORAGE_KEY = "hooksAdminAuthNotice";
const POST_LOGIN_REDIRECT_KEY = "hooksAdminPostLoginRedirect";
const POST_LOGIN_REDIRECT_MAX_AGE_MS = 1000 * 60 * 30;

const STEPS = {
  credentials: "credentials",
  pin: "pin",
  pinSetup: "pin_setup",
};

const FIELD =
  "w-full rounded-2xl border border-slate-200 bg-white/90 py-3.5 text-sm transition-all focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:opacity-60 disabled:cursor-not-allowed";
const PRIMARY =
  "w-full rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:shadow-blue-500/30 disabled:opacity-50";

const formatCountdown = (ms) => {
  const seconds = Math.max(0, Math.ceil(Number(ms || 0) / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
    seconds % 60,
  ).padStart(2, "0")}`;
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
  const [loginTicketExpiresAt, setLoginTicketExpiresAt] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showSetupPin, setShowSetupPin] = useState(false);
  const [showSetupConfirmPin, setShowSetupConfirmPin] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tick, setTick] = useState(() => Date.now());

  const navigate = useNavigate();
  const location = useLocation();
  const loginTicketRemaining = Math.max(0, loginTicketExpiresAt - tick);

  useEffect(() => {
    const timer = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

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

    if (!/^\d{4,10}$/.test(newPin)) {
      return "Organization PIN must be 4 to 10 digits.";
    }

    if (newPin !== confirmPin) {
      return "Organization PIN confirmation does not match.";
    }

    return "";
  };

  const clearAll = (keepEmail = true) => {
    setStep(STEPS.credentials);
    setLoginTicket("");
    setLoginTicketExpiresAt(0);
    setShowPassword(false);
    setShowPin(false);
    setShowSetupPin(false);
    setShowSetupConfirmPin(false);
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
    setLoginTicketExpiresAt(
      Date.now() + Math.max(0, Number(data?.pendingExpiresIn || 900) * 1000),
    );
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

  const cardFooter = `Session expires in ${formatCountdown(loginTicketRemaining)}.`;

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_35%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.14),transparent_30%),linear-gradient(180deg,rgba(248,251,255,0.85)_0%,rgba(244,247,251,0.65)_100%)]" />
      <div className="pointer-events-none absolute left-0 top-0 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 translate-x-1/3 translate-y-1/3 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="surface-panel-strong relative mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-[32px] lg:grid-cols-2">
        <div className="relative p-5 sm:p-8 lg:p-10">
          <div className="mb-8">
            <HookLogo className="h-10 w-auto" />
            <h2 className="mt-6 text-3xl font-bold text-slate-900">
              Welcome Back
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Sign in to continue to your Hooks admin workspace.
            </p>
          </div>

          {notice && (
            <div className="mb-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <FaInfoCircle className="mt-0.5 shrink-0 text-amber-500" />
              <span>{notice}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <FaExclamationCircle className="mt-0.5 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {step !== STEPS.credentials && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => clearAll(false)}
                  disabled={loading}
                  className="text-sm font-medium text-purple-600 hover:text-purple-700"
                >
                  Use another account
                </button>
              </div>
            )}

            {step === STEPS.credentials ? (
              <>
                <div className="relative">
                  <FaEnvelope className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
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
                    disabled={loading}
                    className={`${FIELD} pl-11 pr-4`}
                  />
                </div>

                <div className="relative">
                  <FaLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
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
                    className={`${FIELD} pl-11 pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    disabled={loading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3 text-sm">
                  <label className="flex items-center gap-2 text-gray-700">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                      disabled={loading}
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="font-medium text-purple-600 hover:text-purple-700"
                  >
                    Forgot password?
                  </button>
                </div>
              </>
            ) : step === STEPS.pin ? (
              <>
                <div className="relative">
                  <FaEnvelope className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={form.email}
                    disabled
                    className={`${FIELD} pl-11 pr-4`}
                  />
                </div>

                <div className="rounded-xl border border-purple-100 bg-purple-50/70 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700">
                      <FaShieldAlt />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        Enter organization PIN
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        Password is already verified. Enter the organization PIN
                        to complete admin sign-in.
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        {cardFooter}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <FaLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPin ? "text" : "password"}
                    value={form.pin}
                    onChange={(event) => {
                      setForm((value) => ({
                        ...value,
                        pin: event.target.value.replace(/\D/g, "").slice(0, 10),
                      }));
                      setError("");
                    }}
                    placeholder="Enter organization PIN"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    pattern="[0-9]{4,10}"
                    minLength={4}
                    maxLength={10}
                    required
                    disabled={loading}
                    className={`${FIELD} pl-11 pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin((value) => !value)}
                    disabled={loading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPin ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  The organization PIN is shared by your admin team and is
                  stored securely on the server.
                </div>
              </>
            ) : (
              <>
                <div className="relative">
                  <FaEnvelope className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={form.email}
                    disabled
                    className={`${FIELD} pl-11 pr-4`}
                  />
                </div>

                <div className="rounded-xl border border-purple-100 bg-purple-50/70 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700">
                      <FaShieldAlt />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        Create organization PIN
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        No organization PIN is configured yet. Create it now to
                        complete admin sign-in.
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        {cardFooter}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <FaLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showSetupPin ? "text" : "password"}
                    value={form.newPin}
                    onChange={(event) => {
                      setForm((value) => ({
                        ...value,
                        newPin: event.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10),
                      }));
                      setError("");
                    }}
                    placeholder="Create organization PIN"
                    inputMode="numeric"
                    pattern="[0-9]{4,10}"
                    minLength={4}
                    maxLength={10}
                    required
                    disabled={loading}
                    className={`${FIELD} pl-11 pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSetupPin((value) => !value)}
                    disabled={loading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showSetupPin ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>

                <div className="relative">
                  <FaLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showSetupConfirmPin ? "text" : "password"}
                    value={form.confirmPin}
                    onChange={(event) => {
                      setForm((value) => ({
                        ...value,
                        confirmPin: event.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10),
                      }));
                      setError("");
                    }}
                    placeholder="Confirm organization PIN"
                    inputMode="numeric"
                    pattern="[0-9]{4,10}"
                    minLength={4}
                    maxLength={10}
                    required
                    disabled={loading}
                    className={`${FIELD} pl-11 pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSetupConfirmPin((value) => !value)}
                    disabled={loading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showSetupConfirmPin ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  Create a 4 to 10 digit organization PIN to secure admin
                  access.
                </div>
              </>
            )}

            <button type="submit" disabled={loading} className={PRIMARY}>
              <span className="inline-flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>
                      {step === STEPS.pin
                        ? "Verifying organization PIN..."
                        : step === STEPS.pinSetup
                          ? "Creating organization PIN..."
                          : "Checking credentials..."}
                    </span>
                  </>
                ) : (
                  <>
                    {step === STEPS.credentials ? (
                      <FaSignInAlt />
                    ) : (
                      <FaShieldAlt />
                    )}
                    <span>
                      {step === STEPS.pin
                        ? "Verify Organization PIN"
                        : step === STEPS.pinSetup
                          ? "Create PIN and Sign In"
                          : "Continue"}
                    </span>
                  </>
                )}
              </span>
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-600">
            By signing in, you agree to our{" "}
            <a href="#" className="font-medium text-purple-600">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="font-medium text-purple-600">
              Privacy Policy
            </a>
            .
          </p>
        </div>

        <div className="hero-panel hidden overflow-hidden p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
            <HookLogo className="h-10 w-auto" />
          </div>

          <div>
            <h3 className="text-4xl font-bold leading-tight">
              Secure admin access for your Hooks workspace
            </h3>
            <div className="mt-8 space-y-4 text-sm text-purple-50">
              <div className="flex gap-3">
                <FaRocket className="mt-0.5 shrink-0" />
                <span>
                  Password is step one, and the organization PIN completes
                  access to the admin workspace.
                </span>
              </div>
              <div className="flex gap-3">
                <FaShieldAlt className="mt-0.5 shrink-0" />
                <span>
                  The PIN is centrally managed so admins can update it whenever
                  the team needs to rotate access.
                </span>
              </div>
              <div className="flex gap-3">
                <FaUser className="mt-0.5 shrink-0" />
                <span>
                  Email login stays the same while the second step is now a
                  simple admin PIN instead of device-based MFA.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
