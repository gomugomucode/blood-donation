import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminHeader } from '../components/admin/AdminHeader.js';
import { AdminSidebar } from '../components/admin/AdminSidebar.js';

export const AdminLayout: React.FC = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F7] font-sans text-[#1F2937] overflow-x-hidden">
      <AdminHeader
        isMobileNavOpen={mobileNavOpen}
        onToggleMobileNav={() => setMobileNavOpen((prev) => !prev)}
      />
      <div className="flex flex-1 relative">
        <AdminSidebar
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
        />
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-x-hidden animate-fade-in text-left">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
