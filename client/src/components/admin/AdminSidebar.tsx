import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, HeartPulse, HeartHandshake } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export const AdminSidebar: React.FC = () => {
  const navItems = [
    {
      to: '/admin',
      end: true,
      label: 'Dashboard Overview',
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
      label: 'Donor Directory',
      icon: Users,
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-200/80 bg-white min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-2xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Clinical Administration
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors',
                      isActive
                        ? 'bg-crimson-50 text-crimson-700 font-bold border border-crimson-100 shadow-2xs'
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

      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-2xs text-slate-500">
        <p className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
          <HeartHandshake className="w-3.5 h-3.5 text-crimson-600" />
          HemaCare v1.0.0
        </p>
        <p>Production Blood Bank Management & Donor Registry System.</p>
      </div>
    </aside>
  );
};
