
import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  BookOpen,
  User,
  BarChart,
  Clock,
  FileText,
  Home,
  Users,
  Settings,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { user } = useAuth();
  const role = user?.role || "student";

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-2 py-2 px-3 rounded-lg transition-all",
      isActive
        ? "bg-edu-primary/10 text-edu-primary font-medium"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    );

  // Define navigation items based on user role
  const navItems = {
    student: [
      { to: "/dashboard", icon: <Home className="h-5 w-5" />, label: "Dashboard" },
      { to: "/materials", icon: <BookOpen className="h-5 w-5" />, label: "Study Materials" },
      { to: "/quizzes", icon: <FileText className="h-5 w-5" />, label: "Quizzes" },
      { to: "/progress", icon: <BarChart className="h-5 w-5" />, label: "My Progress" },
      { to: "/profile", icon: <User className="h-5 w-5" />, label: "Profile" },
    ],
    teacher: [
      { to: "/teacher/dashboard", icon: <Home className="h-5 w-5" />, label: "Dashboard" },
      { to: "/materials", icon: <BookOpen className="h-5 w-5" />, label: "Study Materials" },
      { to: "/upload", icon: <Upload className="h-5 w-5" />, label: "Upload Material" },
      { to: "/students", icon: <Users className="h-5 w-5" />, label: "My Students" },
      { to: "/profile", icon: <User className="h-5 w-5" />, label: "Profile" },
    ],
    admin: [
      { to: "/dashboard", icon: <Home className="h-5 w-5" />, label: "Dashboard" },
      { to: "/users", icon: <Users className="h-5 w-5" />, label: "User Management" },
      { to: "/materials", icon: <BookOpen className="h-5 w-5" />, label: "All Materials" },
      { to: "/analytics", icon: <BarChart className="h-5 w-5" />, label: "Analytics" },
      { to: "/settings", icon: <Settings className="h-5 w-5" />, label: "Settings" },
    ],
  };

  const currentNavItems = navItems[role as keyof typeof navItems] || navItems.student;

  return (
    <div
      className={cn(
        "h-[calc(100vh-4rem)] border-r border-border bg-background transition-all duration-300 flex flex-col",
        collapsed ? "w-[70px]" : "w-[250px]"
      )}
    >
      <div className="flex-1 py-6 px-4">
        <Button
          variant="outline"
          size="sm"
          className="mb-6 w-full justify-start"
          onClick={onToggle}
        >
          {collapsed ? "→" : "←"}
        </Button>

        <div className="space-y-1">
          {currentNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={navLinkClass}
              title={collapsed ? item.label : undefined}
            >
              {item.icon}
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </div>
      </div>

      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          {!collapsed && (
            <div>
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{role}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
