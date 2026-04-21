import {
  Train,
  Plus,
  BarChart3,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Github,
  ArrowRightLeft,
  Info,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import infoMarkdown from "./info.md?raw";

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
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden transition-opacity duration-300"
          onClick={onToggle}
        />
      )}
      <aside
        className={cn(
          "fixed md:sticky top-0 h-screen z-40 flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300",
          isOpen
            ? "translate-x-0 w-60 border-r border-sidebar-border shadow-2xl md:shadow-none"
            : "-translate-x-full md:translate-x-0 md:w-[68px] w-60 border-r border-sidebar-border",
        )}
      >
        <div
          className={cn(
            "flex items-center min-h-[68px] py-5 border-b border-sidebar-border relative overflow-hidden",
            isOpen ? "px-5" : "px-5 md:px-0 md:justify-center justify-start",
          )}
        >
          <div className="flex items-center gap-2.5">
            <Train className="h-7 w-7 text-sidebar-primary flex-shrink-0" />
            <div
              className={cn(
                "overflow-hidden transition-opacity",
                !isOpen && "md:hidden",
              )}
            >
              <h1 className="text-sm font-bold leading-tight whitespace-nowrap">
                Empty Run Buster
              </h1>
              <p className="text-[11px] text-sidebar-foreground/60 whitespace-nowrap">
                УЗ · Логістика
              </p>
            </div>
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
                    : "gap-3 px-3 py-2.5 w-full md:justify-center md:w-10 md:h-10 md:mx-auto md:px-0 md:gap-0",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span
                  className={cn(
                    "truncate transition-opacity",
                    !isOpen && "md:hidden",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div
          className={cn(
            "py-3 border-t border-sidebar-border mt-auto flex flex-col gap-1",
            isOpen
              ? "px-4"
              : "px-4 md:px-0 md:items-center md:justify-center items-stretch",
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
                : "gap-3 px-3 py-2.5 w-full md:justify-center md:w-10 md:h-10 md:mx-auto md:px-0 md:gap-0",
            )}
          >
            <ArrowRightLeft className="h-5 w-5 flex-shrink-0" />
            <span
              className={cn(
                "truncate transition-opacity",
                !isOpen && "md:hidden",
              )}
            >
              {isClient ? "Увійти як Логіст" : "Увійти як Клієнт"}
            </span>
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
                : "gap-3 px-3 py-2.5 w-full md:justify-center md:w-10 md:h-10 md:mx-auto md:px-0 md:gap-0",
            )}
          >
            <Github className="h-5 w-5 flex-shrink-0" />
            <span
              className={cn(
                "truncate transition-opacity",
                !isOpen && "md:hidden",
              )}
            >
              Source code
            </span>
          </a>

          <Dialog>
            <DialogTrigger asChild>
              <button
                title={!isOpen ? "Інформація про систему" : undefined}
                className={cn(
                  "flex items-center rounded-md text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  isOpen
                    ? "gap-3 px-3 py-2.5 w-full text-left"
                    : "gap-3 px-3 py-2.5 w-full text-left md:justify-center md:w-10 md:h-10 md:mx-auto md:px-0 md:gap-0 md:text-center",
                )}
              >
                <Info className="h-5 w-5 flex-shrink-0" />
                <span
                  className={cn(
                    "truncate transition-opacity",
                    !isOpen && "md:hidden",
                  )}
                >
                  Про систему
                </span>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogTitle className="sr-only">
                Інформація про систему
              </DialogTitle>
              <DialogDescription className="sr-only">
                Опис логіки роботи алгоритмів розподілу.
              </DialogDescription>
              <div className="prose prose-sm dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {infoMarkdown}
                </ReactMarkdown>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <button
          onClick={onToggle}
          className={cn(
            "absolute flex h-9 w-9 md:h-6 md:w-6 items-center justify-center rounded-full border border-sidebar-border bg-background md:bg-sidebar text-sidebar-foreground shadow-md hover:text-primary z-50 transition-all",
            // Vertical positioning
            isOpen ? "top-6" : "top-[90px] md:top-6",
            // Horizontal positioning
            isOpen
              ? "-right-4 md:-right-3"
              : "-right-[-5px] md:-right-3 translate-x-full md:translate-x-0",
          )}
        >
          {isOpen ? (
            <ChevronLeft className="h-5 w-5 md:h-4 md:w-4" />
          ) : (
            <ChevronRight className="h-5 w-5 md:h-4 md:w-4" />
          )}
        </button>
      </aside>
    </>
  );
}
