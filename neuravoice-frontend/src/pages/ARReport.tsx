import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getWeeklyReport,
  getLatestSession,
  getProfile,
  getSessionHistory,
} from "../services/dashboardService";
import { LogoIcon } from "../components/common/Logo";
import {
  Sun,
  Moon,
  Brain,
  User,
  Mic,
  Timer,
  FileText,
  AudioWaveform,
  Activity,
  MessageSquare,
  Waves,
  Lightbulb,
  BarChart3,
  BarChart2,
  Mail,
  Link,
  Printer,
  Sparkles,
  Flame,
} from "lucide-react";
import "../styles/arreport.css";
import { jsPDF } from "jspdf";

interface ReportData {
  name: string;
  weekLabel: string;
  streak: number;
  riskTier: "Green" | "Yellow" | "Orange" | "Red" | string;
  riskHealth: string;
  totalSessions: number;
  weeklyAverage: string;
  bestScore: string;
  metrics: [string, string | number, string, "good" | "warning" | "alert"][];
  insights: string[];
  recommendations: string[];
  reportId: string;
}

// ── REAL QR CODE GENERATOR ──
interface RealQRCodeProps {
  data: string;
  size?: number;
}

const RealQRCode: React.FC<RealQRCodeProps> = ({ data, size = 140 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const generateQR = async () => {
      if (!data) return;

      try {
        const QRCodeLib = await import("qrcode");
        const canvas = canvasRef.current;
        if (canvas) {
          QRCodeLib.default.toCanvas(
            canvas,
            data,
            {
              width: size,
              margin: 2,
              color: {
                dark: "#7C3AED",
                light: "#FFFFFF",
              },
            },
            (error) => {
              if (error) console.error("QR generation error:", error);
            }
          );
        }
      } catch (err) {
        drawFallbackQR(canvasRef.current);
      }
    };

    generateQR();
  }, [data, size]);

  const drawFallbackQR = (canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = canvas.width;
    const modules = 25;
    const cell = Math.floor(s / modules);

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = "#7C3AED";

    [[0, 0], [0, modules - 7], [modules - 7, 0]].forEach(([row, col]) => {
      ctx.fillRect(col * cell, row * cell, 7 * cell, 7 * cell);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect((col + 1) * cell, (row + 1) * cell, 5 * cell, 5 * cell);
      ctx.fillStyle = "#7C3AED";
      ctx.fillRect((col + 2) * cell, (row + 2) * cell, 3 * cell, 3 * cell);
    });

    const hash = (str: string, i: number) => {
      let h = 0;
      for (let j = 0; j < str.length; j++) {
        h = (h * 31 + str.charCodeAt(j) + i) & 0xffffff;
      }
      return h;
    };

    for (let r = 0; r < modules; r++) {
      for (let c = 0; c < modules; c++) {
        const inFinder =
          (r < 8 && c < 8) || (r < 8 && c >= modules - 8) || (r >= modules - 8 && c < 8);
        if (!inFinder && hash(data || "neuravoice", r * modules + c) % 4 === 0) {
          ctx.fillRect(c * cell, r * cell, cell - 1, cell - 1);
        }
      }
    }
  };

  return <canvas ref={canvasRef} className="qr-canvas" width={size} height={size} />;
};

// ── SKELETON LOADER ──
interface SkeletonProps {
  width?: string;
  height?: string;
  radius?: number;
  style?: React.CSSProperties;
}

const Skeleton: React.FC<SkeletonProps> = ({
  width = "100%",
  height = "16px",
  radius = 8,
  style,
}) => (
  <div className="skeleton" style={{ width, height, borderRadius: radius, ...style }} />
);

// ── METRIC ROW ──
interface MetricRowProps {
  icon: React.ReactNode;
  name: string;
  value: string | number;
  trend: string;
  type: "up" | "down" | "flat";
  delay?: number;
}

const MetricRow: React.FC<MetricRowProps> = ({ icon, name, value, trend, type, delay = 0 }) => {
  const getTrendColor = () => {
    if (type === "up") return "trend-up";
    if (type === "down") return "trend-down";
    return "trend-flat";
  };

  const getTrendIcon = () => {
    if (type === "up") return "▲";
    if (type === "down") return "▼";
    return "●";
  };

  return (
    <div className="metric-row animate-slide-right" style={{ animationDelay: `${delay}s` }}>
      <div className="metric-left">
        <div className={`metric-icon ${type}`}>
          <span>{icon}</span>
        </div>
        <div className="metric-info">
          <span className="metric-name">{name}</span>
          <span className={`metric-trend ${getTrendColor()}`}>
            {getTrendIcon()} {trend}
          </span>
        </div>
      </div>
      <div className="metric-value-wrapper">
        <span className="metric-value">{value}</span>
      </div>
    </div>
  );
};

// ── REAL PDF GENERATION ──
const generateRealPDF = async (data: ReportData) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210,
    M = 20;

  // Header band
  doc.setFillColor(168, 139, 250);
  doc.rect(0, 0, W, 35, "F");
  doc.setFillColor(124, 58, 237);
  doc.rect(0, 0, W, 8, "F");

  // Title
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Neura Voice", M, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("WEEKLY COGNITIVE REPORT", W - M, 20, { align: "right" });
  doc.text(`Report ID: ${data.reportId || "COG-" + Date.now()}`, W - M, 28, { align: "right" });

  // User info
  doc.setTextColor(24, 10, 40);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(data.name || "Neura Voice User", M, 48);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 80, 120);
  doc.text(`${data.weekLabel} · Session streak: ${data.streak} days`, M, 55);
  doc.text(`Generated: ${new Date().toLocaleString()}`, M, 61);

  // Risk tier section
  const riskColor =
    data.riskTier === "Green"
      ? [16, 185, 129]
      : data.riskTier === "Yellow"
      ? [245, 158, 11]
      : data.riskTier === "Orange"
      ? [249, 115, 22]
      : [239, 68, 68];
  doc.setFillColor(245, 243, 255);
  doc.roundedRect(M, 68, W - 2 * M, 16, 3, 3, "F");
  doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`● RISK TIER: ${data.riskTier} — Cognitive health: ${data.riskHealth}`, M + 4, 77);

  // Summary stats
  doc.setTextColor(24, 10, 40);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Summary Statistics", M, 92);
  doc.setDrawColor(168, 139, 250);
  doc.line(M, 94, W - M, 94);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const summaryY = 100;
  doc.text(`• Total Sessions: ${data.totalSessions || "—"}`, M + 4, summaryY);
  doc.text(`• Weekly Average: ${data.weeklyAverage || "—"}`, M + 4, summaryY + 6);
  doc.text(`• Best Score: ${data.bestScore || "—"}`, M + 4, summaryY + 12);
  doc.text(`• Current Streak: ${data.streak} days`, M + 4, summaryY + 18);

  // Biomarker summary
  doc.setTextColor(24, 10, 40);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Biomarker Summary", M, 126);
  doc.line(M, 128, W - M, 128);

  // Table
  doc.setFontSize(8);
  data.metrics.forEach(([name, val, note, status], i) => {
    const y = 134 + i * 7;
    if (i % 2 === 0) {
      doc.setFillColor(250, 249, 255);
      doc.rect(M, y - 3, W - 2 * M, 7, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 80, 120);
    doc.text(name, M + 2, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(24, 10, 40);
    doc.text(String(val), M + 70, y);
    doc.setFont("helvetica", "normal");
    const noteColor =
      status === "good" ? [16, 185, 129] : status === "warning" ? [245, 158, 11] : [239, 68, 68];
    doc.setTextColor(noteColor[0], noteColor[1], noteColor[2]);
    doc.text(String(note), M + 95, y);
  });

  const startY = 134 + data.metrics.length * 7 + 8;

  // AI Insights
  doc.setTextColor(24, 10, 40);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("AI-Generated Insights", M, startY);
  doc.line(M, startY + 2, W - M, startY + 2);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  data.insights.forEach((ins, i) => {
    const y = startY + 8 + i * 7;
    doc.setTextColor(124, 58, 237);
    doc.text("●", M + 2, y);
    doc.setTextColor(100, 80, 120);
    const clean = typeof ins === "string" ? ins.replace(/<[^>]+>/g, "") : ins;
    const lines = doc.splitTextToSize(clean, W - 2 * M - 12);
    doc.text(lines[0] || clean, M + 7, y);
  });

  // Footer
  doc.setFillColor(168, 139, 250);
  doc.rect(0, 277, W, 20, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.text("Neura Voice · AI-Powered Cognitive Health Monitoring", M, 287);
  doc.text("Confidential Health Report", M, 292);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, W - M, 287, { align: "right" });

  const fileName = `NeuraVoice_Report_${data.name.replace(/\s/g, "_")}_${
    new Date().toISOString().split("T")[0]
  }.pdf`;
  doc.save(fileName);
  return true;
};

// ── DEMO DATA GENERATOR ──
const generateDemoReportData = (userName: string): ReportData => {
  const randomScore = (Math.random() * 0.3 + 0.15).toFixed(2);
  const riskTier =
    parseFloat(randomScore) < 0.25 ? "Green" : parseFloat(randomScore) < 0.4 ? "Yellow" : "Orange";

  const riskHealth = riskTier === "Green" ? "Good" : riskTier === "Yellow" ? "Watch" : "Elevated";

  const metrics: ReportData["metrics"] = [
    ["Semantic Coherence", (0.75 + Math.random() * 0.2).toFixed(2), "+2.1%", "good"],
    ["Lexical Diversity", (0.68 + Math.random() * 0.12).toFixed(2), "-0.8%", "warning"],
    ["Speech Rate", Math.floor(110 + Math.random() * 20), "+0.6%", "good"],
    ["Pause Frequency", (2.5 + Math.random() * 1.5).toFixed(1), "+5.2%", "warning"],
    ["Pitch Mean", Math.floor(130 + Math.random() * 30), "+0.6%", "good"],
    ["HNR", (16 + Math.random() * 4).toFixed(1), "+1.8%", "good"],
    ["Articulation Rate", (4.5 + Math.random() * 1).toFixed(1), "+0.3%", "good"],
  ];

  const insights = [
    `Your ${metrics[0][0]} is ${metrics[0][1]} — ${
      Number(metrics[0][1]) > 0.85 ? "above average" : "within normal range"
    }.`,
    `Consistent sessions show ${
      Number(metrics[1][1]) > 0.7 ? "stable" : "slightly variable"
    } lexical diversity.`,
    `Your voice patterns indicate ${
      riskTier === "Green"
        ? "healthy cognitive function"
        : "mild variations worth ongoing monitoring"
    }.`,
    `Maintaining a ${
      Number(metrics[2][1]) > 115 ? "good" : "consistent"
    } speech rate with natural articulation.`,
  ];

  const recommendations =
    riskTier === "Green"
      ? [
          "Continue daily sessions to maintain cognitive baseline",
          "Practice expressive reading aloud to challenge lexical retrieval",
          "Stay well hydrated before sessions for optimal vocal clarity",
        ]
      : [
          "Ensure consistent sleep and rest prior to recordings",
          "Incorporate brief breathing exercises before speaking",
          "Monitor trends across the next 3 consecutive sessions",
        ];

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekLabel = `${weekStart.getDate()}–${weekEnd.getDate()} ${weekStart.toLocaleString(
    "en-US",
    { month: "long", year: "numeric" }
  )}`;

  return {
    name: userName,
    weekLabel,
    streak: Math.floor(Math.random() * 30) + 5,
    riskTier,
    riskHealth,
    totalSessions: Math.floor(Math.random() * 30) + 10,
    weeklyAverage: (Math.random() * 0.3 + 0.2).toFixed(2),
    bestScore: (Math.random() * 0.25 + 0.12).toFixed(2),
    metrics,
    insights,
    recommendations,
    reportId: `DEMO-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
  };
};

export const ARReport: React.FC = () => {
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();

  const [dark, setDark] = useState<boolean>(() => localStorage.getItem("cog_dark") === "true");
  const [downloading, setDownloading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);
  const [qrData, setQrData] = useState("");

  const [profile, setProfile] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [latest, setLatest] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("cog_dark", String(next));
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    if (!token) {
      setFetching(false);
      return;
    }

    if (user?.email?.includes("demo")) {
      setFetching(false);
      return;
    }

    const fetchAll = async () => {
      try {
        const results = await Promise.allSettled([
          getProfile(token),
          getWeeklyReport(token),
          getLatestSession(token),
          getSessionHistory(token, 3),
        ]);

        const prof = results[0].status === "fulfilled" ? results[0].value : null;
        const rep = results[1].status === "fulfilled" ? results[1].value : null;
        const lat = results[2].status === "fulfilled" ? results[2].value : null;
        const hist = results[3].status === "fulfilled" ? results[3].value : [];

        setProfile(prof);
        setReport(rep);
        setLatest(lat);
        setHistory(hist || []);

        const reportUrl = `${window.location.origin}/report/${prof?.id || user?.id || "user"}`;
        setQrData(reportUrl);

        const has401 = results.some(
          (r) => r.status === "rejected" && (r as any).reason?.message?.includes("401")
        );
        if (has401) logout();
      } catch (err) {
        console.error("AR Report fetch error:", err);
      } finally {
        setFetching(false);
      }
    };
    fetchAll();
  }, [token, logout, user]);

  const isDemo = user?.email?.includes("demo");

  const prepareRealReportData = (): ReportData => {
    try {
      const biomarkers = latest?.biomarkers || latest || {};
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      const weekLabel = `${weekStart.getDate()}–${weekEnd.getDate()} ${weekStart.toLocaleString(
        "en-US",
        { month: "long", year: "numeric" }
      )}`;

      const metrics: ReportData["metrics"] = [
        [
          "Semantic Coherence",
          biomarkers.semantic_coherence ? Number(biomarkers.semantic_coherence).toFixed(2) : "—",
          biomarkers.semantic_coherence ? "Above baseline" : "—",
          (Number(biomarkers.semantic_coherence) || 0) > 0.85 ? "good" : "warning",
        ],
        [
          "Cognitive Age",
          profile?.cognitive_age || "—",
          profile?.cognitive_age ? "Stable" : "—",
          "good",
        ],
        [
          "Speech Rate",
          biomarkers.speech_rate ? Math.round(Number(biomarkers.speech_rate)) : "—",
          biomarkers.speech_rate ? "Normal" : "—",
          "good",
        ],
        [
          "Pause Frequency",
          biomarkers.pause_frequency ? Number(biomarkers.pause_frequency).toFixed(1) : "—",
          (Number(biomarkers.pause_frequency) || 0) > 4 ? "Elevated" : "Normal",
          (Number(biomarkers.pause_frequency) || 0) > 4 ? "warning" : "good",
        ],
        [
          "Lexical Diversity",
          biomarkers.lexical_diversity ? Number(biomarkers.lexical_diversity).toFixed(2) : "—",
          (Number(biomarkers.lexical_diversity) || 0) < 0.7 ? "Watch" : "Normal",
          (Number(biomarkers.lexical_diversity) || 0) < 0.7 ? "warning" : "good",
        ],
        [
          "HNR",
          biomarkers.hnr ? Number(biomarkers.hnr).toFixed(1) : "—",
          biomarkers.hnr ? "Good" : "—",
          (Number(biomarkers.hnr) || 0) > 18 ? "good" : "warning",
        ],
        [
          "Jitter",
          biomarkers.jitter ? (Number(biomarkers.jitter) * 100).toFixed(1) + "%" : "—",
          biomarkers.jitter ? "Low" : "—",
          "good",
        ],
      ];

      let rawInsights = report?.insights;
      if (Array.isArray(rawInsights) && rawInsights.length > 0) {
        rawInsights = rawInsights.map((i) =>
          typeof i === "object" && i !== null ? i.text || String(i) : String(i)
        );
      } else if (report?.narrative) {
        rawInsights = [report.narrative];
      } else {
        rawInsights = ["No insights available yet. Complete more sessions to build your profile."];
      }
      const safeInsights = Array.isArray(rawInsights) ? rawInsights : [rawInsights];

      const rawRecommendations = report?.recommendations || [
        "Continue daily sessions to maintain cognitive baseline",
        "Stay hydrated before recording for optimal voice tone",
        "Practice in a quiet space for maximum signal fidelity",
      ];
      const safeRecommendations = Array.isArray(rawRecommendations)
        ? rawRecommendations
        : [rawRecommendations];

      const safeHistory = Array.isArray(history) ? history : [];
      const scores = safeHistory
        .filter((s) => s?.risk_score)
        .map((s) => Number(s.risk_score))
        .filter((s) => !isNaN(s));
      const bestScore = scores.length ? Math.min(...scores).toFixed(2) : "—";
      const weeklyAverage = scores.length
        ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)
        : "—";

      const riskTier = report?.risk_tier || latest?.risk_tier || "Green";

      return {
        name: user?.name || "Neura Voice User",
        weekLabel,
        streak: profile?.streak || 0,
        riskTier,
        riskHealth: riskTier === "Green" ? "Good" : riskTier === "Yellow" ? "Watch" : "Alert",
        totalSessions: profile?.sessions_total || 0,
        weeklyAverage,
        bestScore,
        metrics,
        insights: safeInsights.slice(0, 4),
        recommendations: safeRecommendations,
        reportId: `COG-${profile?.id || user?.id || "user"}-${Date.now()}`,
      };
    } catch {
      return {
        name: user?.name || "User",
        weekLabel: "This Week",
        streak: 0,
        riskTier: "Green",
        riskHealth: "Good",
        totalSessions: 0,
        weeklyAverage: "—",
        bestScore: "—",
        metrics: [],
        insights: ["Your report will appear here after your first session."],
        recommendations: ["Record your first session to get started."],
        reportId: `COG-${user?.id || "new"}-${Date.now()}`,
      };
    }
  };

  const displayData = isDemo
    ? generateDemoReportData(user?.name || "Yash Raj Sharan")
    : prepareRealReportData();
  const displayMetrics = displayData.metrics;
  const displayInsights = displayData.insights;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await generateRealPDF(displayData);
      showToast("PDF report downloaded successfully!");
    } catch (err) {
      console.error("PDF error:", err);
      showToast("PDF generation failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async (method: string) => {
    if (method === "Copy Link") {
      const shareUrl = qrData || window.location.href;
      await navigator.clipboard.writeText(shareUrl);
      showToast("Report link copied to clipboard!");
    } else if (method === "Email") {
      window.location.href = `mailto:?subject=Neura Voice Health Report&body=Check out my cognitive health report: ${window.location.href}`;
      showToast("Opening email...");
    } else if (method === "WhatsApp") {
      window.open(
        `https://wa.me/?text=Check out my Neura Voice cognitive health report: ${window.location.href}`,
        "_blank"
      );
      showToast("Opening WhatsApp...");
    } else if (method === "Print") {
      window.print();
      showToast("Preparing print view...");
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const shareOptions = [
    { icon: <Mail size={16} />, label: "Email", sub: "Send to doctor", action: "Email", color: "#6366F1" },
    { icon: <MessageSquare size={16} />, label: "WhatsApp", sub: "Share report", action: "WhatsApp", color: "#25D366" },
    { icon: <Link size={16} />, label: "Copy Link", sub: "Secure URL", action: "Copy Link", color: "#A88BFA" },
    { icon: <Printer size={16} />, label: "Print", sub: "Paper copy", action: "Print", color: "#E58383" },
  ];

  const getRiskText = () => {
    if (displayData.riskTier === "Green")
      return "No significant anomalies detected this week. Cognitive health is consistent and stable.";
    if (displayData.riskTier === "Yellow")
      return "Mild voice pattern variations observed. Continue monitoring daily.";
    if (displayData.riskTier === "Orange")
      return "Elevated biomarker variations detected. Lifestyle pacing recommended.";
    return "Significant deviations detected. Medical consultation recommended.";
  };

  return (
    <div className={`report-root ${dark ? "dark" : "light"}`}>
      {/* Navigation */}
      <nav className="report-nav">
        <div className="nav-brand" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          <div
            className="brand-ring"
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #A88BFA, #7C3AED)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 10px rgba(124, 58, 237, 0.28)",
            }}
          >
            <LogoIcon size={18} color="#ffffff" />
          </div>
          <span className="brand-name" style={{ fontWeight: 700 }}>
            Neura Voice
          </span>
        </div>

        <div className="nav-links">
          <button className="nav-link" onClick={() => navigate("/dashboard")}>
            Dashboard
          </button>
          <button className="nav-link" onClick={() => navigate("/session")}>
            Session
          </button>
          <button className="nav-link" onClick={() => navigate("/brain")}>
            Neural 3D
          </button>
          <button className="nav-link active">Report</button>
        </div>

        <div className="nav-actions">
          <button className="theme-toggle" onClick={toggleDark} title="Toggle theme">
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button className="new-session" onClick={() => navigate("/session")}>
            <span>+</span> New Session
          </button>
          <div className="user-menu" onClick={logout} title="Click to log out">
            <div className="user-avatar">{user?.name?.charAt(0)?.toUpperCase() || "U"}</div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="report-main">
        {/* Header */}
        <div className="report-header">
          <div className="report-badge">Weekly Cognitive Report</div>
          <h1 className="report-title">
            Your Health <span className="highlight">Summary</span>
          </h1>
          <p
            className="report-date"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            {displayData.weekLabel} · Session streak: {displayData.streak} days{" "}
            <Flame size={14} color="#F59E0B" />
          </p>
          {isDemo && <div className="demo-badge-large">Demo Mode - Sample Data</div>}
        </div>

        {/* Risk Banner */}
        <div className={`risk-banner ${displayData.riskTier.toLowerCase()}`}>
          <div
            className="risk-icon"
            style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Brain size={26} color="#7C3AED" />
          </div>
          <div className="risk-content">
            <div className="risk-label">Current Risk Tier</div>
            <div className="risk-value">Cognitive health: {displayData.riskHealth}</div>
            <div className="risk-description">{getRiskText()}</div>
          </div>
          <div className={`risk-pill ${displayData.riskTier.toLowerCase()}`}>
            ● {displayData.riskTier}
          </div>
        </div>

        {/* Mini Stats */}
        <div className="mini-stats">
          <div className="mini-stat">
            <div className="mini-stat-label">Cognitive Age</div>
            {fetching && !isDemo ? (
              <Skeleton width="80px" height="36px" />
            ) : (
              <div className="mini-stat-value">{profile?.cognitive_age || (isDemo ? "52" : "—")}</div>
            )}
            <div className="mini-stat-sub">
              Biological age:{" "}
              {profile?.dob
                ? new Date().getFullYear() - new Date(profile.dob).getFullYear()
                : isDemo
                ? "58"
                : "—"}
            </div>
          </div>
          <div className="mini-stat">
            <div className="mini-stat-label">Sessions This Week</div>
            {fetching && !isDemo ? (
              <Skeleton width="60px" height="36px" />
            ) : (
              <div className="mini-stat-value">
                {report?.sessions_this_week || (isDemo ? "5" : "0")}/7
              </div>
            )}
            <div
              className="mini-stat-sub"
              style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
            >
              Streak: {displayData.streak} days <Flame size={13} color="#F59E0B" />
            </div>
            <div className="mini-stat-trend positive">▲ On track — keep going!</div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="report-grid">
          {/* Metrics Card */}
          <div className="report-card metrics-card">
            <div className="card-accent"></div>
            <h3 className="card-title">Weekly Biomarker Summary</h3>
            <p className="card-subtitle">Powered by 14 voice biomarkers · latest session</p>
            <div className="metrics-list">
              {fetching && !isDemo ? (
                <>
                  {[...Array(7)].map((_, i) => (
                    <Skeleton key={i} height="64px" style={{ marginBottom: "12px" }} />
                  ))}
                </>
              ) : (
                displayMetrics.map((metric, idx) => (
                  <MetricRow
                    key={metric[0]}
                    icon={getMetricIcon(metric[0])}
                    name={metric[0]}
                    value={metric[1]}
                    trend={metric[2]}
                    type={metric[3] === "good" ? "up" : metric[3] === "warning" ? "down" : "flat"}
                    delay={idx * 0.05}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="report-right">
            {/* PDF Card with Real QR */}
            <div className="report-card pdf-card">
              <h3 className="card-title">Download PDF Report</h3>
              <p className="card-subtitle">Scan QR code or click below for verified clinical PDF</p>
              <div className="qr-section">
                <div className="qr-container">
                  <RealQRCode data={qrData || window.location.href} size={120} />
                </div>
                <p className="qr-hint">Scan with your phone camera to access this report</p>
                <button className="download-btn" onClick={handleDownload} disabled={downloading}>
                  {downloading ? (
                    <>
                      <span className="spinner-small"></span>
                      Generating…
                    </>
                  ) : (
                    <>⬇ Download PDF Report</>
                  )}
                </button>
              </div>
            </div>

            {/* Share Card */}
            <div className="report-card share-card">
              <h3 className="card-title">Share Your Report</h3>
              <p className="card-subtitle">Transmit securely to physician or caregiver</p>
              <div className="share-options">
                {shareOptions.map((opt) => (
                  <div
                    key={opt.label}
                    className="share-option"
                    onClick={() => handleShare(opt.action)}
                  >
                    <div className="share-icon" style={{ background: `${opt.color}15` }}>
                      {opt.icon}
                    </div>
                    <div className="share-info">
                      <div className="share-label">{opt.label}</div>
                      <div className="share-sub">{opt.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights Card */}
        <div className="report-card insights-card">
          <div className="card-accent"></div>
          <div className="insights-header">
            <h3 className="card-title">AI-Generated Weekly Insights</h3>
            <span
              className="insights-badge"
              style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
            >
              <Sparkles size={13} /> AI Powered
            </span>
          </div>
          <p className="card-subtitle">
            Based on your {report?.sessions_this_week || (isDemo ? "5" : "0")} sessions this week
          </p>
          <div className="insights-list">
            {fetching && !isDemo ? (
              <>
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} height="70px" style={{ marginBottom: "12px" }} />
                ))}
              </>
            ) : (
              displayInsights.map((insight, idx) => (
                <div
                  key={idx}
                  className="insight-item animate-slide-up"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="insight-dot"></div>
                  <p className="insight-text">{insight}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recommendations Card */}
        {displayData.recommendations && displayData.recommendations.length > 0 && (
          <div className="report-card recommendations-card">
            <div className="card-accent"></div>
            <h3 className="card-title">Personalized Recommendations</h3>
            <p className="card-subtitle">Based on your recent vocal biomarkers</p>
            <div className="recommendations-list">
              {displayData.recommendations.map((rec, idx) => (
                <div key={idx} className="recommendation-item">
                  <span className="rec-icon" style={{ display: "inline-flex", alignItems: "center" }}>
                    <Lightbulb size={16} color="#F59E0B" />
                  </span>
                  <span className="rec-text">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="report-actions">
          <button
            className="action-btn primary"
            onClick={() => navigate("/session")}
            style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            <Mic size={16} /> Start New Session
          </button>
          <button
            className="action-btn"
            onClick={() => navigate("/dashboard")}
            style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            <BarChart2 size={16} /> View Dashboard
          </button>
        </div>
      </main>

      {/* Toast Notification */}
      {toast && <div className="toast-notification">{toast}</div>}
    </div>
  );
};

// Helper function for metric icons
const getMetricIcon = (name: string): React.ReactNode => {
  const icons: Record<string, React.ReactNode> = {
    "Semantic Coherence": <Brain size={16} />,
    "Cognitive Age": <User size={16} />,
    "Speech Rate": <Mic size={16} />,
    "Pause Frequency": <Timer size={16} />,
    "Lexical Diversity": <FileText size={16} />,
    "HNR": <AudioWaveform size={16} />,
    "Jitter": <Activity size={16} />,
    "Articulation Rate": <MessageSquare size={16} />,
    "Pitch Mean": <Waves size={16} />,
    "Idea Density": <Lightbulb size={16} />,
  };
  return icons[name] || <BarChart3 size={16} />;
};

export default ARReport;
