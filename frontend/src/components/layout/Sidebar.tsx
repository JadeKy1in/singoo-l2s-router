import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  PlusCircle,
  BarChart3,
  Wrench,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  labelCn: string;
  href?: string;
  soon?: boolean;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", labelCn: "仪表盘", href: "/" },
  { icon: PlusCircle, label: "New Session", labelCn: "新建会话", href: "/new" },
  { icon: BarChart3, label: "Analytics", labelCn: "分析", soon: true },
  { icon: Wrench, label: "Settings", labelCn: "设置", soon: true },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 shrink-0",
        collapsed ? "w-[72px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">S</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">Singoo</span>
              <span className="text-[10px] text-muted-foreground">L2S-Router</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="shrink-0 p-1 rounded-md hover:bg-sidebar-accent text-muted-foreground hover:text-sidebar-foreground transition-colors"
        >
          <ChevronLeft
            className={cn("w-3.5 h-3.5 transition-transform", collapsed && "rotate-180")}
          />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          if (item.soon) {
            return (
              <span
                key={item.label}
                className="flex items-center w-full gap-3 px-3 py-2.5 rounded-lg text-left text-muted-foreground/50 cursor-not-allowed select-none"
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate">
                      {item.label} <span className="text-[10px]">(Soon)</span>
                    </span>
                    <span className="text-[10px]">{item.labelCn}</span>
                  </div>
                )}
              </span>
            );
          }
          const isActive =
            item.href === "/"
              ? location.pathname === "/"
              : !!item.href && location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.label}
              to={item.href!}
              className={cn(
                "flex items-center w-full gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate">{item.label}</span>
                  <span className="text-[10px] text-muted-foreground">{item.labelCn}</span>
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <button className="flex items-center w-full gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors">
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium">Log Out</span>
              <span className="text-[10px] text-muted-foreground">登出</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
