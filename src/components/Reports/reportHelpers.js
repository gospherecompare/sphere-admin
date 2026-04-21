const EMPTY_TEXT = "-";

const isEmptyValue = (value) =>
  value === null || value === undefined || String(value).trim() === "";

const normalizeDateValue = (value) => {
  if (isEmptyValue(value)) return null;
  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isNaN(time) ? null : time;
  }

  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct.getTime();

  const normalized = String(value).trim();
  if (!normalized) return null;

  const withTimeSeparator = normalized.includes("T")
    ? normalized
    : normalized.replace(" ", "T");
  const utcFallback = new Date(`${withTimeSeparator}Z`);
  if (!Number.isNaN(utcFallback.getTime())) return utcFallback.getTime();

  const localFallback = new Date(withTimeSeparator);
  return Number.isNaN(localFallback.getTime()) ? null : localFallback.getTime();
};

const normalizeNumberValue = (value) => {
  if (isEmptyValue(value)) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeTextValue = (value) => {
  if (isEmptyValue(value)) return null;
  return String(value).trim().toLowerCase();
};

const compareValues = (left, right, type) => {
  if (type === "number") {
    return normalizeNumberValue(left) - normalizeNumberValue(right);
  }

  if (type === "date") {
    return normalizeDateValue(left) - normalizeDateValue(right);
  }

  return String(left).localeCompare(String(right), undefined, {
    numeric: true,
    sensitivity: "base",
  });
};

const sortRows = (rows, getValue, options = {}) => {
  const { direction = "desc", type = "text", fallback } = options;
  const factor = direction === "asc" ? 1 : -1;

  return [...rows].sort((leftRow, rightRow) => {
    const leftRaw = getValue(leftRow);
    const rightRaw = getValue(rightRow);

    const leftValue = isEmptyValue(leftRaw) ? fallback : leftRaw;
    const rightValue = isEmptyValue(rightRaw) ? fallback : rightRaw;

    const leftEmpty =
      type === "number"
        ? normalizeNumberValue(leftValue) === null
        : type === "date"
          ? normalizeDateValue(leftValue) === null
          : normalizeTextValue(leftValue) === null;

    const rightEmpty =
      type === "number"
        ? normalizeNumberValue(rightValue) === null
        : type === "date"
          ? normalizeDateValue(rightValue) === null
          : normalizeTextValue(rightValue) === null;

    if (leftEmpty && rightEmpty) return 0;
    if (leftEmpty) return 1;
    if (rightEmpty) return -1;

    return compareValues(leftValue, rightValue, type) * factor;
  });
};

const formatNumber = (value, digits = 0) => {
  const parsed = normalizeNumberValue(value);
  if (parsed === null) return EMPTY_TEXT;
  return parsed.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

const formatScore = (value, digits = 1) => formatNumber(value, digits);

const formatCount = (value) => formatNumber(value, 0);

const formatSeconds = (value, digits = 1) => {
  const parsed = normalizeNumberValue(value);
  if (parsed === null) return EMPTY_TEXT;
  return `${parsed.toFixed(digits)}s`;
};

const formatPercent = (value, digits = 0) => {
  const parsed = normalizeNumberValue(value);
  if (parsed === null) return EMPTY_TEXT;
  return `${parsed.toFixed(digits)}%`;
};

const formatDateTime = (value) => {
  const timestamp = normalizeDateValue(value);
  if (timestamp === null) return EMPTY_TEXT;

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
};

export {
  EMPTY_TEXT,
  formatCount,
  formatDateTime,
  formatNumber,
  formatPercent,
  formatScore,
  formatSeconds,
  isEmptyValue,
  normalizeDateValue,
  normalizeNumberValue,
  sortRows,
};
