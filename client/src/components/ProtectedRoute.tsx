// src/components/ProtectedRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

type ProtectedRouteProps = {
  children: JSX.Element;
  /** Where to redirect if not authenticated (default: /login) */
  redirectTo?: string;
  /** Optional: component to render while auth state is loading */
  loadingFallback?: JSX.Element | null;
};

/**
 * ProtectedRoute
 * - Waits for the initial auth check to complete.
 * - Redirects unauthenticated users to `redirectTo`.
 * - Returns `children` for authenticated users.
 *
 * Usage:
 * <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
 */
export function ProtectedRoute({
  children,
  redirectTo = "/login",
  loadingFallback = <div>Loading…</div>,
}: ProtectedRouteProps) {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    // show a non-blocking spinner / skeleton while we determine auth state
    return loadingFallback;
  }

  // not authenticated → redirect to login
  if (!session) {
    return <Navigate to={redirectTo} replace />;
  }

  // authenticated → render children
  return children;
}
