const BLOG_DATE_TIME_PATTERN =
  /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?(?:Z)?$/i;

export const parseBlogPublishedAt = (value) => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value !== "string" || !value.trim()) return null;

  const raw = value.trim();
  const wallClock = raw.match(BLOG_DATE_TIME_PATTERN);
  const date = wallClock
    ? new Date(`${wallClock[1]}T${wallClock[2]}`)
    : new Date(raw);

  return Number.isNaN(date.getTime()) ? null : date;
};

export const toBlogDateTimeLocalValue = (value) => {
  const date = parseBlogPublishedAt(value);
  if (!date) return "";

  const pad = (num) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const isBlogPublishedAtInFuture = (value, now = new Date()) => {
  const date = parseBlogPublishedAt(value);
  return date !== null && date.getTime() > now.getTime();
};
