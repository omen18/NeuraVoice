import React from "react";

interface LogoIconProps {
  size?: number;
  color?: string;
  className?: string;
}

export const LogoIcon: React.FC<LogoIconProps> = ({
  size = 20,
  color = "currentColor",
  className = "",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ display: "inline-block", verticalAlign: "middle" }}
  >
    <defs>
      <linearGradient id="neuraVoiceGlow" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#E0D7FE" />
      </linearGradient>
    </defs>
    {/* Acoustic voice frequencies with neural synaptic end-nodes */}
    <line x1="5" y1="16" x2="7.5" y2="16" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    <line x1="10" y1="11" x2="10" y2="21" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    <line x1="14.5" y1="7" x2="14.5" y2="25" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    <line x1="19" y1="4.5" x2="19" y2="27.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    <line x1="23.5" y1="9" x2="23.5" y2="23" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    <line x1="28" y1="13" x2="28" y2="19" stroke={color} strokeWidth="2.2" strokeLinecap="round" />

    {/* Synaptic nodes (Brain intelligence connection points) */}
    <circle cx="19" cy="4.5" r="2.2" fill={color} />
    <circle cx="14.5" cy="25" r="2" fill={color} />
    <circle cx="23.5" cy="9" r="2" fill={color} />
    <circle cx="10" cy="21" r="1.8" fill={color} />

    {/* Neural impulse arch linking cognitive centers */}
    <path
      d="M10 11C13 8 16 6 19 4.5M14.5 25C17 25 21 24 23.5 23"
      stroke={color}
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeDasharray="1.5 2"
      opacity="0.65"
    />
  </svg>
);

interface LogoBrandProps {
  size?: number;
  showBadge?: boolean;
  onClick?: () => void;
  className?: string;
}

export const LogoBrand: React.FC<LogoBrandProps> = ({
  size = 20,
  showBadge = true,
  onClick,
  className = "",
}) => (
  <div
    className={`nav-logo ${className}`}
    onClick={onClick}
    style={{
      cursor: onClick ? "pointer" : "default",
      display: "inline-flex",
      alignItems: "center",
      gap: "10px",
      userSelect: "none",
    }}
  >
    <div
      className="nav-logo-box"
      style={{
        width: "34px",
        height: "34px",
        borderRadius: "10px",
        background: "linear-gradient(135deg, #A88BFA 0%, #7C3AED 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 10px rgba(124, 58, 237, 0.28)",
        color: "#ffffff",
        transition: "transform 0.2s ease",
      }}
    >
      <LogoIcon size={size} color="#ffffff" />
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <span className="nav-logo-name" style={{ letterSpacing: "-0.01em", fontWeight: 700 }}>
        Neura Voice
      </span>
      {showBadge && (
        <span
          style={{
            fontSize: "10px",
            fontWeight: "600",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            padding: "2px 6px",
            borderRadius: "6px",
            background: "rgba(124, 58, 237, 0.12)",
            color: "#7C3AED",
            border: "1px solid rgba(124, 58, 237, 0.2)",
          }}
        >
          AI
        </span>
      )}
    </div>
  </div>
);

export default LogoIcon;
