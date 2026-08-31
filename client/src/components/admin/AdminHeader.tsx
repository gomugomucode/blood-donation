import React from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { Button } from '../common/Button.js';
import { ShieldCheck, LogOut, HeartHandshake } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminHeader: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-slate-200/80 bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      <div className="flex items-center gap-3">
        <Link to="/admin" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-crimson-600 flex items-center justify-center text-white shadow-xs">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-slate-900 text-sm tracking-tight">HemaCare</span>
            <span className="ml-1.5 px-1.5 py-0.5 text-2xs font-extrabold uppercase tracking-wider bg-slate-900 text-white rounded">
              Admin Portal
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100/80 border border-slate-200/60 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold text-slate-800">{user?.email}</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-500 font-mono text-2xs">ADMIN</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          leftIcon={<LogOut className="w-3.5 h-3.5" />}
        >
          Sign Out
        </Button>
      </div>
    </header>
  );
};
