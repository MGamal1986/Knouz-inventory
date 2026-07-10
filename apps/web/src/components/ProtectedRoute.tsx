import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ReactNode } from "react";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { admin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-surface-container-high border-t-deep-charcoal" />
      </div>
    );
  }

  if (!admin) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return <>{children}</>;
}
