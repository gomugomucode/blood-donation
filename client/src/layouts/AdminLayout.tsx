import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminHeader } from '../components/admin/AdminHeader.js';
import { AdminSidebar } from '../components/admin/AdminSidebar.js';

export const AdminLayout: React.FC = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F7] font-sans text-[#1F2937] overflow-x-hidden">
      {/* 1. Administrative Top Coordination Strip (Gives proper top spacing & clinical status) */}
      <div className="bg-[#8F1D35] text-white text-xs py-1.5 px-4 sm:px-6 shadow-xs">
        <div className="max-w-full mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider font-mono">
              Command Center
            </span>
            <span className="text-white/90 text-xs font-medium hidden sm:inline">
              Regional Blood Demand & Clinical Transfusion Administration
            </span>
          </div>
          <div className="flex items-center gap-2 text-2xs sm:text-xs font-mono text-white/90">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Live System Active</span>
          </div>
        </div>
      </div>

      {/* 2. Admin Header with proper vertical spacing */}
      <AdminHeader
        isMobileNavOpen={mobileNavOpen}
        onToggleMobileNav={() => setMobileNavOpen((prev) => !prev)}
      />

      {/* 3. Main Body: flex-1 with min-w-0 for robust unclipped table containment */}
      <div className="flex flex-1 relative min-w-0">
        <AdminSidebar
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
        />
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 w-full overflow-x-hidden animate-fade-in text-left">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
