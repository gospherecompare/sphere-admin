// components/Login.js
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { buildUrl } from "../api";
import {
  FaUser,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaEnvelope,
  FaShieldAlt,
  FaRocket,
  FaExclamationCircle,
  FaSpinner,
  FaMobileAlt,
  FaSignInAlt,
  FaInfoCircle,
} from "react-icons/fa";
import HookLogo from "./Ui/hooklogo";

const AUTH_NOTICE_STORAGE_KEY = "hooksAdminAuthNotice";
const POST_LOGIN_REDIRECT_KEY = "hooksAdminPostLoginRedirect";
const POST_LOGIN_REDIRECT_MAX_AGE_MS = 1000 * 60 * 30; // 30 minutes
const SESSION_TIMEOUT_NOTICE = "Session timed out. Please log in again.";
const PENDING_OTP_STORAGE_KEY = "hooksAdminPendingLoginOtp";

const formatCountdown = (ms) => {
  const totalSeconds = Math.max(0, Math.ceil(Number(ms || 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0",
  )}`;
};

const formatOtpDeliveryMessage = (channels = []) => {
  const normalized = Array.isArray(channels)
    ? channels.map((channel) => String(channel).toLowerCase())
    : [];
  const hasEmail = normalized.includes("email");
  const hasSms = normalized.includes("sms");

  if (hasEmail && hasSms) {
    return "We sent a 6-digit code to your registered email and mobile number.";
  }
  if (hasSms) {
    return "We sent a 6-digit code to your registered mobile number.";
  }
  if (hasEmail) {
    return "We sent a 6-digit code to your registered email address.";
  }
  return "We sent a 6-digit code to your registered contact method.";
};

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [authStep, setAuthStep] = useState("credentials");
  const [otp, setOtp] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [otpExpiresAt, setOtpExpiresAt] = useState(0);
  const [otpResendAvailableAt, setOtpResendAvailableAt] = useState(0);
  const [otpDeliveryChannels, setOtpDeliveryChannels] = useState([]);

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [error, setError] = useState("");
  const [sessionNotice, setSessionNotice] = useState("");
  const [clockTick, setClockTick] = useState(() => Date.now());
  const navigate = useNavigate();
  const location = useLocation();

  const normalizeRedirectPath = (candidatePath) => {
    if (!candidatePath || typeof candidatePath !== "string") return null;
    if (!candidatePath.startsWith("/")) return null;
    if (candidatePath.startsWith("//")) return null;
    if (candidatePath.startsWith("/login")) return null;
    return candidatePath;
  };

  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem("savedEmail");
      if (savedEmail) {
        setFormData((f) => ({ ...f, email: savedEmail }));
        setRememberMe(true);
      }

      const pendingOtpRaw = sessionStorage.getItem(PENDING_OTP_STORAGE_KEY);
      if (pendingOtpRaw) {
        const pendingOtp = JSON.parse(pendingOtpRaw);
        const pendingExpiresAt = Number(pendingOtp?.expiresAt || 0);
        if (
          pendingOtp?.challengeId &&
          pendingOtp?.email &&
          (!pendingExpiresAt || pendingExpiresAt > Date.now())
        ) {
          setFormData((f) => ({ ...f, email: pendingOtp.email, password: "" }));
          setRememberMe(Boolean(pendingOtp?.rememberMe));
          setAuthStep("otp");
          setChallengeId(String(pendingOtp.challengeId));
          setOtp("");
          setOtpExpiresAt(pendingExpiresAt || Date.now() + 5 * 60 * 1000);
          setOtpResendAvailableAt(Number(pendingOtp?.resendAvailableAt || 0));
          setOtpDeliveryChannels(
            Array.isArray(pendingOtp?.deliveryChannels)
              ? pendingOtp.deliveryChannels
              : [],
          );
          setSessionNotice(
            formatOtpDeliveryMessage(pendingOtp?.deliveryChannels || []),
          );
        } else {
          sessionStorage.removeItem(PENDING_OTP_STORAGE_KEY);
          if (pendingOtpRaw) {
            setSessionNotice("Your login code expired. Please sign in again.");
          }
        }
      }
    } catch (e) {
      /* ignore localStorage errors */
    }
  }, []);

  useEffect(() => {
    try {
      const fromState = location.state?.reason;
      const storedNotice = sessionStorage.getItem(AUTH_NOTICE_STORAGE_KEY);

      if (fromState === "session_expired") {
        setSessionNotice(SESSION_TIMEOUT_NOTICE);
      } else if (storedNotice) {
        setSessionNotice(storedNotice);
      }

      if (storedNotice) {
        sessionStorage.removeItem(AUTH_NOTICE_STORAGE_KEY);
      }
    } catch (e) {
      /* ignore sessionStorage errors */
    }
  }, [location.state]);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setClockTick(Date.now());
    }, 1000);

    return () => window.clearInterval(timerId);
  }, []);

  const otpRemainingMs = Math.max(0, Number(otpExpiresAt || 0) - clockTick);
  const otpResendRemainingMs = Math.max(
    0,
    Number(otpResendAvailableAt || 0) - clockTick,
  );

  const clearOtpState = ({ keepEmail = true } = {}) => {
    setAuthStep("credentials");
    setOtp("");
    setChallengeId("");
    setOtpExpiresAt(0);
    setOtpResendAvailableAt(0);
    setOtpDeliveryChannels([]);
    setIsResendingOtp(false);
    sessionStorage.removeItem(PENDING_OTP_STORAGE_KEY);

    if (keepEmail) {
      setFormData((current) => ({ ...current, password: "" }));
    } else {
      setFormData({ email: "", password: "" });
    }
  };

  const persistOtpState = (nextState) => {
    try {
      sessionStorage.setItem(
        PENDING_OTP_STORAGE_KEY,
        JSON.stringify(nextState),
      );
    } catch (e) {
      /* ignore sessionStorage errors */
    }
  };

  const completeLogin = (data) => {
    const safeUser = data?.user || {};
    const normalizedEmail = String(formData.email || "").trim();

    if (data?.token) {
      Cookies.set("authToken", data.token, {
        expires: rememberMe ? 7 : 1,
        secure: false,
        sameSite: "strict",
        path: "/",
      });

      if (safeUser.username) {
        Cookies.set("username", safeUser.username, {
          expires: rememberMe ? 7 : 1,
          secure: false,
          sameSite: "strict",
          path: "/",
        });
      }

      if (safeUser.role) {
        Cookies.set("role", safeUser.role, {
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
    }

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
        localStorage.setItem("savedEmail", normalizedEmail);
      } else {
        localStorage.removeItem("savedEmail");
      }
    } catch (e) {
      /* ignore localStorage errors */
    }

    let redirectPath = normalizeRedirectPath(location.state?.from) || "/dashboard";

    try {
      if (redirectPath === "/dashboard") {
        const rawRedirect = sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY);
        if (rawRedirect) {
          const parsed = JSON.parse(rawRedirect);
          const savedAt = Number(parsed?.savedAt || 0);
          const isFresh =
            !savedAt || Date.now() - savedAt <= POST_LOGIN_REDIRECT_MAX_AGE_MS;
          const storedPath = normalizeRedirectPath(parsed?.path);
          if (isFresh && storedPath) {
            redirectPath = storedPath;
          }
        }
      }
    } catch (e) {
      /* ignore sessionStorage errors */
    }

    try {
      sessionStorage.removeItem(PENDING_OTP_STORAGE_KEY);
      sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
      sessionStorage.removeItem(AUTH_NOTICE_STORAGE_KEY);
    } catch (e) {
      /* ignore sessionStorage errors */
    }

    setAuthStep("credentials");
    setOtp("");
    setChallengeId("");
    setOtpExpiresAt(0);
    setOtpResendAvailableAt(0);
    setOtpDeliveryChannels([]);
    setSessionNotice("");
    setError("");
    setShowPassword(false);

    navigate(redirectPath, { replace: true });
  };

  const startOtpFlow = (data) => {
    const now = Date.now();
    const expiresInMs = Math.max(0, Number(data?.expiresIn || 300) * 1000);
    const resendAfterMs = Math.max(
      0,
      Number(data?.resendAfterMs || 30 * 1000),
    );
    const nextChallengeId = String(data?.challengeId || "").trim();
    const nextDeliveryChannels = Array.isArray(data?.deliveryChannels)
      ? data.deliveryChannels
      : [];

    setAuthStep("otp");
    setChallengeId(nextChallengeId);
    setOtp("");
    setOtpExpiresAt(now + expiresInMs);
    setOtpResendAvailableAt(now + resendAfterMs);
    setOtpDeliveryChannels(nextDeliveryChannels);
    setSessionNotice(formatOtpDeliveryMessage(nextDeliveryChannels));
    setError("");
    setShowPassword(false);
    setFormData((current) => ({ ...current, password: "" }));

    persistOtpState({
      challengeId: nextChallengeId,
      email: String(formData.email || "").trim(),
      rememberMe,
      expiresAt: now + expiresInMs,
      resendAvailableAt: now + resendAfterMs,
      deliveryChannels: nextDeliveryChannels,
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
  };

  const handleOtpChange = (e) => {
    const nextValue = String(e.target.value || "")
      .replace(/\D/g, "")
      .slice(0, 6);
    setOtp(nextValue);
    if (error) setError("");
  };

  const handleReturnToCredentials = (clearEmail = false) => {
    clearOtpState({ keepEmail: !clearEmail });
    if (clearEmail) {
      setFormData({ email: "", password: "" });
      setRememberMe(false);
    }
    setSessionNotice("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const normalizedEmail = String(formData.email || "").trim();

    if (authStep === "otp") {
      const normalizedOtp = String(otp || "")
        .replace(/\D/g, "")
        .slice(0, 6);

      if (normalizedOtp.length !== 6) {
        setError("Enter the 6-digit verification code.");
        return;
      }

      if (!challengeId) {
        setError("OTP session expired. Please log in again.");
        setSessionNotice("");
        handleReturnToCredentials();
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(buildUrl("/api/auth/login/verify-otp"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: normalizedEmail,
            challengeId,
            otp: normalizedOtp,
          }),
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok && data.token) {
          completeLogin(data);
          return;
        }

        if (response.status === 410 || response.status === 429) {
          setError(data.message || "OTP expired. Please log in again.");
          setSessionNotice("");
          handleReturnToCredentials();
          return;
        }

        if (response.status === 401 && typeof data.attemptsRemaining === "number") {
          setError(
            `${data.message || "Invalid OTP"}. ${data.attemptsRemaining} attempts remaining.`,
          );
          return;
        }

        setError(data.message || "Invalid OTP. Please try again.");
      } catch (requestError) {
        console.error("OTP verification error:", requestError);
        setError("Network error. Please try again.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(buildUrl("/api/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password: formData.password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.otpRequired) {
        if (!data.challengeId) {
          setError("OTP could not be started. Please try again.");
          return;
        }
        startOtpFlow(data);
        return;
      }

      if (response.ok && data.token) {
        clearOtpState({ keepEmail: true });
        completeLogin(data);
        return;
      }

      setError(data.message || "Login failed. Please try again.");
    } catch (requestError) {
      console.error("Login error:", requestError);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!challengeId) {
      setError("OTP session expired. Please log in again.");
      setSessionNotice("");
      handleReturnToCredentials();
      return;
    }

    if (otpResendRemainingMs > 0) {
      return;
    }

    setIsResendingOtp(true);
    setError("");

    try {
      const response = await fetch(buildUrl("/api/auth/login/resend-otp"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          challengeId,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        const now = Date.now();
        const nextExpiresAt =
          now + Math.max(0, Number(data.expiresIn || 300) * 1000);
        const nextResendAt =
          now + Math.max(0, Number(data.resendAfterMs || 30 * 1000));
        const nextChannels = Array.isArray(data.deliveryChannels)
          ? data.deliveryChannels
          : otpDeliveryChannels;

        setOtpExpiresAt(nextExpiresAt);
        setOtpResendAvailableAt(nextResendAt);
        setOtpDeliveryChannels(nextChannels);
        setSessionNotice(formatOtpDeliveryMessage(nextChannels));
        persistOtpState({
          challengeId,
          email: normalizedEmail,
          rememberMe,
          expiresAt: nextExpiresAt,
          resendAvailableAt: nextResendAt,
          deliveryChannels: nextChannels,
        });
        return;
      }

      if (response.status === 410 || response.status === 429) {
        if (typeof data.retryAfterMs === "number") {
          const nextRetryAt = Date.now() + Number(data.retryAfterMs || 0);
          setOtpResendAvailableAt(nextRetryAt);
          persistOtpState({
            challengeId,
            email: normalizedEmail,
            rememberMe,
            expiresAt: otpExpiresAt,
            resendAvailableAt: nextRetryAt,
            deliveryChannels: otpDeliveryChannels,
          });
        } else {
          setSessionNotice("");
          handleReturnToCredentials();
        }
        setError(data.message || "Please wait before requesting another OTP.");
        return;
      }

      setError(data.message || "Unable to resend OTP. Please try again.");
    } catch (requestError) {
      console.error("OTP resend error:", requestError);
      setError("Network error. Please try again.");
    } finally {
      setIsResendingOtp(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl w-full bg-white shadow-xl rounded-xl sm:rounded-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left Panel - Login Form */}
            <div className="p-4 sm:p-5 md:p-8 lg:p-10 xl:p-12">
              {/* Logo and Header */}
              <div className="text-center lg:text-left mb-4 sm:mb-6 md:mb-8">
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <HookLogo className="h-8 w-auto sm:h-9 md:h-10" />
                </div>

                <div className="mt-3 sm:mt-4 md:mt-6">
                  <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 leading-tight">
                    Welcome Back
                  </h2>
                  <p className="text-gray-600 text-xs sm:text-sm md:text-base mt-1 sm:mt-2">
                    Sign in to your account to continue
                  </p>
                </div>
              </div>

              {/* Error Box */}
              {sessionNotice && (
                <div className="mb-3 sm:mb-4 md:mb-6 p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg sm:rounded-xl flex items-start gap-2 sm:gap-3">
                  <FaInfoCircle className="text-amber-500 text-sm sm:text-base flex-shrink-0 mt-0.5" />
                  <span className="text-amber-800 font-medium text-xs sm:text-sm leading-snug">
                    {sessionNotice}
                  </span>
                </div>
              )}

              {error && (
                <div className="mb-3 sm:mb-4 md:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg sm:rounded-xl flex items-start gap-2 sm:gap-3">
                  <FaExclamationCircle className="text-red-500 text-sm sm:text-base flex-shrink-0 mt-0.5" />
                  <span className="text-red-700 font-medium text-xs sm:text-sm leading-snug">
                    {error}
                  </span>
                </div>
              )}

              {/* Login Form */}
              <form
                onSubmit={handleSubmit}
                className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6"
              >
                {authStep === "otp" ? (
                  <>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleReturnToCredentials(true)}
                        className="text-purple-600 hover:text-purple-700 text-xs sm:text-sm md:text-base font-medium transition-colors"
                        disabled={isLoading || isResendingOtp}
                      >
                        Use another account
                      </button>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 md:pl-4 flex items-center pointer-events-none">
                        <FaEnvelope className="text-gray-400 text-xs sm:text-sm md:text-base" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        required
                        disabled
                        className="w-full pl-8 sm:pl-10 md:pl-12 pr-3 sm:pr-4 py-2 sm:py-2.5 md:py-3 
                                 bg-gray-50 border border-gray-200 
                                 rounded-lg sm:rounded-lg 
                                 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                                 text-xs sm:text-sm md:text-base
                                 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                      />
                    </div>

                    <div className="rounded-xl border border-purple-100 bg-purple-50/70 p-3 sm:p-4 flex items-start gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700">
                        <FaShieldAlt className="text-sm sm:text-base" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm sm:text-base font-semibold text-gray-900">
                          Verification code sent
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 leading-snug">
                          {formatOtpDeliveryMessage(otpDeliveryChannels)}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          Code expires in {formatCountdown(otpRemainingMs)}.
                        </div>
                      </div>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 md:pl-4 flex items-center pointer-events-none">
                        <FaMobileAlt className="text-gray-400 text-xs sm:text-sm md:text-base" />
                      </div>
                      <input
                        type="text"
                        name="otp"
                        value={otp}
                        onChange={handleOtpChange}
                        placeholder="Enter 6-digit OTP"
                        autoComplete="one-time-code"
                        inputMode="numeric"
                        maxLength={6}
                        required
                        disabled={isLoading || isResendingOtp}
                        className="w-full pl-8 sm:pl-10 md:pl-12 pr-3 sm:pr-4 py-2 sm:py-2.5 md:py-3 
                                 bg-gray-50 border border-gray-200 
                                 rounded-lg sm:rounded-lg 
                                 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                                 text-xs sm:text-sm md:text-base tracking-[0.3em] text-center
                                 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={
                          isLoading ||
                          isResendingOtp ||
                          otpResendRemainingMs > 0
                        }
                        className="text-purple-600 hover:text-purple-700 text-xs sm:text-sm md:text-base font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isResendingOtp
                          ? "Sending code..."
                          : otpResendRemainingMs > 0
                          ? `Resend in ${formatCountdown(otpResendRemainingMs)}`
                          : "Resend code"}
                      </button>

                      <div className="text-xs sm:text-sm text-gray-500 leading-snug">
                        Keep this tab open while you verify the code.
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Email */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 md:pl-4 flex items-center pointer-events-none">
                        <FaEnvelope className="text-gray-400 text-xs sm:text-sm md:text-base" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        required
                        disabled={isLoading}
                        className="w-full pl-8 sm:pl-10 md:pl-12 pr-3 sm:pr-4 py-2 sm:py-2.5 md:py-3 
                                 bg-gray-50 border border-gray-200 
                                 rounded-lg sm:rounded-lg 
                                 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                                 text-xs sm:text-sm md:text-base
                                 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      />
                    </div>

                    {/* Password */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 md:pl-4 flex items-center pointer-events-none">
                        <FaLock className="text-gray-400 text-xs sm:text-sm md:text-base" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        required
                        disabled={isLoading}
                        className="w-full pl-8 sm:pl-10 md:pl-12 pr-9 sm:pr-11 md:pr-12 py-2 sm:py-2.5 md:py-3 
                                 bg-gray-50 border border-gray-200 
                                 rounded-lg sm:rounded-lg 
                                 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                                 text-xs sm:text-sm md:text-base
                                 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-2.5 sm:pr-3 md:pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <FaEyeSlash className="text-xs sm:text-sm md:text-base" />
                        ) : (
                          <FaEye className="text-xs sm:text-sm md:text-base" />
                        )}
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                      <label className="flex items-center gap-2 sm:gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          disabled={isLoading}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 transition-colors"
                        />
                        <span className="text-gray-700 text-xs sm:text-sm md:text-base">
                          Remember me
                        </span>
                      </label>

                      <button
                        type="button"
                        className="text-purple-600 hover:text-purple-700 text-xs sm:text-sm md:text-base font-medium transition-colors"
                        onClick={() => {
                          /* Add forgot password logic */
                        }}
                      >
                        Forgot password?
                      </button>
                    </div>
                  </>
                )}

                {/* Login / Verify Button */}
                <button
                  type="submit"
                  disabled={isLoading || isResendingOtp}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 
                           text-white py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-lg 
                           font-semibold text-xs sm:text-sm md:text-base
                           hover:from-purple-600 hover:to-indigo-700 
                           active:from-purple-700 active:to-indigo-800
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all duration-200 ease-in-out
                           flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <FaSpinner className="animate-spin text-xs sm:text-sm md:text-base" />
                      <span>{authStep === "otp" ? "Verifying..." : "Logging in..."}</span>
                    </>
                  ) : (
                    <>
                      {authStep === "otp" ? (
                        <FaShieldAlt className="text-xs sm:text-sm md:text-base" />
                      ) : (
                        <FaSignInAlt className="text-xs sm:text-sm md:text-base" />
                      )}
                      <span>{authStep === "otp" ? "Verify OTP" : "Login Now"}</span>
                    </>
                  )}
                </button>
              </form>

              {/* Footer Text */}
              <div className="mt-4 sm:mt-6 md:mt-8 text-center">
                <h6 className="text-gray-600 text-xs sm:text-xs md:text-sm leading-snug">
                  By signing in, you agree to our{" "}
                  <a
                    href="#"
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="#"
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Privacy Policy
                  </a>
                </h6>
              </div>
            </div>

            {/* Right Panel - Hidden on mobile, shown on lg and up */}
            <div
              className="hidden lg:flex bg-gradient-to-br from-purple-600 to-indigo-700 
               p-6 xl:p-12 flex-col justify-between relative overflow-hidden"
            >
              {/* Bubble Animation Background */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(12)].map((_, i) => (
                  <span
                    key={i}
                    className="absolute bubble-animation bg-white bg-opacity-20 rounded-full"
                    style={{
                      width: `${20 + Math.random() * 60}px`,
                      height: `${20 + Math.random() * 60}px`,
                      left: `${Math.random() * 100}%`,
                      animationDuration: `${8 + Math.random() * 12}s`,
                      animationDelay: `${Math.random() * 5}s`,
                    }}
                  ></span>
                ))}
              </div>

              {/* Content */}
              <div className="relative z-10 animate-fadeUp">
                <div className="flex items-center gap-3 mb-6 lg:mb-8">
                  <a href="/" className="flex items-center flex-shrink-0">
                    <div className="rounded-lg bg-white/95 px-2 py-1.5 shadow-sm">
                      <HookLogo className="h-8 w-auto sm:h-9 md:h-10" />
                    </div>
                  </a>
                </div>

                <h3 className="text-2xl lg:text-4xl xl:text-5xl font-bold text-white mb-4 lg:mb-6 leading-tight">
                  Tech Discovery
                  <br /> & Comparison Platform
                </h3>

                <div className="space-y-3 lg:space-y-4 mb-6 lg:mb-8">
                  <div className="flex items-start gap-3 hover:translate-x-1 transition-transform duration-300">
                    <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FaRocket className="text-purple-200 text-xs lg:text-sm" />
                    </div>
                    <h6 className="text-white text-sm lg:text-base leading-snug">
                      Get the latest smartphone & electronics updates instantly
                    </h6>
                  </div>

                  <div className="flex items-start gap-3 hover:translate-x-1 transition-transform duration-300">
                    <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FaShieldAlt className="text-purple-200 text-xs lg:text-sm" />
                    </div>
                    <h6 className="text-white text-sm lg:text-base leading-snug">
                      Compare devices easily with detailed insights
                    </h6>
                  </div>

                  <div className="flex items-start gap-3 hover:translate-x-1 transition-transform duration-300">
                    <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FaUser className="text-purple-200 text-xs lg:text-sm" />
                    </div>
                    <h6 className="text-white text-sm lg:text-base leading-snug">
                      Clean, fast & research-focused user experience for
                      everyone
                    </h6>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add CSS animations */}
      <style>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes bubbleFloat {
          0% {
            transform: translateY(100%) translateX(0) scale(0.5);
            opacity: 0;
          }
          10% {
            opacity: 0.2;
          }
          90% {
            opacity: 0.1;
          }
          100% {
            transform: translateY(-1000%) translateX(calc(var(--move-x, 0) * 100px)) scale(1.2);
            opacity: 0;
          }
        }
        
        .animate-fadeUp {
          animation: fadeUp 0.8s ease-out forwards;
        }
        
        .bubble-animation {
          --move-x: calc(var(--i, 1) * 0.5 - 0.5);
          animation: bubbleFloat linear infinite;
          bottom: -100px;
        }
        
        .bubble-animation:nth-child(odd) {
          --move-x: calc(var(--i, 1) * 0.3);
        }
        
        .bubble-animation:nth-child(even) {
          --move-x: calc(var(--i, 1) * -0.3);
        }
        
        /* Mobile and tablet responsive adjustments */
        @media (max-width: 768px) {
          .bubble-animation {
            width: 20px !important;
            height: 20px !important;
            animation-duration: 10s !important;
          }
        }
        
        @media (max-width: 640px) {
          .bubble-animation {
            display: none;
          }
        }
      `}</style>
    </>
  );
};

export default Login;
