import React, { useCallback, useEffect, useState } from "react";
import { getApps, initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import {
  FaBell,
  FaBullhorn,
  FaCheckCircle,
  FaExclamationTriangle,
  FaHeartbeat,
  FaUsers,
} from "react-icons/fa";
import { buildUrl, getAuthToken } from "../api";

const TABS = ["Overview", "Send", "Subscribers", "History", "Health", "Diagnostics"];
const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const apiRequest = async (path, options = {}) => {
  const startedAt = performance.now();
  const token = getAuthToken();
  let response;
  try {
    response = await fetch(buildUrl(`/api/admin/notifications${path}`), {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    const connectionError = new Error(
      `Notification API connection failed. Check the configured API URL, server availability, CORS, and network connection. ${error?.message || ""}`.trim(),
    );
    connectionError.api_latency_ms = Math.round(performance.now() - startedAt);
    throw connectionError;
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      body.message || `Request failed with status ${response.status}`,
    );
    error.status = response.status;
    error.payload = body;
    error.api_latency_ms = Math.round(performance.now() - startedAt);
    throw error;
  }
  return body;
};

const inspectBrowserNotifications = async () => {
  if (typeof window === "undefined") {
    return { checks: [], project_id: null };
  }

  const checks = [];
  const addCheck = (name, status, detail) =>
    checks.push({ name, status, detail });
  const requiredFirebaseFields = [
    "apiKey",
    "authDomain",
    "projectId",
    "storageBucket",
    "messagingSenderId",
    "appId",
  ];
  const missingFields = requiredFirebaseFields.filter(
    (field) => !FIREBASE_CONFIG[field],
  );
  const permission =
    "Notification" in window ? Notification.permission : "unsupported";

  addCheck(
    "Browser network",
    navigator.onLine ? "ok" : "error",
    navigator.onLine
      ? "Browser reports an active network connection."
      : "Browser is offline. Check the device network connection.",
  );
  addCheck(
    "Secure context",
    window.isSecureContext ? "ok" : "error",
    window.isSecureContext
      ? "Push APIs are available in this secure context."
      : "Push notifications require HTTPS or localhost.",
  );
  addCheck(
    "Notification permission",
    permission === "granted"
      ? "ok"
      : permission === "denied"
        ? "error"
        : "warning",
    permission === "granted"
      ? "Browser permission is granted."
      : permission === "denied"
        ? "Permission is blocked in browser/site settings."
        : permission === "default"
          ? "Permission has not been requested for this browser."
          : "This browser does not expose the Notifications API.",
  );
  addCheck(
    "Web Firebase configuration",
    missingFields.length ? "error" : "ok",
    missingFields.length
      ? `Missing frontend settings: ${missingFields.join(", ")}.`
      : `All required settings are present. Project: ${FIREBASE_CONFIG.projectId}.`,
  );
  addCheck(
    "VAPID key",
    import.meta.env.VITE_FIREBASE_VAPID_KEY ? "ok" : "error",
    import.meta.env.VITE_FIREBASE_VAPID_KEY
      ? "A VAPID key is configured (key value is hidden)."
      : "VITE_FIREBASE_VAPID_KEY is missing from the frontend build configuration.",
  );

  let messagingSupported = false;
  try {
    messagingSupported = await isSupported();
  } catch {
    messagingSupported = false;
  }
  addCheck(
    "Firebase messaging support",
    messagingSupported ? "ok" : "error",
    messagingSupported
      ? "Firebase Messaging APIs are supported by this browser."
      : "Firebase Messaging is unavailable; check browser support and privacy settings.",
  );

  let serviceWorker;
  if (!("serviceWorker" in navigator)) {
    addCheck(
      "Push service worker",
      "error",
      "This browser does not support service workers.",
    );
  } else {
    try {
      const response = await fetch("/firebase-messaging-sw.js", {
        method: "HEAD",
        cache: "no-store",
      });
      addCheck(
        "Service worker asset",
        response.ok ? "ok" : "error",
        response.ok
          ? "The production service-worker script is reachable."
          : `Service-worker script returned HTTP ${response.status}.`,
      );
      serviceWorker = await navigator.serviceWorker.getRegistration("/");
      const activeWorker = serviceWorker?.active;
      addCheck(
        "Service worker registration",
        activeWorker ? "ok" : "warning",
        activeWorker
          ? `Active worker: ${new URL(activeWorker.scriptURL).pathname}.`
          : "No active push service worker is registered for this site. Enable push to register it.",
      );
    } catch (error) {
      addCheck(
        "Service worker registration",
        "error",
        error?.message || "Could not inspect the service worker.",
      );
    }
  }

  let serviceWorkerProjectId = null;
  const workerScriptUrl = serviceWorker?.active?.scriptURL;
  if (workerScriptUrl) {
    try {
      const configParameter = new URL(workerScriptUrl).searchParams.get("config");
      if (configParameter) {
        serviceWorkerProjectId = JSON.parse(configParameter).projectId || null;
      }
    } catch {
      serviceWorkerProjectId = null;
    }
  }

  if (serviceWorkerProjectId && FIREBASE_CONFIG.projectId) {
    const matches = serviceWorkerProjectId === FIREBASE_CONFIG.projectId;
    addCheck(
      "Service worker Firebase project",
      matches ? "ok" : "error",
      matches
        ? `Service worker and page both use ${FIREBASE_CONFIG.projectId}.`
        : `Service worker uses ${serviceWorkerProjectId}, but page uses ${FIREBASE_CONFIG.projectId}. Re-enable push to refresh its configuration.`,
    );
  }

  return {
    checks,
    project_id: FIREBASE_CONFIG.projectId || null,
    permission,
  };
};

const CheckRow = ({ name, status, detail }) => {
  const normalizedStatus = String(status || "").toLowerCase();
  const isError = ["error", "failed", "offline", "stopped", "missing", "file_missing", "file_unreadable", "invalid", "incomplete"].includes(
    normalizedStatus,
  );
  const isWarning = ["warning", "unknown", "not_seen", "firebase_missing", "degraded"].includes(
    normalizedStatus,
  );
  const Icon = isError || isWarning ? FaExclamationTriangle : FaCheckCircle;
  const colorClass = isError
    ? "text-rose-600"
    : isWarning
      ? "text-amber-600"
      : "text-emerald-600";

  return (
    <div className="flex gap-3 border-b border-slate-100 py-3 last:border-b-0">
      <Icon className={`mt-0.5 shrink-0 ${colorClass}`} aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800">{name}</p>
        <p className="mt-0.5 break-words text-xs leading-5 text-slate-500">
          {detail}
        </p>
      </div>
    </div>
  );
};

const StatusCard = ({ label, value, detail, icon: Icon }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      {React.createElement(Icon, {
        className: "text-lg text-indigo-500",
        "aria-hidden": true,
      })}
    </div>
    <p className="mt-3 text-3xl font-semibold text-slate-950">{value ?? "—"}</p>
    {detail ? <p className="mt-1 text-sm text-slate-500">{detail}</p> : null}
  </div>
);

const EventRows = ({ events }) => (
  <div className="divide-y divide-slate-100">
    {events.length ? events.map((event) => (
      <article key={event.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900">{event.title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{event.message}</p>
          <p className="mt-2 text-xs text-slate-400">
            {event.event_type} · {new Date(event.created_at).toLocaleString()}
          </p>
        </div>
        {event.push_recipients !== undefined ? (
          <div className="text-right text-xs text-slate-500">
            <p>{event.push_recipients} recipients</p>
            <p>{event.sent} sent · {event.queued} queued · {event.failed} failed</p>
          </div>
        ) : null}
      </article>
    )) : <p className="py-8 text-center text-sm text-slate-500">No notification events yet.</p>}
  </div>
);

const AdminNotifications = () => {
  const [tab, setTab] = useState("Overview");
  const [health, setHealth] = useState(null);
  const [events, setEvents] = useState([]);
  const [subscriberData, setSubscriberData] = useState(null);
  const [audience, setAudience] = useState(null);
  const [diagnostics, setDiagnostics] = useState(null);
  const [browserDiagnostics, setBrowserDiagnostics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pushState, setPushState] = useState("idle");
  const [form, setForm] = useState({ title: "", message: "", url: "", image_url: "" });

  const loadTabData = useCallback(async (selectedTab) => {
    setLoading(true);
    setError("");
    try {
      if (selectedTab === "Overview" || selectedTab === "Health") {
        const [healthData, eventData] = await Promise.all([
          apiRequest("/health"),
          apiRequest("/events?limit=8"),
        ]);
        setHealth(healthData);
        setEvents(eventData.events || []);
      } else if (selectedTab === "History") {
        const data = await apiRequest("/events?limit=100");
        setEvents(data.events || []);
      } else if (selectedTab === "Subscribers") {
        const data = await apiRequest("/subscribers?limit=50");
        setSubscriberData(data);
      } else if (selectedTab === "Send") {
        setAudience(await apiRequest("/audience"));
      } else if (selectedTab === "Diagnostics") {
        const diagnosticsStartedAt = performance.now();
        const [result, browserData] = await Promise.all([
          apiRequest("/diagnostics").then((data) => ({
            data,
            api_latency_ms: Math.round(performance.now() - diagnosticsStartedAt),
          })),
          inspectBrowserNotifications(),
        ]);
        setDiagnostics({
          ...result.data,
          api_latency_ms: result.api_latency_ms,
        });
        setBrowserDiagnostics(browserData);
      }
    } catch (requestError) {
      setError(requestError.message || "Could not load notification data.");
      if (selectedTab === "Diagnostics") {
        setDiagnostics(
          requestError.payload
            ? {
                ...requestError.payload,
                api_latency_ms: requestError.api_latency_ms,
              }
            : null,
        );
        try {
          setBrowserDiagnostics(await inspectBrowserNotifications());
        } catch {
          setBrowserDiagnostics(null);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTabData(tab);
  }, [loadTabData, tab]);

  const enablePush = async () => {
    setError("");
    setMessage("");
    setPushState("working");
    try {
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
      if (!vapidKey || Object.values(FIREBASE_CONFIG).some((value) => !value)) {
        throw new Error("Set the VITE_FIREBASE_* web config and VITE_FIREBASE_VAPID_KEY before enabling push.");
      }
      if (!("Notification" in window) || !(await isSupported())) {
        throw new Error("This browser does not support Firebase web push.");
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Notification permission was not granted.");
      const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
      const serviceWorkerUrl = new URL("/firebase-messaging-sw.js", window.location.origin);
      serviceWorkerUrl.searchParams.set("config", JSON.stringify(FIREBASE_CONFIG));
      const registration = await navigator.serviceWorker.register(serviceWorkerUrl);
      const token = await getToken(getMessaging(app), { vapidKey, serviceWorkerRegistration: registration });
      if (!token) throw new Error("Firebase did not return a device token.");
      await apiRequest("/devices", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      setPushState("enabled");
      setMessage("This browser is registered for admin push tests.");
    } catch (requestError) {
      setPushState("idle");
      setError(requestError.message || "Push registration failed.");
    }
  };

  const testPush = async () => {
    setError("");
    setMessage("");
    try {
      const result = await apiRequest("/test", { method: "POST" });
      const failures = Object.entries(result.failure_codes || {})
        .map(([code, count]) => `${code} (${count})`)
        .join(", ");
      setMessage(
        `FCM accepted ${result.sent} test push(es); ${result.failed} failed.${failures ? ` Failure codes: ${failures}` : ""}`,
      );
    } catch (requestError) {
      setError(requestError.message || "Push test failed.");
    }
  };

  const disablePush = async () => {
    setError("");
    setMessage("");
    try {
      await apiRequest("/devices", { method: "DELETE" });
      setPushState("idle");
      setMessage("Admin push devices have been disabled.");
    } catch (requestError) {
      setError(requestError.message || "Could not disable admin push.");
    }
  };

  const refreshAudience = async () => {
    setError("");
    try {
      setAudience(await apiRequest("/audience"));
    } catch (requestError) {
      setError(requestError.message || "Could not refresh the subscriber count.");
    }
  };

  const sendNotification = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!audience) {
      setError("Refresh the audience preview before sending.");
      return;
    }
    const confirmed = window.confirm(
      `Send this notification to ${audience.recipients} subscribed customer(s)?`,
    );
    if (!confirmed) return;
    try {
      const result = await apiRequest("/send", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          expected_recipients: audience.recipients,
        }),
      });
      setMessage(`Notification queued for ${result.recipientCount} customer(s).`);
      setForm({ title: "", message: "", url: "", image_url: "" });
      setAudience(null);
    } catch (requestError) {
      setError(requestError.message || "Notification could not be sent.");
      if (requestError.status === 409) refreshAudience();
    }
  };

  return (
    <section className="min-h-full bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Engagement</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Notification Center</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Monitor automatic publish alerts, send confirmed subscriber broadcasts, and review delivery health.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadTabData(tab)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Refresh
          </button>
        </header>

        <nav className="mt-7 flex gap-2 overflow-x-auto border-b border-slate-200" aria-label="Notification sections">
          {TABS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold ${
                tab === item ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              {item}
            </button>
          ))}
        </nav>

        {error ? <div role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div> : null}
        {message ? <div role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div> : null}
        {loading ? <p className="py-10 text-center text-sm text-slate-500">Loading notification data…</p> : null}

        {!loading && tab === "Overview" ? (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatusCard label="Active subscriptions" value={health?.subscribers?.active_subscriptions} icon={FaUsers} />
              <StatusCard label="Registered devices" value={health?.subscribers?.active_devices} icon={FaBell} />
              <StatusCard label="Queued deliveries" value={health?.queue?.queued ?? 0} detail="Waiting for the push worker" icon={FaBullhorn} />
              <StatusCard label="Worker" value={health?.worker?.status || "unknown"} detail={health?.worker?.last_heartbeat_at ? `Heartbeat ${new Date(health.worker.last_heartbeat_at).toLocaleString()}` : "No heartbeat received"} icon={FaHeartbeat} />
            </div>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><h2 className="text-lg font-semibold text-slate-950">Admin device push</h2><p className="mt-1 text-sm text-slate-500">Register this browser separately from customer devices and send a server-originated test.</p></div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={enablePush} className="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-indigo-700">{pushState === "enabled" ? "Re-register device" : "Enable push"}</button>
                  <button type="button" onClick={testPush} className="rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Send test</button>
                  <button type="button" onClick={disablePush} className="rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Disable admin devices</button>
                </div>
              </div>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white px-5 py-2 sm:px-6">
              <h2 className="pt-4 text-lg font-semibold text-slate-950">Recent activity</h2>
              <EventRows events={events} />
            </section>
          </div>
        ) : null}

        {!loading && tab === "Send" ? (
          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <form onSubmit={sendNotification} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-slate-950">Compose subscriber notification</h2>
              <label className="block text-sm font-medium text-slate-700">Title<input required minLength={3} maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
              <label className="block text-sm font-medium text-slate-700">Message<textarea required minLength={5} maxLength={500} rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
              <label className="block text-sm font-medium text-slate-700">Destination URL<input type="text" maxLength={2048} placeholder="/news/example or https://…" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
              <label className="block text-sm font-medium text-slate-700">Image URL (optional)<input type="url" maxLength={2048} placeholder="https://…" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
              <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Review and send</button>
            </form>
            <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="font-semibold text-slate-950">Audience confirmation</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">The server rechecks the push-enabled customer count during queueing. If it changes, you must review the new count before confirming again.</p>
              <p className="mt-5 text-3xl font-semibold text-indigo-700">{audience?.recipients ?? "—"}</p>
              <p className="text-sm text-slate-500">push-enabled customers · {audience?.active_devices ?? "—"} active devices</p>
              <button type="button" onClick={refreshAudience} className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Refresh audience count</button>
            </aside>
          </div>
        ) : null}

        {!loading && tab === "Subscribers" ? (
          <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="grid gap-4 border-b border-slate-100 p-5 sm:grid-cols-3">
              <StatusCard label="Active subscriptions" value={subscriberData?.stats?.active_subscriptions} icon={FaUsers} />
              <StatusCard label="Any price drop" value={subscriberData?.stats?.any_drop} icon={FaBell} />
              <StatusCard label="Target price" value={subscriberData?.stats?.target_price} icon={FaBullhorn} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Variant</th><th className="px-4 py-3">Source / Store</th><th className="px-4 py-3">Trigger</th><th className="px-4 py-3">Target</th><th className="px-4 py-3">Push</th><th className="px-4 py-3">Status</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{(subscriberData?.subscriptions || []).map((item) => <tr key={item.id}><td className="px-4 py-3 font-medium text-slate-900">{item.product_name}</td><td className="px-4 py-3 text-slate-600">{[item.ram, item.storage].filter(Boolean).join(" / ") || "—"}</td><td className="px-4 py-3 text-slate-600">{item.source_type}{item.store_name ? ` · ${item.store_name}` : ""}</td><td className="px-4 py-3 text-slate-600">{item.trigger_type}</td><td className="px-4 py-3 text-slate-600">{item.target_price ?? "—"}</td><td className="px-4 py-3 text-slate-600">{item.has_active_push ? "Active" : "No active device"}</td><td className="px-4 py-3">{item.is_active ? "Active" : "Inactive"}</td></tr>)}</tbody>
              </table>
              {!subscriberData?.subscriptions?.length ? <p className="p-8 text-center text-sm text-slate-500">No subscriptions found.</p> : null}
            </div>
          </section>
        ) : null}

        {!loading && tab === "History" ? (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white px-5 py-2 sm:px-6">
            <h2 className="pt-4 text-lg font-semibold text-slate-950">Notification event history</h2>
            <EventRows events={events} />
          </section>
        ) : null}

        {!loading && tab === "Health" ? (
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-slate-950">Service status</h2>
              <dl className="mt-4 space-y-3 text-sm">{Object.entries(health || {}).filter(([, value]) => value && typeof value === "object" && !Array.isArray(value)).map(([key, value]) => <div key={key} className="flex justify-between gap-4 border-b border-slate-100 pb-3"><dt className="capitalize text-slate-500">{key.replaceAll("_", " ")}</dt><dd className="text-right font-medium text-slate-800">{value.status || JSON.stringify(value)}</dd></div>)}</dl>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-slate-950">Queue counts</h2>
              <pre className="mt-4 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-emerald-200">{JSON.stringify(health?.queue || {}, null, 2)}</pre>
              <p className="mt-3 text-xs leading-5 text-slate-500">Health data reports service status only; credentials and tokens are never returned.</p>
            </section>
          </div>
        ) : null}

        {!loading && tab === "Diagnostics" ? (
          <div className="mt-6 space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">End-to-end notification diagnostics</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Opening this page only reads status; it does not send a notification. FCM acceptance confirms
                    provider handoff, not that a device displayed the notification.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={enablePush} className="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                    {pushState === "enabled" ? "Re-register this browser" : "Register this browser"}
                  </button>
                  <button type="button" onClick={testPush} className="rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    Send explicit test
                  </button>
                  <button type="button" onClick={disablePush} className="rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    Disable admin devices
                  </button>
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-400">
                Server checked {diagnostics?.checked_at ? new Date(diagnostics.checked_at).toLocaleString() : "—"}
                {" · "}API round trip {diagnostics?.api_latency_ms ?? "—"} ms
              </p>
            </section>

            <div className="grid gap-5 lg:grid-cols-2">
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="font-semibold text-slate-950">Server and provider</h2>
                <div className="mt-2">
                  <CheckRow
                    name="Database"
                    status={diagnostics?.database?.status || "unknown"}
                    detail={diagnostics?.database?.reason || `${diagnostics?.database?.latency_ms ?? "—"} ms query latency`}
                  />
                  <CheckRow
                    name="Firebase Admin credentials"
                    status={diagnostics?.firebase_admin?.status || "unknown"}
                    detail={[
                      diagnostics?.firebase_admin?.reason,
                      diagnostics?.firebase_admin?.missing_fields?.length
                        ? `Missing: ${diagnostics.firebase_admin.missing_fields.join(", ")}.`
                        : null,
                      diagnostics?.firebase_admin?.project_id
                        ? `Server project: ${diagnostics.firebase_admin.project_id}.`
                        : null,
                    ].filter(Boolean).join(" ") || "Credential values are intentionally not shown."}
                  />
                  <CheckRow
                    name="Notification worker"
                    status={diagnostics?.worker?.status || "unknown"}
                    detail={[
                      diagnostics?.worker?.last_heartbeat_at
                        ? `Heartbeat ${diagnostics.worker.heartbeat_age_seconds}s ago (${new Date(diagnostics.worker.last_heartbeat_at).toLocaleString()}).`
                        : `No heartbeat received. Start the separate worker with: ${diagnostics?.runtime?.worker_command || "npm run worker:notifications"}.`,
                      `Processed ${diagnostics?.worker?.processed_count ?? 0} deliveries.`,
                      diagnostics?.worker?.last_error ? `Last error: ${diagnostics.worker.last_error}` : null,
                    ].filter(Boolean).join(" ")}
                  />
                  <CheckRow
                    name="Runtime environment"
                    status={diagnostics?.runtime?.environment === "production" ? "ok" : "warning"}
                    detail={`${diagnostics?.runtime?.environment || "unknown"} · Node ${diagnostics?.runtime?.node_version || "unknown"} · uptime ${diagnostics?.runtime?.uptime_seconds ?? "—"}s`}
                  />
                  <CheckRow
                    name="Firebase project alignment"
                    status={
                      diagnostics?.firebase_admin?.project_id && browserDiagnostics?.project_id
                        ? diagnostics.firebase_admin.project_id === browserDiagnostics.project_id ? "ok" : "error"
                        : "warning"
                    }
                    detail={
                      diagnostics?.firebase_admin?.project_id && browserDiagnostics?.project_id
                        ? `Server: ${diagnostics.firebase_admin.project_id}; browser: ${browserDiagnostics.project_id}.`
                        : "Project comparison is unavailable until both Firebase configurations expose a project ID."
                    }
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="font-semibold text-slate-950">Browser and service worker</h2>
                <div className="mt-2">
                  {browserDiagnostics?.checks?.length
                    ? browserDiagnostics.checks.map((check) => <CheckRow key={check.name} {...check} />)
                    : <p className="py-4 text-sm text-slate-500">Browser diagnostics are unavailable.</p>}
                </div>
              </section>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatusCard label="Active customer devices" value={diagnostics?.subscribers?.active_devices} icon={FaBell} />
              <StatusCard label="Active customers" value={diagnostics?.subscribers?.active_customers} icon={FaUsers} />
              <StatusCard label="Active price alerts" value={diagnostics?.subscribers?.active_price_alerts} icon={FaBullhorn} />
              <StatusCard label="Your admin test devices" value={diagnostics?.subscribers?.active_admin_test_devices} icon={FaHeartbeat} />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="font-semibold text-slate-950">Push delivery queue</h2>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {Object.entries(diagnostics?.queue?.by_status || {}).map(([status, count]) => (
                    <div key={status} className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs capitalize text-slate-500">{status.replaceAll("_", " ")}</p>
                      <p className="mt-1 text-xl font-semibold text-slate-900">{count}</p>
                    </div>
                  ))}
                  {!Object.keys(diagnostics?.queue?.by_status || {}).length ? (
                    <p className="col-span-full py-3 text-sm text-slate-500">No push delivery records.</p>
                  ) : null}
                </div>
                <p className="mt-4 text-xs text-slate-500">
                  Oldest queued/processing delivery: {diagnostics?.queue?.oldest_pending_at
                    ? new Date(diagnostics.queue.oldest_pending_at).toLocaleString()
                    : "none"}
                </p>
              </section>
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="font-semibold text-slate-950">Delivery by event type</h2>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[420px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-wide text-slate-500">
                      <tr><th className="py-2 pr-3">Event</th><th className="py-2 pr-3">Status</th><th className="py-2 text-right">Count</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(diagnostics?.queue?.by_event_type || []).map((row, index) => (
                        <tr key={`${row.event_type}-${row.status}-${index}`}>
                          <td className="py-2 pr-3 text-slate-700">{row.event_type}</td>
                          <td className="py-2 pr-3 capitalize text-slate-500">{row.status.replaceAll("_", " ")}</td>
                          <td className="py-2 text-right font-medium text-slate-800">{row.count}</td>
                        </tr>
                      ))}
                      {!diagnostics?.queue?.by_event_type?.length ? (
                        <tr><td className="py-3 text-slate-500" colSpan={3}>No event delivery data.</td></tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white px-5 py-2 sm:px-6">
              <h2 className="pt-4 text-lg font-semibold text-slate-950">Recent failed, skipped, or errored deliveries</h2>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-slate-500">
                    <tr><th className="py-3 pr-3">Event</th><th className="py-3 pr-3">Title</th><th className="py-3 pr-3">Status</th><th className="py-3 pr-3">Attempts</th><th className="py-3 pr-3">Error</th><th className="py-3">Created</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(diagnostics?.recent_failures || []).map((failure) => (
                      <tr key={failure.delivery_id}>
                        <td className="py-3 pr-3 text-slate-700">{failure.event_type}</td>
                        <td className="max-w-[220px] truncate py-3 pr-3 text-slate-700" title={failure.title}>{failure.title}</td>
                        <td className="py-3 pr-3 capitalize text-rose-700">{failure.status}</td>
                        <td className="py-3 pr-3 text-slate-600">{failure.attempts}</td>
                        <td className="max-w-[340px] whitespace-normal py-3 pr-3 text-xs text-slate-500">{failure.error_message || "—"}</td>
                        <td className="py-3 text-xs text-slate-500">{new Date(failure.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                    {!diagnostics?.recent_failures?.length ? (
                      <tr><td className="py-6 text-center text-slate-500" colSpan={6}>No recent failed, skipped, or errored deliveries.</td></tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default AdminNotifications;
