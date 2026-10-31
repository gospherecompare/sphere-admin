import axios from "axios";
import { API_BASE } from "./index";

const CLIENT_KEY_HEADER = "X-MobilesX-Client-Key";
const BOOTSTRAP_PATH = "/api/crypto/public-key";
const KDF_SALT = new TextEncoder().encode("MobilesX API response ECDH v1");
const KDF_INFO = new TextEncoder().encode("AES-256-GCM");
const INSTALLED_KEY = "__MOBILESX_API_RESPONSE_ENCRYPTION__";
const decoder = new TextDecoder();
const contexts = new Map();
const readyContexts = new Map();

const toBase64Url = (bytes) => {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const fromBase64Url = (value) => {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

const getApiOrigins = () => {
  const origins = new Set([window.location.origin]);
  try {
    origins.add(new URL(API_BASE).origin);
  } catch {
    // Ignore a malformed configured API base.
  }
  return origins;
};

const parseApiUrl = (value, base = undefined) => {
  try {
    const raw =
      typeof value === "string" || value instanceof URL
        ? String(value)
        : value && typeof value.url === "string"
          ? value.url
          : "";
    if (!raw) return null;
    const url = new URL(raw, base || window.location.origin);
    if (!url.pathname.startsWith("/api/")) return null;
    if (!getApiOrigins().has(url.origin)) return null;
    return url;
  } catch {
    return null;
  }
};

const createContext = async (origin, fetchImpl) => {
  if (!globalThis.crypto?.subtle) throw new Error("Web Crypto is unavailable");
  const pair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    false,
    ["deriveBits"],
  );
  const publicKey = new Uint8Array(await crypto.subtle.exportKey("spki", pair.publicKey));
  const response = await fetchImpl(`${origin}${BOOTSTRAP_PATH}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    credentials: "include",
  });
  if (!response.ok) throw new Error("API response encryption is not enabled");
  const configuration = await response.json();
  if (!configuration?.enabled || !configuration?.publicKey) {
    throw new Error("API response encryption is disabled");
  }

  const serverPublicKey = await crypto.subtle.importKey(
    "spki",
    fromBase64Url(configuration.publicKey),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: "ECDH", public: serverPublicKey },
    pair.privateKey,
    256,
  );
  const hkdfKey = await crypto.subtle.importKey("raw", sharedSecret, "HKDF", false, ["deriveKey"]);
  const responseKey = await crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: KDF_SALT, info: KDF_INFO },
    hkdfKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
  return { requestPublicKey: toBase64Url(publicKey), responseKey };
};

const getContext = (origin, fetchImpl) => {
  if (!contexts.has(origin)) {
    let pending;
    pending = createContext(origin, fetchImpl)
      .then((context) => {
        readyContexts.set(origin, context);
        return context;
      })
      .catch((error) => {
        window.setTimeout(() => {
          if (contexts.get(origin) === pending) contexts.delete(origin);
        }, 15_000);
        throw error;
      });
    contexts.set(origin, pending);
  }
  return contexts.get(origin);
};

const decryptPayload = async (payload, responseKey) => {
  let envelope = payload;
  if (typeof envelope === "string") {
    try {
      envelope = JSON.parse(envelope);
    } catch {
      return payload;
    }
  }
  if (
    !envelope?.encrypted ||
    envelope.version !== 1 ||
    envelope.algorithm !== "AES-256-GCM"
  ) {
    return payload;
  }

  const data = fromBase64Url(envelope.data);
  const tag = fromBase64Url(envelope.tag);
  const ciphertext = new Uint8Array(data.length + tag.length);
  ciphertext.set(data);
  ciphertext.set(tag, data.length);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64Url(envelope.iv) },
    responseKey,
    ciphertext,
  );
  return JSON.parse(decoder.decode(plaintext));
};

const decryptFetchResponse = async (response, responseKey) => {
  if (!response.headers.get("content-type")?.includes("application/json")) {
    return response;
  }
  let envelope;
  try {
    envelope = await response.clone().json();
  } catch {
    return response;
  }
  if (!envelope?.encrypted) return response;

  const plaintext = await decryptPayload(envelope, responseKey);
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.delete("etag");
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(plaintext), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

const installFetchDecryptor = () => {
  if (typeof window.fetch !== "function") return;
  const innerFetch = window.fetch.bind(window);
  try {
    const apiOrigin = new URL(API_BASE).origin;
    void getContext(apiOrigin, innerFetch).catch(() => {});
  } catch {
    // Continue using the configured API without response encryption.
  }

  window.fetch = async (input, init = undefined) => {
    const url = parseApiUrl(input);
    if (!url || url.pathname === BOOTSTRAP_PATH) return innerFetch(input, init);

    const context = readyContexts.get(url.origin);
    if (!context) {
      void getContext(url.origin, innerFetch).catch(() => {});
      return innerFetch(input, init);
    }

    const headers = new Headers(input instanceof Request ? input.headers : undefined);
    new Headers(init?.headers).forEach((value, name) => headers.set(name, value));
    headers.set(CLIENT_KEY_HEADER, context.requestPublicKey);
    const request = new Request(input, { ...init, headers });
    const response = await innerFetch(request);
    return decryptFetchResponse(response, context.responseKey);
  };
};

const resolveAxiosApiUrl = (config) =>
  parseApiUrl(config?.url || "", config?.baseURL || API_BASE);

const decryptAxiosResponse = async (response) => {
  const context = response?.config?.__mobilesxCryptoContext;
  if (!context) return response;
  response.data = await decryptPayload(response.data, context.responseKey);
  return response;
};

const installAxiosDecryptor = () => {
  axios.interceptors.request.use(async (config) => {
    const url = resolveAxiosApiUrl(config);
    if (!url || url.pathname === BOOTSTRAP_PATH) return config;
    const context = readyContexts.get(url.origin);
    if (!context) {
      void getContext(url.origin, window.fetch.bind(window)).catch(() => {});
      return config;
    }
    config.__mobilesxCryptoContext = context;
    if (typeof config.headers?.set === "function") {
      config.headers.set(CLIENT_KEY_HEADER, context.requestPublicKey);
    } else {
      config.headers = { ...(config.headers || {}), [CLIENT_KEY_HEADER]: context.requestPublicKey };
    }
    return config;
  });
  axios.interceptors.response.use(
    decryptAxiosResponse,
    async (error) => {
      if (error?.response) await decryptAxiosResponse(error.response);
      return Promise.reject(error);
    },
  );
};

export const installApiResponseEncryption = () => {
  if (typeof window === "undefined" || window[INSTALLED_KEY]) return;
  installFetchDecryptor();
  installAxiosDecryptor();
  window[INSTALLED_KEY] = true;
};

export default installApiResponseEncryption;
