import { readDraftValue } from "../hooks/useFormDraft";
import { getSmartphoneLifecycle } from "./smartphoneLifecycle";

const PREVIEW_STORAGE_KEY = "hooks-admin:create-mobile:preview";
const PREVIEW_VERSION = 1;
const PREVIEW_TTL_MS = 1000 * 60 * 60 * 24;
const CREATE_DRAFT_KEY = "hooks-admin:create-mobile:draft";

const isBrowser = () => typeof window !== "undefined";

const parseJson = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const readStoredSnapshot = (storageKey) => {
  if (!isBrowser()) return null;
  try {
    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) return null;

    const parsed = parseJson(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.version !== PREVIEW_VERSION) return null;

    const savedAt = Number(parsed.savedAt || 0);
    if (savedAt && Date.now() - savedAt > PREVIEW_TTL_MS) {
      window.sessionStorage.removeItem(storageKey);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

const normalizeText = (value = "") =>
  String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const getDraftTitle = (formData = {}) => {
  const productName = String(formData?.product?.name || "").trim();
  const model = String(formData?.smartphone?.model || "").trim();
  const brand = String(formData?.smartphone?.brand || "").trim();

  return productName || model || brand || "Smartphone preview";
};

const buildPreviewState = ({
  formData = {},
  publishEnabled = false,
  savedAt = Date.now(),
} = {}) => {
  const normalizedFormData =
    formData && typeof formData === "object" ? formData : {};
  const title = getDraftTitle(normalizedFormData);
  const slug = slugifySmartphone(title) || "smartphone-preview";

  return {
    version: PREVIEW_VERSION,
    savedAt,
    publishEnabled: Boolean(publishEnabled),
    slug,
    title,
    launchStatus: getSmartphonePreviewLaunchStatus(normalizedFormData),
    formData: normalizedFormData,
  };
};

export const slugifySmartphone = (value = "") =>
  normalizeText(value)
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const getSmartphonePreviewLaunchStatus = (formData = {}) => {
  const smartphone =
    formData && typeof formData === "object" ? formData.smartphone || {} : {};
  return getSmartphoneLifecycle({
    launchDate: smartphone.launch_date || smartphone.launchDate || null,
    launchStatus:
      smartphone.launch_status_override ||
      smartphone.launchStatusOverride ||
      smartphone.launch_status ||
      smartphone.launchStatus ||
      "",
    variants: Array.isArray(formData?.variants) ? formData.variants : [],
  }).launchStage;
};

export const saveSmartphonePreviewSnapshot = (input = {}) => {
  if (!isBrowser()) return null;
  const snapshot = buildPreviewState(input);
  window.sessionStorage.setItem(
    PREVIEW_STORAGE_KEY,
    JSON.stringify(snapshot),
  );
  return snapshot;
};

export const readSmartphonePreviewState = () => {
  const stored = readStoredSnapshot(PREVIEW_STORAGE_KEY);
  if (stored) return stored;

  const draftValue = readDraftValue(CREATE_DRAFT_KEY);
  if (draftValue && typeof draftValue === "object") {
    return buildPreviewState({
      formData: draftValue,
      publishEnabled: false,
    });
  }

  return null;
};

export const clearSmartphonePreviewSnapshot = () => {
  if (!isBrowser()) return;
  window.sessionStorage.removeItem(PREVIEW_STORAGE_KEY);
};

export const getSmartphonePreviewPath = (input = {}) => {
  const snapshot =
    input && typeof input === "object" && "formData" in input
      ? buildPreviewState(input)
      : buildPreviewState({ formData: input });

  return `/products/smartphones/preview/${snapshot.slug || "smartphone-preview"}`;
};
