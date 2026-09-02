import React from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { Button } from '../common/Button.js';
import { ShieldCheck, LogOut, Droplets, PlusCircle, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AdminHeaderProps {
  isMobileNavOpen?: boolean;
  onToggleMobileNav?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  isMobileNavOpen = false,
  onToggleMobileNav,
}) => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-[#E7E5E4] bg-white/95 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs backdrop-blur-md">
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Navigation Toggle (min 44x44 target) */}
        <button
          type="button"
          onClick={onToggleMobileNav}
          className="md:hidden p-2 text-[#1F2937] hover:text-[#D92D45] rounded-xl hover:bg-[#FFF7F8] active:bg-[#FFE4E8] min-h-[44px] min-w-[44px] flex items-center justify-center transition cursor-pointer"
          aria-label={isMobileNavOpen ? 'Close navigation drawer' : 'Open navigation drawer'}
          aria-expanded={isMobileNavOpen}
        >
          {isMobileNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        <Link to="/admin" className="flex items-center gap-2 sm:gap-2.5 group">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#D92D45] flex items-center justify-center text-white shadow-xs transition-transform group-hover:scale-105 shrink-0">
            <Droplets className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-extrabold text-[#1F2937] text-sm sm:text-base tracking-tight">HemaCare</span>
              <span className="px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider bg-[#FFF0F2] text-[#D92D45] border border-[#FFE4E8] rounded-md font-mono">
                Command Center
              </span>
            </div>
            <span className="text-[10px] text-[#667085] font-medium hidden xs:block -mt-0.5">
              Clinical Transfusion Administration
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Link to="/admin/requests/create" className="sm:hidden">
          <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-3.5 h-3.5" />} className="min-h-[38px] px-2.5 text-xs">
            New
          </Button>
        </Link>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FAF9F7] border border-[#E7E5E4] text-xs">
          <ShieldCheck className="w-4 h-4 text-[#15803D] shrink-0" />
          <span className="font-semibold text-[#1F2937] truncate max-w-[140px] md:max-w-[200px]">{user?.email}</span>
          <span className="text-[#E7E5E4]">|</span>
          <span className="text-[#667085] font-mono text-[11px] font-bold">ADMIN</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          leftIcon={<LogOut className="w-3.5 h-3.5" />}
          className="min-h-[38px] text-xs px-3"
        >
          Sign Out
        </Button>
      </div>
    </header>
  );
};
