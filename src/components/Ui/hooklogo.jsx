import React, { useId } from "react";

export default function HookLogo({
  className,
  title = "Hook",
  "aria-label": ariaLabel = "Hook",
}) {
  const reactId = useId();
  const gradientId = `device-gradient-${reactId.replace(/:/g, "")}`;

  return (
    <svg
      viewBox="0 0 420 120"
      preserveAspectRatio="xMinYMid meet"
      role="img"
      aria-label={ariaLabel}
      className={className}
    >
      {title ? <title>{title}</title> : null}

      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>

      <rect
        x="20"
        y="30"
        width="28"
        height="60"
        rx="8"
        stroke={`url(#${gradientId})`}
        strokeWidth="4"
        fill="none"
      />
      <rect
        x="60"
        y="30"
        width="28"
        height="60"
        rx="8"
        stroke={`url(#${gradientId})`}
        strokeWidth="4"
        fill="none"
      />

      <text
        x="110"
        y="78"
        fontFamily="Inter, Poppins, Arial, sans-serif"
        fontSize="48"
        fontWeight="800"
        fill="#111"
      >
        Hook
      </text>
    </svg>
  );
}
