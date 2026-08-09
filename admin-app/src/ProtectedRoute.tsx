import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { admin, loading } = useAuth();

  if (loading) {
    return <p className="loading">Lädt…</p>;
  }
  if (!admin) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
