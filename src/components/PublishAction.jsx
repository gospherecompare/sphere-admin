import React, { useState, useRef, useEffect } from "react";
import { FaEllipsisV, FaToggleOn, FaToggleOff } from "react-icons/fa";
import Cookies from "js-cookie";

export default function PublishAction({
  id,
  published: initialPublished,
  onChange,
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [published, setPublished] = useState(!!initialPublished);
  const ref = useRef(null);

  useEffect(() => {
    setPublished(!!initialPublished);
  }, [initialPublished]);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  async function togglePublish() {
    setLoading(true);
    try {
      const token = Cookies.get("authToken");
      // decode token payload to extract user id (published_by)
      const parseJwt = (t) => {
        try {
          const base64Url = t.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
          const jsonPayload = decodeURIComponent(
            atob(padded)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join(""),
          );
          return JSON.parse(jsonPayload);
        } catch (e) {
          return null;
        }
      };

      const payload = token ? parseJwt(token) : null;
      const userId =
        payload?.id ||
        payload?._id ||
        payload?.userId ||
        payload?.user_id ||
        null;

      const body = {
        id,
        is_published: !published,
        published_by: userId,
      };

      const res = await fetch(
        `http://apishpere.duckdns.org/api/products/${id}/publish`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify(body),
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Server ${res.status}`);
      }

      const data = await res.json().catch(() => null);
      // backend may return the updated product or a success flag
      const newPublished =
        (data &&
          (data.data?.is_published ??
            data.data?.published ??
            data.is_published ??
            data.published)) ??
        !published;
      setPublished(newPublished);
      if (onChange) onChange(newPublished);
      setOpen(false);
    } catch (err) {
      console.error("Publish toggle error:", err);
      alert("Failed to update publish status. See console for details.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        title="Actions"
      >
        <FaEllipsisV />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="px-3 py-2 text-sm text-gray-700 border-b border-gray-100">
            Actions
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!loading) togglePublish();
            }}
            className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-gray-50 transition-colors"
          >
            {published ? (
              <FaToggleOn className="text-green-500 text-xl" />
            ) : (
              <FaToggleOff className="text-gray-400 text-xl" />
            )}
            <div className="flex-1">
              <div className="font-medium">
                {published ? "Unpublish" : "Publish"}
              </div>
              <div className="text-xs text-gray-500">
                {published ? "Disable visibility" : "Make visible to users"}
              </div>
            </div>
            <div className="text-xs text-gray-400">{loading ? "..." : ""}</div>
          </button>
        </div>
      )}
    </div>
  );
}
