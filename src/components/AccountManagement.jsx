import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import axios from "axios";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaLock,
  FaEdit,
  FaSave,
  FaTimes,
  FaEye,
  FaEyeSlash,
  FaCheck,
  FaExclamationCircle,
  FaArrowLeft,
  FaSpinner,
} from "react-icons/fa";

const AccountManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    username: "",
    email: "",
    phone: "",
    first_name: "",
    last_name: "",
    gender: "",
  });

  const [profileErrors, setProfileErrors] = useState({});
  const [profileTouched, setProfileTouched] = useState({});

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordTouched, setPasswordTouched] = useState({});
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Fetch user data on mount
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const token = Cookies.get("authToken");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.get(
        "http://apishpere.duckdns.org/api/auth/profile",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        const user = response.data.user;
        setUserData(user);
        setProfileForm({
          username: user.username || "",
          email: user.email || "",
          phone: user.phone || "",
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          gender: user.gender || "",
        });
        setMessage({ type: "", text: "" });
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      setMessage({
        type: "error",
        text: "Failed to load profile",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Validation for profile fields
  const validateProfileField = (name, value) => {
    if (name === "email") {
      if (!value.trim()) return "Email is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        return "Invalid email address";
    }

    if (name === "phone") {
      if (value && !/^[\d\s\-\+()]+$/.test(value))
        return "Invalid phone number";
    }

    if (name === "first_name" || name === "last_name") {
      if (value && !/^[A-Za-z\s\-]+$/.test(value))
        return "Only letters allowed";
    }

    return "";
  };

  // Validation for password fields
  const validatePasswordField = (name, value) => {
    if (name === "currentPassword") {
      if (!value) return "Current password is required";
    }

    if (name === "newPassword") {
      if (!value) return "New password is required";
      if (value.length < 8) return "Password must be at least 8 characters";
      if (!/[A-Z]/.test(value))
        return "Must contain at least one uppercase letter";
      if (!/[a-z]/.test(value))
        return "Must contain at least one lowercase letter";
      if (!/[0-9]/.test(value)) return "Must contain at least one number";
    }

    if (name === "confirmPassword") {
      if (!value) return "Please confirm your password";
      if (value !== passwordForm.newPassword) return "Passwords do not match";
    }

    return "";
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));

    if (profileTouched[name]) {
      const error = validateProfileField(name, value);
      setProfileErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleProfileBlur = (e) => {
    const { name, value } = e.target;
    setProfileTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateProfileField(name, value);
    setProfileErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));

    if (passwordTouched[name]) {
      const error = validatePasswordField(name, value);
      setPasswordErrors((prev) => ({ ...prev, [name]: error }));
    }

    if (name === "newPassword") {
      checkPasswordStrength(value);
    }
  };

  const handlePasswordBlur = (e) => {
    const { name, value } = e.target;
    setPasswordTouched((prev) => ({ ...prev, [name]: true }));
    const error = validatePasswordField(name, value);
    setPasswordErrors((prev) => ({ ...prev, [name]: error }));
  };

  const checkPasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    setPasswordStrength(score);
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const validateProfileForm = () => {
    const errors = {};
    ["email"].forEach((field) => {
      const error = validateProfileField(field, profileForm[field]);
      if (error) errors[field] = error;
    });
    return errors;
  };

  const validatePasswordFormFunc = () => {
    const errors = {};
    Object.keys(passwordForm).forEach((field) => {
      const error = validatePasswordField(field, passwordForm[field]);
      if (error) errors[field] = error;
    });
    return errors;
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const errors = validateProfileForm();

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      setMessage({ type: "error", text: "Please fix all errors" });
      return;
    }

    try {
      setIsLoading(true);
      const token = Cookies.get("authToken");

      const response = await axios.put(
        "http://apishpere.duckdns.org/api/auth/profile",
        {
          email: profileForm.email,
          phone: profileForm.phone,
          first_name: profileForm.first_name,
          last_name: profileForm.last_name,
          gender: profileForm.gender,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        setUserData(response.data.user);
        setIsEditing(false);
        setMessage({ type: "success", text: "Profile updated successfully" });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to update profile",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const errors = validatePasswordFormFunc();

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      setMessage({ type: "error", text: "Please fix all errors" });
      return;
    }

    try {
      setIsLoading(true);
      const token = Cookies.get("authToken");

      const response = await axios.post(
        "http://apishpere.duckdns.org/api/auth/change-password",
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success || response.status === 200) {
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setPasswordErrors({});
        setPasswordTouched({});
        setMessage({ type: "success", text: "Password changed successfully" });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      }
    } catch (err) {
      console.error("Error changing password:", err);
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to change password",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return "bg-red-500";
    if (passwordStrength <= 2) return "bg-orange-500";
    if (passwordStrength <= 3) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return "Very Weak";
    if (passwordStrength <= 2) return "Weak";
    if (passwordStrength <= 3) return "Fair";
    return "Strong";
  };

  if (isLoading && !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Header */}

      <div className="max-w-6xl mx-auto">
        {/* Message Alert */}
        {message.text && (
          <div
            className={`mb-6 p-4 flex items-center space-x-3 ${
              message.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            {message.type === "success" ? (
              <FaCheck className="text-lg flex-shrink-0" />
            ) : (
              <FaExclamationCircle className="text-lg flex-shrink-0" />
            )}
            <span>{message.text}</span>
            <button
              onClick={() => setMessage({ type: "", text: "" })}
              className="ml-auto p-1 hover:bg-gray-200 rounded"
            >
              <FaTimes />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => {
              setActiveTab("profile");
              setIsEditing(false);
            }}
            className={`pb-4 px-2 font-medium transition-colors ${
              activeTab === "profile"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <FaUser className="inline mr-2" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`pb-4 px-2 font-medium transition-colors ${
              activeTab === "password"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <FaLock className="inline mr-2" />
            Security
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Info Card */}

            {/* Profile Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-lg font-bold text-gray-900">
                    Profile Information
                  </h3>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <FaEdit />
                      <span>Edit Profile</span>
                    </button>
                  )}
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaEnvelope className="inline mr-2" />
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={profileForm.email}
                      onChange={handleProfileChange}
                      onBlur={handleProfileBlur}
                      disabled={!isEditing}
                      className={`w-full px-4 py-2 rounded-lg border transition-colors disabled:bg-gray-50 ${
                        profileErrors.email && profileTouched.email
                          ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                      } focus:outline-none focus:ring-2`}
                    />
                    {profileErrors.email && profileTouched.email && (
                      <p className="mt-1 text-sm text-red-600">
                        {profileErrors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaPhone className="inline mr-2" />
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={profileForm.phone}
                      onChange={handleProfileChange}
                      onBlur={handleProfileBlur}
                      disabled={!isEditing}
                      className={`w-full px-4 py-2 rounded-lg border transition-colors disabled:bg-gray-50 ${
                        profileErrors.phone && profileTouched.phone
                          ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                      } focus:outline-none focus:ring-2`}
                      placeholder="+1 (555) 000-0000"
                    />
                    {profileErrors.phone && profileTouched.phone && (
                      <p className="mt-1 text-sm text-red-600">
                        {profileErrors.phone}
                      </p>
                    )}
                  </div>

                  {/* First Name and Last Name */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        value={profileForm.first_name}
                        onChange={handleProfileChange}
                        onBlur={handleProfileBlur}
                        disabled={!isEditing}
                        className={`w-full px-4 py-2 rounded-lg border transition-colors disabled:bg-gray-50 ${
                          profileErrors.first_name && profileTouched.first_name
                            ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                        } focus:outline-none focus:ring-2`}
                      />
                      {profileErrors.first_name &&
                        profileTouched.first_name && (
                          <p className="mt-1 text-sm text-red-600">
                            {profileErrors.first_name}
                          </p>
                        )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="last_name"
                        value={profileForm.last_name}
                        onChange={handleProfileChange}
                        onBlur={handleProfileBlur}
                        disabled={!isEditing}
                        className={`w-full px-4 py-2 rounded-lg border transition-colors disabled:bg-gray-50 ${
                          profileErrors.last_name && profileTouched.last_name
                            ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                        } focus:outline-none focus:ring-2`}
                      />
                      {profileErrors.last_name && profileTouched.last_name && (
                        <p className="mt-1 text-sm text-red-600">
                          {profileErrors.last_name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={profileForm.gender}
                      onChange={handleProfileChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none disabled:bg-gray-50 transition-colors"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Action Buttons */}
                  {isEditing && (
                    <div className="flex space-x-3 pt-4">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
                      >
                        {isLoading ? (
                          <FaSpinner className="animate-spin" />
                        ) : (
                          <FaSave />
                        )}
                        <span>Save Changes</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setProfileErrors({});
                          setProfileTouched({});
                        }}
                        className="flex-1 bg-gray-200 text-gray-900 py-2 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center space-x-2"
                      >
                        <FaTimes />
                        <span>Cancel</span>
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === "password" && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">
                Change Password
              </h3>

              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      onBlur={handlePasswordBlur}
                      className={`w-full px-4 py-2 rounded-lg border transition-colors pr-10 ${
                        passwordErrors.currentPassword &&
                        passwordTouched.currentPassword
                          ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                      } focus:outline-none focus:ring-2`}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("current")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {passwordErrors.currentPassword &&
                    passwordTouched.currentPassword && (
                      <p className="mt-1 text-sm text-red-600">
                        {passwordErrors.currentPassword}
                      </p>
                    )}
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      onBlur={handlePasswordBlur}
                      className={`w-full px-4 py-2 rounded-lg border transition-colors pr-10 ${
                        passwordErrors.newPassword &&
                        passwordTouched.newPassword
                          ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                      } focus:outline-none focus:ring-2`}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("new")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {passwordErrors.newPassword &&
                    passwordTouched.newPassword && (
                      <p className="mt-1 text-sm text-red-600">
                        {passwordErrors.newPassword}
                      </p>
                    )}

                  {/* Password Strength */}
                  {passwordForm.newPassword && (
                    <div className="mt-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm text-gray-600">Strength:</span>
                        <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getPasswordStrengthColor()} transition-all`}
                            style={{
                              width: `${(passwordStrength / 5) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-600">
                          {getPasswordStrengthText()}
                        </span>
                      </div>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li
                          className={
                            passwordForm.newPassword.length >= 8
                              ? "text-green-600"
                              : ""
                          }
                        >
                          ✓ At least 8 characters
                        </li>
                        <li
                          className={
                            /[A-Z]/.test(passwordForm.newPassword)
                              ? "text-green-600"
                              : ""
                          }
                        >
                          ✓ Contains uppercase letter
                        </li>
                        <li
                          className={
                            /[a-z]/.test(passwordForm.newPassword)
                              ? "text-green-600"
                              : ""
                          }
                        >
                          ✓ Contains lowercase letter
                        </li>
                        <li
                          className={
                            /[0-9]/.test(passwordForm.newPassword)
                              ? "text-green-600"
                              : ""
                          }
                        >
                          ✓ Contains number
                        </li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      onBlur={handlePasswordBlur}
                      className={`w-full px-4 py-2 rounded-lg border transition-colors pr-10 ${
                        passwordErrors.confirmPassword &&
                        passwordTouched.confirmPassword
                          ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                      } focus:outline-none focus:ring-2`}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("confirm")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword &&
                    passwordTouched.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">
                        {passwordErrors.confirmPassword}
                      </p>
                    )}
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
                  >
                    {isLoading ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <FaLock />
                    )}
                    <span>Change Password</span>
                  </button>
                </div>
              </form>

              {/* Security Tips */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">
                  Security Tips:
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>
                    • Use a strong password with a mix of letters, numbers, and
                    symbols
                  </li>
                  <li>• Never share your password with anyone</li>
                  <li>• Change your password regularly</li>
                  <li>• Use a unique password for this account</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountManagement;
