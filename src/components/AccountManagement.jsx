import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import axios from "axios";
import { buildUrl } from "../api";
import {
  FaCalendarAlt,
  FaCheck,
  FaChevronRight,
  FaDesktop,
  FaEdit,
  FaEnvelope,
  FaExclamationCircle,
  FaEye,
  FaEyeSlash,
  FaHistory,
  FaInfoCircle,
  FaKey,
  FaLock,
  FaPhone,
  FaQuestionCircle,
  FaRegCreditCard,
  FaSave,
  FaShieldAlt,
  FaSpinner,
  FaTimes,
  FaUser,
  FaUserEdit,
} from "react-icons/fa";

const PIN_PATTERN = /^\d{7}$/;
const DELETE_PIN_PATTERN = /^\d{4}$/;
const ADMIN_ROLE_TOKENS = new Set(["admin", "ceo"]);
const INPUT_CLASS =
  "h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-base text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-700 sm:text-sm";
const ERROR_INPUT_CLASS =
  "h-11 w-full rounded-lg border border-red-300 bg-white px-4 text-base text-slate-700 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100 sm:text-sm";

const normalizeRoleToken = (role) =>
  String(role || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const isAdminUser = (user) =>
  ADMIN_ROLE_TOKENS.has(normalizeRoleToken(user?.role));

const getInputClass = (hasError = false, extraClass = "") =>
  `${hasError ? ERROR_INPUT_CLASS : INPUT_CLASS} ${extraClass}`;

const FieldError = ({ visible, children }) =>
  visible ? <p className="mt-1 text-xs text-red-600">{children}</p> : null;

const VisibilityButton = ({ visible, onClick, label }) => (
  <button
    type="button"
    aria-label={label}
    onClick={onClick}
    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
  >
    {visible ? <FaEyeSlash /> : <FaEye />}
  </button>
);

const AccountManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [initialLoading, setInitialLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [pinSaving, setPinSaving] = useState(false);
  const [deletePinSaving, setDeletePinSaving] = useState(false);
  const [deletePinDeleting, setDeletePinDeleting] = useState(false);
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
  const [deletePinStatus, setDeletePinStatus] = useState({
    isConfigured: false,
    updated_at: null,
    updated_by: null,
  });
  const [deletePinForm, setDeletePinForm] = useState({
    currentPin: "",
    newPin: "",
    confirmPin: "",
  });
  const [deletePinErrors, setDeletePinErrors] = useState({});
  const [deletePinTouched, setDeletePinTouched] = useState({});
  const [showDeletePins, setShowDeletePins] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [deletePinPasswordModal, setDeletePinPasswordModal] = useState({
    open: false,
    mode: "save",
    adminPassword: "",
    showPassword: false,
    error: "",
  });

  const getToken = () => Cookies.get("authToken");
  const getAuthHeaders = (token) => ({ Authorization: `Bearer ${token}` });
  const isAdminRole = isAdminUser(userData);

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
        const loadedUser = profileResponse.data.user;
        setUserData(loadedUser);
        populateProfileForm(loadedUser);

        if (isAdminUser(loadedUser)) {
          const deletePinStatusResponse = await axios.get(
            buildUrl("/api/auth/data-delete-pin/status"),
            {
              headers: getAuthHeaders(token),
            },
          );

          if (deletePinStatusResponse.data.success) {
            setDeletePinStatus({
              isConfigured: Boolean(
                deletePinStatusResponse.data.isConfigured,
              ),
              updated_at: deletePinStatusResponse.data.updated_at || null,
              updated_by: deletePinStatusResponse.data.updated_by || null,
            });
          }
        } else {
          setDeletePinStatus({
            isConfigured: false,
            updated_at: null,
            updated_by: null,
          });
        }
      }

      if (pinStatusResponse.data.success) {
        setPinStatus({
          isConfigured: Boolean(pinStatusResponse.data.isConfigured),
          updated_at: pinStatusResponse.data.updated_at || null,
          updated_by: pinStatusResponse.data.updated_by || null,
        });
      }

      setMessage({ type: "", text: "" });
    } catch (error) {
      console.error("Error loading account management data:", error);
      if ([401, 403].includes(error.response?.status)) {
        navigate("/login");
        return;
      }
      setMessage({ type: "error", text: "Failed to load account details" });
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadAccountData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === "delete-pin" && userData && !isAdminRole) {
      setActiveTab("profile");
    }
  }, [activeTab, isAdminRole, userData]);

  const validateProfileField = (name, value) => {
    if (name === "email") {
      if (!value.trim()) return "Email is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return "Invalid email address";
      }
    }
    if (name === "phone" && value && !/^[\d\s+()-]+$/.test(value)) {
      return "Invalid phone number";
    }
    if (
      (name === "first_name" || name === "last_name") &&
      value &&
      !/^[A-Za-z\s-]+$/.test(value)
    ) {
      return "Only letters allowed";
    }
    return "";
  };

  const validatePasswordField = (name, value, nextForm = passwordForm) => {
    if (name === "currentPassword" && !value) {
      return "Current password is required";
    }
    if (name === "newPassword") {
      if (!value) return "New password is required";
      if (value.length < 8) return "Password must be at least 8 characters";
      if (!/[A-Z]/.test(value)) return "Must contain an uppercase letter";
      if (!/[a-z]/.test(value)) return "Must contain a lowercase letter";
      if (!/[0-9]/.test(value)) return "Must contain a number";
    }
    if (name === "confirmPassword") {
      if (!value) return "Please confirm your password";
      if (value !== nextForm.newPassword) return "Passwords do not match";
    }
    return "";
  };

  const validatePinField = (name, value, nextForm = pinForm) => {
    if (name === "currentPin") {
      if (pinStatus.isConfigured && !value) {
        return "Current organization PIN is required";
      }
      if (value && !PIN_PATTERN.test(value)) {
        return "PIN must be exactly 7 digits";
      }
    }
    if (name === "newPin") {
      if (!value) return "New organization PIN is required";
      if (!PIN_PATTERN.test(value)) return "PIN must be exactly 7 digits";
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

  const validateDeletePinField = (
    name,
    value,
    nextForm = deletePinForm,
  ) => {
    if (name === "currentPin") {
      if (deletePinStatus.isConfigured && !value) {
        return "Current delete PIN is required";
      }
      if (value && !DELETE_PIN_PATTERN.test(value)) {
        return "Delete PIN must be exactly 4 digits";
      }
    }
    if (name === "newPin") {
      if (!value) return "New delete PIN is required";
      if (!DELETE_PIN_PATTERN.test(value)) {
        return "Delete PIN must be exactly 4 digits";
      }
      if (deletePinStatus.isConfigured && value === nextForm.currentPin) {
        return "New delete PIN must be different from current PIN";
      }
    }
    if (name === "confirmPin") {
      if (!value) return "Please confirm the delete PIN";
      if (value !== nextForm.newPin) return "Delete PINs do not match";
    }
    return "";
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((previous) => ({ ...previous, [name]: value }));
    if (profileTouched[name]) {
      setProfileErrors((previous) => ({
        ...previous,
        [name]: validateProfileField(name, value),
      }));
    }
  };

  const handleProfileBlur = (event) => {
    const { name, value } = event.target;
    setProfileTouched((previous) => ({ ...previous, [name]: true }));
    setProfileErrors((previous) => ({
      ...previous,
      [name]: validateProfileField(name, value),
    }));
  };

  const checkPasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    setPasswordStrength(score);
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    const nextForm = { ...passwordForm, [name]: value };
    setPasswordForm(nextForm);

    if (passwordTouched[name]) {
      setPasswordErrors((previous) => ({
        ...previous,
        [name]: validatePasswordField(name, value, nextForm),
      }));
    }
    if (name === "newPassword") {
      checkPasswordStrength(value);
      if (passwordTouched.confirmPassword) {
        setPasswordErrors((previous) => ({
          ...previous,
          confirmPassword: validatePasswordField(
            "confirmPassword",
            nextForm.confirmPassword,
            nextForm,
          ),
        }));
      }
    }
  };

  const handlePasswordBlur = (event) => {
    const { name, value } = event.target;
    setPasswordTouched((previous) => ({ ...previous, [name]: true }));
    setPasswordErrors((previous) => ({
      ...previous,
      [name]: validatePasswordField(name, value),
    }));
  };

  const handlePinChange = (event) => {
    const { name, value } = event.target;
    const normalizedValue = value.replace(/\D/g, "").slice(0, 7);
    const nextForm = { ...pinForm, [name]: normalizedValue };
    setPinForm(nextForm);

    if (pinTouched[name]) {
      setPinErrors((previous) => ({
        ...previous,
        [name]: validatePinField(name, normalizedValue, nextForm),
      }));
    }
    if (name === "newPin" && pinTouched.confirmPin) {
      setPinErrors((previous) => ({
        ...previous,
        confirmPin: validatePinField(
          "confirmPin",
          nextForm.confirmPin,
          nextForm,
        ),
      }));
    }
  };

  const handlePinBlur = (event) => {
    const { name, value } = event.target;
    const normalizedValue = value.replace(/\D/g, "").slice(0, 7);
    const nextForm = { ...pinForm, [name]: normalizedValue };
    setPinTouched((previous) => ({ ...previous, [name]: true }));
    setPinErrors((previous) => ({
      ...previous,
      [name]: validatePinField(name, normalizedValue, nextForm),
    }));
  };

  const handleDeletePinChange = (event) => {
    const { name, value } = event.target;
    const isPinInput = ["currentPin", "newPin", "confirmPin"].includes(name);
    const normalizedValue = isPinInput
      ? value.replace(/\D/g, "").slice(0, 4)
      : value;
    const nextForm = { ...deletePinForm, [name]: normalizedValue };
    setDeletePinForm(nextForm);

    if (deletePinTouched[name]) {
      setDeletePinErrors((previous) => ({
        ...previous,
        [name]: validateDeletePinField(name, normalizedValue, nextForm),
      }));
    }
    if (name === "newPin" && deletePinTouched.confirmPin) {
      setDeletePinErrors((previous) => ({
        ...previous,
        confirmPin: validateDeletePinField(
          "confirmPin",
          nextForm.confirmPin,
          nextForm,
        ),
      }));
    }
    if (name === "currentPin" && deletePinTouched.newPin) {
      setDeletePinErrors((previous) => ({
        ...previous,
        newPin: validateDeletePinField(
          "newPin",
          nextForm.newPin,
          nextForm,
        ),
      }));
    }
  };

  const handleDeletePinBlur = (event) => {
    const { name, value } = event.target;
    const isPinInput = ["currentPin", "newPin", "confirmPin"].includes(name);
    const normalizedValue = isPinInput
      ? value.replace(/\D/g, "").slice(0, 4)
      : value;
    const nextForm = { ...deletePinForm, [name]: normalizedValue };
    setDeletePinTouched((previous) => ({ ...previous, [name]: true }));
    setDeletePinErrors((previous) => ({
      ...previous,
      [name]: validateDeletePinField(name, normalizedValue, nextForm),
    }));
  };

  const validateProfileForm = () => {
    const errors = {};
    ["email"].forEach((field) => {
      const error = validateProfileField(field, profileForm[field]);
      if (error) errors[field] = error;
    });
    return errors;
  };

  const validatePasswordForm = () => {
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
      if (!pinStatus.isConfigured && field === "currentPin") return;
      const error = validatePinField(field, pinForm[field], pinForm);
      if (error) errors[field] = error;
    });
    return errors;
  };

  const validateDeletePinForm = () => {
    const errors = {};
    Object.keys(deletePinForm).forEach((field) => {
      if (!deletePinStatus.isConfigured && field === "currentPin") return;
      const error = validateDeletePinField(field, deletePinForm[field]);
      if (error) errors[field] = error;
    });
    return errors;
  };

  const markDeletePinFormTouched = () => {
    setDeletePinTouched({
      currentPin: deletePinStatus.isConfigured,
      newPin: true,
      confirmPin: true,
    });
  };

  const resetDeletePinForm = () => {
    setDeletePinForm({
      currentPin: "",
      newPin: "",
      confirmPin: "",
    });
    setDeletePinErrors({});
    setDeletePinTouched({});
  };

  const handleUpdateProfile = async (event) => {
    event.preventDefault();
    const errors = validateProfileForm();
    if (Object.keys(errors).length) {
      setProfileErrors(errors);
      setMessage({ type: "error", text: "Please fix all errors" });
      return;
    }

    try {
      setProfileSaving(true);
      const response = await axios.put(
        buildUrl("/api/auth/profile"),
        {
          email: profileForm.email,
          phone: profileForm.phone,
          first_name: profileForm.first_name,
          last_name: profileForm.last_name,
          gender: profileForm.gender,
        },
        { headers: getAuthHeaders(getToken()) },
      );
      if (response.data.success) {
        setUserData(response.data.user);
        populateProfileForm(response.data.user);
        setIsEditing(false);
        setMessage({ type: "success", text: "Profile updated successfully" });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to update profile",
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    const errors = validatePasswordForm();
    if (Object.keys(errors).length) {
      setPasswordErrors(errors);
      setMessage({ type: "error", text: "Please fix all errors" });
      return;
    }

    try {
      setPasswordSaving(true);
      const response = await axios.post(
        buildUrl("/api/auth/change-password"),
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        { headers: getAuthHeaders(getToken()) },
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
    } catch (error) {
      console.error("Error changing password:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to change password",
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleUpdateOrganizationPin = async (event) => {
    event.preventDefault();
    const errors = validatePinForm();
    if (Object.keys(errors).length) {
      setPinErrors(errors);
      setMessage({ type: "error", text: "Please fix all errors" });
      return;
    }

    try {
      setPinSaving(true);
      const response = await axios.put(
        buildUrl("/api/auth/organization-pin"),
        {
          currentPin: pinStatus.isConfigured ? pinForm.currentPin : "",
          newPin: pinForm.newPin,
        },
        { headers: getAuthHeaders(getToken()) },
      );
      if (response.data.success) {
        setPinForm({ currentPin: "", newPin: "", confirmPin: "" });
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
    } catch (error) {
      console.error("Error updating organization PIN:", error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.message || "Failed to update organization PIN",
      });
    } finally {
      setPinSaving(false);
    }
  };

  const resetDeletePinPasswordModal = () => {
    setDeletePinPasswordModal({
      open: false,
      mode: "save",
      adminPassword: "",
      showPassword: false,
      error: "",
    });
  };

  const openDeletePinPasswordModal = (mode) => {
    setDeletePinPasswordModal({
      open: true,
      mode,
      adminPassword: "",
      showPassword: false,
      error: "",
    });
  };

  const closeDeletePinPasswordModal = () => {
    if (deletePinSaving || deletePinDeleting) return;
    resetDeletePinPasswordModal();
  };

  const handleDeletePinPasswordChange = (event) => {
    const { value } = event.target;
    setDeletePinPasswordModal((previous) => ({
      ...previous,
      adminPassword: value,
      error: previous.error && value.trim() ? "" : previous.error,
    }));
  };

  const submitDeletePinUpdate = async (adminPassword) => {
    try {
      setDeletePinSaving(true);
      const response = await axios.put(
        buildUrl("/api/auth/data-delete-pin"),
        {
          currentPassword: adminPassword,
          currentPin: deletePinStatus.isConfigured
            ? deletePinForm.currentPin
            : "",
          newPin: deletePinForm.newPin,
        },
        { headers: getAuthHeaders(getToken()) },
      );

      if (response.data.success) {
        resetDeletePinForm();
        resetDeletePinPasswordModal();
        setDeletePinStatus({
          isConfigured: Boolean(response.data.isConfigured),
          updated_at: response.data.updated_at || null,
          updated_by: response.data.updated_by || null,
        });
        setMessage({
          type: "success",
          text: response.data.message || "Delete PIN updated successfully",
        });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      }
    } catch (error) {
      console.error("Error updating delete PIN:", error);
      setDeletePinPasswordModal((previous) => ({
        ...previous,
        error: error.response?.data?.message || "Failed to update delete PIN",
      }));
    } finally {
      setDeletePinSaving(false);
    }
  };

  const submitDeletePinRemoval = async (adminPassword) => {
    try {
      setDeletePinDeleting(true);
      const response = await axios.delete(
        buildUrl("/api/auth/data-delete-pin"),
        {
          headers: getAuthHeaders(getToken()),
          data: {
            currentPassword: adminPassword,
          },
        },
      );

      if (response.data.success) {
        resetDeletePinForm();
        resetDeletePinPasswordModal();
        setDeletePinStatus({
          isConfigured: false,
          updated_at: null,
          updated_by: null,
        });
        setMessage({
          type: "success",
          text: response.data.message || "Delete PIN removed",
        });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      }
    } catch (error) {
      console.error("Error removing delete PIN:", error);
      setDeletePinPasswordModal((previous) => ({
        ...previous,
        error: error.response?.data?.message || "Failed to remove delete PIN",
      }));
    } finally {
      setDeletePinDeleting(false);
    }
  };

  const handleUpdateDeletePin = (event) => {
    event.preventDefault();
    if (!isAdminRole) {
      setMessage({
        type: "error",
        text: "Only admin users can manage the delete audit PIN",
      });
      return;
    }

    const errors = validateDeletePinForm();
    if (Object.keys(errors).length) {
      markDeletePinFormTouched();
      setDeletePinErrors(errors);
      setMessage({ type: "error", text: "Please fix all errors" });
      return;
    }

    setMessage({ type: "", text: "" });
    openDeletePinPasswordModal("save");
  };

  const handleRemoveDeletePin = () => {
    if (!isAdminRole) {
      setMessage({
        type: "error",
        text: "Only admin users can manage the delete audit PIN",
      });
      return;
    }

    setMessage({ type: "", text: "" });
    openDeletePinPasswordModal("remove");
  };

  const handleSubmitDeletePinPassword = async (event) => {
    event.preventDefault();
    const adminPassword = deletePinPasswordModal.adminPassword;
    if (!adminPassword.trim()) {
      setDeletePinPasswordModal((previous) => ({
        ...previous,
        error: "Admin password is required",
      }));
      return;
    }

    if (deletePinPasswordModal.mode === "remove") {
      await submitDeletePinRemoval(adminPassword);
      return;
    }

    await submitDeletePinUpdate(adminPassword);
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

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return "bg-red-500";
    if (passwordStrength <= 2) return "bg-orange-500";
    if (passwordStrength <= 3) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 1) return "Very weak";
    if (passwordStrength <= 2) return "Weak";
    if (passwordStrength <= 3) return "Fair";
    return "Strong";
  };

  const updatedByLabel = pinStatus.updated_by
    ? userData?.email || `Admin user #${pinStatus.updated_by}`
    : "Not updated yet";

  const deletePinUpdatedByLabel = deletePinStatus.updated_by
    ? userData?.email || `Admin user #${deletePinStatus.updated_by}`
    : "Not updated yet";
  const isDeletePinPasswordRemoval =
    deletePinPasswordModal.mode === "remove";
  const isDeletePinPasswordBusy = isDeletePinPasswordRemoval
    ? deletePinDeleting
    : deletePinSaving;

  const accountTabs = [
    { id: "profile", label: "Profile", icon: FaUser },
    { id: "password", label: "Security", icon: FaLock },
    { id: "pin", label: "Organization PIN", icon: FaRegCreditCard },
    ...(isAdminRole
      ? [{ id: "delete-pin", label: "Delete PIN", icon: FaShieldAlt }]
      : []),
  ];

  const quickActions = [
    {
      title: "Change Password",
      description: "Update your account password",
      icon: FaLock,
      iconClass: "bg-[#2864dc]",
      onClick: () => setActiveTab("password"),
    },
    {
      title: "Organization PIN",
      description: "Rotate your shared access PIN",
      icon: FaKey,
      iconClass: "bg-[#8457dc]",
      onClick: () => setActiveTab("pin"),
    },
    ...(isAdminRole
      ? [
          {
            title: "Delete Audit PIN",
            description: deletePinStatus.isConfigured
              ? "Rotate or remove delete approval"
              : "Create delete approval PIN",
            icon: FaShieldAlt,
            iconClass: "bg-[#d93d53]",
            onClick: () => setActiveTab("delete-pin"),
          },
        ]
      : []),
    {
      title: "Profile Details",
      description: "Review your account information",
      icon: FaUserEdit,
      iconClass: "bg-[#17a866]",
      onClick: () => {
        setActiveTab("profile");
        setIsEditing(true);
      },
    },
    {
      title: "Security Status",
      description: "Review account protection",
      icon: FaHistory,
      iconClass: "bg-[#f28a16]",
      onClick: () => setActiveTab("pin"),
    },
  ];

  if (initialLoading && !userData) {
    return (
      <div className="flex min-h-[520px] items-center justify-center">
        <div className="text-center">
          <FaSpinner className="mx-auto mb-4 animate-spin text-4xl text-[#2864dc]" />
          <p className="text-sm font-medium text-slate-500">
            Loading account settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1560px] space-y-4 pb-2 sm:space-y-5">
      <section className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            System Administration
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">
            Account Settings
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage your profile, security settings and organization preferences.
          </p>
        </div>
        <div className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-[0_10px_35px_rgba(15,23,42,0.04)] sm:px-4 lg:w-auto">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <FaQuestionCircle />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-800">Need help?</p>
            <p className="text-xs text-slate-500">View account documentation</p>
          </div>
        </div>
      </section>

      {message.text && (
        <div
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-sm ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message.type === "success" ? <FaCheck /> : <FaExclamationCircle />}
          <span>{message.text}</span>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => setMessage({ type: "", text: "" })}
            className="ml-auto rounded p-1 transition hover:bg-black/5"
          >
            <FaTimes />
          </button>
        </div>
      )}

      <nav
        aria-label="Account settings sections"
        className="flex max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-white px-1 shadow-[0_10px_35px_rgba(15,23,42,0.04)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-3"
      >
        {accountTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setActiveTab(id);
              if (id !== "profile") setIsEditing(false);
            }}
            className={`flex min-w-fit shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3.5 text-sm font-semibold transition sm:px-4 sm:py-4 ${
              activeTab === id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {React.createElement(Icon)}
            {label}
          </button>
        ))}
      </nav>

      {activeTab === "profile" && (
        <>
          <section className="grid gap-4 xl:grid-cols-[1.18fr_0.98fr]">
            <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_12px_36px_rgba(15,23,42,0.045)] sm:p-6">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">
                    Profile Information
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Update your personal details and how others see you.
                  </p>
                </div>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-blue-200 px-4 text-sm font-semibold text-blue-600 transition hover:border-blue-300 hover:bg-blue-50"
                  >
                    <FaEdit />
                    Edit Profile
                  </button>
                )}
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <FaEnvelope className="text-slate-400" />
                    Email Address
                  </label>
                  <div className="relative">
                    <FaEnvelope className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={profileForm.email}
                      onChange={handleProfileChange}
                      onBlur={handleProfileBlur}
                      disabled={!isEditing}
                      className={getInputClass(
                        profileErrors.email && profileTouched.email,
                        "pl-11",
                      )}
                    />
                  </div>
                  <FieldError
                    visible={profileErrors.email && profileTouched.email}
                  >
                    {profileErrors.email}
                  </FieldError>
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <FaPhone className="text-slate-400" />
                    Phone Number
                  </label>
                  <div className="relative">
                    <FaPhone className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={profileForm.phone}
                      onChange={handleProfileChange}
                      onBlur={handleProfileBlur}
                      disabled={!isEditing}
                      placeholder="+1 (555) 000-0000"
                      className={getInputClass(
                        profileErrors.phone && profileTouched.phone,
                        "pl-11",
                      )}
                    />
                  </div>
                  <FieldError
                    visible={profileErrors.phone && profileTouched.phone}
                  >
                    {profileErrors.phone}
                  </FieldError>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { name: "first_name", label: "First Name" },
                    { name: "last_name", label: "Last Name" },
                  ].map(({ name, label }) => (
                    <div key={name}>
                      <label className="mb-2 block text-xs font-semibold text-slate-600">
                        {label}
                      </label>
                      <input
                        type="text"
                        name={name}
                        value={profileForm[name]}
                        onChange={handleProfileChange}
                        onBlur={handleProfileBlur}
                        disabled={!isEditing}
                        className={getInputClass(
                          profileErrors[name] && profileTouched[name],
                        )}
                      />
                      <FieldError
                        visible={profileErrors[name] && profileTouched[name]}
                      >
                        {profileErrors[name]}
                      </FieldError>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-600">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={profileForm.gender}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    className={getInputClass()}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {isEditing && (
                  <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {profileSaving ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FaSave />
                      )}
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setProfileErrors({});
                        setProfileTouched({});
                        if (userData) populateProfileForm(userData);
                      }}
                      className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <FaTimes />
                      Cancel
                    </button>
                  </div>
                )}
              </form>

              <div className="mt-5 flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50/70 px-4 py-3">
                <FaInfoCircle className="mt-0.5 text-blue-600" />
                <div>
                  <p className="text-xs font-semibold text-blue-700">
                    Profile Visibility
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Your profile information is visible to authorized team
                    members only.
                  </p>
                </div>
              </div>
            </article>

            <div className="space-y-4">
              <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_12px_36px_rgba(15,23,42,0.045)] sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600">
                  <FaShieldAlt />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-950">
                      Organization PIN
                    </h2>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        pinStatus.isConfigured
                          ? "bg-green-50 text-green-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {pinStatus.isConfigured ? "Configured" : "Not Set"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Your organization PIN adds an extra layer of security after
                    password verification.
                  </p>
                </div>
              </div>

              <div
                className={`mt-6 flex gap-3 rounded-lg border px-4 py-4 ${
                  pinStatus.isConfigured
                    ? "border-green-100 bg-green-50/70"
                    : "border-amber-100 bg-amber-50/70"
                }`}
              >
                <FaLock
                  className={`mt-0.5 ${
                    pinStatus.isConfigured ? "text-green-600" : "text-amber-600"
                  }`}
                />
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    PIN Status
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {pinStatus.isConfigured
                      ? "The organization PIN is configured and active."
                      : "Create the organization PIN to finish securing admin login."}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 border-b border-slate-100 py-6 sm:grid-cols-2">
                <div className="flex gap-3">
                  <FaCalendarAlt className="mt-0.5 text-blue-600" />
                  <div>
                    <p className="text-xs font-semibold text-blue-600">
                      Last Updated
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-700">
                      {formatPinUpdatedAt(pinStatus.updated_at)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <FaUser className="mt-0.5 text-blue-600" />
                  <div>
                    <p className="text-xs font-semibold text-blue-600">
                      Updated By
                    </p>
                    <p className="mt-1 break-all text-sm font-medium text-slate-700">
                      {updatedByLabel}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("pin")}
                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-blue-300 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
              >
                <FaKey />
                {pinStatus.isConfigured ? "Change PIN" : "Create PIN"}
              </button>

              <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-100 bg-amber-50/70 px-4 py-3">
                <FaExclamationCircle className="mt-0.5 text-amber-500" />
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Important
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    You will need to enter your current PIN before making any
                    changes.
                  </p>
                </div>
              </div>
              </article>

              {isAdminRole && (
                <article className="min-w-0 rounded-xl border border-rose-100 bg-white p-4 shadow-[0_12px_36px_rgba(15,23,42,0.045)] sm:p-6">
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                      <FaShieldAlt />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-950">
                          Delete Audit PIN
                        </h2>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            deletePinStatus.isConfigured
                              ? "bg-green-50 text-green-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {deletePinStatus.isConfigured
                            ? "Configured"
                            : "Not Set"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Required before audited delete actions. Admin password
                        is needed to create, update, or remove it.
                      </p>
                    </div>
                  </div>

                  <div
                    className={`mt-6 flex gap-3 rounded-lg border px-4 py-4 ${
                      deletePinStatus.isConfigured
                        ? "border-green-100 bg-green-50/70"
                        : "border-amber-100 bg-amber-50/70"
                    }`}
                  >
                    <FaLock
                      className={`mt-0.5 ${
                        deletePinStatus.isConfigured
                          ? "text-green-600"
                          : "text-amber-600"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Delete Approval Status
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        {deletePinStatus.isConfigured
                          ? "Delete approval is active for audited destructive actions."
                          : "Create the delete PIN before admins can complete audited deletes."}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 border-b border-slate-100 py-6 sm:grid-cols-2">
                    <div className="flex gap-3">
                      <FaCalendarAlt className="mt-0.5 text-rose-600" />
                      <div>
                        <p className="text-xs font-semibold text-rose-600">
                          Last Updated
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {formatPinUpdatedAt(deletePinStatus.updated_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <FaUser className="mt-0.5 text-rose-600" />
                      <div>
                        <p className="text-xs font-semibold text-rose-600">
                          Updated By
                        </p>
                        <p className="mt-1 break-all text-sm font-medium text-slate-700">
                          {deletePinUpdatedByLabel}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("delete-pin")}
                    className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-rose-200 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                  >
                    <FaKey />
                    {deletePinStatus.isConfigured
                      ? "Manage Delete PIN"
                      : "Create Delete PIN"}
                  </button>
                </article>
              )}
            </div>
          </section>

          <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_12px_36px_rgba(15,23,42,0.045)] sm:p-5">
            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-950">
                Quick Actions
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Common account and security actions
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {quickActions.map(
                ({ title, description, icon: Icon, iconClass, onClick }) => (
                  <button
                    key={title}
                    type="button"
                    onClick={onClick}
                    className="group flex min-w-0 items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-3 text-left transition hover:border-blue-100 hover:bg-blue-50/40"
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white ${iconClass}`}
                    >
                      {React.createElement(Icon, { className: "text-sm" })}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-slate-800">
                        {title}
                      </span>
                      <span className="mt-1 block text-[11px] text-slate-500">
                        {description}
                      </span>
                    </span>
                    <FaChevronRight className="text-xs text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-500" />
                  </button>
                ),
              )}
            </div>
          </section>

          <p className="flex items-center justify-center gap-2 py-1 text-xs text-slate-500">
            <FaShieldAlt />
            Your account is protected with organization-level security.
          </p>
        </>
      )}

      {activeTab === "password" && (
        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_12px_36px_rgba(15,23,42,0.045)] sm:p-6">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-950">
                Change Password
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Use a strong, unique password for your admin account.
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              {[
                {
                  name: "currentPassword",
                  label: "Current Password",
                  visibility: "current",
                },
                {
                  name: "newPassword",
                  label: "New Password",
                  visibility: "new",
                },
                {
                  name: "confirmPassword",
                  label: "Confirm Password",
                  visibility: "confirm",
                },
              ].map(({ name, label, visibility }) => (
                <div key={name}>
                  <label className="mb-2 block text-xs font-semibold text-slate-600">
                    {label}
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords[visibility] ? "text" : "password"}
                      name={name}
                      value={passwordForm[name]}
                      onChange={handlePasswordChange}
                      onBlur={handlePasswordBlur}
                      className={getInputClass(
                        passwordErrors[name] && passwordTouched[name],
                        "pr-11",
                      )}
                    />
                    <VisibilityButton
                      visible={showPasswords[visibility]}
                      label={`${showPasswords[visibility] ? "Hide" : "Show"} ${label.toLowerCase()}`}
                      onClick={() =>
                        setShowPasswords((previous) => ({
                          ...previous,
                          [visibility]: !previous[visibility],
                        }))
                      }
                    />
                  </div>
                  <FieldError
                    visible={passwordErrors[name] && passwordTouched[name]}
                  >
                    {passwordErrors[name]}
                  </FieldError>
                </div>
              ))}

              {passwordForm.newPassword && (
                <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-600">
                      Password strength
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full ${getPasswordStrengthColor()} transition-all`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={passwordSaving}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {passwordSaving ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaLock />
                )}
                Change Password
              </button>
            </form>
          </article>

          <aside className="space-y-4">
            <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
                <FaShieldAlt />
              </span>
              <h3 className="mt-4 text-base font-bold text-slate-900">
                Password guidance
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Use a unique password with uppercase and lowercase letters,
                numbers, and symbols. Avoid reusing credentials from another
                service.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("pin")}
              className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-[0_12px_36px_rgba(15,23,42,0.045)] transition hover:border-blue-200"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                <FaKey />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-slate-800">
                  Organization PIN
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  Review your second login step
                </span>
              </span>
              <FaChevronRight className="text-slate-400 transition group-hover:translate-x-0.5" />
            </button>
          </aside>
        </section>
      )}

      {activeTab === "pin" && (
        <section className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
          <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_12px_36px_rgba(15,23,42,0.045)] sm:p-6">
            <div className="mb-6 flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                <FaKey />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  {pinStatus.isConfigured
                    ? "Change Organization PIN"
                    : "Create Organization PIN"}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  This shared seven-digit PIN is required after email and
                  password verification.
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdateOrganizationPin} className="space-y-4">
              {pinStatus.isConfigured && (
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-600">
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
                      maxLength={7}
                      className={getInputClass(
                        pinErrors.currentPin && pinTouched.currentPin,
                        "pr-11 tracking-[0.28em]",
                      )}
                    />
                    <VisibilityButton
                      visible={showPins.current}
                      label="Toggle current organization PIN visibility"
                      onClick={() =>
                        setShowPins((previous) => ({
                          ...previous,
                          current: !previous.current,
                        }))
                      }
                    />
                  </div>
                  <FieldError
                    visible={pinErrors.currentPin && pinTouched.currentPin}
                  >
                    {pinErrors.currentPin}
                  </FieldError>
                </div>
              )}

              {[
                {
                  name: "newPin",
                  label: pinStatus.isConfigured
                    ? "New Organization PIN"
                    : "Organization PIN",
                  visibility: "new",
                },
                {
                  name: "confirmPin",
                  label: "Confirm Organization PIN",
                  visibility: "confirm",
                },
              ].map(({ name, label, visibility }) => (
                <div key={name}>
                  <label className="mb-2 block text-xs font-semibold text-slate-600">
                    {label}
                  </label>
                  <div className="relative">
                    <input
                      type={showPins[visibility] ? "text" : "password"}
                      name={name}
                      value={pinForm[name]}
                      onChange={handlePinChange}
                      onBlur={handlePinBlur}
                      inputMode="numeric"
                      maxLength={7}
                      className={getInputClass(
                        pinErrors[name] && pinTouched[name],
                        "pr-11 tracking-[0.28em]",
                      )}
                    />
                    <VisibilityButton
                      visible={showPins[visibility]}
                      label={`Toggle ${label.toLowerCase()} visibility`}
                      onClick={() =>
                        setShowPins((previous) => ({
                          ...previous,
                          [visibility]: !previous[visibility],
                        }))
                      }
                    />
                  </div>
                  <FieldError visible={pinErrors[name] && pinTouched[name]}>
                    {pinErrors[name]}
                  </FieldError>
                </div>
              ))}

              <div className="rounded-lg border border-blue-100 bg-blue-50/70 px-4 py-3 text-xs leading-5 text-slate-600">
                Use an exact seven-digit PIN for your admin team. The stored PIN
                is protected with one-way hashing.
              </div>

              <button
                type="submit"
                disabled={pinSaving}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pinSaving ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaShieldAlt />
                )}
                {pinStatus.isConfigured
                  ? "Update Organization PIN"
                  : "Create Organization PIN"}
              </button>
            </form>
          </article>

          <aside className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.045)]">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-600">
                <FaShieldAlt />
              </span>
              <h3 className="mt-4 text-base font-bold text-slate-900">
                PIN security status
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {pinStatus.isConfigured
                  ? "Your organization PIN is configured and required after password verification."
                  : "No organization PIN exists yet. Create one to complete the admin login flow."}
              </p>
              <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <FaCalendarAlt className="text-blue-600" />
                  {formatPinUpdatedAt(pinStatus.updated_at)}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <FaDesktop className="text-blue-600" />
                  Applied to all admin logins
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/70 p-4">
              <FaExclamationCircle className="mt-0.5 text-amber-500" />
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Keep this PIN private
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Share the organization PIN only with authorized admin team
                  members and rotate it when access changes.
                </p>
              </div>
            </div>
          </aside>
        </section>
      )}

      {activeTab === "delete-pin" && isAdminRole && (
        <section className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
          <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_12px_36px_rgba(15,23,42,0.045)] sm:p-6">
            <div className="mb-6 flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <FaShieldAlt />
              </span>
              <div>
                <span className="mb-2 inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-rose-600">
                  Step 1 of 2
                </span>
                <h2 className="text-lg font-bold text-slate-950">
                  {deletePinStatus.isConfigured
                    ? "Manage Delete Audit PIN"
                    : "Create Delete Audit PIN"}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  This four-digit PIN is required with a delete reason before
                  audited delete actions can complete.
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdateDeletePin} className="space-y-4">
              {deletePinStatus.isConfigured && (
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-600">
                    Current Delete PIN
                  </label>
                  <div className="relative">
                    <input
                      type={showDeletePins.current ? "text" : "password"}
                      name="currentPin"
                      value={deletePinForm.currentPin}
                      onChange={handleDeletePinChange}
                      onBlur={handleDeletePinBlur}
                      inputMode="numeric"
                      maxLength={4}
                      className={getInputClass(
                        deletePinErrors.currentPin &&
                          deletePinTouched.currentPin,
                        "pr-11 tracking-[0.35em]",
                      )}
                    />
                    <VisibilityButton
                      visible={showDeletePins.current}
                      label="Toggle current delete PIN visibility"
                      onClick={() =>
                        setShowDeletePins((previous) => ({
                          ...previous,
                          current: !previous.current,
                        }))
                      }
                    />
                  </div>
                  <FieldError
                    visible={
                      deletePinErrors.currentPin &&
                      deletePinTouched.currentPin
                    }
                  >
                    {deletePinErrors.currentPin}
                  </FieldError>
                </div>
              )}

              {[
                {
                  name: "newPin",
                  label: deletePinStatus.isConfigured
                    ? "New Delete PIN"
                    : "Delete PIN",
                  visibility: "new",
                },
                {
                  name: "confirmPin",
                  label: "Confirm Delete PIN",
                  visibility: "confirm",
                },
              ].map(({ name, label, visibility }) => (
                <div key={name}>
                  <label className="mb-2 block text-xs font-semibold text-slate-600">
                    {label}
                  </label>
                  <div className="relative">
                    <input
                      type={showDeletePins[visibility] ? "text" : "password"}
                      name={name}
                      value={deletePinForm[name]}
                      onChange={handleDeletePinChange}
                      onBlur={handleDeletePinBlur}
                      inputMode="numeric"
                      maxLength={4}
                      className={getInputClass(
                        deletePinErrors[name] && deletePinTouched[name],
                        "pr-11 tracking-[0.35em]",
                      )}
                    />
                    <VisibilityButton
                      visible={showDeletePins[visibility]}
                      label={`Toggle ${label.toLowerCase()} visibility`}
                      onClick={() =>
                        setShowDeletePins((previous) => ({
                          ...previous,
                          [visibility]: !previous[visibility],
                        }))
                      }
                    />
                  </div>
                  <FieldError
                    visible={deletePinErrors[name] && deletePinTouched[name]}
                  >
                    {deletePinErrors[name]}
                  </FieldError>
                </div>
              ))}

              <div className="rounded-lg border border-rose-100 bg-rose-50/70 px-4 py-3 text-xs leading-5 text-slate-600">
                First enter and confirm the exact four-digit delete PIN. The
                next screen asks for your admin password before anything is
                saved.
              </div>

              <div
                className={`grid gap-3 ${
                  deletePinStatus.isConfigured ? "sm:grid-cols-2" : ""
                }`}
              >
                <button
                  type="submit"
                  disabled={deletePinSaving || deletePinDeleting}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletePinSaving ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <FaShieldAlt />
                  )}
                  Continue to Admin Password
                </button>

                {deletePinStatus.isConfigured && (
                  <button
                    type="button"
                    onClick={handleRemoveDeletePin}
                    disabled={deletePinSaving || deletePinDeleting}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletePinDeleting ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <FaTimes />
                    )}
                    Verify Password to Remove
                  </button>
                )}
              </div>
            </form>
          </article>

          <aside className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.045)]">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <FaShieldAlt />
              </span>
              <h3 className="mt-4 text-base font-bold text-slate-900">
                Delete audit status
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {deletePinStatus.isConfigured
                  ? "Delete approval is configured. Admins must provide the delete PIN and a reason before audited deletes run."
                  : "No delete PIN exists yet. Create one here before admins can complete audited delete actions."}
              </p>
              <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <FaCalendarAlt className="text-rose-600" />
                  {formatPinUpdatedAt(deletePinStatus.updated_at)}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <FaUser className="text-rose-600" />
                  {deletePinUpdatedByLabel}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <FaDesktop className="text-rose-600" />
                  Admin role only
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/70 p-4">
              <FaExclamationCircle className="mt-0.5 text-amber-500" />
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Admin password required
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Creating, rotating, or removing this delete PIN requires the
                  signed-in admin account password.
                </p>
              </div>
            </div>
          </aside>
        </section>
      )}

      {deletePinPasswordModal.open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close admin password confirmation"
            className="absolute inset-0 cursor-default"
            onClick={closeDeletePinPasswordModal}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-pin-password-title"
            className="relative w-full max-w-md rounded-2xl border border-white/70 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.28)] sm:p-6"
          >
            <div className="flex items-start gap-3">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                  isDeletePinPasswordRemoval
                    ? "bg-red-50 text-red-600"
                    : "bg-rose-50 text-rose-600"
                }`}
              >
                {isDeletePinPasswordRemoval ? <FaTimes /> : <FaShieldAlt />}
              </span>
              <div className="min-w-0 flex-1">
                <h2
                  id="delete-pin-password-title"
                  className="text-lg font-bold text-slate-950"
                >
                  {isDeletePinPasswordRemoval
                    ? "Verify Admin Password"
                    : "Step 2: Admin Password"}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {isDeletePinPasswordRemoval
                    ? "Enter your admin password to remove the delete audit PIN."
                    : "Your 4-digit delete PIN entries match. Enter your admin password to save this change."}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close admin password modal"
                onClick={closeDeletePinPasswordModal}
                disabled={isDeletePinPasswordBusy}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FaTimes />
              </button>
            </div>

            <form
              onSubmit={handleSubmitDeletePinPassword}
              className="mt-5 space-y-4"
            >
              {!isDeletePinPasswordRemoval && (
                <div className="flex items-start gap-3 rounded-xl border border-green-100 bg-green-50/70 px-4 py-3">
                  <FaCheck className="mt-0.5 text-green-600" />
                  <div>
                    <p className="text-xs font-bold text-green-700">
                      PIN confirmed
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      The admin password is the final approval step before the
                      delete audit PIN is saved.
                    </p>
                  </div>
                </div>
              )}

              {isDeletePinPasswordRemoval && (
                <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50/70 px-4 py-3">
                  <FaExclamationCircle className="mt-0.5 text-red-600" />
                  <div>
                    <p className="text-xs font-bold text-red-700">
                      Removing this PIN blocks audited deletes
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      Delete actions cannot complete again until an admin
                      creates a new delete PIN.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-600">
                  Admin Password
                </label>
                <div className="relative">
                  <input
                    type={
                      deletePinPasswordModal.showPassword ? "text" : "password"
                    }
                    value={deletePinPasswordModal.adminPassword}
                    onChange={handleDeletePinPasswordChange}
                    autoComplete="current-password"
                    autoFocus
                    className={getInputClass(
                      Boolean(deletePinPasswordModal.error),
                      "pr-11",
                    )}
                  />
                  <VisibilityButton
                    visible={deletePinPasswordModal.showPassword}
                    label="Toggle admin password visibility"
                    onClick={() =>
                      setDeletePinPasswordModal((previous) => ({
                        ...previous,
                        showPassword: !previous.showPassword,
                      }))
                    }
                  />
                </div>
                <FieldError visible={Boolean(deletePinPasswordModal.error)}>
                  {deletePinPasswordModal.error}
                </FieldError>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row">
                <button
                  type="button"
                  onClick={closeDeletePinPasswordModal}
                  disabled={isDeletePinPasswordBusy}
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeletePinPasswordBusy}
                  className={`inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    isDeletePinPasswordRemoval
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {isDeletePinPasswordBusy ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <FaShieldAlt />
                  )}
                  {isDeletePinPasswordRemoval
                    ? "Remove Delete PIN"
                    : deletePinStatus.isConfigured
                      ? "Save Updated PIN"
                      : "Save Delete PIN"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};

export default AccountManagement;
