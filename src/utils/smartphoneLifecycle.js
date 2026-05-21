const PREBOOKING_PATTERN =
  /(pre[-\s]?order|pre[-\s]?book|prebooking|presale|coming\s*soon|not[\s_-]*started)/i;

const parsePriceValue = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const normalizeText = (value) =>
  value === null || value === undefined ? "" : String(value).trim();

const normalizeLifecycleStatus = (value) => {
  const text = normalizeText(value).toLowerCase();
  if (!text) return null;
  if (/rumou?r/.test(text)) return "rumored";
  if (/announce/.test(text)) return "announced";
  if (PREBOOKING_PATTERN.test(text)) return "upcoming";
  if (/(upcoming|expected|launching soon)/i.test(text)) return "upcoming";
  if (/(available|on sale|in stock)/i.test(text)) return "available";
  if (/(released|launched|out now)/i.test(text)) return "released";
  return null;
};

const parseDateValue = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value);
  }

  if (typeof value === "object") return null;

  const raw = String(value).trim();
  if (!raw) return null;

  const dateOnlyMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]) - 1;
    const day = Number(dateOnlyMatch[3]);
    const date = new Date(year, month, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toDateOnly = (value) => {
  const date = parseDateValue(value);
  if (!date) return null;
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const getTodayDateOnly = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const getVariantStores = (variant) =>
  Array.isArray(variant?.stores)
    ? variant.stores
    : Array.isArray(variant?.store_prices)
      ? variant.store_prices
      : Array.isArray(variant?.storePrices)
        ? variant.storePrices
        : [];

const collectStoreRows = ({ variants = [], additionalStoreRows = [] } = {}) => {
  const rows = Array.isArray(additionalStoreRows)
    ? [...additionalStoreRows]
    : [];

  (Array.isArray(variants) ? variants : []).forEach((variant) => {
    rows.push(...getVariantStores(variant));
  });

  return rows.filter(Boolean);
};

const extractEarliestDate = (values = []) => {
  const dates = values.map(toDateOnly).filter(Boolean);
  if (!dates.length) return null;
  return dates.sort((left, right) => left.getTime() - right.getTime())[0];
};

const getEarliestSaleStartDate = ({
  saleStartDate = null,
  variants = [],
  additionalStoreRows = [],
} = {}) => {
  const directCandidates = [];

  if (saleStartDate) directCandidates.push(saleStartDate);

  (Array.isArray(variants) ? variants : []).forEach((variant) => {
    directCandidates.push(
      variant?.sale_start_date,
      variant?.saleStartDate,
      variant?.sale_date,
      variant?.saleDate,
    );

    getVariantStores(variant).forEach((store) => {
      directCandidates.push(
        store?.sale_start_date,
        store?.saleStartDate,
        store?.sale_date,
        store?.saleDate,
        store?.available_from,
        store?.availableFrom,
      );
    });
  });

  (Array.isArray(additionalStoreRows) ? additionalStoreRows : []).forEach(
    (store) => {
      directCandidates.push(
        store?.sale_start_date,
        store?.saleStartDate,
        store?.sale_date,
        store?.saleDate,
        store?.available_from,
        store?.availableFrom,
      );
    },
  );

  return extractEarliestDate(directCandidates);
};

const isPrebookingStore = (store) => {
  if (!store || typeof store !== "object") return false;
  if (store?.is_prebooking === true || store?.isPrebooking === true) {
    return true;
  }

  const availabilityText = [
    store?.availability_status,
    store?.availabilityStatus,
    store?.sale_status,
    store?.saleStatus,
    store?.cta_label,
    store?.ctaLabel,
  ]
    .map(normalizeText)
    .filter(Boolean)
    .join(" ");

  if (PREBOOKING_PATTERN.test(availabilityText)) return true;

  const saleStart = toDateOnly(
    store?.sale_start_date ||
      store?.saleStartDate ||
      store?.sale_date ||
      store?.saleDate ||
      store?.available_from ||
      store?.availableFrom ||
      null,
  );

  return Boolean(saleStart && saleStart > getTodayDateOnly());
};

const hasLiveStoreSignal = (store) => {
  if (!store || typeof store !== "object") return false;
  if (isPrebookingStore(store)) return false;

  return Boolean(
    parsePriceValue(
      store?.price ??
        store?.current_price ??
        store?.sale_price ??
        store?.offer_price ??
        store?.base_price,
    ) ||
      normalizeText(store?.url) ||
      normalizeText(store?.affiliate_link) ||
      normalizeText(store?.store) ||
      normalizeText(store?.store_name) ||
      normalizeText(store?.storeName),
  );
};

const getSmartphoneLifecycle = ({
  launchDate = null,
  saleStartDate = null,
  officialPreorderUrl = "",
  launchStatus = "",
  statusText = "",
  variants = [],
  additionalStoreRows = [],
} = {}) => {
  const today = getTodayDateOnly();
  const launch = toDateOnly(launchDate);
  const earliestSaleStart = getEarliestSaleStartDate({
    saleStartDate,
    variants,
    additionalStoreRows,
  });
  const normalizedStatus =
    normalizeLifecycleStatus(launchStatus) ||
    normalizeLifecycleStatus(statusText);
  const preorderLink = Boolean(normalizeText(officialPreorderUrl));
  const storeRows = collectStoreRows({ variants, additionalStoreRows });
  const hasPrebookingStores = storeRows.some(isPrebookingStore);
  const hasLiveStores = storeRows.some(hasLiveStoreSignal);
  const hasStoreSignals = storeRows.length > 0;

  let launchStage = "released";

  if (normalizedStatus === "rumored" || normalizedStatus === "announced") {
    launchStage = normalizedStatus;
  } else if (normalizedStatus === "upcoming") {
    if (launch) {
      launchStage = launch > today ? "upcoming" : "released";
    } else if (
      preorderLink ||
      hasPrebookingStores ||
      (earliestSaleStart && earliestSaleStart > today)
    ) {
      launchStage = "upcoming";
    } else {
      launchStage = "released";
    }
  } else if (
    normalizedStatus === "released" ||
    normalizedStatus === "available"
  ) {
    launchStage = launch && launch > today ? "upcoming" : "released";
  } else if (launch) {
    launchStage = launch > today ? "upcoming" : "released";
  } else if (
    preorderLink ||
    hasPrebookingStores ||
    (earliestSaleStart && earliestSaleStart > today)
  ) {
    launchStage = "upcoming";
  } else if (earliestSaleStart && earliestSaleStart <= today) {
    launchStage = "released";
  }

  let saleStage = "sale_tbd";

  if (earliestSaleStart) {
    if (earliestSaleStart > today) {
      saleStage =
        preorderLink || hasPrebookingStores ? "preorder" : "sale_scheduled";
    } else {
      saleStage = hasLiveStores ? "on_sale" : "sale_started";
    }
  } else if (normalizedStatus === "available") {
    saleStage = "on_sale";
  } else if (preorderLink || hasPrebookingStores) {
    saleStage = "preorder";
  } else if (hasLiveStores) {
    saleStage = "on_sale";
  } else if (launchStage === "released" && hasStoreSignals) {
    saleStage = "store_pending";
  }

  let storeStage = "none";
  if (hasLiveStores) storeStage = "live";
  else if (preorderLink || hasPrebookingStores) storeStage = "prebooking";
  else if (hasStoreSignals) storeStage = "listed";

  return {
    launchStage,
    saleStage,
    storeStage,
    launchDate: launch,
    saleStartDate: earliestSaleStart,
    preorderLink,
    hasPrebookingStores,
    hasLiveStores,
    hasStoreSignals,
  };
};

const isUpcomingLaunchStage = (value) =>
  ["rumored", "announced", "upcoming"].includes(value);

const formatLaunchStageLabel = (value) => {
  switch (value) {
    case "rumored":
      return "Rumored";
    case "announced":
      return "Announced";
    case "upcoming":
      return "Upcoming";
    case "available":
      return "Available";
    case "released":
      return "Released";
    default:
      return "";
  }
};

const formatSaleStageLabel = (value) => {
  switch (value) {
    case "preorder":
      return "Pre-order";
    case "sale_scheduled":
      return "Sale Scheduled";
    case "on_sale":
      return "On Sale";
    case "sale_started":
      return "Sale Started";
    case "store_pending":
      return "Store Links Pending";
    case "sale_tbd":
      return "Sale Date TBA";
    default:
      return "";
  }
};

const formatStoreStageLabel = (value) => {
  switch (value) {
    case "live":
      return "Live Stores";
    case "prebooking":
      return "Pre-booking Stores";
    case "listed":
      return "Store Listing Pending";
    case "none":
      return "No Store Listing";
    default:
      return "";
  }
};

export {
  formatLaunchStageLabel,
  formatSaleStageLabel,
  formatStoreStageLabel,
  getEarliestSaleStartDate,
  getSmartphoneLifecycle,
  getTodayDateOnly,
  isUpcomingLaunchStage,
  normalizeLifecycleStatus,
  parseDateValue,
  toDateOnly,
};
