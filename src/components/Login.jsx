import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import {
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
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
  deviceAuth: "device_auth",
  deviceSetup: "device_setup",
};

const FIELD =
  "w-full rounded-lg border border-gray-200 bg-gray-50 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60";
const PRIMARY =
  "w-full rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 py-3 text-sm font-semibold text-white hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50";

const formatCountdown = (ms) => {
  const s = Math.max(0, Math.ceil(Number(ms || 0) / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(
    s % 60,
  ).padStart(2, "0")}`;
};

const deviceError = (error, fallback) => {
  const name = String(error?.name || "");
  if (name === "NotAllowedError") {
    return "The device prompt was cancelled or timed out.";
  }
  if (name === "InvalidStateError") {
    return "This device credential is already registered.";
  }
  if (name === "NotSupportedError") {
    return "This browser cannot use device verification here.";
  }
  if (name === "SecurityError") {
    return "Device verification requires HTTPS or localhost.";
  }
  return fallback;
};

const DEVICE_REQUIRED_MESSAGE =
  "This login requires device verification. Use a browser and device that supports passkeys, Face ID, fingerprint, Windows Hello, or screen lock.";

const Login = ({ onLogin }) => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [step, setStep] = useState(STEPS.credentials);
  const [loginTicket, setLoginTicket] = useState("");
  const [loginTicketExpiresAt, setLoginTicketExpiresAt] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [deviceSupport, setDeviceSupport] = useState({
    checked: false,
    supported: false,
    message: DEVICE_REQUIRED_MESSAGE,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tick, setTick] = useState(() => Date.now());

  const navigate = useNavigate();
  const location = useLocation();
  const loginTicketRemaining = Math.max(0, loginTicketExpiresAt - tick);

  useEffect(() => {
    let active = true;

    (async () => {
      let supported = false;
      if (browserSupportsWebAuthn()) {
        try {
          supported = await platformAuthenticatorIsAvailable();
        } catch {}
      }

      if (active) {
        setDeviceSupport({
          checked: true,
          supported,
          message: supported ? "" : DEVICE_REQUIRED_MESSAGE,
        });
      }
    })();

    return () => {
      active = false;
    };
  }, []);

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
    } catch {}
  }, [location.state]);

  const support = async () => {
    if (deviceSupport.checked) return deviceSupport;

    let supported = false;
    if (browserSupportsWebAuthn()) {
      try {
        supported = await platformAuthenticatorIsAvailable();
      } catch {}
    }

    const resolved = {
      checked: true,
      supported,
      message: supported ? "" : DEVICE_REQUIRED_MESSAGE,
    };
    setDeviceSupport(resolved);
    return resolved;
  };

  const normalizeRedirect = (path) =>
    path &&
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.startsWith("/login")
      ? path
      : null;

  const clearAll = (keepEmail = true) => {
    setStep(STEPS.credentials);
    setLoginTicket("");
    setLoginTicketExpiresAt(0);
    setShowPassword(false);
    setError("");

    if (keepEmail) {
      setForm((value) => ({ ...value, password: "" }));
    } else {
      setForm({ email: "", password: "" });
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
        (nextStep === STEPS.deviceSetup
          ? "Set up device verification to finish signing in."
          : "Use your device verification to finish signing in."),
    );
    setForm((value) => ({ ...value, password: "" }));
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
    } catch {}

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
    } catch {}

    clearAll(true);
    setNotice("");
    navigate(redirect, { replace: true });
  };

  const verifyDevice = async () => {
    if (!loginTicket) {
      return setError("Your sign-in session expired. Please log in again.");
    }

    const resolvedSupport = await support();
    if (!resolvedSupport.supported) {
      return setError(
        resolvedSupport.message || "Device verification is unavailable.",
      );
    }

    setLoading(true);
    setError("");

    try {
      const optionsRes = await fetch(buildUrl("/api/auth/login/webauthn/options"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginTicket }),
      });
      const optionsData = await optionsRes.json().catch(() => ({}));

      if (!optionsRes.ok || !optionsData?.options) {
        setError(
          optionsData.message ||
            "Unable to start device verification. Please try again.",
        );
        if (optionsRes.status === 401 || optionsRes.status === 410) {
          clearAll(true);
        }
        return;
      }

      const credential = await startAuthentication({
        optionsJSON: optionsData.options,
      });

      const verifyRes = await fetch(buildUrl("/api/auth/login/webauthn/verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginTicket, response: credential }),
      });
      const verifyData = await verifyRes.json().catch(() => ({}));

      if (verifyRes.ok && verifyData?.token) {
        return finish(verifyData);
      }

      setError(
        verifyData.message || "Device verification failed. Please try again.",
      );
      if (verifyRes.status === 401 || verifyRes.status === 410) {
        clearAll(true);
      }
    } catch (err) {
      setError(deviceError(err, "Device verification failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const setupDevice = async () => {
    if (!loginTicket) {
      return setError("Your sign-in session expired. Please log in again.");
    }

    const resolvedSupport = await support();
    if (!resolvedSupport.supported) {
      return setError(resolvedSupport.message || "Device setup is unavailable.");
    }

    setLoading(true);
    setError("");

    try {
      const optionsRes = await fetch(
        buildUrl("/api/auth/login/webauthn/register/options"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ loginTicket }),
        },
      );
      const optionsData = await optionsRes.json().catch(() => ({}));

      if (!optionsRes.ok || !optionsData?.options) {
        setError(
          optionsData.message || "Unable to start device setup. Please try again.",
        );
        if (optionsRes.status === 401 || optionsRes.status === 410) {
          clearAll(true);
        }
        return;
      }

      const registration = await startRegistration({
        optionsJSON: optionsData.options,
      });

      const verifyRes = await fetch(
        buildUrl("/api/auth/login/webauthn/register/verify"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ loginTicket, response: registration }),
        },
      );
      const verifyData = await verifyRes.json().catch(() => ({}));

      if (verifyRes.ok && verifyData?.token) {
        return finish(verifyData);
      }

      setError(verifyData.message || "Device setup failed. Please try again.");
      if (verifyRes.status === 401 || verifyRes.status === 410) {
        clearAll(true);
      }
    } catch (err) {
      setError(deviceError(err, "Device setup failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (step === STEPS.deviceAuth) return verifyDevice();
    if (step === STEPS.deviceSetup) return setupDevice();

    setLoading(true);
    try {
      const resolvedSupport = await support();
      if (!resolvedSupport.supported) {
        setError(resolvedSupport.message || DEVICE_REQUIRED_MESSAGE);
        return;
      }

      const res = await fetch(buildUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(form.email || "").trim(),
          password: form.password,
          deviceAuthSupported: resolvedSupport.supported,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (
        res.ok &&
        (data?.nextStep === STEPS.deviceAuth ||
          data?.nextStep === STEPS.deviceSetup)
      ) {
        return startPending(data);
      }

      if (res.ok && data?.token) {
        return finish(data);
      }

      setError(data.message || "Login failed. Please try again.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const cardTitle =
    step === STEPS.deviceAuth
      ? "Confirm on this device"
      : "Set up device verification";
  const cardBody =
    step === STEPS.deviceAuth
      ? "Use Face ID, fingerprint, Windows Hello, or your device screen lock to finish signing in."
      : "Create a passkey on this device to finish signing in and use MFA on every future login.";
  const cardFooter = `Session expires in ${formatCountdown(loginTicketRemaining)}.`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4 md:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-2xl bg-white shadow-xl lg:grid-cols-2">
        <div className="p-5 sm:p-8 lg:p-10">
          <div className="mb-8">
            <HookLogo className="h-10 w-auto" />
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Welcome Back
            </h2>
            <p className="mt-2 text-sm text-gray-600">
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

          {step === STEPS.credentials &&
            deviceSupport.checked &&
            !deviceSupport.supported && (
              <div className="mb-4 flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                <FaInfoCircle className="mt-0.5 shrink-0 text-blue-500" />
                <span>{deviceSupport.message}</span>
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
                        {cardTitle}
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        {cardBody}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        {cardFooter}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  {step === STEPS.deviceAuth
                    ? "This account uses MFA on every login. Approve the device prompt to continue."
                    : "This account must register a device credential before sign-in can finish."}
                </div>
              </>
            )}

            <button type="submit" disabled={loading} className={PRIMARY}>
              <span className="inline-flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>
                      {step === STEPS.deviceAuth
                        ? "Checking device..."
                        : step === STEPS.deviceSetup
                          ? "Enabling device..."
                          : "Starting MFA..."}
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
                      {step === STEPS.deviceAuth
                        ? "Verify with Device"
                        : step === STEPS.deviceSetup
                          ? "Enable Device Verification"
                          : "Continue with MFA"}
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

        <div className="hidden bg-gradient-to-br from-purple-600 to-indigo-700 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="rounded-xl bg-white/10 p-4">
            <HookLogo className="h-10 w-auto" />
          </div>

          <div>
            <h3 className="text-4xl font-bold leading-tight">
              Secure admin access for your Hooks workspace
            </h3>
            <div className="mt-8 space-y-4 text-sm text-purple-50">
              <div className="flex gap-3">
                <FaRocket className="mt-0.5 shrink-0" />
                <span>Password is step one, then device verification completes every login.</span>
              </div>
              <div className="flex gap-3">
                <FaShieldAlt className="mt-0.5 shrink-0" />
                <span>
                  Supported browsers use Face ID, fingerprint, Windows Hello, or
                  device screen lock through passkeys.
                </span>
              </div>
              <div className="flex gap-3">
                <FaUser className="mt-0.5 shrink-0" />
                <span>
                  New admin devices are enrolled during sign-in before access is
                  granted.
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
