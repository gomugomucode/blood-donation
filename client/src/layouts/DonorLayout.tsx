import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import {
  Droplets,
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
    <div className="min-h-screen flex flex-col bg-[#FAF9F7] font-sans text-[#1F2937] pb-16 md:pb-0">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E7E5E4] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-[#D92D45] flex items-center justify-center text-white shadow-xs transition-transform group-hover:scale-105">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-[#1F2937] text-base tracking-tight block">HemaCare</span>
                <span className="text-[10px] text-[#D92D45] font-bold block -mt-1 tracking-wider uppercase">
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

          <div className="flex items-center gap-3">
            {/* Notification Bell with Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="relative p-2.5 rounded-xl text-[#667085] hover:text-[#1F2937] hover:bg-[#FAF9F7] active:bg-[#F5F5F4] transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="View donation notifications"
                aria-expanded={notifDropdownOpen}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-4 h-4 bg-[#D92D45] text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-xs">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-[#E7E5E4] shadow-elevated py-3 z-50 animate-fade-in text-left">
                  <div className="px-4 pb-2.5 border-b border-[#E7E5E4]/80 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#1F2937]">Notifications</h3>
                      <p className="text-2xs text-[#667085]">
                        {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount === 1 ? '' : 's'}` : 'All caught up'}
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllReadMutation.mutate()}
                        className="text-2xs font-semibold text-[#D92D45] hover:text-[#B42318] flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-[#E7E5E4]/50">
                    {!notifData?.items || notifData.items.length === 0 ? (
                      <div className="py-8 text-center text-xs text-[#667085]">
                        No notifications yet.
                      </div>
                    ) : (
                      notifData.items.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={cn(
                            'p-3.5 hover:bg-[#FAF9F7] transition-colors cursor-pointer text-left',
                            notif.status !== 'READ' ? 'bg-[#FFF7F8]' : ''
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-[#1F2937] flex items-center gap-1.5">
                              {notif.status !== 'READ' && (
                                <span className="w-2 h-2 rounded-full bg-[#D92D45] shrink-0" />
                              )}
                              {notif.title}
                            </span>
                            <span className="text-2xs text-[#667085] shrink-0 font-mono">
                              {new Date(notif.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-2xs text-[#667085] mt-1 line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-2.5 px-3 border-t border-[#E7E5E4]/80 text-center">
                    <Link
                      to="/dashboard/opportunities"
                      onClick={() => setNotifDropdownOpen(false)}
                      className="text-xs font-semibold text-[#D92D45] hover:text-[#B42318] inline-flex items-center gap-1"
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
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#FAF9F7] hover:bg-white border border-[#E7E5E4] transition-colors cursor-pointer min-h-[40px]"
                  aria-label="User profile menu"
                >
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-bold text-[#1F2937] leading-tight">
                      {user.donorProfile.fullName}
                    </div>
                    <div className="text-[10px] text-[#667085] font-medium">Verified Donor</div>
                  </div>
                  <BloodGroupBadge bloodGroup={user.donorProfile.bloodGroup} size="sm" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-[#E7E5E4] shadow-elevated py-2 z-50 animate-fade-in text-xs text-left">
                    <div className="px-4 py-2 border-b border-[#E7E5E4]/80">
                      <div className="font-bold text-[#1F2937]">{user.donorProfile.fullName}</div>
                      <div className="text-[#667085] text-2xs truncate">{user.email}</div>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-[#1F2937] hover:bg-[#FAF9F7] hover:text-[#D92D45] transition"
                    >
                      <User className="w-4 h-4 text-[#667085]" />
                      Manage Profile & Consent
                    </Link>
                    <Link
                      to="/history"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-[#1F2937] hover:bg-[#FAF9F7] hover:text-[#D92D45] transition"
                    >
                      <History className="w-4 h-4 text-[#667085]" />
                      Donation Records
                    </Link>
                    <div className="border-t border-[#E7E5E4]/80 mt-1 pt-1">
                      <button
                        onClick={logout}
                        className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-[#D92D45] hover:bg-[#FFF0F2] transition cursor-pointer"
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

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E7E5E4] shadow-lg px-2 py-1 flex items-center justify-around">
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
                  isActive ? 'text-[#D92D45] font-bold' : 'text-[#667085] hover:text-[#1F2937]'
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
