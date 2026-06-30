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

const normalizeSaleStage = (value) => {
  const text = normalizeText(value).toLowerCase().replace(/[\s-]+/g, "_");
  if (!text) return null;
  if (/out_?of_?stock|sold_?out/.test(text)) return "out_of_stock";
  if (/pre_?order|pre_?book|prebooking|presale/.test(text)) return "preorder";
  if (/sale_?scheduled|scheduled|coming_?soon/.test(text)) {
    return "sale_scheduled";
  }
  if (/sale_?live|on_?sale|available|in_?stock/.test(text)) return "on_sale";
  if (/sale_?started|started/.test(text)) return "sale_started";
  if (/store_?pending|pending|listed/.test(text)) return "store_pending";
  if (/tbd|unknown|not_?started|none/.test(text)) return "sale_tbd";
  return text;
};

const normalizeStoreStage = (value) => {
  const text = normalizeText(value).toLowerCase().replace(/[\s-]+/g, "_");
  if (!text) return null;
  if (/pre_?order|pre_?book|prebooking|presale/.test(text)) {
    return "prebooking";
  }
  if (/live|available|in_?stock/.test(text)) return "live";
  if (/pending|listed|store_?pending/.test(text)) return "listed";
  if (/none|no_?store|tbd|unknown/.test(text)) return "none";
  return text;
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
  launchStatus = "",
  saleStage = "",
  storeStage = "",
  statusText = "",
  variants = [],
  additionalStoreRows = [],
} = {}) => {
  const directLaunchStage = normalizeLifecycleStatus(launchStatus);
  const directSaleStage = normalizeSaleStage(saleStage);
  const directStoreStage = normalizeStoreStage(storeStage);

  if (directLaunchStage || directSaleStage || directStoreStage) {
    return {
      launchStage: directLaunchStage || "released",
      saleStage:
        directSaleStage ||
        (directLaunchStage === "available"
          ? "on_sale"
          : directLaunchStage === "upcoming"
            ? "preorder"
            : directLaunchStage === "announced"
              ? "sale_scheduled"
              : "sale_tbd"),
      storeStage: directStoreStage || "none",
      launchDate: toDateOnly(launchDate),
      saleStartDate: toDateOnly(saleStartDate),
      hasPrebookingStores: false,
      hasLiveStores: false,
      hasStoreSignals: false,
    };
  }

  const today = getTodayDateOnly();
  const earliestSaleStart = getEarliestSaleStartDate({
    saleStartDate,
    variants,
    additionalStoreRows,
  });
  const normalizedStatus =
    normalizeLifecycleStatus(launchStatus) ||
    normalizeLifecycleStatus(statusText);
  const storeRows = collectStoreRows({ variants, additionalStoreRows });
  const hasPrebookingStores = storeRows.some(isPrebookingStore);
  const hasLiveStores = storeRows.some(hasLiveStoreSignal);
  const hasStoreSignals = storeRows.length > 0;

  let launchStage = "released";

  if (normalizedStatus === "rumored" || normalizedStatus === "announced") {
    launchStage = normalizedStatus;
  } else if (normalizedStatus === "upcoming") {
    launchStage = "upcoming";
  } else if (
    normalizedStatus === "released" ||
    normalizedStatus === "available"
  ) {
    launchStage = normalizedStatus;
  } else if (hasPrebookingStores) {
    launchStage = "upcoming";
  } else if (hasLiveStores) {
    launchStage = "available";
  }

  let resolvedSaleStage = "sale_tbd";

  if (earliestSaleStart) {
    if (earliestSaleStart > today) {
      resolvedSaleStage = hasPrebookingStores ? "preorder" : "sale_scheduled";
    } else {
      resolvedSaleStage = hasLiveStores ? "on_sale" : "sale_started";
    }
  } else if (normalizedStatus === "available") {
    resolvedSaleStage = "on_sale";
  } else if (hasPrebookingStores) {
    resolvedSaleStage = "preorder";
  } else if (hasLiveStores) {
    resolvedSaleStage = "on_sale";
  } else if (launchStage === "released" && hasStoreSignals) {
    resolvedSaleStage = "store_pending";
  }

  let resolvedStoreStage = "none";
  if (hasLiveStores) resolvedStoreStage = "live";
  else if (hasPrebookingStores) resolvedStoreStage = "prebooking";
  else if (hasStoreSignals) resolvedStoreStage = "listed";

  return {
    launchStage,
    saleStage: resolvedSaleStage,
    storeStage: resolvedStoreStage,
    launchDate: toDateOnly(launchDate),
    saleStartDate: earliestSaleStart,
    hasPrebookingStores,
    hasLiveStores,
    hasStoreSignals,
  };
};

const getSmartphoneRenderState = ({
  launchStage,
  saleStage,
  storeStage,
} = {}) => {
  const launch = normalizeLifecycleStatus(launchStage) || "unknown";
  const sale = normalizeSaleStage(saleStage) || "sale_tbd";
  const store = normalizeStoreStage(storeStage) || "none";

  const isLive =
    store === "live" || sale === "on_sale" || sale === "sale_live";

  if (isLive) {
    return {
      renderType: "available",
      displayStatus: "Available now",
    };
  }

  if (sale === "out_of_stock") {
    return {
      renderType: "available",
      displayStatus: "Out of stock",
    };
  }

  if (sale === "preorder" || store === "prebooking") {
    return {
      renderType: "upcoming",
      displayStatus: "Upcoming",
    };
  }

  if (sale === "sale_scheduled") {
    return {
      renderType: "upcoming",
      displayStatus: "Upcoming",
    };
  }

  if (launch === "released") {
    return {
      renderType: "upcoming",
      displayStatus: "Upcoming",
    };
  }

  if (launch === "announced") {
    return {
      renderType: "upcoming",
      displayStatus: "Announced",
    };
  }

  if (launch === "rumored") {
    return {
      renderType: "upcoming",
      displayStatus: "Rumored",
    };
  }

  return {
    renderType: "upcoming",
    displayStatus:
      launch === "upcoming" ? "Upcoming" : formatLaunchStageLabel(launch) || "Upcoming",
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
    case "sale_live":
      return "Sale Live";
    case "sale_started":
      return "Sale Started";
    case "out_of_stock":
      return "Out of Stock";
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
  getSmartphoneRenderState,
  getTodayDateOnly,
  isUpcomingLaunchStage,
  normalizeSaleStage,
  normalizeStoreStage,
  normalizeLifecycleStatus,
  parseDateValue,
  toDateOnly,
};
