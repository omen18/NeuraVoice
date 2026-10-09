import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#030F0A",
          color: "#6EE7B7",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: "14px",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            border: "2px solid rgba(110,231,183,0.3)",
            borderTopColor: "#6EE7B7",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <span>Initializing Neura Voice Neural Core…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isLoggedIn) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

export default ProtectedRoute;
