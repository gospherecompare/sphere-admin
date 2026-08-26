import React, { useId } from "react";

export default function MobileXLogo({
  className,
  title = "MobileX",
  "aria-label": ariaLabel = "MobileX",
  showText = true,
  darkBackground = true,
}) {
  const reactId = useId();
  const titleId = `mobilex-logo-title-${reactId.replace(/:/g, "")}`;
  const primaryColor = darkBackground ? "#FFFFFF" : "#111318";

  return (
    <svg
      className={className}
      viewBox="0 0 874 420"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={ariaLabel}
      aria-labelledby={title ? titleId : undefined}
    >
      {title ? <title id={titleId}>{title}</title> : null}
      <path fill={primaryColor} d="M0 419h99l2-277 187 185 183-182-71-70-112 110L101 0H0z" />
      <path fill={primaryColor} d="M365 0l203 202-211 217h119l213-217L488 0z" />
      <path fill="#2563EB" d="M868 0H746L639 117l61 62z" />
      <path fill="#2563EB" d="M631 298l115 122h128L694 235z" />
    </svg>
  );
}
