import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import axios from "axios";
import { buildUrl } from "../api";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaLock,
  FaEdit,
  FaSave,
  FaTimes,
  FaEye,
  FaEyeSlash,
  FaCheck,
  FaExclamationCircle,
  FaSpinner,
  FaShieldAlt,
} from "react-icons/fa";

const PIN_PATTERN = /^\d{4,10}$/;
const AccountManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [initialLoading, setInitialLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [pinSaving, setPinSaving] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

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

  const [pinStatus, setPinStatus] = useState({
    isConfigured: false,
    updated_at: null,
    updated_by: null,
  });
  const [pinForm, setPinForm] = useState({
    currentPin: "",
    newPin: "",
    confirmPin: "",
  });
  const [pinErrors, setPinErrors] = useState({});
  const [pinTouched, setPinTouched] = useState({});
  const [showPins, setShowPins] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    loadAccountData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getToken = () => Cookies.get("authToken");

  const getAuthHeaders = (token) => ({
    Authorization: `Bearer ${token}`,
  });

  const populateProfileForm = (user) => {
    setProfileForm({
      username: user.username || "",
      email: user.email || "",
      phone: user.phone || "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      gender: user.gender || "",
    });
  };

  const loadAccountData = async () => {
    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setInitialLoading(true);
      const [profileResponse, pinStatusResponse] = await Promise.all([
        axios.get(buildUrl("/api/auth/profile"), {
          headers: getAuthHeaders(token),
        }),
        axios.get(buildUrl("/api/auth/organization-pin/status"), {
          headers: getAuthHeaders(token),
        }),
      ]);

      if (profileResponse.data.success) {
        const user = profileResponse.data.user;
        setUserData(user);
        populateProfileForm(user);
      }

      if (pinStatusResponse.data.success) {
        setPinStatus({
          isConfigured: Boolean(pinStatusResponse.data.isConfigured),
          updated_at: pinStatusResponse.data.updated_at || null,
          updated_by: pinStatusResponse.data.updated_by || null,
        });
      }

      setMessage({ type: "", text: "" });
    } catch (err) {
      console.error("Error loading account management data:", err);
      setMessage({
        type: "error",
        text: "Failed to load account details",
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const validateProfileField = (name, value) => {
    if (name === "email") {
      if (!value.trim()) return "Email is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        return "Invalid email address";
    }

    if (name === "phone") {
      if (value && !/^[\d\s+()-]+$/.test(value))
        return "Invalid phone number";
    }

    if (name === "first_name" || name === "last_name") {
      if (value && !/^[A-Za-z\s-]+$/.test(value))
        return "Only letters allowed";
    }

    return "";
  };

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

  const validatePinField = (name, value, nextForm = pinForm) => {
    if (name === "currentPin") {
      if (pinStatus.isConfigured && !value) {
        return "Current organization PIN is required";
      }
      if (value && !PIN_PATTERN.test(value)) {
        return "PIN must be 4 to 10 digits";
      }
    }

    if (name === "newPin") {
      if (!value) return "New organization PIN is required";
      if (!PIN_PATTERN.test(value)) return "PIN must be 4 to 10 digits";
      if (pinStatus.isConfigured && value === nextForm.currentPin) {
        return "New PIN must be different from current PIN";
      }
    }

    if (name === "confirmPin") {
      if (!value) return "Please confirm the organization PIN";
      if (value !== nextForm.newPin) return "PINs do not match";
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
      if (passwordTouched.confirmPassword) {
        setPasswordErrors((prev) => ({
          ...prev,
          confirmPassword: validatePasswordField(
            "confirmPassword",
            passwordForm.confirmPassword,
          ),
        }));
      }
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

  const handlePinChange = (e) => {
    const { name, value } = e.target;
    const normalizedValue = value.replace(/\D/g, "").slice(0, 10);
    const nextForm = { ...pinForm, [name]: normalizedValue };

    setPinForm(nextForm);

    if (pinTouched[name]) {
      setPinErrors((prev) => ({
        ...prev,
        [name]: validatePinField(name, normalizedValue, nextForm),
      }));
    }

    if (name === "newPin" && pinTouched.confirmPin) {
      setPinErrors((prev) => ({
        ...prev,
        confirmPin: validatePinField(
          "confirmPin",
          nextForm.confirmPin,
          nextForm,
        ),
      }));
    }
  };

  const handlePinBlur = (e) => {
    const { name, value } = e.target;
    const normalizedValue = value.replace(/\D/g, "").slice(0, 10);
    const nextForm = { ...pinForm, [name]: normalizedValue };

    setPinTouched((prev) => ({ ...prev, [name]: true }));
    setPinErrors((prev) => ({
      ...prev,
      [name]: validatePinField(name, normalizedValue, nextForm),
    }));
  };

  const togglePinVisibility = (field) => {
    setShowPins((prev) => ({ ...prev, [field]: !prev[field] }));
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

  const validatePinForm = () => {
    const errors = {};
    Object.keys(pinForm).forEach((field) => {
      if (!pinStatus.isConfigured && field === "currentPin") {
        return;
      }

      const error = validatePinField(field, pinForm[field], pinForm);
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
      setProfileSaving(true);
      const token = getToken();

      const response = await axios.put(
        buildUrl("/api/auth/profile"),
        {
          email: profileForm.email,
          phone: profileForm.phone,
          first_name: profileForm.first_name,
          last_name: profileForm.last_name,
          gender: profileForm.gender,
        },
        { headers: getAuthHeaders(token) },
      );

      if (response.data.success) {
        setUserData(response.data.user);
        populateProfileForm(response.data.user);
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
      setProfileSaving(false);
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
      setPasswordSaving(true);
      const token = getToken();

      const response = await axios.post(
        buildUrl("/api/auth/change-password"),
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        { headers: getAuthHeaders(token) },
      );

      if (response.data.success || response.status === 200) {
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setPasswordErrors({});
        setPasswordTouched({});
        setPasswordStrength(0);
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
      setPasswordSaving(false);
    }
  };

  const handleUpdateOrganizationPin = async (e) => {
    e.preventDefault();
    const errors = validatePinForm();

    if (Object.keys(errors).length > 0) {
      setPinErrors(errors);
      setMessage({ type: "error", text: "Please fix all errors" });
      return;
    }

    try {
      setPinSaving(true);
      const token = getToken();
      const response = await axios.put(
        buildUrl("/api/auth/organization-pin"),
        {
          currentPin: pinStatus.isConfigured ? pinForm.currentPin : "",
          newPin: pinForm.newPin,
        },
        { headers: getAuthHeaders(token) },
      );

      if (response.data.success) {
        setPinForm({
          currentPin: "",
          newPin: "",
          confirmPin: "",
        });
        setPinErrors({});
        setPinTouched({});
        setPinStatus({
          isConfigured: Boolean(response.data.isConfigured),
          updated_at: response.data.updated_at || null,
          updated_by: response.data.updated_by || null,
        });
        setMessage({
          type: "success",
          text:
            response.data.message || "Organization PIN updated successfully",
        });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      }
    } catch (err) {
      console.error("Error updating organization PIN:", err);
      setMessage({
        type: "error",
        text:
          err.response?.data?.message || "Failed to update organization PIN",
      });
    } finally {
      setPinSaving(false);
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

  const formatPinUpdatedAt = (value) => {
    if (!value) return "Not updated yet";

    try {
      return new Date(value).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return "Recently updated";
    }
  };

  if (initialLoading && !userData) {
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
    <div className="min-h-full bg-gray-50 p-1 sm:p-2 md:p-2">
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
                        disabled={profileSaving}
                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
                      >
                        {profileSaving ? (
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
                          if (userData) {
                            populateProfileForm(userData);
                          }
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
          <div className="max-w-2xl mx-auto space-y-6">
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
                    disabled={passwordSaving}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
                  >
                    {passwordSaving ? (
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

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Organization PIN
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    This PIN is required after password verification during admin
                    login.
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                    pinStatus.isConfigured
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  <FaShieldAlt />
                  {pinStatus.isConfigured ? "Configured" : "Not Set"}
                </span>
              </div>

              <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                <div>Last updated: {formatPinUpdatedAt(pinStatus.updated_at)}</div>
                <div className="mt-1">
                  Stored securely on the server using one-way hashing.
                </div>
              </div>

              <form onSubmit={handleUpdateOrganizationPin} className="space-y-4">
                {pinStatus.isConfigured && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Organization PIN
                    </label>
                    <div className="relative">
                      <input
                        type={showPins.current ? "text" : "password"}
                        name="currentPin"
                        value={pinForm.currentPin}
                        onChange={handlePinChange}
                        onBlur={handlePinBlur}
                        inputMode="numeric"
                        maxLength={10}
                        className={`w-full px-4 py-2 rounded-lg border transition-colors pr-10 ${
                          pinErrors.currentPin && pinTouched.currentPin
                            ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                        } focus:outline-none focus:ring-2`}
                      />
                      <button
                        type="button"
                        onClick={() => togglePinVisibility("current")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPins.current ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {pinErrors.currentPin && pinTouched.currentPin && (
                      <p className="mt-1 text-sm text-red-600">
                        {pinErrors.currentPin}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {pinStatus.isConfigured
                      ? "New Organization PIN"
                      : "Organization PIN"}
                  </label>
                  <div className="relative">
                    <input
                      type={showPins.new ? "text" : "password"}
                      name="newPin"
                      value={pinForm.newPin}
                      onChange={handlePinChange}
                      onBlur={handlePinBlur}
                      inputMode="numeric"
                      maxLength={10}
                      className={`w-full px-4 py-2 rounded-lg border transition-colors pr-10 ${
                        pinErrors.newPin && pinTouched.newPin
                          ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                      } focus:outline-none focus:ring-2`}
                    />
                    <button
                      type="button"
                      onClick={() => togglePinVisibility("new")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPins.new ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {pinErrors.newPin && pinTouched.newPin && (
                    <p className="mt-1 text-sm text-red-600">
                      {pinErrors.newPin}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Organization PIN
                  </label>
                  <div className="relative">
                    <input
                      type={showPins.confirm ? "text" : "password"}
                      name="confirmPin"
                      value={pinForm.confirmPin}
                      onChange={handlePinChange}
                      onBlur={handlePinBlur}
                      inputMode="numeric"
                      maxLength={10}
                      className={`w-full px-4 py-2 rounded-lg border transition-colors pr-10 ${
                        pinErrors.confirmPin && pinTouched.confirmPin
                          ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                      } focus:outline-none focus:ring-2`}
                    />
                    <button
                      type="button"
                      onClick={() => togglePinVisibility("confirm")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPins.confirm ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {pinErrors.confirmPin && pinTouched.confirmPin && (
                    <p className="mt-1 text-sm text-red-600">
                      {pinErrors.confirmPin}
                    </p>
                  )}
                </div>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                  Use a 4 to 10 digit PIN for your admin team. You can rotate it
                  here whenever access needs to change.
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={pinSaving}
                    className="w-full bg-gray-900 text-white py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
                  >
                    {pinSaving ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <FaShieldAlt />
                    )}
                    <span>
                      {pinStatus.isConfigured
                        ? "Update Organization PIN"
                        : "Create Organization PIN"}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountManagement;


