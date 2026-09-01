import React from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { Button } from '../common/Button.js';
import { ShieldCheck, LogOut, Droplets, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminHeader: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-[#E7E5E4] bg-white/95 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs backdrop-blur-md">
      <div className="flex items-center gap-3">
        <Link to="/admin" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-[#D92D45] flex items-center justify-center text-white shadow-xs transition-transform group-hover:scale-105">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#1F2937] text-base tracking-tight">HemaCare</span>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-[#FFF0F2] text-[#D92D45] border border-[#FFE4E8] rounded-md font-mono">
                Staff Center
              </span>
            </div>
            <span className="text-[10px] text-[#667085] font-medium block -mt-0.5">Clinical Coordination</span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <Link to="/admin/requests/create" className="sm:hidden">
          <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
            New
          </Button>
        </Link>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FAF9F7] border border-[#E7E5E4] text-xs">
          <ShieldCheck className="w-4 h-4 text-[#15803D] shrink-0" />
          <span className="font-semibold text-[#1F2937] truncate max-w-[180px]">{user?.email}</span>
          <span className="text-[#E7E5E4]">|</span>
          <span className="text-[#667085] font-mono text-[11px] font-bold">COORDINATOR</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          leftIcon={<LogOut className="w-3.5 h-3.5" />}
          className="min-h-[38px]"
        >
          Sign Out
        </Button>
      </div>
    </header>
  );
};
