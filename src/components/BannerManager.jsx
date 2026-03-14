import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FaBullhorn,
  FaPlus,
  FaSave,
  FaEdit,
  FaTrash,
  FaUpload,
  FaSpinner,
  FaCheckCircle,
  FaExclamationCircle,
  FaExternalLinkAlt,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import Cookies from "js-cookie";
import { buildUrl } from "../api";
import { uploadToCloudinary } from "../config/cloudinary";

const PLACEMENTS = [
  { value: "top_leaderboard", label: "Top Leaderboard / Masthead" },
  { value: "right_sidebar", label: "Right Sidebar / Rail" },
  { value: "in_content", label: "In-Content / Between Blocks" },
  { value: "footer_leaderboard", label: "Footer Leaderboard" },
  { value: "mobile_sticky", label: "Mobile Sticky Bottom" },
];

const SIZE_PRESETS = {
  top_leaderboard: {
    desktop: ["970x90", "970x250", "728x90"],
    tablet: ["728x90"],
    mobile: ["320x50", "320x100"],
  },
  right_sidebar: {
    desktop: ["300x600", "300x250", "160x600", "336x280"],
    tablet: ["300x250"],
    mobile: [],
  },
  in_content: {
    desktop: ["300x250", "336x280", "728x90"],
    tablet: ["300x250"],
    mobile: ["300x250", "320x50", "320x100"],
  },
  footer_leaderboard: {
    desktop: ["970x90", "728x90"],
    tablet: ["728x90"],
    mobile: ["320x50"],
  },
  mobile_sticky: {
    desktop: [],
    tablet: [],
    mobile: ["320x50", "320x100"],
  },
};

const getDefaultSizes = (placement) => {
  const preset = SIZE_PRESETS[placement] || {};
  return {
    size_desktop: preset.desktop?.[0] || "",
    size_tablet: preset.tablet?.[0] || "",
    size_mobile: preset.mobile?.[0] || "",
  };
};

const toDateTimeLocal = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate(),
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const toUtcIso = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
};

const BannerManager = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [mediaPreview, setMediaPreview] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState(() => ({
    title: "",
    placement: "top_leaderboard",
    size_desktop: "",
    size_tablet: "",
    size_mobile: "",
    media_url: "",
    media_type: "",
    link_url: "",
    start_at: "",
    end_at: "",
    is_published: false,
    priority: 0,
  }));

  const placementPresets = useMemo(
    () => SIZE_PRESETS[formData.placement] || {},
    [formData.placement],
  );

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    if (editingId) return;
    const defaults = getDefaultSizes(formData.placement);
    setFormData((prev) => ({
      ...prev,
      size_desktop: prev.size_desktop || defaults.size_desktop,
      size_tablet: prev.size_tablet || defaults.size_tablet,
      size_mobile: prev.size_mobile || defaults.size_mobile,
    }));
  }, [formData.placement, editingId]);

  const showToast = (title, message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const token = Cookies.get("authToken");
      const res = await fetch(buildUrl("/api/admin/banners"), {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setBanners(Array.isArray(data?.banners) ? data.banners : []);
    } catch (err) {
      console.error("Failed to fetch banners:", err);
      showToast("Error", "Failed to load banners", "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    const defaults = getDefaultSizes("top_leaderboard");
    setFormData({
      title: "",
      placement: "top_leaderboard",
      size_desktop: defaults.size_desktop,
      size_tablet: defaults.size_tablet,
      size_mobile: defaults.size_mobile,
      media_url: "",
      media_type: "",
      link_url: "",
      start_at: "",
      end_at: "",
      is_published: false,
      priority: 0,
    });
    setMediaPreview(null);
    setEditingId(null);
  };

  const handleEdit = (banner) => {
    setEditingId(banner.id);
    setFormData({
      title: banner.title || "",
      placement: banner.placement || "top_leaderboard",
      size_desktop: banner.size_desktop || "",
      size_tablet: banner.size_tablet || "",
      size_mobile: banner.size_mobile || "",
      media_url: banner.media_url || "",
      media_type: banner.media_type || "",
      link_url: banner.link_url || "",
      start_at: toDateTimeLocal(banner.start_at),
      end_at: toDateTimeLocal(banner.end_at),
      is_published: Boolean(banner.is_published),
      priority: Number(banner.priority || 0),
    });
    setMediaPreview(banner.media_url || null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this banner?")) return;
    try {
      const token = Cookies.get("authToken");
      const res = await fetch(buildUrl(`/api/admin/banners/${id}`), {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast("Success", "Banner deleted", "success");
      fetchBanners();
    } catch (err) {
      console.error("Delete banner error:", err);
      showToast("Error", "Failed to delete banner", "error");
    }
  };

  const handleTogglePublish = async (banner) => {
    try {
      const token = Cookies.get("authToken");
      const res = await fetch(buildUrl(`/api/admin/banners/${banner.id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ is_published: !banner.is_published }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast(
        "Success",
        `Banner ${banner.is_published ? "unpublished" : "published"}`,
        "success",
      );
      fetchBanners();
    } catch (err) {
      console.error("Toggle publish error:", err);
      showToast("Error", "Failed to update publish status", "error");
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 30 * 1024 * 1024) {
      showToast("Error", "File size should be under 30MB", "error");
      return;
    }

    setUploading(true);
    try {
      const data = await uploadToCloudinary(file, "banners", {
        resourceType: "auto",
      });
      const mediaType = file.type || data.resource_type || "";
      setFormData((prev) => ({
        ...prev,
        media_url: data.secure_url,
        media_type: mediaType,
      }));
      setMediaPreview(data.secure_url);
      showToast("Success", "Banner media uploaded", "success");
    } catch (err) {
      console.error("Banner upload failed:", err);
      showToast("Error", err.message || "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.placement) {
      showToast("Error", "Placement is required", "error");
      return;
    }
    if (!formData.media_url) {
      showToast("Error", "Banner media is required", "error");
      return;
    }

    setSaving(true);
    try {
      const token = Cookies.get("authToken");
      const method = editingId ? "PUT" : "POST";
      const url = editingId
        ? buildUrl(`/api/admin/banners/${editingId}`)
        : buildUrl("/api/admin/banners");

      const payload = {
        title: formData.title || null,
        placement: formData.placement,
        size_desktop: formData.size_desktop || null,
        size_tablet: formData.size_tablet || null,
        size_mobile: formData.size_mobile || null,
        media_url: formData.media_url,
        media_type: formData.media_type || null,
        link_url: formData.link_url || null,
        start_at: toUtcIso(formData.start_at),
        end_at: toUtcIso(formData.end_at),
        is_published: Boolean(formData.is_published),
        priority: Number(formData.priority || 0),
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(errText || `HTTP ${res.status}`);
      }

      showToast("Success", editingId ? "Banner updated" : "Banner created");
      resetForm();
      fetchBanners();
    } catch (err) {
      console.error("Save banner error:", err);
      showToast("Error", err.message || "Failed to save banner", "error");
    } finally {
      setSaving(false);
    }
  };

  const isVideo = (url, type) => {
    if (type && String(type).startsWith("video")) return true;
    return /\.(mp4|webm|mov|m4v)$/i.test(url || "");
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
          <FaBullhorn />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banner Manager</h1>
          <p className="text-sm text-gray-500">
            Create, schedule, and publish marketing banners
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FaPlus className="text-purple-600" />
            {editingId ? "Edit Banner" : "Create Banner"}
          </h2>
          {editingId && (
            <button
              onClick={resetForm}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title (optional)
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="Campaign title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Placement
            </label>
            <select
              name="placement"
              value={formData.placement}
              onChange={handleInputChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              {PLACEMENTS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Desktop Size
            </label>
            <input
              list="desktop-sizes"
              name="size_desktop"
              value={formData.size_desktop}
              onChange={handleInputChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="e.g. 970x90"
            />
            <datalist id="desktop-sizes">
              {(placementPresets.desktop || []).map((size) => (
                <option key={size} value={size} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tablet Size
            </label>
            <input
              list="tablet-sizes"
              name="size_tablet"
              value={formData.size_tablet}
              onChange={handleInputChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="e.g. 728x90"
            />
            <datalist id="tablet-sizes">
              {(placementPresets.tablet || []).map((size) => (
                <option key={size} value={size} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mobile Size
            </label>
            <input
              list="mobile-sizes"
              name="size_mobile"
              value={formData.size_mobile}
              onChange={handleInputChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="e.g. 320x50"
            />
            <datalist id="mobile-sizes">
              {(placementPresets.mobile || []).map((size) => (
                <option key={size} value={size} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Click URL (optional)
            </label>
            <input
              type="text"
              name="link_url"
              value={formData.link_url}
              onChange={handleInputChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="https://brand.com/campaign"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time
            </label>
            <input
              type="datetime-local"
              name="start_at"
              value={formData.start_at}
              onChange={handleInputChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Time
            </label>
            <input
              type="datetime-local"
              name="end_at"
              value={formData.end_at}
              onChange={handleInputChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <input
              type="number"
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              min={0}
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                name="is_published"
                checked={formData.is_published}
                onChange={handleInputChange}
                className="w-4 h-4 text-purple-600"
              />
              Publish
            </label>
          </div>
        </div>

        <div className="mt-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Banner Media (image, gif, or video)
          </label>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 border border-dashed border-gray-300 rounded-xl p-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleUpload}
              />
              <button
                onClick={triggerUpload}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm"
                disabled={uploading}
              >
                {uploading ? <FaSpinner className="animate-spin" /> : <FaUpload />}
                {uploading ? "Uploading..." : "Upload Banner"}
              </button>
              {formData.media_url && (
                <div className="mt-2 text-xs text-gray-500 break-all">
                  {formData.media_url}
                </div>
              )}
            </div>

            <div className="w-full md:w-72 border border-gray-200 rounded-xl p-3 bg-gray-50">
              <div className="text-xs text-gray-500 mb-2">Preview</div>
              {mediaPreview ? (
                isVideo(mediaPreview, formData.media_type) ? (
                  <video
                    src={mediaPreview}
                    className="w-full rounded-lg"
                    muted
                    autoPlay
                    loop
                    playsInline
                  />
                ) : (
                  <img
                    src={mediaPreview}
                    alt="Banner preview"
                    className="w-full rounded-lg"
                  />
                )
              ) : (
                <div className="text-xs text-gray-400">No media uploaded</div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm"
            disabled={saving}
          >
            {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
            {editingId ? "Update Banner" : "Create Banner"}
          </button>
          <button
            onClick={resetForm}
            className="px-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Banner List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">All Banners</h2>
          {loading && <FaSpinner className="animate-spin text-gray-500" />}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">Placement</th>
                <th className="text-left px-4 py-3">Sizes</th>
                <th className="text-left px-4 py-3">Dates</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Preview</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((banner) => (
                <tr key={banner.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {banner.title || "Untitled"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {banner.placement}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    <div>D: {banner.size_desktop || "-"}</div>
                    <div>T: {banner.size_tablet || "-"}</div>
                    <div>M: {banner.size_mobile || "-"}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    <div>Start: {banner.start_at ? new Date(banner.start_at).toLocaleString() : "-"}</div>
                    <div>End: {banner.end_at ? new Date(banner.end_at).toLocaleString() : "-"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                          banner.is_published
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {banner.is_published ? (
                          <FaCheckCircle />
                        ) : (
                          <FaExclamationCircle />
                        )}
                        {banner.is_published ? "Published" : "Unpublished"}
                      </span>
                      {banner.is_active && (
                        <span className="text-[10px] text-green-600">
                          Active
                        </span>
                      )}
                      {banner.is_expired && (
                        <span className="text-[10px] text-red-500">
                          Expired
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {banner.media_url ? (
                      <a
                        href={banner.media_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-purple-700 text-xs"
                      >
                        View <FaExternalLinkAlt />
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(banner)}
                        className="p-2 rounded-lg bg-blue-50 text-blue-600"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleTogglePublish(banner)}
                        className="p-2 rounded-lg bg-yellow-50 text-yellow-700"
                        title="Toggle publish"
                      >
                        {banner.is_published ? <FaEyeSlash /> : <FaEye />}
                      </button>
                      <button
                        onClick={() => handleDelete(banner.id)}
                        className="p-2 rounded-lg bg-red-50 text-red-600"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && banners.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No banners created yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toasts */}
      <div className="fixed top-5 right-5 space-y-3 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-sm text-white ${
              toast.type === "error" ? "bg-red-500" : "bg-green-600"
            }`}
          >
            <div className="font-semibold">{toast.title}</div>
            <div>{toast.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BannerManager;
