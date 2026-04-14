import { ReactNode, useState } from "react";
import { AppSidebar } from "./AppSidebar";

export function AppLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    return localStorage.getItem("sidebarOpen") !== "false";
  });

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const newState = !prev;
      localStorage.setItem("sidebarOpen", String(newState));
      return newState;
    });
  };
  return (
    <div className="flex min-h-screen bg-background relative">
      <AppSidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
      <main className="flex-1 min-w-0 overflow-hidden">
        <div className="w-full max-w-7xl mx-auto p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
