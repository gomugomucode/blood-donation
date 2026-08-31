import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import {
  HeartHandshake,
  LayoutDashboard,
  User,
  History,
  LogOut,
  Bell,
  Sparkles,
  CheckCheck,
  ArrowRight,
} from 'lucide-react';
import { BloodGroupBadge } from '../components/common/Badge.js';
import { cn } from '../lib/utils.js';
import {
  useDonorNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '../hooks/useNotifications.js';

export const DonorLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const { data: unreadData } = useUnreadNotificationCount();
  const { data: notifData } = useDonorNotifications({ limit: 6 });
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const unreadCount = unreadData?.unreadCount ?? 0;

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/dashboard/opportunities', label: 'Opportunities', icon: Sparkles, end: false },
    { to: '/history', label: 'Donation History', icon: History, end: false },
    { to: '/profile', label: 'Donor Profile', icon: User, end: false },
  ];

  const handleNotificationClick = async (notif: any) => {
    if (notif.status !== 'READ') {
      await markReadMutation.mutateAsync(notif.id);
    }
    setNotifDropdownOpen(false);
    if (notif.opportunityId) {
      navigate(`/dashboard/opportunities/${notif.opportunityId}`);
    } else {
      navigate('/dashboard/opportunities');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans pb-16 md:pb-0">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-600/20 transition-transform group-hover:scale-105">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-slate-900 text-base tracking-tight block">HemaCare</span>
                <span className="text-[10px] text-rose-600 font-bold block -mt-1 tracking-wider uppercase">
                  Donor Portal
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1.5">
              {navLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150',
                        isActive
                          ? 'bg-rose-50 text-rose-700 font-bold border border-rose-200 shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
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
            {/* Notification Bell with Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="relative p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="View donation notifications"
                aria-expanded={notifDropdownOpen}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-4 h-4 bg-rose-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-sm animate-pulse-subtle">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-elevated py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 pb-2.5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
                      <p className="text-2xs text-slate-500">
                        {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount === 1 ? '' : 's'}` : 'All caught up'}
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllReadMutation.mutate()}
                        className="text-2xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                    {!notifData?.items || notifData.items.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        No notifications yet.
                      </div>
                    ) : (
                      notifData.items.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={cn(
                            'p-3.5 hover:bg-slate-50 transition-colors cursor-pointer text-left',
                            notif.status !== 'READ' ? 'bg-rose-50/40' : ''
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              {notif.status !== 'READ' && (
                                <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
                              )}
                              {notif.title}
                            </span>
                            <span className="text-2xs text-slate-400 shrink-0 font-mono">
                              {new Date(notif.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-2xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-2.5 px-3 border-t border-slate-100 text-center">
                    <Link
                      to="/dashboard/opportunities"
                      onClick={() => setNotifDropdownOpen(false)}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1"
                    >
                      View All Opportunities <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Donor Profile Badge / Dropdown */}
            {user?.donorProfile && (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-colors cursor-pointer min-h-[40px]"
                  aria-label="User profile menu"
                >
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-bold text-slate-900 leading-tight">
                      {user.donorProfile.fullName}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">Verified Donor</div>
                  </div>
                  <BloodGroupBadge bloodGroup={user.donorProfile.bloodGroup} size="sm" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-elevated py-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <div className="font-bold text-slate-900">{user.donorProfile.fullName}</div>
                      <div className="text-slate-500 text-2xs truncate">{user.email}</div>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      Manage Profile & Consent
                    </Link>
                    <Link
                      to="/history"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
                    >
                      <History className="w-4 h-4 text-slate-400" />
                      Donation Records
                    </Link>
                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={logout}
                        className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-rose-600 hover:bg-rose-50 transition"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Donor View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-fade-in">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar (44px+ touch targets) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-2 py-1 flex items-center justify-around">
        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center py-1.5 px-3 rounded-xl min-h-[48px] min-w-[60px] text-[10px] font-semibold transition-colors',
                  isActive ? 'text-rose-600 font-bold' : 'text-slate-500 hover:text-slate-900'
                )
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.label.split(' ')[0]}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};
