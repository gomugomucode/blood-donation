import React from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { Button } from '../common/Button.js';
import { ShieldCheck, LogOut, HeartHandshake, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminHeader: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-slate-200/80 bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs backdrop-blur-md bg-white/95">
      <div className="flex items-center gap-3">
        <Link to="/admin" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <HeartHandshake className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-sm tracking-tight">HemaCare</span>
              <span className="px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 rounded-md font-mono">
                Coordinator Hub
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium block -mt-0.5">Clinical Administration</span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <Link to="/admin/requests/create" className="sm:hidden">
          <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
            New
          </Button>
        </Link>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold text-slate-800 truncate max-w-[180px]">{user?.email}</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600 font-mono text-[11px] font-bold">STAFF ADMIN</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          leftIcon={<LogOut className="w-3.5 h-3.5" />}
          className="min-h-[40px]"
        >
          Sign Out
        </Button>
      </div>
    </header>
  );
};
