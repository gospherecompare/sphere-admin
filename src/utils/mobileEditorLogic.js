const SMARTPHONE_SPEC_SECTIONS = [
  "build_design",
  "display",
  "performance",
  "camera",
  "battery",
  "connectivity",
  "network",
  "ports",
  "audio",
  "multimedia",
];

const isPlainObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const safeObject = (value) => {
  if (isPlainObject(value)) return value;
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return isPlainObject(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
};

const safeObjectOrNull = (value) => {
  const next = safeObject(value);
  return Object.keys(next).length ? next : null;
};

const toArray = (value) => (Array.isArray(value) ? value : []);

const trimOrNull = (value) => {
  if (value === null || value === undefined) return null;
  const next = String(value).trim();
  return next ? next : null;
};

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const next =
    typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
  return Number.isFinite(next) ? next : null;
};

const compactObject = (value) => (isPlainObject(value) ? value : {});

const normalizeLifecycleOption = (value) => {
  const raw = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  return raw || null;
};

const formatDateInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const parseMobileDate = (value) => {
  if (!value) return null;
  const str = String(value).trim();
  if (!str) return null;

  const dateOnly = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]) - 1;
    const day = Number(dateOnly[3]);
    const date = new Date(year, month, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const dayFirst = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dayFirst) {
    const day = Number(dayFirst[1]);
    const month = Number(dayFirst[2]) - 1;
    const year = Number(dayFirst[3]);
    const date = new Date(year, month, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(str);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const normalizeDateInputValue = (value) => {
  if (!value) return "";
  const str = String(value).trim();
  if (!str) return "";

  const isoPrefix = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoPrefix) return `${isoPrefix[1]}-${isoPrefix[2]}-${isoPrefix[3]}`;

  const parsed = parseMobileDate(str);
  return parsed ? formatDateInput(parsed) : "";
};

export const pickFirstValidMobileDateInput = (...values) => {
  for (const value of values) {
    const normalized = normalizeDateInputValue(value);
    if (normalized) return normalized;
  }
  return "";
};

export const generateMobileEditorYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = 2000; year <= currentYear + 2; year += 1) {
    years.push(year);
  }
  return years.reverse();
};

export const getMobileEditorDaysInMonth = (year, month) =>
  new Date(year, month + 1, 0).getDate();

export const stripSphereFields = (section, disableSphere) => {
  if (!disableSphere || !isPlainObject(section)) return section || {};
  const next = { ...section };
  delete next.sphere_score;
  delete next.sphere_description;
  delete next.sphere_images;
  return next;
};

export const cleanMobilePayload = (input) => {
  const clean = (value) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed === "" ? undefined : trimmed;
    }
    if (Array.isArray(value)) {
      const cleanedArray = value.map(clean).filter((item) => item !== undefined);
      return cleanedArray.length ? cleanedArray : undefined;
    }
    if (typeof value === "object") {
      const output = {};
      Object.keys(value).forEach((key) => {
        const cleanedValue = clean(value[key]);
        if (cleanedValue !== undefined) output[key] = cleanedValue;
      });
      return Object.keys(output).length ? output : undefined;
    }
    return value;
  };

  const cleaned = clean(input) || {};

  if (Array.isArray(input?.variants) && input.variants.length === 0) {
    cleaned.variants = [];
  }
  if (
    Array.isArray(input?.variant_store_prices) &&
    input.variant_store_prices.length === 0
  ) {
    cleaned.variant_store_prices = [];
  }

  if (Array.isArray(cleaned.variant_store_prices)) {
    cleaned.variant_store_prices = cleaned.variant_store_prices.map((store) => {
      if (store.variant_id) {
        const rest = { ...store };
        delete rest.variant_index;
        return rest;
      }
      return store;
    });
  }

  return cleaned;
};

const normalizeColors = (colors) =>
  toArray(colors)
    .filter((color) => color?.name && color?.code)
    .map((color) => ({
      ...color,
      name: String(color.name).trim(),
      code: String(color.code).trim(),
    }));

const pickSection = (source, section) =>
  safeObjectOrNull(source?.[section]) ||
  safeObjectOrNull(source?.[`${section}_json`]) ||
  safeObjectOrNull(source?.smartphone?.[section]) ||
  {};

const buildSpecSections = (source, isUpcomingDevice) =>
  SMARTPHONE_SPEC_SECTIONS.reduce((sections, section) => {
    sections[section] = stripSphereFields(
      pickSection(source, section),
      isUpcomingDevice,
    );
    return sections;
  }, {});

const normalizeCreateMobileEditorData = (formData) => {
  const product = safeObject(formData?.product);
  const smartphone = safeObject(formData?.smartphone);
  return {
    productName: product.name || "",
    brandId: product.brand_id || "",
    segment: smartphone.segment || "Smart Phone",
    brand: smartphone.brand || "",
    model: smartphone.model || "",
    launchDate: smartphone.launch_date || "",
    launchStatusOverride: smartphone.launch_status_override || "",
    saleStatusOverride: smartphone.sale_status_override || "",
    storeStageOverride: smartphone.store_stage_override || "",
    launchDateType: smartphone.launch_date_type || "",
    priceConfidence: smartphone.price_confidence || "",
    specConfidence: smartphone.spec_confidence || "",
    officialPreorderUrl: smartphone.official_preorder_url || "",
    colors: normalizeColors(smartphone.colors),
    images: toArray(formData?.images),
    variants: toArray(formData?.variants),
    sensors: smartphone.sensors || null,
    isFoldable: Boolean(smartphone.is_foldable),
    source: { ...formData, smartphone },
  };
};

const normalizeEditMobileEditorData = (formData) => {
  const product = safeObject(formData?.product);
  const smartphone = safeObject(formData?.smartphone);
  return {
    productName:
      formData?.name ||
      formData?.product_name ||
      product.name ||
      smartphone.product_name ||
      smartphone.name ||
      "",
    brandId: formData?.brand_id || product.brand_id || "",
    segment:
      formData?.segment || formData?.category || smartphone.segment || "Smart Phone",
    brand:
      formData?.brand ||
      formData?.brand_name ||
      product.brand ||
      product.brand_name ||
      smartphone.brand ||
      smartphone.brand_name ||
      "",
    model: formData?.model || smartphone.model || "",
    launchDate: formData?.launch_date || smartphone.launch_date || "",
    launchStatusOverride:
      formData?.launch_status_override ||
      formData?.launchStatusOverride ||
      smartphone.launch_status_override ||
      smartphone.launchStatusOverride ||
      "",
    saleStatusOverride:
      formData?.sale_status_override ||
      formData?.saleStatusOverride ||
      smartphone.sale_status_override ||
      smartphone.saleStatusOverride ||
      "",
    storeStageOverride:
      formData?.store_stage_override ||
      formData?.storeStageOverride ||
      smartphone.store_stage_override ||
      smartphone.storeStageOverride ||
      "",
    launchDateType:
      formData?.launch_date_type ||
      formData?.launchDateType ||
      smartphone.launch_date_type ||
      smartphone.launchDateType ||
      "",
    priceConfidence:
      formData?.price_confidence ||
      formData?.priceConfidence ||
      smartphone.price_confidence ||
      smartphone.priceConfidence ||
      "",
    specConfidence:
      formData?.spec_confidence ||
      formData?.specConfidence ||
      smartphone.spec_confidence ||
      smartphone.specConfidence ||
      "",
    officialPreorderUrl:
      formData?.official_preorder_url ||
      formData?.officialPreorderUrl ||
      smartphone.official_preorder_url ||
      smartphone.officialPreorderUrl ||
      "",
    colors: normalizeColors(formData?.colors || smartphone.colors),
    images: toArray(formData?.images || smartphone.images),
    variants: toArray(formData?.variants || smartphone.variants),
    sensors: formData?.sensors || smartphone.sensors || null,
    isFoldable: Boolean(formData?.is_foldable || smartphone.is_foldable),
    source: { ...formData, smartphone },
  };
};

const normalizeStore = (store, variant, variantIndex) => {
  const variantId = variant?.id || variant?.variant_id || null;
  return {
    id: store?.id || null,
    variant_id: variantId,
    variant_index: variantId ? undefined : variantIndex,
    store: trimOrNull(store?.store || store?.store_name || store?.storeName),
    store_name: trimOrNull(store?.store_name || store?.store || store?.storeName),
    price: toNumberOrNull(store?.price),
    currency: store?.currency || undefined,
    availability: store?.availability || undefined,
    url: trimOrNull(store?.url),
    offer_text: trimOrNull(store?.offer_text || store?.offerText),
    delivery_info: trimOrNull(store?.delivery_info || store?.deliveryInfo),
    sale_start_date:
      normalizeDateInputValue(
        store?.sale_start_date || store?.sale_date || store?.saleStartDate,
      ) || null,
    discount: trimOrNull(store?.discount),
    offers: trimOrNull(store?.offers),
    custom_properties: compactObject(store?.custom_properties),
  };
};

const normalizeVariant = (variant, variantIndex) => {
  const storesSource = Array.isArray(variant?.stores)
    ? variant.stores
    : Array.isArray(variant?.store_prices)
      ? variant.store_prices
      : [];
  const stores = storesSource.map((store) =>
    normalizeStore(store, variant, variantIndex),
  );

  return {
    id: variant?.id || null,
    variant_id: variant?.id || variant?.variant_id || null,
    ram: trimOrNull(variant?.ram),
    storage: trimOrNull(variant?.storage || variant?.storage_size),
    base_price: toNumberOrNull(variant?.base_price ?? variant?.price),
    custom_properties: compactObject(variant?.custom_properties),
    stores,
  };
};

const toVariantStorePriceRows = (variants) =>
  variants.flatMap((variant, variantIndex) =>
    toArray(variant.stores).map((store) => ({
      id: store.id,
      variant_id: variant.id || variant.variant_id || null,
      variant_index: variant.id || variant.variant_id ? undefined : variantIndex,
      store_name: store.store_name,
      price: store.price,
      url: store.url,
      offer_text: store.offer_text,
      delivery_info: store.delivery_info,
      sale_start_date: store.sale_start_date,
      discount: store.discount,
      offers: store.offers,
      custom_properties: store.custom_properties,
    })),
  );

const toVariantsJsonRows = (variants) =>
  variants.map((variant) => ({
    id: variant.id,
    variant_id: variant.id || variant.variant_id || null,
    ram: variant.ram,
    storage: variant.storage,
    base_price: variant.base_price,
    custom_properties: variant.custom_properties,
    store_prices: toArray(variant.stores).map((store) => ({
      id: store.id,
      store: store.store || store.store_name,
      store_name: store.store_name,
      price: store.price,
      currency: store.currency,
      availability: store.availability,
      url: store.url,
      offer_text: store.offer_text,
      delivery_info: store.delivery_info,
      sale_start_date: store.sale_start_date,
      discount: store.discount,
      offers: store.offers,
      custom_properties: store.custom_properties,
    })),
  }));

export const buildMobileSubmitPayload = ({
  formData,
  mode = "create",
  id,
  isUpcomingDevice = false,
  publishEnabled = false,
}) => {
  const normalized =
    mode === "edit"
      ? normalizeEditMobileEditorData(formData)
      : normalizeCreateMobileEditorData(formData);
  const specs = buildSpecSections(normalized.source, isUpcomingDevice);
  const variants = normalized.variants.map((variant, index) =>
    normalizeVariant(variant, index),
  );
  const variantsJson = toVariantsJsonRows(variants);
  const variantStorePrices = toVariantStorePriceRows(variants);
  const brandId = toNumberOrNull(normalized.brandId);
  const launchDate = normalizeDateInputValue(normalized.launchDate) || null;
  const launchStatusOverride = normalizeLifecycleOption(
    normalized.launchStatusOverride,
  );
  const saleStatusOverride = normalizeLifecycleOption(
    normalized.saleStatusOverride,
  );
  const storeStageOverride = normalizeLifecycleOption(
    normalized.storeStageOverride,
  );
  const launchDateType = normalizeLifecycleOption(normalized.launchDateType);
  const priceConfidence = normalizeLifecycleOption(normalized.priceConfidence);
  const specConfidence = normalizeLifecycleOption(normalized.specConfidence);
  const officialPreorderUrl = trimOrNull(normalized.officialPreorderUrl);
  const sensors = normalized.sensors || null;

  const product = {
    name: normalized.productName,
    brand_name: normalized.brand,
  };
  if (brandId !== null) product.brand_id = brandId;

  const smartphone = {
    segment: normalized.segment,
    category: normalized.segment,
    brand: normalized.brand,
    brand_name: normalized.brand,
    model: normalized.model,
    launch_date: launchDate,
    launch_status_override: launchStatusOverride,
    sale_status_override: saleStatusOverride,
    store_stage_override: storeStageOverride,
    launch_date_type: launchDateType,
    price_confidence: priceConfidence,
    spec_confidence: specConfidence,
    official_preorder_url: officialPreorderUrl,
    images: normalized.images,
    colors: normalized.colors,
    ...specs,
    sensors,
    is_foldable: normalized.isFoldable,
  };

  return {
    ...(mode === "edit" ? { id } : {}),
    product,
    smartphone,
    name: normalized.productName,
    product_name: normalized.productName,
    product_type: "smartphone",
    segment: normalized.segment,
    category: normalized.segment,
    brand: normalized.brand,
    brand_name: normalized.brand,
    model: normalized.model,
    launch_date: launchDate,
    launch_status_override: launchStatusOverride,
    sale_status_override: saleStatusOverride,
    store_stage_override: storeStageOverride,
    launch_date_type: launchDateType,
    price_confidence: priceConfidence,
    spec_confidence: specConfidence,
    official_preorder_url: officialPreorderUrl,
    publish: Boolean(publishEnabled),
    published: Boolean(publishEnabled),
    images: normalized.images,
    images_json: normalized.images,
    colors: normalized.colors,
    ...specs,
    build_design_json: specs.build_design,
    display_json: specs.display,
    performance_json: specs.performance,
    camera_json: specs.camera,
    battery_json: specs.battery,
    connectivity_json: specs.connectivity,
    network_json: specs.network,
    ports_json: specs.ports,
    port_json: specs.ports,
    audio_json: specs.audio,
    multimedia_json: specs.multimedia,
    sensors,
    is_foldable: normalized.isFoldable,
    variants,
    variant_store_prices: variantStorePrices,
    variants_json: variantsJson,
  };
};
