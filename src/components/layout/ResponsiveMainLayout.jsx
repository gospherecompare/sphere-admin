/**
 * Responsive Main Layout Wrapper
 * Integrates Sidebar and Navbar with mobile-responsive design
 */

import React, { useState } from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import { Menu, X } from 'react-icons/fa';

export const ResponsiveMainLayout = ({
  sidebar: SidebarComponent,
  navbar: NavbarComponent,
  children,
  showSidebar = true,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isMobile } = useResponsive();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="layout-wrapper min-h-screen bg-gray-50">
      {/* Navbar with mobile menu button */}
      {NavbarComponent && (
        <div className="header-responsive">
          {showSidebar && isMobile && (
            <button
              onClick={toggleSidebar}
              className="menu-button-mobile mr-4"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
          <div className="flex-1 w-full">
            {NavbarComponent}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 relative">
        {/* Sidebar - Responsive */}
        {showSidebar && SidebarComponent && (
          <>
            {/* Mobile backdrop */}
            {sidebarOpen && isMobile && (
              <div
                className="fixed inset-0 bg-black/40 z-100 lg:hidden"
                onClick={closeSidebar}
                aria-hidden="true"
              />
            )}
            
            {/* Sidebar Container */}
            <div
              className={`
                fixed lg:relative
                top-0 left-0
                w-full lg:w-auto
                h-full lg:h-auto
                transform lg:transform-none
                transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                z-110 lg:z-0
                bg-white
              `}
              onClick={(e) => {
                if (isMobile) {
                  e.stopPropagation();
                }
              }}
            >
              <div className="w-64 h-full overflow-y-auto lg:w-auto lg:overflow-visible">
                {SidebarComponent}
              </div>
            </div>
          </>
        )}

        {/* Main Content */}
        <main className="layout-content flex-1 w-full overflow-x-hidden">
          <div className="min-h-screen">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ResponsiveMainLayout;
