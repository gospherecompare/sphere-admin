import React, { useState, useRef, useEffect } from "react";
import Cookies from "js-cookie";
import { buildUrl, getAuthToken } from "../api";
import {
  FaPlay,
  FaTrash,
  FaCopy,
  FaSave,
  FaHistory,
  FaKey,
  FaCode,
  FaFileCode,
  FaGlobe,
  FaCog,
  FaChevronDown,
  FaBook,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaSearch,
  FaPlus,
  FaEdit,
  FaDownload,
  FaUpload,
} from "react-icons/fa";

// Method color mapping
const methodColors = {
  GET: "bg-emerald-500",
  POST: "bg-blue-500",
  PUT: "bg-amber-500",
  PATCH: "bg-purple-500",
  DELETE: "bg-red-500",
  OPTIONS: "bg-gray-500",
  HEAD: "bg-indigo-500",
};

// Predefined endpoints for quick selection
const presetEndpoints = [
  { name: "Smartphones List", method: "GET", url: "/api/smartphones" },
  {
    name: "Create Smartphone (insert)",
    method: "POST",
    url: "/api/smartphones/req",
  },
  { name: "Update Smartphone", method: "PUT", url: "/api/smartphones/:id" },
  { name: "Categories", method: "GET", url: "/api/categories" },
  { name: "Brands", method: "GET", url: "/api/brands" },
  { name: "Create Laptop", method: "POST", url: "/api/laptop" },
  { name: "Network Devices", method: "GET", url: "/api/networking" },
];

export default function ApiTester() {
  // States
  const [method, setMethod] = useState("POST");
  const [url, setUrl] = useState("/api/smartphones/req");
  const [token, setToken] = useState(
    getAuthToken() || Cookies.get("authToken") || "",
  );
  const [body, setBody] = useState(`{
  "name": "iPhone 15 Pro",
  "brand_id": 1,
  "category_id": 1,
  "price": 999.99,
  "is_published": true,
  "specifications": {
    "display": "6.1-inch Super Retina XDR",
    "processor": "A17 Pro",
    "ram": "8GB",
    "storage": "256GB"
  }
}`);
  const [headers, setHeaders] = useState([
    { key: "Content-Type", value: "application/json", enabled: true },
    { key: "Accept", value: "application/json", enabled: true },
  ]);
  const [queryParams, setQueryParams] = useState([
    { key: "", value: "", enabled: true },
  ]);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("body");
  const [presetBody, setPresetBody] = useState("json");
  const [collections, setCollections] = useState([]);
  const [userPresets, setUserPresets] = useState([]);
  const [importText, setImportText] = useState("");
  const [responseTime, setResponseTime] = useState(0);
  const [copied, setCopied] = useState(false);

  const responseRef = useRef(null);

  // Add a new header
  const addHeader = () => {
    setHeaders([...headers, { key: "", value: "", enabled: true }]);
  };

  // Remove a header
  const removeHeader = (index) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  // Add a query parameter
  const addQueryParam = () => {
    setQueryParams([...queryParams, { key: "", value: "", enabled: true }]);
  };

  // Remove a query parameter
  const removeQueryParam = (index) => {
    setQueryParams(queryParams.filter((_, i) => i !== index));
  };

  // Send request
  const sendRequest = async () => {
    const startTime = Date.now();
    setLoading(true);
    setResponse(null);
    setError(null);

    // Prepare headers
    const headersObj = {};
    headers
      .filter((h) => h.enabled && h.key.trim())
      .forEach((h) => {
        headersObj[h.key] = h.value;
      });
    if (token && token.trim()) {
      headersObj["Authorization"] = `Bearer ${token}`;
    }

    // Prepare query params
    const params = new URLSearchParams();
    queryParams
      .filter((q) => q.enabled && q.key.trim())
      .forEach((q) => {
        params.append(q.key, q.value);
      });
    const queryString = params.toString();

    // Parse body
    let parsedBody = null;
    if (body && body.trim() && activeTab === "body") {
      try {
        parsedBody = JSON.parse(body);
      } catch (e) {
        setError(`Invalid JSON: ${e.message}`);
        setLoading(false);
        return;
      }
    }

    // Build URL: handle empty input and absolute URLs
    const inputUrl =
      url && String(url).trim() ? String(url).trim() : "/api/smartphone";
    let fullUrl;
    if (/^https?:\/\//i.test(inputUrl)) {
      fullUrl = inputUrl + (queryString ? `?${queryString}` : "");
    } else {
      // ensure leading slash for buildUrl
      const path = inputUrl.startsWith("/") ? inputUrl : `/${inputUrl}`;
      fullUrl = buildUrl(path) + (queryString ? `?${queryString}` : "");
    }

    try {
      const fetchOptions = { method, headers: headersObj };
      // Browsers disallow a body on GET/HEAD requests
      if (parsedBody && !/^(GET|HEAD)$/i.test(method)) {
        fetchOptions.body = JSON.stringify(parsedBody);
      }

      const res = await fetch(fullUrl, fetchOptions);

      const endTime = Date.now();
      setResponseTime(endTime - startTime);

      const text = await res.text();
      let parsedResponse = null;
      try {
        parsedResponse = JSON.parse(text);
      } catch (e) {
        parsedResponse = text;
      }

      const responseData = {
        status: res.status,
        ok: res.ok,
        headers: Object.fromEntries(res.headers.entries()),
        body: parsedResponse,
        size: text.length,
        time: endTime - startTime,
      };

      setResponse(responseData);

      // Add to history
      const historyEntry = {
        method,
        url: fullUrl,
        status: res.status,
        ok: res.ok,
        timestamp: new Date().toISOString(),
        time: endTime - startTime,
      };
      setHistory([historyEntry, ...history.slice(0, 9)]); // Keep last 10
    } catch (err) {
      setError(err.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  // Fill token from cookies
  const fillTokenFromCookies = () => {
    const authToken = getAuthToken() || Cookies.get("authToken");
    if (authToken) {
      setToken(authToken);
    }
  };

  // Load user presets from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("apiTester.presets");
      if (raw) setUserPresets(JSON.parse(raw));
    } catch (e) {
      // ignore
    }
  }, []);

  const persistPresets = (presets) => {
    try {
      localStorage.setItem("apiTester.presets", JSON.stringify(presets));
    } catch (e) {
      // ignore
    }
  };

  // Save current request as user preset
  const savePreset = () => {
    const preset = {
      name: `${method} ${url}`,
      method,
      url,
      body,
      headers,
      queryParams,
      token,
    };
    const newPresets = [preset, ...userPresets].slice(0, 50);
    setUserPresets(newPresets);
    persistPresets(newPresets);
  };

  const deletePreset = (index) => {
    const p = [...userPresets];
    p.splice(index, 1);
    setUserPresets(p);
    persistPresets(p);
  };

  // Import presets from JSON text
  const importPresets = () => {
    try {
      const parsed = JSON.parse(importText);
      if (!Array.isArray(parsed))
        throw new Error("Import must be a JSON array");
      const normalized = parsed.map((it) => ({
        name: it.name || `${it.method || "GET"} ${it.url || ""}`,
        method: it.method || "GET",
        url: it.url || "",
        body: it.body || "",
        headers: it.headers || [],
        queryParams: it.queryParams || [],
        token: it.token || "",
      }));
      const merged = [...normalized, ...userPresets].slice(0, 100);
      setUserPresets(merged);
      persistPresets(merged);
      setImportText("");
    } catch (e) {
      setError(`Import failed: ${e.message}`);
    }
  };

  // Copy response to clipboard
  const copyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(
        typeof response.body === "string"
          ? response.body
          : JSON.stringify(response.body, null, 2),
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Format size
  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Clear all
  const clearAll = () => {
    setBody("");
    setResponse(null);
    setError(null);
    setHeaders([
      { key: "Content-Type", value: "application/json", enabled: true },
      { key: "Accept", value: "application/json", enabled: true },
    ]);
    setQueryParams([{ key: "", value: "", enabled: true }]);
  };

  // Load preset
  const loadPreset = (preset) => {
    setMethod(preset.method || "GET");
    setUrl(preset.url || "");
    if (preset.body !== undefined)
      setBody(
        typeof preset.body === "string"
          ? preset.body
          : JSON.stringify(preset.body, null, 2),
      );
    if (Array.isArray(preset.headers) && preset.headers.length)
      setHeaders(preset.headers);
    if (Array.isArray(preset.queryParams) && preset.queryParams.length)
      setQueryParams(preset.queryParams);
    if (preset.token) setToken(preset.token);
    setActiveTab("body");
  };

  // Beautify JSON
  const beautifyJson = () => {
    try {
      const parsed = JSON.parse(body);
      setBody(JSON.stringify(parsed, null, 2));
    } catch (e) {
      // Not valid JSON, do nothing
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <FaCode className="text-xl text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">API Tester</h1>
                <p className="text-gray-600">
                  Test your API endpoints like Postman
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setCollections([
                    ...collections,
                    {
                      name: `Collection ${collections.length + 1}`,
                      requests: [],
                    },
                  ])
                }
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 transition-colors"
              >
                <FaSave />
                <span className="hidden sm:inline">Save</span>
              </button>
              <button
                onClick={savePreset}
                title="Save current request as preset"
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 transition-colors"
              >
                <FaFileCode />
                <span className="hidden sm:inline">Save Preset</span>
              </button>
              <button
                onClick={clearAll}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 transition-colors"
              >
                <FaTrash />
                <span className="hidden sm:inline">Clear All</span>
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-white shadow-sm rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">History</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {history.length}
                  </p>
                </div>
                <FaHistory className="text-blue-500 text-xl" />
              </div>
            </div>
            <div className="bg-white shadow-sm rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Collections</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {collections.length}
                  </p>
                </div>
                <FaBook className="text-purple-500 text-xl" />
              </div>
            </div>
            <div className="bg-white shadow-sm rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Last Status</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {history[0]?.status || "N/A"}
                  </p>
                </div>
                <FaCheckCircle
                  className={
                    history[0]?.ok
                      ? "text-emerald-500 text-xl"
                      : "text-red-500 text-xl"
                  }
                />
              </div>
            </div>
            <div className="bg-white shadow-sm rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Time</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {history.length > 0
                      ? `${(history.reduce((a, b) => a + b.time, 0) / history.length).toFixed(0)}ms`
                      : "0ms"}
                  </p>
                </div>
                <FaClock className="text-orange-500 text-xl" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Request Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Bar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex">
                    <select
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                      className="border border-gray-300 rounded-l-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {Object.keys(methodColors).map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Enter request URL"
                        className="w-full border border-gray-300 border-l-0 rounded-r-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <FaGlobe className="absolute right-3 top-3 text-gray-400" />
                    </div>
                  </div>
                  <button
                    onClick={sendRequest}
                    disabled={loading}
                    className={`px-6 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                      loading
                        ? "bg-blue-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                    } text-white shadow-sm hover:shadow-md`}
                  >
                    <FaPlay className="text-sm" />
                    {loading ? "Sending..." : "Send"}
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 px-4">
                <div className="flex space-x-6">
                  {[
                    { id: "params", label: "Params", icon: FaCog },
                    { id: "headers", label: "Headers", icon: FaKey },
                    { id: "body", label: "Body", icon: FaFileCode },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-3 px-1 flex items-center gap-2 font-medium border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <tab.icon />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-4">
                {activeTab === "params" && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">Query Parameters</h3>
                      <button
                        onClick={addQueryParam}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded flex items-center gap-1"
                      >
                        <FaPlus className="text-xs" /> Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {queryParams.map((param, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <input
                            type="checkbox"
                            checked={param.enabled}
                            onChange={(e) => {
                              const newParams = [...queryParams];
                              newParams[index].enabled = e.target.checked;
                              setQueryParams(newParams);
                            }}
                            className="h-4 w-4"
                          />
                          <input
                            type="text"
                            value={param.key}
                            onChange={(e) => {
                              const newParams = [...queryParams];
                              newParams[index].key = e.target.value;
                              setQueryParams(newParams);
                            }}
                            placeholder="Key"
                            className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm"
                          />
                          <input
                            type="text"
                            value={param.value}
                            onChange={(e) => {
                              const newParams = [...queryParams];
                              newParams[index].value = e.target.value;
                              setQueryParams(newParams);
                            }}
                            placeholder="Value"
                            className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm"
                          />
                          <button
                            onClick={() => removeQueryParam(index)}
                            className="p-1.5 text-gray-500 hover:text-red-500"
                          >
                            <FaTrash className="text-sm" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "headers" && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">Request Headers</h3>
                      <button
                        onClick={addHeader}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded flex items-center gap-1"
                      >
                        <FaPlus className="text-xs" /> Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {headers.map((header, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <input
                            type="checkbox"
                            checked={header.enabled}
                            onChange={(e) => {
                              const newHeaders = [...headers];
                              newHeaders[index].enabled = e.target.checked;
                              setHeaders(newHeaders);
                            }}
                            className="h-4 w-4"
                          />
                          <input
                            type="text"
                            value={header.key}
                            onChange={(e) => {
                              const newHeaders = [...headers];
                              newHeaders[index].key = e.target.value;
                              setHeaders(newHeaders);
                            }}
                            placeholder="Header name"
                            className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm"
                          />
                          <input
                            type="text"
                            value={header.value}
                            onChange={(e) => {
                              const newHeaders = [...headers];
                              newHeaders[index].value = e.target.value;
                              setHeaders(newHeaders);
                            }}
                            placeholder="Value"
                            className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm"
                          />
                          <button
                            onClick={() => removeHeader(index)}
                            className="p-1.5 text-gray-500 hover:text-red-500"
                          >
                            <FaTrash className="text-sm" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "body" && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex gap-2">
                        <select
                          value={presetBody}
                          onChange={(e) => setPresetBody(e.target.value)}
                          className="border border-gray-300 rounded px-3 py-1.5 text-sm"
                        >
                          <option value="json">JSON</option>
                          <option value="text">Text</option>
                          <option value="xml">XML</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={beautifyJson}
                          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded flex items-center gap-1"
                        >
                          <FaEdit className="text-xs" /> Beautify
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={12}
                      className="w-full font-mono text-sm border border-gray-300 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder='{"key": "value"}'
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Authorization */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <FaKey /> Authorization
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Bearer token"
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={fillTokenFromCookies}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                >
                  Fill from Cookies
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Response & Presets */}
          <div className="space-y-6">
            {/* Response Panel */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Response</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={copyResponse}
                      className="p-1.5 text-gray-500 hover:text-blue-500 relative"
                      title="Copy response"
                    >
                      <FaCopy />
                      {copied && (
                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded">
                          Copied!
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    <p className="mt-3 text-gray-600">Sending request...</p>
                  </div>
                ) : error ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-700 mb-2">
                      <FaTimesCircle />
                      <span className="font-medium">Error</span>
                    </div>
                    <pre className="text-red-600 text-sm overflow-auto">
                      {error}
                    </pre>
                  </div>
                ) : response ? (
                  <div>
                    <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div
                          className={`px-3 py-1 rounded-full text-white text-sm font-medium ${
                            response.ok ? "bg-emerald-500" : "bg-red-500"
                          }`}
                        >
                          {response.status} {response.ok ? "OK" : "Error"}
                        </div>
                        <div className="text-sm text-gray-600">
                          <FaClock className="inline mr-1" />
                          {response.time}ms
                        </div>
                        <div className="text-sm text-gray-600">
                          Size: {formatSize(response.size)}
                        </div>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                        <h4 className="font-medium text-sm">Body</h4>
                      </div>
                      <pre
                        ref={responseRef}
                        className="p-4 text-sm overflow-auto max-h-96 bg-gray-900 text-gray-100"
                      >
                        {typeof response.body === "string"
                          ? response.body
                          : JSON.stringify(response.body, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <FaCode className="text-3xl mx-auto mb-3 opacity-50" />
                    <p>Response will appear here</p>
                    <p className="text-sm mt-1">
                      Send a request to see the response
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Presets */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <FaBook /> Quick Presets
              </h3>
              <div className="space-y-2">
                {userPresets.length > 0 && (
                  <div className="mb-2">
                    <div className="text-xs text-gray-500 mb-1">
                      Saved Presets
                    </div>
                    {userPresets.map((preset, i) => (
                      <div key={`user-${i}`} className="flex gap-2">
                        <button
                          onClick={() => loadPreset(preset)}
                          className="flex-1 p-2 border border-gray-200 rounded-lg text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={`px-2 py-0.5 text-xs font-medium rounded text-white ${methodColors[preset.method] || "bg-gray-500"}`}
                                >
                                  {preset.method}
                                </span>
                                <span className="text-sm font-medium text-gray-900">
                                  {preset.name}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 truncate">
                                {preset.url}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deletePreset(i);
                                }}
                                title="Delete preset"
                                className="text-red-500 p-1"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {presetEndpoints.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => loadPreset(preset)}
                    className="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded text-white ${methodColors[preset.method]}`}
                          >
                            {preset.method}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {preset.name}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {preset.url}
                        </p>
                      </div>
                      <FaChevronDown className="text-gray-400 group-hover:text-gray-600 transform -rotate-90" />
                    </div>
                  </button>
                ))}

                <div className="mt-3">
                  <div className="text-xs text-gray-500 mb-1">
                    Import Presets (JSON array)
                  </div>
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    rows={4}
                    className="w-full font-mono text-xs border border-gray-300 rounded-lg p-2"
                    placeholder='[ { "name": "List products", "method": "GET", "url": "/api/smartphones" } ]'
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={importPresets}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      Import
                    </button>
                    <button
                      onClick={() => setImportText("")}
                      className="px-3 py-1 bg-gray-50 hover:bg-gray-100 rounded"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <FaHistory /> Recent History
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {history.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setMethod(item.method);
                        setUrl(item.url.split("?")[0]); // Remove query params
                      }}
                      className="w-full p-2 text-left hover:bg-gray-50 rounded transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded text-white ${methodColors[item.method]}`}
                          >
                            {item.method}
                          </span>
                          <span className="text-xs text-gray-600 truncate max-w-[120px]">
                            {item.url}
                          </span>
                        </div>
                        <span
                          className={`text-xs font-medium ${
                            item.ok ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(item.timestamp).toLocaleTimeString()} •{" "}
                        {item.time}ms
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
