import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { HeartHandshake, Menu, X, LogIn, UserPlus, PhoneCall, AlertCircle, Droplets } from 'lucide-react';
import { Button } from '../components/common/Button.js';
import { useAuth } from '../hooks/useAuth.js';

export const PublicLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, isAdmin } = useAuth();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle Escape key and body scroll lock for mobile menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F7] font-sans text-[#1F2937] overflow-x-hidden">
      {/* 1. Emergency Coordination Banner (Deep Burgundy #8F1D35) */}
      <div className="bg-[#8F1D35] text-white text-xs py-2 px-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider">
              24/7 Hotline
            </span>
            <span className="text-white/90 text-xs font-medium text-center sm:text-left">
              Regional Blood Demand & Emergency Transfusion Coordination
            </span>
          </div>
          <a
            href="tel:+97714200000"
            className="inline-flex items-center gap-1.5 text-white hover:text-white/80 font-mono font-semibold transition py-1"
          >
            <PhoneCall className="w-3.5 h-3.5 text-rose-200" />
            <span>Emergency Line: +977-1-4200000</span>
          </a>
        </div>
      </div>

      {/* 2. Light Healthcare Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E7E5E4] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-[#D92D45] flex items-center justify-center text-white shadow-xs transition-transform group-hover:scale-105">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-[#1F2937] text-lg tracking-tight block">HemaCare</span>
              <span className="text-[10px] text-[#D92D45] font-bold block -mt-1 tracking-wider uppercase">
                Blood Donation Network
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-[#667085]">
            <Link
              to="/"
              className={`hover:text-[#D92D45] transition-colors py-1 ${
                location.pathname === '/' ? 'text-[#D92D45] font-bold border-b-2 border-[#D92D45]' : ''
              }`}
            >
              Home
            </Link>
            <a
              href="#compatibility"
              className="hover:text-[#D92D45] transition-colors py-1"
            >
              Blood Compatibility
            </a>
            <a
              href="#how-it-works"
              className="hover:text-[#D92D45] transition-colors py-1"
            >
              How It Works
            </a>

            {isAuthenticated ? (
              <Link
                to={isAdmin ? '/admin' : '/dashboard'}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FFF0F2] text-[#D92D45] font-bold border border-[#FFE4E8] hover:bg-[#FFE4E8] transition min-h-[40px]"
              >
                Go to {isAdmin ? 'Coordinator Command Center' : 'Donor Dashboard'} →
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login">
                  <Button variant="outline" size="sm" leftIcon={<LogIn className="w-3.5 h-3.5" />} className="min-h-[40px]">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm" leftIcon={<UserPlus className="w-3.5 h-3.5" />} className="min-h-[40px]">
                    Become a Donor
                  </Button>
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Toggle Button (Min 44x44 touch target) */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 text-[#1F2937] hover:text-[#D92D45] focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-[#FFF7F8] active:bg-[#FFE4E8] transition"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu with Backdrop */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 top-16 bg-slate-900/40 backdrop-blur-xs z-30 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="relative z-40 md:hidden bg-white border-b border-[#E7E5E4] px-5 pt-4 pb-6 space-y-3 shadow-lg animate-fade-in text-left">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2.5 text-sm font-semibold text-[#1F2937] hover:text-[#D92D45] active:text-[#D92D45]"
              >
                Home
              </Link>
              <a
                href="#compatibility"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2.5 text-sm font-medium text-[#667085] hover:text-[#D92D45]"
              >
                Blood Compatibility
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2.5 text-sm font-medium text-[#667085] hover:text-[#D92D45]"
              >
                How It Works
              </a>

              {isAuthenticated ? (
                <Link
                  to={isAdmin ? '/admin' : '/dashboard'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-3 px-4 rounded-xl bg-[#FFF0F2] text-sm font-bold text-[#D92D45] border border-[#FFE4E8] text-center"
                >
                  Open {isAdmin ? 'Coordinator Command Center' : 'Donor Dashboard'} →
                </Link>
              ) : (
                <div className="pt-3 space-y-2.5 border-t border-[#E7E5E4]">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full py-3 text-center text-sm font-semibold text-[#1F2937] bg-[#FAF9F7] border border-[#E7E5E4] rounded-xl hover:bg-white active:bg-slate-100 min-h-[44px]"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full py-3 text-center text-sm font-bold text-white bg-[#D92D45] hover:bg-[#B42318] active:bg-[#8F1D35] rounded-xl shadow-xs min-h-[44px]"
                  >
                    Become a Donor
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </header>

      {/* Main Page Body */}
      <main className="flex-1 w-full">
        <Outlet />
      </main>

      {/* 3. Warm Healthcare Footer */}
      <footer className="bg-white border-t border-[#E7E5E4] py-10 text-xs text-[#667085]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 text-left">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#E7E5E4] pb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#D92D45] flex items-center justify-center text-white">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-[#1F2937] text-sm block">HemaCare Transfusion Registry</span>
                <span className="text-[11px] text-[#667085]">Voluntary Blood Donor Network</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-xs text-[#667085] font-medium">
              <Link to="/login" className="hover:text-[#D92D45] transition-colors py-1">
                Portal Sign In
              </Link>
              <Link to="/register" className="hover:text-[#D92D45] transition-colors font-semibold py-1">
                Become a Donor
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-2xs text-[#667085]">
            <p>© {new Date().getFullYear()} HemaCare Platform. All rights reserved.</p>
            <p className="flex items-center gap-1.5 text-center sm:text-right text-[#667085]">
              <AlertCircle className="w-3.5 h-3.5 text-[#B45309] shrink-0" />
              Basic donation screening indicators are informational and do not substitute for on-site clinical assessment.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
