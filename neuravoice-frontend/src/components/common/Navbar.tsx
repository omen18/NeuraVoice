import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LogoIcon } from "./Logo";
import { Plus, LayoutDashboard, Mic, Brain, Sparkles, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "session", label: "Session", icon: Mic },
  { key: "brain", label: "Neural 3D", icon: Brain },
  { key: "ar-report", label: "Clinical Report", icon: Sparkles },
];

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const active = location.pathname.replace("/", "") || "dashboard";

  const getInitials = (name?: string): string => {
    if (!name) return "NV";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <nav className="shared-nav">
      <div
        className="nav-logo"
        onClick={() => navigate("/dashboard")}
        style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "10px" }}
      >
        <div className="nav-logo-box">
          <LogoIcon size={18} color="#ffffff" />
        </div>
        <span className="nav-logo-name" style={{ fontWeight: 700, letterSpacing: "-0.01em" }}>
          Neura Voice
        </span>
      </div>

      <div className="nav-links">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`nav-link ${active === key ? "active" : ""}`}
            onClick={() => navigate(`/${key}`)}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Icon size={15} strokeWidth={2} opacity={active === key ? 1 : 0.75} />
            {label}
          </button>
        ))}
      </div>

      <div className="nav-right" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          className="nav-session-btn"
          onClick={() => navigate("/session")}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>Start Session</span>
        </button>

        <div
          className="nav-avatar"
          title={`${user?.name || "User"} (${user?.email || ""})`}
          style={{
            cursor: "pointer",
            fontWeight: 700,
            userSelect: "none",
          }}
          onClick={() => {
            if (window.confirm("Do you want to log out of Neura Voice?")) {
              logout();
              navigate("/auth");
            }
          }}
        >
          {getInitials(user?.name)}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
