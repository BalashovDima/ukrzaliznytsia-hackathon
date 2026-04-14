import { Train, Plus, BarChart3, LayoutDashboard } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const CLIENT_NAV_ITEMS = [
  { to: "/client/shipments", label: "Мої заявки", icon: Train },
  { to: "/client/create-shipment", label: "Нова заявка", icon: Plus },
];

const MANAGE_NAV_ITEMS = [
  { to: "/manage/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { to: "/manage/shipments", label: "Всі заявки", icon: Train },
  { to: "/manage/analytics", label: "Аналітика", icon: BarChart3 },
];

export function AppSidebar() {
  const location = useLocation();
  const isClient = location.pathname.startsWith("/client");
  const navItems = isClient ? CLIENT_NAV_ITEMS : MANAGE_NAV_ITEMS;

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-sidebar-border">
        <Train className="h-7 w-7 text-sidebar-primary" />
        <div>
          <h1 className="text-sm font-bold leading-tight">Empty Run Buster</h1>
          <p className="text-[11px] text-sidebar-foreground/60">
            УЗ · Логістика
          </p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-sidebar-border">
        <p className="text-[10px] text-sidebar-foreground/40">
          v1.0 · FSD Architecture
        </p>
      </div>
    </aside>
  );
}
