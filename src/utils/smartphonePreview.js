import { readDraftValue } from "../hooks/useFormDraft";

const PREVIEW_STORAGE_KEY = "hooks-admin:create-mobile:preview";
const PREVIEW_VERSION = 1;
const PREVIEW_TTL_MS = 1000 * 60 * 60 * 24;
const CREATE_DRAFT_KEY = "hooks-admin:create-mobile:draft";

const isBrowser = () => typeof window !== "undefined";

const parseJson = (value) => {
  try {
    return JSON.parse(value);
  } catch (error) {
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
  } catch (error) {
    return null;
  }
};

const normalizeText = (value = "") =>
  String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const parseDateValue = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "object") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getEarliestSaleStartDate = (variants = []) => {
  const dates = [];

  const collectDate = (value) => {
    const parsed = parseDateValue(value);
    if (parsed) dates.push(parsed);
  };

  (Array.isArray(variants) ? variants : []).forEach((variant) => {
    collectDate(
      variant?.sale_start_date ||
        variant?.saleStartDate ||
        variant?.sale_date ||
        variant?.saleDate ||
        null,
    );

    const stores = Array.isArray(variant?.stores)
      ? variant.stores
      : Array.isArray(variant?.store_prices)
        ? variant.store_prices
        : [];

    stores.forEach((store) => {
      collectDate(
        store?.sale_start_date ||
          store?.saleStartDate ||
          store?.sale_date ||
          store?.saleDate ||
          store?.available_from ||
          store?.availableFrom ||
          null,
      );
    });
  });

  if (!dates.length) return null;
  return dates.sort((a, b) => a - b)[0];
};

const normalizeLaunchStatusOverride = (value) => {
  const text = normalizeText(value);
  if (!text) return null;
  if (text === "preorder") return "upcoming";
  if (/rumou?r/.test(text)) return "rumored";
  if (/announce/.test(text)) return "announced";
  if (/(upcoming|coming soon|expected|launching soon)/.test(text))
    return "upcoming";
  if (/(available|on sale|in stock)/.test(text)) return "available";
  if (/(released|launched|out now)/.test(text)) return "released";
  return null;
};

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
  const override = normalizeLaunchStatusOverride(
    smartphone.launch_status_override ||
      smartphone.launchStatusOverride ||
      smartphone.launch_status ||
      smartphone.launchStatus,
  );
  if (override) return override;

  const saleStart = getEarliestSaleStartDate(
    Array.isArray(formData?.variants) ? formData.variants : [],
  );
  if (saleStart) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return saleStart > today ? "upcoming" : "available";
  }

  if (String(smartphone.official_preorder_url || "").trim()) {
    return "upcoming";
  }

  const launchDate = parseDateValue(
    smartphone.launch_date || smartphone.launchDate || null,
  );
  if (launchDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return launchDate > today ? "upcoming" : "released";
  }

  return "released";
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
