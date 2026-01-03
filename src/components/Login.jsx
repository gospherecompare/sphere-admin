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
      const response = await fetch("http://localhost:5000/api/auth/login", {
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
        console.log("Login successful:");

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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-3 sm:p-4 md:p-6">
        <div className="max-w-6xl w-full bg-white shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left Panel - Login Form */}
            <div className="p-5 sm:p-6 md:p-8 lg:p-10 xl:p-12">
              {/* Logo and Header */}
              <div className="text-center lg:text-left mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-3 sm:space-y-0 sm:space-x-3 mb-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl text-white flex items-center justify-center">
                    <img
                      src={logo}
                      alt="Smart Arena Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-center sm:text-left">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                      Smart Arena
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-1">
                      Mobile Inventory Management
                    </p>
                  </div>
                </div>

                <div className="mt-4 sm:mt-6">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
                    Welcome Back
                  </h2>
                  <p className="text-gray-600 text-sm sm:text-base mt-1 sm:mt-2">
                    Sign in to your account to continue
                  </p>
                </div>
              </div>

              {/* Error Box */}
              {error && (
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg sm:rounded-xl flex items-center space-x-2 sm:space-x-3">
                  <FaExclamationCircle className="text-red-500 text-base sm:text-lg flex-shrink-0" />
                  <span className="text-red-700 font-medium text-xs sm:text-sm">
                    {error}
                  </span>
                </div>
              )}

              {/* Login Form */}
              <form
                onSubmit={handleSubmit}
                className="space-y-4 sm:space-y-5 md:space-y-6"
              >
                {/* Email */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                    <FaEnvelope className="text-gray-400 text-sm sm:text-base" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                    disabled={isLoading}
                    className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 md:py-4 
                             bg-gray-50 border border-gray-200 
                             rounded-full sm:rounded-full 
                             focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                             text-sm sm:text-base
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                    <FaLock className="text-gray-400 text-sm sm:text-base" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                    className="w-full pl-9 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 md:py-4 
                             bg-gray-50 border border-gray-200 
                             rounded-full sm:rounded-full 
                             focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                             text-sm sm:text-base
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-gray-400 hover:text-gray-600"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <FaEyeSlash className="text-sm sm:text-base" />
                    ) : (
                      <FaEye className="text-sm sm:text-base" />
                    )}
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-left justify-between space-y-3 sm:space-y-0">
                  <label className="flex items-center space-x-2 sm:space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={isLoading}
                      className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="text-gray-700 text-sm sm:text-base">
                      Remember me
                    </span>
                  </label>

                  <button
                    type="button"
                    className="text-purple-600 hover:text-purple-700 text-sm sm:text-base font-medium"
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
                           text-white py-3 sm:py-4 rounded-full sm:rounded-full 
                           font-semibold text-sm sm:text-base md:text-lg
                           hover:from-purple-600 hover:to-indigo-700 
                           active:from-purple-700 active:to-indigo-800
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all duration-200 ease-in-out
                           flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <FaSpinner className="animate-spin text-base sm:text-lg" />
                      <span>Logging in...</span>
                    </>
                  ) : (
                    <>
                      <FaSignInAlt className="text-base sm:text-lg" />
                      <span>Login Now</span>
                    </>
                  )}
                </button>
              </form>

              {/* Footer Text */}
              <div className="mt-6 sm:mt-8 text-center">
                <h6 className="text-gray-600 text-xs sm:text-sm">
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
               p-8 xl:p-12 flex-col justify-between relative overflow-hidden"
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
                <div className="flex items-center space-x-3 mb-8">
                  <FaMobileAlt className="text-white text-3xl" />
                  <h2 className="text-3xl font-bold text-white">Smart Arena</h2>
                </div>

                <h3 className="text-4xl xl:text-5xl font-bold text-white mb-6">
                  Tech Discovery
                  <br /> & Comparison Platform
                </h3>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center space-x-3 hover:translate-x-1 transition-transform duration-300">
                    <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <FaRocket className="text-purple-600 text-sm" />
                    </div>
                    <h6 className="text-white text-lg">
                      Get the latest smartphone & electronics updates instantly
                    </h6>
                  </div>

                  <div className="flex items-center space-x-3 hover:translate-x-1 transition-transform duration-300">
                    <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <FaShieldAlt className="text-purple-600 text-sm" />
                    </div>
                    <h6 className="text-white text-lg">
                      Compare devices easily with detailed insights
                    </h6>
                  </div>

                  <div className="flex items-center space-x-3 hover:translate-x-1 transition-transform duration-300">
                    <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <FaUser className="text-purple-600 text-sm" />
                    </div>
                    <h6 className="text-white text-lg">
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
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .bubble-animation {
            animation-duration: calc(12s * var(--speed, 1)) !important;
          }
        }
      `}</style>
    </>
  );
};

export default Login;
