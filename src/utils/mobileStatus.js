const parseDateValue = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeLaunchStatus = (value) => {
  if (!value) return null;
  const text = String(value).trim().toLowerCase();
  if (!text) return null;
  if (/rumou?r/.test(text)) return "rumored";
  if (/announce/.test(text)) return "announced";
  if (/(pre[-\s]?order|pre[-\s]?book|prebooking|presale)/i.test(text))
    return "upcoming";
  if (/(upcoming|coming soon|expected|launching soon)/i.test(text))
    return "upcoming";
  if (/(available|on sale|in stock)/i.test(text)) return "available";
  if (/(released|launched|out now)/i.test(text)) return "released";
  return null;
};

const firstText = (...values) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
};

const collectStatusText = (mobile) => {
  const raw = mobile?.raw || {};
  const parts = [
    raw.launch_status_override,
    raw.launchStatusOverride,
    raw.launch_status,
    raw.launchStatus,
    raw.launch_status_text,
    raw.launchStatusText,
    raw.launch_date_text,
    raw.launchDateText,
    raw.launch_date_label,
    raw.launchDateLabel,
    raw.status,
    raw.availability,
    raw.availability_status,
    raw.availabilityStatus,
    raw.badge,
    raw.badge_text,
    raw.badgeText,
    raw.manual_badge,
    raw.manualBadge,
    raw.trend_manual_badge,
    raw.trendManualBadge,
    mobile?.launch_status_override,
    mobile?.launchStatusOverride,
    mobile?.launch_status,
    mobile?.launchStatus,
    mobile?.launch_status_text,
    mobile?.launchStatusText,
    mobile?.launch_date_text,
    mobile?.launchDateText,
    mobile?.launch_date_label,
    mobile?.launchDateLabel,
    mobile?.status,
    mobile?.availability,
    mobile?.availability_status,
    mobile?.availabilityStatus,
    mobile?.badge,
    mobile?.badge_text,
    mobile?.badgeText,
  ];

  return parts
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean)
    .join(" ");
};

const toDateOnly = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    const d = new Date(value);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const raw = String(value).trim();
  if (!raw) return null;
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const d = new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

const getTodayDateOnly = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const resolveSaleStartDate = (mobile) => {
  if (!mobile) return null;
  const raw = mobile.raw || {};
  const direct =
    raw.sale_start_date ||
    raw.saleStartDate ||
    raw.sale_date ||
    raw.saleDate ||
    mobile.sale_start_date ||
    mobile.saleStartDate ||
    mobile.sale_date ||
    mobile.saleDate ||
    null;
  const directDate = toDateOnly(direct);
  if (directDate) return directDate;

  const variants = Array.isArray(mobile.variants) ? mobile.variants : [];
  for (const variant of variants) {
    const variantDirect =
      variant?.sale_start_date ||
      variant?.saleStartDate ||
      variant?.sale_date ||
      variant?.saleDate ||
      null;
    const variantDate = toDateOnly(variantDirect);
    if (variantDate) return variantDate;
    const stores = Array.isArray(variant?.store_prices)
      ? variant.store_prices
      : [];
    for (const store of stores) {
      const storeDirect =
        store?.sale_start_date ||
        store?.saleStartDate ||
        store?.sale_date ||
        store?.saleDate ||
        store?.available_from ||
        store?.availableFrom ||
        null;
      const storeDate = toDateOnly(storeDirect);
      if (storeDate) return storeDate;
    }
  }
  return null;
};

const isUpcomingOrPreorder = (mobile) => {
  if (!mobile) return false;
  const saleStartDate = resolveSaleStartDate(mobile);
  if (saleStartDate) {
    const today = getTodayDateOnly();
    return saleStartDate > today;
  }

  const raw = mobile.raw || {};
  const statusText = collectStatusText(mobile);
  const status = normalizeLaunchStatus(statusText);
  if (status) return !["released", "available"].includes(status);

  const launchDate = firstText(
    raw.launch_date,
    raw.launchDate,
    raw.launch_date_text,
    raw.launchDateText,
    raw.launch_date_label,
    raw.launchDateLabel,
    mobile.launch_date,
    mobile.launchDate,
    mobile.launch_date_text,
    mobile.launchDateText,
    mobile.launch_date_label,
    mobile.launchDateLabel,
  );
  const launch = parseDateValue(launchDate);
  if (launch && launch > new Date()) return true;

  if (statusText) {
    if (
      /(upcoming|coming soon|expected|pre[-\s]?book|pre[-\s]?order|prebooking|presale|rumored|announced)/i.test(
        statusText,
      )
    ) {
      return true;
    }
  }

  const variants = Array.isArray(mobile.variants) ? mobile.variants : [];
  for (const variant of variants) {
    const stores = Array.isArray(variant?.store_prices)
      ? variant.store_prices
      : [];
    if (
      stores.some((store) => {
        if (store?.is_prebooking === true) return true;
        const availability = String(
          store?.availability_status || store?.availabilityStatus || "",
        ).toLowerCase();
        if (availability.includes("prebook")) return true;
        const cta = String(store?.cta_label || store?.ctaLabel || "").toLowerCase();
        if (
          cta.includes("preorder") ||
          cta.includes("pre-order") ||
          cta.includes("coming soon")
        ) {
          return true;
        }
        return false;
      })
    ) {
      return true;
    }
  }

  return false;
};

export { isUpcomingOrPreorder };
