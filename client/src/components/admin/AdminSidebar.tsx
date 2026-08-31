import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  HeartPulse,
  HeartHandshake,
  ShieldAlert,
  PlusCircle,
  Activity,
} from 'lucide-react';
import { cn } from '../../lib/utils.js';

export const AdminSidebar: React.FC = () => {
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

  return (
    <aside className="w-64 border-r border-slate-200/80 bg-white min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex shrink-0">
      <div className="space-y-6">
        {/* Quick Emergency Action */}
        <div className="pt-1">
          <NavLink
            to="/admin/requests/create"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold shadow-sm shadow-rose-600/10 transition-all hover:shadow-md"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Blood Request</span>
          </NavLink>
        </div>

        <div>
          <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
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
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150',
                      isActive
                        ? 'bg-rose-50 text-rose-700 font-bold border border-rose-200 shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
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
          <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
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
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150',
                      isActive
                        ? 'bg-rose-50 text-rose-700 font-bold border border-rose-200 shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
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

      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-2xs text-slate-500 space-y-1">
        <p className="font-bold text-slate-800 flex items-center gap-1.5">
          <HeartHandshake className="w-4 h-4 text-rose-600" />
          HemaCare Operations
        </p>
        <p className="text-[11px] leading-relaxed">
          High-availability Blood Matching & Transfusion Management System.
        </p>
      </div>
    </aside>
  );
};
