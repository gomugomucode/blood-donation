import React, { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { HeartHandshake, LayoutDashboard, User, History, LogOut, Menu, X } from 'lucide-react';
import { BloodGroupBadge } from '../components/common/Badge.js';
import { Button } from '../components/common/Button.js';
import { cn } from '../lib/utils.js';

export const DonorLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/profile', label: 'My Profile', icon: User, end: false },
    { to: '/history', label: 'Donation History', icon: History, end: false },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-crimson-600 flex items-center justify-center text-white shadow-xs">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-slate-900 text-base tracking-tight">HemaCare</span>
                <span className="text-2xs text-slate-500 font-semibold block -mt-1">Donor Portal</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 ml-4">
              {navLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors',
                        isActive
                          ? 'bg-crimson-50 text-crimson-700 font-bold border border-crimson-100'
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

          <div className="flex items-center gap-3">
            {user?.donorProfile && (
              <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-xs font-bold text-slate-800">
                  {user.donorProfile.fullName}
                </span>
                <BloodGroupBadge bloodGroup={user.donorProfile.bloodGroup} />
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              leftIcon={<LogOut className="w-3.5 h-3.5" />}
              className="hidden sm:inline-flex"
            >
              Sign Out
            </Button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-2">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold',
                      isActive ? 'bg-crimson-50 text-crimson-700' : 'text-slate-700'
                    )
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Signed in as {user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={logout}>
                Sign Out
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Main Donor View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};
