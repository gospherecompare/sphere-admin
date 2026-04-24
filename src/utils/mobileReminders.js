const DAY_MS = 24 * 60 * 60 * 1000;
const RECENT_RELEASE_WINDOW_DAYS = 7;
const MAX_REMINDERS = 12;

const normalizeText = (value) =>
  value === null || value === undefined ? "" : String(value).trim();

const firstText = (...values) =>
  values.map(normalizeText).find((value) => value.length > 0) || "";

const parseDateValue = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value);
  }

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

const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const diffCalendarDays = (fromValue, toValue) => {
  const from = toDateOnly(fromValue);
  const to = toDateOnly(toValue);
  if (!from || !to) return null;
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
};

const hasSpecificTime = (date) =>
  Boolean(
    date &&
      (date.getHours() ||
        date.getMinutes() ||
        date.getSeconds() ||
        date.getMilliseconds()),
  );

const formatDateLabel = (value) => {
  const date = parseDateValue(value);
  if (!date) return "Date not set";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTimeLabel = (value) => {
  const date = parseDateValue(value);
  if (!date) return "";
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatWhenLabel = (value) => {
  const date = parseDateValue(value);
  if (!date) return "Date not set";

  const daysFromToday = diffCalendarDays(getToday(), date);
  const timeLabel = hasSpecificTime(date) ? `, ${formatTimeLabel(date)}` : "";

  if (daysFromToday === 0) return `Today${timeLabel}`;
  if (daysFromToday === 1) return `Tomorrow${timeLabel}`;
  if (daysFromToday === -1) return `Yesterday${timeLabel}`;
  return `${formatDateLabel(date)}${timeLabel}`;
};

const joinList = (values = []) => {
  if (values.length <= 1) return values[0] || "";
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
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

const collectStatusText = (mobile) => {
  const raw = mobile?.raw || {};

  return [
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
  ]
    .map(normalizeText)
    .filter(Boolean)
    .join(" ");
};

const getProductId = (mobile) =>
  normalizeText(
    mobile?.id ||
      mobile?._id ||
      mobile?.product_id ||
      mobile?.productId ||
      mobile?.raw?.product_id ||
      mobile?.raw?.productId ||
      mobile?.raw?.id ||
      mobile?.raw?._id,
  );

const getProductName = (mobile) =>
  firstText(
    mobile?.name,
    mobile?.product_name,
    mobile?.model_name,
    mobile?.raw?.name,
    mobile?.raw?.product_name,
    "Unnamed mobile",
  );

const getProductBrand = (mobile) =>
  firstText(
    mobile?.brand,
    mobile?.brand_name,
    mobile?.raw?.brand,
    mobile?.raw?.brand_name,
    "Unknown brand",
  );

const getLaunchDate = (mobile) => {
  const raw = mobile?.raw || {};
  const candidates = [
    raw.launch_date,
    raw.launchDate,
    raw.launch_date_text,
    raw.launchDateText,
    raw.launch_date_label,
    raw.launchDateLabel,
    mobile?.launch_date,
    mobile?.launchDate,
    mobile?.launch_date_text,
    mobile?.launchDateText,
    mobile?.launch_date_label,
    mobile?.launchDateLabel,
  ];

  for (const candidate of candidates) {
    const parsed = parseDateValue(candidate);
    if (parsed) return parsed;
  }
  return null;
};

const getSaleStartDate = (mobile) => {
  const candidates = [];
  const raw = mobile?.raw || {};

  [
    raw.sale_start_date,
    raw.saleStartDate,
    raw.sale_date,
    raw.saleDate,
    mobile?.sale_start_date,
    mobile?.saleStartDate,
    mobile?.sale_date,
    mobile?.saleDate,
  ].forEach((value) => {
    const parsed = parseDateValue(value);
    if (parsed) candidates.push(parsed);
  });

  const variants = Array.isArray(mobile?.variants) ? mobile.variants : [];
  variants.forEach((variant) => {
    [
      variant?.sale_start_date,
      variant?.saleStartDate,
      variant?.sale_date,
      variant?.saleDate,
    ].forEach((value) => {
      const parsed = parseDateValue(value);
      if (parsed) candidates.push(parsed);
    });

    const stores = Array.isArray(variant?.store_prices)
      ? variant.store_prices
      : Array.isArray(variant?.stores)
        ? variant.stores
        : [];

    stores.forEach((store) => {
      [
        store?.sale_start_date,
        store?.saleStartDate,
        store?.sale_date,
        store?.saleDate,
        store?.available_from,
        store?.availableFrom,
      ].forEach((value) => {
        const parsed = parseDateValue(value);
        if (parsed) candidates.push(parsed);
      });
    });
  });

  if (!candidates.length) return null;
  return candidates.sort((a, b) => a.getTime() - b.getTime())[0];
};

const hasPreorderLink = (mobile) =>
  Boolean(
    firstText(
      mobile?.official_preorder_url,
      mobile?.officialPreorderUrl,
      mobile?.raw?.official_preorder_url,
      mobile?.raw?.officialPreorderUrl,
    ),
  );

const getMissingFields = ({ status, launchDate, saleStartDate, preorder }) => {
  const missing = [];

  if (!launchDate) {
    if (
      status === "released" ||
      status === "announced" ||
      status === "rumored" ||
      status === "upcoming" ||
      (!saleStartDate && !status)
    ) {
      missing.push("launch date");
    }
  }

  if (!saleStartDate) {
    if (
      status === "available" ||
      status === "upcoming" ||
      status === "announced" ||
      preorder
    ) {
      missing.push("sale start date");
    }
  }

  if (!status && !launchDate && !saleStartDate) {
    missing.push("status");
  }

  return Array.from(new Set(missing));
};

const getReminderMeta = (kind) => {
  switch (kind) {
    case "launch_sale_today":
      return {
        group: "today",
        badge: "Today",
        titlePrefix: "Launch and sale start today",
        descriptionPrefix: "Launch date and sale start date are both due",
        priority: 0,
      };
    case "sale_today":
      return {
        group: "today",
        badge: "Sale",
        titlePrefix: "Sale starts today",
        descriptionPrefix: "Sale start reminder set",
        priority: 1,
      };
    case "launch_today":
      return {
        group: "today",
        badge: "Launch",
        titlePrefix: "Launch today",
        descriptionPrefix: "Launch reminder set",
        priority: 2,
      };
    case "missing_info":
      return {
        group: "update",
        badge: "Update info",
        titlePrefix: "Update info",
        descriptionPrefix: "Missing",
        priority: 3,
      };
    case "upcoming_sale":
      return {
        group: "upcoming",
        badge: "Upcoming",
        titlePrefix: "Sale reminder",
        descriptionPrefix: "Sale starts",
        priority: 4,
      };
    case "upcoming_launch":
      return {
        group: "upcoming",
        badge: "Upcoming",
        titlePrefix: "Launch reminder",
        descriptionPrefix: "Launches",
        priority: 5,
      };
    case "released_recent":
      return {
        group: "released",
        badge: "Released",
        titlePrefix: "Released",
        descriptionPrefix: "Released on",
        priority: 6,
      };
    default:
      return {
        group: "upcoming",
        badge: "Status",
        titlePrefix: "Status reminder",
        descriptionPrefix: "",
        priority: 10,
      };
  }
};

const buildReminder = (mobile) => {
  const today = getToday();
  const productId = getProductId(mobile);
  const name = getProductName(mobile);
  const brand = getProductBrand(mobile);
  const launchDate = getLaunchDate(mobile);
  const saleStartDate = getSaleStartDate(mobile);
  const status = normalizeLaunchStatus(collectStatusText(mobile));
  const preorder = hasPreorderLink(mobile);

  const launchDiff = launchDate ? diffCalendarDays(today, launchDate) : null;
  const saleDiff = saleStartDate
    ? diffCalendarDays(today, saleStartDate)
    : null;

  let kind = null;
  let when = saleStartDate || launchDate || null;
  let description = "";

  if (saleDiff === 0 && launchDiff === 0) {
    kind = "launch_sale_today";
    when = saleStartDate || launchDate;
    description = `Launch date and sale start date are both set for ${formatWhenLabel(when)}.`;
  } else if (saleDiff === 0) {
    kind = "sale_today";
    when = saleStartDate;
    description = `Sale starts ${formatWhenLabel(saleStartDate)}.`;
  } else if (launchDiff === 0) {
    kind = "launch_today";
    when = launchDate;
    description = `Launch is scheduled for ${formatWhenLabel(launchDate)}.`;
  } else if (saleDiff !== null && saleDiff > 0) {
    kind = "upcoming_sale";
    when = saleStartDate;
    description = `Sale starts ${formatWhenLabel(saleStartDate)}.`;
  } else if (
    launchDiff !== null &&
    launchDiff > 0 &&
    (saleDiff === null || launchDiff <= saleDiff)
  ) {
    kind = "upcoming_launch";
    when = launchDate;
    description = `Launches ${formatWhenLabel(launchDate)}.`;
  } else if (
    launchDiff !== null &&
    launchDiff < 0 &&
    launchDiff >= -RECENT_RELEASE_WINDOW_DAYS
  ) {
    kind = "released_recent";
    when = launchDate;
    description = `Released ${formatWhenLabel(launchDate)}.`;
  } else {
    const missingFields = getMissingFields({
      status,
      launchDate,
      saleStartDate,
      preorder,
    });

    if (!missingFields.length) return null;

    kind = "missing_info";
    description = `Missing ${joinList(missingFields)}.`;
    when = launchDate || saleStartDate || null;
  }

  const meta = getReminderMeta(kind);

  return {
    id: `${kind}-${productId || name}`,
    kind,
    group: meta.group,
    badge: meta.badge,
    title: `${name} ${meta.titlePrefix}`.trim(),
    description,
    productId: productId || null,
    productName: name,
    brand,
    when,
    whenLabel: when ? formatWhenLabel(when) : "",
    priority: meta.priority,
  };
};

const sortReminders = (left, right) => {
  if (left.priority !== right.priority) return left.priority - right.priority;

  const leftTime = left.when ? left.when.getTime() : Number.MAX_SAFE_INTEGER;
  const rightTime = right.when
    ? right.when.getTime()
    : Number.MAX_SAFE_INTEGER;

  if (left.kind === "released_recent" && right.kind === "released_recent") {
    return rightTime - leftTime;
  }

  return leftTime - rightTime;
};

const EMPTY_SUMMARY = {
  items: [],
  total: 0,
  hiddenCount: 0,
  counts: {
    today: 0,
    upcoming: 0,
    released: 0,
    update: 0,
  },
};

const createMobileReminderSummary = (mobiles = []) => {
  const items = createMobileReminderItems(mobiles);
  const counts = {
    today: 0,
    upcoming: 0,
    released: 0,
    update: 0,
  };

  items.forEach((reminder) => {
    if (reminder.group === "today") counts.today += 1;
    if (reminder.group === "upcoming") counts.upcoming += 1;
    if (reminder.group === "released") counts.released += 1;
    if (reminder.group === "update") counts.update += 1;
  });

  return {
    items: items.slice(0, MAX_REMINDERS),
    total: items.length,
    hiddenCount: Math.max(items.length - MAX_REMINDERS, 0),
    counts,
  };
};

const createMobileReminderItems = (mobiles = []) => {
  const uniqueMobiles = new Map();

  (Array.isArray(mobiles) ? mobiles : []).forEach((mobile) => {
    const key = getProductId(mobile) || getProductName(mobile);
    if (!key || uniqueMobiles.has(key)) return;
    uniqueMobiles.set(key, mobile);
  });

  const reminders = [];

  uniqueMobiles.forEach((mobile) => {
    const reminder = buildReminder(mobile);
    if (!reminder) return;
    reminders.push(reminder);
  });

  return reminders.sort(sortReminders);
};

export { EMPTY_SUMMARY, createMobileReminderItems, createMobileReminderSummary };
