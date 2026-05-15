/**
 * Responsive Main Layout Wrapper
 * Integrates Sidebar and Navbar with mobile-responsive design
 */

import React, { useState } from "react";
import { useResponsive } from "@/hooks/useResponsive";
import { FaBars, FaTimes } from "react-icons/fa";

const shellClass =
  "rounded-[28px] border border-slate-200/80 bg-white/95 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm";

export const ResponsiveMainLayout = ({
  sidebar: SidebarComponent,
  navbar: NavbarComponent,
  children,
  showSidebar = true,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isMobile } = useResponsive();

  const toggleSidebar = () => setSidebarOpen((open) => !open);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#eef6ff_100%)]">
      {NavbarComponent && (
        <div className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
          <div className="mx-auto flex h-16 w-full max-w-[1720px] items-center gap-4 px-4 sm:px-6 lg:px-8">
            {showSidebar && isMobile && (
              <button
                onClick={toggleSidebar}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:border-slate-300 hover:bg-white"
                aria-label="Toggle sidebar"
              >
                {sidebarOpen ? <FaTimes size={16} /> : <FaBars size={16} />}
              </button>
            )}
            <div className="min-w-0 flex-1">{NavbarComponent}</div>
          </div>
        </div>
      )}

      <div className="relative mx-auto flex w-full max-w-[1720px] gap-6 px-4 py-4 sm:px-6 lg:px-8">
        {showSidebar && SidebarComponent && (
          <>
            {sidebarOpen && isMobile && (
              <div
                className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm lg:hidden"
                onClick={closeSidebar}
                aria-hidden="true"
              />
            )}

            <div
              className={`fixed bottom-0 left-0 top-16 z-50 w-[min(320px,100vw)] transition-transform duration-300 lg:sticky lg:top-24 lg:z-10 lg:block lg:w-72 ${
                sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
              }`}
              onClick={(e) => {
                if (isMobile) {
                  e.stopPropagation();
                }
              }}
            >
              <div className={`${shellClass} h-full overflow-y-auto p-2 lg:h-auto`}>
                {SidebarComponent}
              </div>
            </div>
          </>
        )}

        <main className="min-w-0 flex-1 overflow-x-hidden">
          <div className="min-h-screen">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default ResponsiveMainLayout;
