import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  HeartPulse,
  HeartHandshake,
  ShieldAlert,
  PlusCircle,
  Activity,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils.js';

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  mobileOpen = false,
  onCloseMobile,
}) => {
  const location = useLocation();

  // Automatically close mobile drawer when route changes
  useEffect(() => {
    if (mobileOpen && onCloseMobile) {
      onCloseMobile();
    }
  }, [location.pathname]);

  // Handle Escape key and body scroll lock for mobile sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen && onCloseMobile) {
        onCloseMobile();
      }
    };

    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileOpen, onCloseMobile]);

  const operationsNav = [
    {
      to: '/admin',
      end: true,
      label: 'Command Center',
      icon: LayoutDashboard,
    },
    {
      to: '/admin/requests',
      end: false,
      label: 'Blood Requests',
      icon: HeartPulse,
    },
    {
      to: '/admin/donors',
      end: false,
      label: 'Donor Registry',
      icon: Users,
    },
  ];

  const systemNav = [
    {
      to: '/admin/operations',
      end: false,
      label: 'Operations & Health',
      icon: Activity,
    },
    {
      to: '/admin/audit-logs',
      end: false,
      label: 'Security & Audit Logs',
      icon: ShieldAlert,
    },
  ];

  const renderNavContent = (isMobileView: boolean) => (
    <div className="space-y-6">
      {/* Quick Action */}
      <div className="pt-1">
        <NavLink
          to="/admin/requests/create"
          onClick={() => isMobileView && onCloseMobile?.()}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-[#D92D45] hover:bg-[#B42318] active:bg-[#8F1D35] text-white text-xs font-bold shadow-xs transition-all whitespace-nowrap min-h-[44px]"
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          <span>New Blood Request</span>
        </NavLink>
      </div>

      <div>
        <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-[#667085] mb-2">
          Clinical Operations
        </p>
        <nav className="space-y-1">
          {operationsNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => isMobileView && onCloseMobile?.()}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 min-h-[44px]',
                    isActive
                      ? 'bg-[#FFF0F2] text-[#D92D45] font-bold border border-[#FFE4E8]'
                      : 'text-[#667085] hover:bg-[#FAF9F7] hover:text-[#1F2937]'
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div>
        <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-[#667085] mb-2">
          Governance & Audit
        </p>
        <nav className="space-y-1">
          {systemNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => isMobileView && onCloseMobile?.()}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 min-h-[44px]',
                    isActive
                      ? 'bg-[#FFF0F2] text-[#D92D45] font-bold border border-[#FFE4E8]'
                      : 'text-[#667085] hover:bg-[#FAF9F7] hover:text-[#1F2937]'
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Persistent Sidebar */}
      <aside className="w-64 border-r border-[#E7E5E4] bg-white min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex shrink-0 text-left">
        {renderNavContent(false)}

        <div className="p-3.5 rounded-2xl bg-[#FAF9F7] border border-[#E7E5E4] text-2xs text-[#667085] space-y-1 mt-6">
          <p className="font-bold text-[#1F2937] flex items-center gap-1.5">
            <HeartHandshake className="w-4 h-4 text-[#D92D45]" />
            HemaCare Operations
          </p>
          <p className="text-[11px] leading-relaxed">
            Regional Transfusion Registry & Clinical Dispatch.
          </p>
        </div>
      </aside>

      {/* 2. Mobile Responsive Slide-Over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation drawer">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Slide-over Drawer */}
          <aside className="relative w-72 max-w-[85vw] h-full bg-white shadow-2xl p-4 flex flex-col justify-between overflow-y-auto z-10 animate-in slide-in-from-left duration-200 text-left">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E7E5E4]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#D92D45] text-white flex items-center justify-center font-bold text-xs">
                    HC
                  </div>
                  <span className="font-bold text-sm text-[#1F2937]">Admin Navigation</span>
                </div>
                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="p-2 text-[#667085] hover:text-[#1F2937] rounded-lg hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center transition"
                  aria-label="Close navigation drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {renderNavContent(true)}
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF9F7] border border-[#E7E5E4] text-2xs text-[#667085] space-y-1 mt-6">
              <p className="font-bold text-[#1F2937] flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-[#D92D45]" />
                HemaCare Operations
              </p>
              <p className="text-[11px] leading-relaxed">
                Regional Transfusion Registry & Clinical Dispatch.
              </p>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};
