import { useState, useEffect } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet } from "react-router-dom";

interface AppLayoutProps {
  requiredRole?: "student" | "teacher" | "admin";
}

export const AppLayout = ({ requiredRole }: AppLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, isAuthenticated, loading } = useAuth();

  // Log everything for debugging
  useEffect(() => {
    console.log("🔍 AppLayout Debug:");
    console.log("isAuthenticated:", isAuthenticated);
    console.log("loading:", loading);
    console.log("user:", user);
    console.log("requiredRole:", requiredRole);
    console.log("user?.role:", user?.role);
    if (requiredRole && user?.role !== requiredRole) {
      console.warn("🚫 Access denied: role mismatch");
    }
  }, [isAuthenticated, loading, user, requiredRole]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-edu-primary/20"></div>
          <div className="h-4 w-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.warn("🔐 Redirecting to login: user not authenticated");
    return <Navigate to="/login" />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    console.warn(`❌ Unauthorized: Required "${requiredRole}", but user has "${user?.role}"`);
    return <Navigate to="/unauthorized" />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
