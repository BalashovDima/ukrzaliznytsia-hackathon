import {
  Train,
  Plus,
  BarChart3,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Github,
  ArrowRightLeft,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const CLIENT_NAV_ITEMS = [
  { to: "/client/shipments", label: "Мої заявки", icon: Train },
  { to: "/client/create-shipment", label: "Нова заявка", icon: Plus },
];

const MANAGE_NAV_ITEMS = [
  { to: "/manage/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { to: "/manage/shipments", label: "Всі заявки", icon: Train },
  { to: "/manage/analytics", label: "Аналітика", icon: BarChart3 },
];

interface AppSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function AppSidebar({ isOpen, onToggle }: AppSidebarProps) {
  const location = useLocation();
  const isClient = location.pathname.startsWith("/client");
  const navItems = isClient ? CLIENT_NAV_ITEMS : MANAGE_NAV_ITEMS;

  return (
    <aside
      className={cn(
        "sticky top-0 h-screen z-30 flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300",
        isOpen ? "w-60" : "w-[68px]",
      )}
    >
      <div
        className={cn(
          "flex items-center min-h-[68px] py-5 border-b border-sidebar-border relative overflow-hidden",
          isOpen ? "px-5" : "px-0 justify-center",
        )}
      >
        <div className="flex items-center gap-2.5">
          <Train className="h-7 w-7 text-sidebar-primary flex-shrink-0" />
          {isOpen && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold leading-tight whitespace-nowrap">
                Empty Run Buster
              </h1>
              <p className="text-[11px] text-sidebar-foreground/60 whitespace-nowrap">
                УЗ · Логістика
              </p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 py-4 space-y-1 overflow-y-auto overflow-x-hidden px-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              title={!isOpen ? item.label : undefined}
              className={cn(
                "flex items-center rounded-md text-sm font-medium transition-colors",
                isOpen
                  ? "gap-3 px-3 py-2.5 w-full"
                  : "justify-center w-10 h-10 mx-auto",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {isOpen && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div
        className={cn(
          "py-3 border-t border-sidebar-border mt-auto flex flex-col gap-1",
          isOpen ? "px-4" : "px-0 items-center justify-center",
        )}
      >
        <Link
          to={isClient ? "/manage/dashboard" : "/client/shipments"}
          title={
            !isOpen
              ? isClient
                ? "Увійти як Логіст"
                : "Увійти як Клієнт"
              : undefined
          }
          className={cn(
            "flex items-center rounded-md text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
            isOpen
              ? "gap-3 px-3 py-2.5 w-full"
              : "justify-center w-10 h-10 mx-auto",
          )}
        >
          <ArrowRightLeft className="h-5 w-5 flex-shrink-0" />
          {isOpen && (
            <span className="truncate">
              {isClient ? "Увійти як Логіст" : "Увійти як Клієнт"}
            </span>
          )}
        </Link>
        <a
          href="https://github.com/BalashovDima/ukrzaliznytsia-hackathon"
          target="_blank"
          rel="noreferrer"
          title={!isOpen ? "GitHub Project" : undefined}
          className={cn(
            "flex items-center rounded-md text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
            isOpen
              ? "gap-3 px-3 py-2.5 w-full"
              : "justify-center w-10 h-10 mx-auto",
          )}
        >
          <Github className="h-5 w-5 flex-shrink-0" />
          {isOpen && <span className="truncate">Source code</span>}
        </a>
      </div>

      <button
        onClick={onToggle}
        className="absolute -right-3 top-6 flex h-6 w-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm hover:text-primary z-40"
      >
        {isOpen ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>
    </aside>
  );
}
