const WINDOW_INSTALLED_KEY = "__HOOKS_ADMIN_NETWORK_TRACKER_INSTALLED__";
const WINDOW_COUNT_KEY = "__HOOKS_ADMIN_NETWORK_IN_FLIGHT__";
const ACTIVITY_EVENT = "hooks-admin:network-activity";

const toRequestUrl = (input) => {
  if (typeof input === "string" || input instanceof URL) return String(input);
  if (input && typeof input === "object" && typeof input.url === "string") {
    return input.url;
  }
  return null;
};

const shouldTrackUrl = (value) => {
  if (typeof window === "undefined" || !value) return false;

  try {
    const parsed = new URL(String(value), window.location.origin);
    return String(parsed.pathname || "").startsWith("/api/");
  } catch {
    return false;
  }
};

const emitActivity = () => {
  window.dispatchEvent(
    new CustomEvent(ACTIVITY_EVENT, {
      detail: { count: window[WINDOW_COUNT_KEY] || 0 },
    }),
  );
};

const increment = () => {
  window[WINDOW_COUNT_KEY] = Math.max(0, (window[WINDOW_COUNT_KEY] || 0) + 1);
  emitActivity();
};

const decrement = () => {
  window[WINDOW_COUNT_KEY] = Math.max(0, (window[WINDOW_COUNT_KEY] || 0) - 1);
  emitActivity();
};

const installFetchTracker = () => {
  if (typeof window.fetch !== "function") return;
  const nativeFetch = window.fetch.bind(window);

  window.fetch = async (input, init = undefined) => {
    const shouldTrack = shouldTrackUrl(toRequestUrl(input));
    if (shouldTrack) increment();

    try {
      return await nativeFetch(input, init);
    } finally {
      if (shouldTrack) decrement();
    }
  };
};

const installXhrTracker = () => {
  if (typeof window.XMLHttpRequest !== "function") return;

  const NativeXMLHttpRequest = window.XMLHttpRequest;

  window.XMLHttpRequest = function HooksTrackedXMLHttpRequest() {
    const xhr = new NativeXMLHttpRequest();
    let tracked = false;
    let completed = false;

    const finish = () => {
      if (!tracked || completed) return;
      completed = true;
      decrement();
    };

    const nativeOpen = xhr.open;
    xhr.open = function open(method, url, ...args) {
      tracked = shouldTrackUrl(url);
      return nativeOpen.call(xhr, method, url, ...args);
    };

    const nativeSend = xhr.send;
    xhr.send = function send(...args) {
      if (tracked) increment();
      xhr.addEventListener("loadend", finish, { once: true });
      xhr.addEventListener("abort", finish, { once: true });
      xhr.addEventListener("error", finish, { once: true });
      xhr.addEventListener("timeout", finish, { once: true });
      return nativeSend.apply(xhr, args);
    };

    return xhr;
  };
};

export const installFetchActivityTracker = () => {
  if (typeof window === "undefined") return;
  if (window[WINDOW_INSTALLED_KEY]) return;

  window[WINDOW_COUNT_KEY] = window[WINDOW_COUNT_KEY] || 0;
  installFetchTracker();
  installXhrTracker();
  window[WINDOW_INSTALLED_KEY] = true;
};

export default installFetchActivityTracker;
