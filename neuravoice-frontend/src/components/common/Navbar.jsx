import { useNavigate, useLocation } from "react-router-dom";
import { LogoIcon } from "./Logo";
import { Plus } from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const active = location.pathname.replace("/", "") || "dashboard";

  return (
    <nav className="shared-nav">
      <a href="/dashboard" className="nav-logo">
        <div className="nav-logo-box">
          <LogoIcon size={18} color="#ffffff" />
        </div>
        <span className="nav-logo-name">Neura Voice</span>
      </a>
      <div className="nav-links">
        {["dashboard", "session", "brain", "ar-report"].map((p) => (
          <button
            key={p}
            className={`nav-link ${active === p ? "active" : ""}`}
            onClick={() => navigate(`/${p}`)}
          >
            {p === "ar-report" ? "AR Report" : p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>
      <div className="nav-right">
        <button className="nav-session-btn" onClick={() => navigate("/session")} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <Plus size={15} strokeWidth={2.5} /> Start session
        </button>
        <div className="nav-avatar">YS</div>
      </div>
    </nav>
  );
};

export default Navbar;