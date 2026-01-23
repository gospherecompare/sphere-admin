// components/Login.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
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
import logo from "../../assests/Favicon.png";

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("http://api.apisphere.in/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token using cookies
        if (data.token) {
          Cookies.set("authToken", data.token, {
            expires: rememberMe ? 7 : 1,
            secure: false,
            sameSite: "strict",
            path: "/",
          });

          Cookies.set("username", data.user.username, {
            expires: rememberMe ? 7 : 1,
            secure: false,
            sameSite: "strict",
            path: "/",
          });

          Cookies.set("role", data.user.role, {
            expires: rememberMe ? 7 : 1,
            secure: false,
            sameSite: "strict",
            path: "/",
          });
        }

        // Store user info using cookies
        if (data.user) {
          Cookies.set("user", JSON.stringify(data.user), {
            expires: rememberMe ? 7 : 1,
            secure: false,
            sameSite: "strict",
            path: "/",
          });
        }

        if (onLogin) {
          onLogin(data);
        }

        navigate("/dashboard");
      } else {
        setError(data.message || "Login failed. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
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
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl md:rounded-2xl text-white flex items-center justify-center flex-shrink-0">
                    <img
                      src={logo}
                      alt="Sphere Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-center sm:text-left">
                    <a
                      href="/"
                      className="flex items-center flex-shrink-0 justify-center sm:justify-start"
                    >
                      <h1 className="smartarena-logo text-lg sm:text-xl md:text-2xl">
                        SPHERE
                      </h1>
                    </a>
                  </div>
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

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={isLoading}
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
                      <span>Logging in...</span>
                    </>
                  ) : (
                    <>
                      <FaSignInAlt className="text-xs sm:text-sm md:text-base" />
                      <span>Login Now</span>
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
                    <h1 className="smartarena-logo_1 text-2xl lg:text-3xl">
                      SPHERE
                    </h1>
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
