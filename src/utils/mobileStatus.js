import {
  formatLaunchStageLabel,
  formatSaleStageLabel,
  formatStoreStageLabel,
  getSmartphoneLifecycle,
  isUpcomingLaunchStage,
} from "./smartphoneLifecycle";

const firstText = (...values) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
};

const collectStatusText = (mobile) => {
  const raw = mobile?.raw || {};
  const parts = [
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

const getMobileLifecycleState = (mobile) => {
  const raw = mobile?.raw || {};

  return getSmartphoneLifecycle({
    launchDate: firstText(
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
    ),
    launchStatus: firstText(
      raw.launch_stage,
      raw.launchStage,
      raw.launch_status,
      raw.launchStatus,
      mobile?.launch_stage,
      mobile?.launchStage,
      mobile?.launch_status,
      mobile?.launchStatus,
    ),
    saleStage: firstText(
      raw.sale_stage,
      raw.saleStage,
      raw.sale_status,
      raw.saleStatus,
      mobile?.sale_stage,
      mobile?.saleStage,
      mobile?.sale_status,
      mobile?.saleStatus,
    ),
    storeStage: firstText(
      raw.store_stage,
      raw.storeStage,
      mobile?.store_stage,
      mobile?.storeStage,
    ),
    saleStartDate: firstText(
      raw.sale_start_date,
      raw.saleStartDate,
      raw.sale_date,
      raw.saleDate,
      mobile?.sale_start_date,
      mobile?.saleStartDate,
      mobile?.sale_date,
      mobile?.saleDate,
    ),
    officialPreorderUrl: firstText(
      raw.official_preorder_url,
      raw.officialPreorderUrl,
      mobile?.official_preorder_url,
      mobile?.officialPreorderUrl,
    ),
    statusText: collectStatusText(mobile),
    variants: Array.isArray(mobile?.variants) ? mobile.variants : [],
    additionalStoreRows: Array.isArray(raw?.store_prices)
      ? raw.store_prices
      : Array.isArray(raw?.storePrices)
        ? raw.storePrices
        : [],
  });
};

const isUpcomingOrPreorder = (mobile) => {
  const lifecycle = getMobileLifecycleState(mobile);
  if (isUpcomingLaunchStage(lifecycle.launchStage)) return true;
  if (["preorder", "sale_scheduled"].includes(lifecycle.saleStage)) {
    return true;
  }
  if (
    lifecycle.launchStage === "released" &&
    ["sale_tbd", "store_pending"].includes(lifecycle.saleStage) &&
    lifecycle.storeStage !== "live"
  ) {
    return true;
  }
  return false;
};

export {
  formatLaunchStageLabel,
  formatSaleStageLabel,
  formatStoreStageLabel,
  getMobileLifecycleState,
  isUpcomingOrPreorder,
};
