const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const PRODUCT_TYPE_OPTIONS = [
  { value: "all", label: "All devices" },
  { value: "smartphone", label: "Smartphones" },
  { value: "laptop", label: "Laptops" },
  { value: "tv", label: "TVs" },
];

export const GROUP_OPTIONS = [
  { value: "year", label: "Year" },
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
];

export const DATE_RANGE_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "last_90", label: "90 days" },
  { value: "last_180", label: "6 months" },
  { value: "last_365", label: "1 year" },
  { value: "ytd", label: "Year to date" },
  { value: "custom", label: "Custom" },
];

export const GAP_BUCKETS = [
  {
    key: "prelaunch",
    label: "Before launch",
    test: (value) => value < 0,
  },
  {
    key: "same_day",
    label: "Launch day",
    test: (value) => value === 0,
  },
  {
    key: "week_1",
    label: "1-7 days",
    test: (value) => value >= 1 && value <= 7,
  },
  {
    key: "week_2",
    label: "8-14 days",
    test: (value) => value >= 8 && value <= 14,
  },
  {
    key: "month_1",
    label: "15-30 days",
    test: (value) => value >= 15 && value <= 30,
  },
  {
    key: "month_2",
    label: "31-60 days",
    test: (value) => value >= 31 && value <= 60,
  },
  {
    key: "later",
    label: "61+ days",
    test: (value) => value >= 61,
  },
];

const monthFormatter = new Intl.DateTimeFormat("en-IN", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const shortMonthFormatter = new Intl.DateTimeFormat("en-IN", {
  month: "short",
  timeZone: "UTC",
});

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export const parseDateOnlyAsUtc = (value) => {
  if (!value) return null;

  const match = String(value).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  return new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );
};

export const formatShortDate = (value) => {
  const date = parseDateOnlyAsUtc(value);
  if (!date) return "Not set";
  return dateFormatter.format(date);
};

export const toDateInputValue = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
};

const toNumberOrNull = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const getIsoWeekInfo = (date) => {
  const workingDate = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const weekday = workingDate.getUTCDay() || 7;
  workingDate.setUTCDate(workingDate.getUTCDate() + 4 - weekday);

  const isoYear = workingDate.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const weekNumber = Math.ceil(((workingDate - yearStart) / DAY_IN_MS + 1) / 7);

  return { year: isoYear, week: weekNumber };
};

const getTimelineBucket = (date, groupBy) => {
  if (groupBy === "year") {
    const year = String(date.getUTCFullYear());
    return {
      key: year,
      sortKey: year,
      label: year,
      shortLabel: year,
    };
  }

  if (groupBy === "week") {
    const { year, week } = getIsoWeekInfo(date);
    const paddedWeek = String(week).padStart(2, "0");
    return {
      key: `${year}-W${paddedWeek}`,
      sortKey: `${year}-W${paddedWeek}`,
      label: `Week ${week}, ${year}`,
      shortLabel: `W${week}`,
    };
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return {
    key: `${year}-${month}`,
    sortKey: `${year}-${month}`,
    label: monthFormatter.format(date),
    shortLabel: shortMonthFormatter.format(date),
  };
};

export const buildLaunchSeries = (devices = [], groupBy = "month") => {
  const counts = new Map();

  for (const device of Array.isArray(devices) ? devices : []) {
    const date = parseDateOnlyAsUtc(device?.launch_date);
    if (!date) continue;

    const bucket = getTimelineBucket(date, groupBy);
    const existing = counts.get(bucket.key);

    if (existing) {
      existing.count += 1;
      continue;
    }

    counts.set(bucket.key, {
      ...bucket,
      count: 1,
    });
  }

  return Array.from(counts.values()).sort((left, right) =>
    String(left.sortKey).localeCompare(String(right.sortKey)),
  );
};

export const buildSummaryStats = (devices = []) => {
  const safeDevices = Array.isArray(devices) ? devices : [];
  const launchedDevices = safeDevices.filter((device) =>
    parseDateOnlyAsUtc(device?.launch_date),
  );
  const saleTaggedDevices = safeDevices.filter((device) =>
    parseDateOnlyAsUtc(device?.sale_start_date),
  );
  const gaps = safeDevices
    .map((device) => toNumberOrNull(device?.sale_gap_days))
    .filter((value) => value !== null)
    .sort((left, right) => left - right);

  const gapTotal = gaps.reduce((sum, value) => sum + value, 0);
  const comparableDevices = gaps.length;

  return {
    totalDevices: safeDevices.length,
    launchedDevices: launchedDevices.length,
    saleTaggedDevices: saleTaggedDevices.length,
    comparableDevices,
    avgGapDays: comparableDevices
      ? Number((gapTotal / comparableDevices).toFixed(1))
      : null,
    minGapDays: comparableDevices ? gaps[0] : null,
    maxGapDays: comparableDevices ? gaps[gaps.length - 1] : null,
    preLaunchSales: gaps.filter((value) => value < 0).length,
    launchDaySales: gaps.filter((value) => value === 0).length,
  };
};

export const buildGapHistogram = (devices = []) => {
  const gaps = (Array.isArray(devices) ? devices : [])
    .map((device) => toNumberOrNull(device?.sale_gap_days))
    .filter((value) => value !== null);

  return GAP_BUCKETS.map((bucket) => {
    const count = gaps.filter((value) => bucket.test(value)).length;
    return {
      key: bucket.key,
      label: bucket.label,
      count,
    };
  });
};

const getQuantile = (values, quantile) => {
  if (!values.length) return null;

  const index = (values.length - 1) * quantile;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) return values[lower];

  const weight = index - lower;
  return Number(
    (values[lower] + (values[upper] - values[lower]) * weight).toFixed(1),
  );
};

const toPercent = (count, total) => {
  if (!total) return 0;
  return Math.round((count / total) * 100);
};

export const buildDateRangeFromPreset = (
  preset = "all",
  referenceDate = new Date(),
) => {
  const current = referenceDate instanceof Date
    ? new Date(referenceDate.getTime())
    : new Date(referenceDate);

  if (Number.isNaN(current.getTime())) {
    return { start: "", end: "" };
  }

  const todayUtc = new Date(
    Date.UTC(
      current.getUTCFullYear(),
      current.getUTCMonth(),
      current.getUTCDate(),
    ),
  );

  const withOffset = (days) => {
    const next = new Date(todayUtc.getTime());
    next.setUTCDate(next.getUTCDate() + days);
    return next;
  };

  switch (preset) {
    case "last_90":
      return { start: toDateInputValue(withOffset(-89)), end: toDateInputValue(todayUtc) };
    case "last_180":
      return { start: toDateInputValue(withOffset(-179)), end: toDateInputValue(todayUtc) };
    case "last_365":
      return { start: toDateInputValue(withOffset(-364)), end: toDateInputValue(todayUtc) };
    case "ytd":
      return {
        start: `${todayUtc.getUTCFullYear()}-01-01`,
        end: toDateInputValue(todayUtc),
      };
    default:
      return { start: "", end: "" };
  }
};

export const buildPredictionModel = (devices = []) => {
  const gaps = (Array.isArray(devices) ? devices : [])
    .map((device) => toNumberOrNull(device?.sale_gap_days))
    .filter((value) => value !== null)
    .sort((left, right) => left - right);

  const sampleSize = gaps.length;
  if (!sampleSize) return null;

  const histogram = buildGapHistogram(
    gaps.map((gap) => ({ sale_gap_days: gap })),
  );
  const strongestBucket = [...histogram].sort((left, right) => {
    if (right.count !== left.count) return right.count - left.count;
    return left.label.localeCompare(right.label);
  })[0];

  return {
    sampleSize,
    withinLaunchDay: toPercent(gaps.filter((value) => value <= 0).length, sampleSize),
    within7Days: toPercent(gaps.filter((value) => value <= 7).length, sampleSize),
    within30Days: toPercent(
      gaps.filter((value) => value <= 30).length,
      sampleSize,
    ),
    within60Days: toPercent(
      gaps.filter((value) => value <= 60).length,
      sampleSize,
    ),
    medianGapDays: getQuantile(gaps, 0.5),
    upperQuartileGapDays: getQuantile(gaps, 0.75),
    strongestBucket,
  };
};

export const buildBrandCompareRows = (devices = [], selectedBrands = []) => {
  const selectedSet = new Set(
    (Array.isArray(selectedBrands) ? selectedBrands : []).filter(Boolean),
  );
  const selectedOrder = new Map(
    (Array.isArray(selectedBrands) ? selectedBrands : []).map((brand, index) => [
      brand,
      index,
    ]),
  );

  const grouped = new Map();

  for (const device of Array.isArray(devices) ? devices : []) {
    const brand = String(device?.brand_name || "Unknown").trim() || "Unknown";
    if (selectedSet.size && !selectedSet.has(brand)) continue;

    if (!grouped.has(brand)) {
      grouped.set(brand, {
        brand,
        count: 0,
        saleTagged: 0,
        gapValues: [],
        within30Days: 0,
      });
    }

    const row = grouped.get(brand);
    row.count += 1;

    if (parseDateOnlyAsUtc(device?.sale_start_date)) {
      row.saleTagged += 1;
    }

    const gap = toNumberOrNull(device?.sale_gap_days);
    if (gap !== null) {
      row.gapValues.push(gap);
      if (gap <= 30) row.within30Days += 1;
    }
  }

  return Array.from(grouped.values())
    .map((row) => {
      const sortedGaps = [...row.gapValues].sort((left, right) => left - right);
      return {
        brand: row.brand,
        count: row.count,
        saleCoverage: toPercent(row.saleTagged, row.count),
        avgGapDays: sortedGaps.length
          ? Number(
              (
                sortedGaps.reduce((sum, value) => sum + value, 0) /
                sortedGaps.length
              ).toFixed(1),
            )
          : null,
        medianGapDays: getQuantile(sortedGaps, 0.5),
        minGapDays: sortedGaps.length ? sortedGaps[0] : null,
        maxGapDays: sortedGaps.length ? sortedGaps[sortedGaps.length - 1] : null,
        within30DaysRate: sortedGaps.length
          ? toPercent(row.within30Days, sortedGaps.length)
          : 0,
      };
    })
    .sort((left, right) => {
      if (selectedSet.size) {
        return (
          (selectedOrder.get(left.brand) ?? Number.MAX_SAFE_INTEGER) -
          (selectedOrder.get(right.brand) ?? Number.MAX_SAFE_INTEGER)
        );
      }
      if (right.count !== left.count) return right.count - left.count;
      return left.brand.localeCompare(right.brand);
    });
};

const buildNamedRanking = (devices = [], getLabel, limit = 6) => {
  const counts = new Map();

  for (const device of Array.isArray(devices) ? devices : []) {
    const label = String(getLabel(device) || "").trim() || "Unknown";
    if (!counts.has(label)) {
      counts.set(label, {
        label,
        count: 0,
        saleTagged: 0,
        gapValues: [],
      });
    }

    const row = counts.get(label);
    row.count += 1;

    if (parseDateOnlyAsUtc(device?.sale_start_date)) {
      row.saleTagged += 1;
    }

    const gap = toNumberOrNull(device?.sale_gap_days);
    if (gap !== null) row.gapValues.push(gap);
  }

  return Array.from(counts.values())
    .map((row) => ({
      label: row.label,
      count: row.count,
      saleCoverage: toPercent(row.saleTagged, row.count),
      avgGapDays: row.gapValues.length
        ? Number(
            (
              row.gapValues.reduce((sum, value) => sum + value, 0) /
              row.gapValues.length
            ).toFixed(1),
          )
        : null,
    }))
    .sort((left, right) => {
      if (right.count !== left.count) return right.count - left.count;
      return left.label.localeCompare(right.label);
    })
    .slice(0, limit);
};

export const buildBrandRanking = (devices = [], limit = 6) =>
  buildNamedRanking(
    devices,
    (device) => device?.brand_name || "Unknown",
    limit,
  );

export const buildCategoryRanking = (devices = [], limit = 6) =>
  buildNamedRanking(
    devices,
    (device) => device?.category || "Uncategorized",
    limit,
  );

export const buildTypeBreakdown = (devices = []) => {
  const grouped = new Map();

  for (const device of Array.isArray(devices) ? devices : []) {
    const key = String(device?.product_type || "").trim() || "unknown";
    if (!grouped.has(key)) {
      grouped.set(key, {
        productType: key,
        count: 0,
        saleTagged: 0,
        gapValues: [],
      });
    }

    const current = grouped.get(key);
    current.count += 1;
    if (parseDateOnlyAsUtc(device?.sale_start_date)) current.saleTagged += 1;

    const gap = toNumberOrNull(device?.sale_gap_days);
    if (gap !== null) current.gapValues.push(gap);
  }

  return Array.from(grouped.values())
    .map((item) => ({
      productType: item.productType,
      count: item.count,
      saleCoverage: toPercent(item.saleTagged, item.count),
      avgGapDays: item.gapValues.length
        ? Number(
            (
              item.gapValues.reduce((sum, value) => sum + value, 0) /
              item.gapValues.length
            ).toFixed(1),
          )
        : null,
    }))
    .sort((left, right) => right.count - left.count);
};

export const buildDataQualitySummary = (
  devices = [],
  { outlierThresholdDays = 120 } = {},
) => {
  const safeDevices = Array.isArray(devices) ? devices : [];

  let missingLaunchDate = 0;
  let missingSaleDate = 0;
  let negativeGapCount = 0;
  let outlierGapCount = 0;
  let missingBrandCount = 0;
  let missingCategoryCount = 0;
  const flaggedRows = [];

  for (const device of safeDevices) {
    const issues = [];
    const launchDate = parseDateOnlyAsUtc(device?.launch_date);
    const saleDate = parseDateOnlyAsUtc(device?.sale_start_date);
    const gap = toNumberOrNull(device?.sale_gap_days);
    const brand = String(device?.brand_name || "").trim();
    const category = String(device?.category || "").trim();

    if (!launchDate) {
      missingLaunchDate += 1;
      issues.push("Missing launch date");
    }

    if (!saleDate) {
      missingSaleDate += 1;
      issues.push("Missing sale date");
    }

    if (gap !== null && gap < 0) {
      negativeGapCount += 1;
      issues.push("Sale before launch");
    }

    if (gap !== null && gap >= outlierThresholdDays) {
      outlierGapCount += 1;
      issues.push(`${outlierThresholdDays}+ day gap`);
    }

    if (!brand) {
      missingBrandCount += 1;
      issues.push("Missing brand");
    }

    if (!category) {
      missingCategoryCount += 1;
      issues.push("Missing category");
    }

    if (issues.length) {
      flaggedRows.push({
        ...device,
        issues,
      });
    }
  }

  const issueCards = [
    {
      key: "missing_launch_date",
      label: "Missing launch date",
      count: missingLaunchDate,
      helper: "Devices without a usable launch date",
    },
    {
      key: "missing_sale_date",
      label: "Missing sale date",
      count: missingSaleDate,
      helper: "Devices missing a sale start date",
    },
    {
      key: "negative_gap",
      label: "Negative gap",
      count: negativeGapCount,
      helper: "Sale happens before launch in the stored data",
    },
    {
      key: "outlier_gap",
      label: `${outlierThresholdDays}+ day gap`,
      count: outlierGapCount,
      helper: "Very long gaps that may need validation",
    },
    {
      key: "missing_brand",
      label: "Missing brand",
      count: missingBrandCount,
      helper: "Rows without a mapped brand",
    },
    {
      key: "missing_category",
      label: "Missing category",
      count: missingCategoryCount,
      helper: "Rows without a mapped category",
    },
  ];

  flaggedRows.sort((left, right) => {
    if (right.issues.length !== left.issues.length) {
      return right.issues.length - left.issues.length;
    }

    const leftDate = parseDateOnlyAsUtc(left?.launch_date);
    const rightDate = parseDateOnlyAsUtc(right?.launch_date);
    return (rightDate?.getTime() || 0) - (leftDate?.getTime() || 0);
  });

  return {
    totalDevices: safeDevices.length,
    flaggedDevicesCount: flaggedRows.length,
    issueCards,
    flaggedRows: flaggedRows.slice(0, 8),
  };
};

export const sortDevicesByLaunchDateDesc = (devices = []) => {
  return [...(Array.isArray(devices) ? devices : [])].sort((left, right) => {
    const leftDate = parseDateOnlyAsUtc(left?.launch_date);
    const rightDate = parseDateOnlyAsUtc(right?.launch_date);
    const timeDiff = (rightDate?.getTime() || 0) - (leftDate?.getTime() || 0);
    if (timeDiff !== 0) return timeDiff;
    return Number(right?.product_id || 0) - Number(left?.product_id || 0);
  });
};

export const formatGapLabel = (value) => {
  const gap = toNumberOrNull(value);
  if (gap === null) return "Sale date missing";
  if (gap === 0) return "Launch day";
  if (gap < 0) return `${Math.abs(gap)}d before launch`;
  if (gap === 1) return "1 day after launch";
  return `${gap}d after launch`;
};

export const getGapTone = (value) => {
  const gap = toNumberOrNull(value);
  if (gap === null) {
    return "bg-slate-100 text-slate-600 border-slate-200";
  }
  if (gap < 0) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  if (gap === 0) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (gap <= 14) {
    return "bg-sky-50 text-sky-700 border-sky-200";
  }
  if (gap <= 30) {
    return "bg-indigo-50 text-indigo-700 border-indigo-200";
  }
  return "bg-rose-50 text-rose-700 border-rose-200";
};
