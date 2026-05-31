import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { SearchProvider } from "../../providers/SearchProvider";
import { MobileSidebar } from "./MobileSidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-text">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <MobileSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        <SearchProvider>
          <div className="sticky top-0 z-30 border-b border-emerald-900/30 bg-emerald-900 text-white shadow-sm backdrop-blur-xl">
            <Topbar onMenuClick={() => setMobileMenuOpen(true)} />
          </div>
          <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1600px]">{children}</div>
          </main>
        </SearchProvider>
      </div>
    </div>
  );
};
