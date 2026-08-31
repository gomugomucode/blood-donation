import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { HeartHandshake, Shield, Menu, X, LogIn, UserPlus, PhoneCall, AlertCircle } from 'lucide-react';
import { Button } from '../components/common/Button.js';
import { useAuth } from '../hooks/useAuth.js';

export const PublicLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      {/* Emergency Hotline Header Banner */}
      <div className="bg-slate-900 text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider">
              Emergency
            </span>
            <span className="text-slate-300 hidden sm:inline">24/7 Regional Transfusion & Blood Demand Coordination</span>
          </div>
          <a
            href="tel:+97714200000"
            className="inline-flex items-center gap-1.5 text-rose-400 hover:text-rose-300 font-mono font-semibold transition"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Hotline: +977-1-4200000</span>
          </a>
        </div>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-600/20 transition-transform group-hover:scale-105">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-lg tracking-tight block">HemaCare</span>
              <span className="text-[10px] text-rose-600 font-bold block -mt-1 tracking-wider uppercase">
                Blood Registry & Matching
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <Link
              to="/"
              className={`hover:text-rose-600 transition-colors py-1 ${
                location.pathname === '/' ? 'text-rose-600 font-bold border-b-2 border-rose-600' : ''
              }`}
            >
              Home
            </Link>

            {isAuthenticated ? (
              <Link
                to={isAdmin ? '/admin' : '/dashboard'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 font-bold border border-rose-200 hover:bg-rose-100 transition"
              >
                Go to {isAdmin ? 'Coordinator Command Center' : 'Donor Portal'} →
              </Link>
            ) : (
              <>
                <Link
                  to="/admin/login"
                  className="hover:text-slate-900 flex items-center gap-1.5 transition-colors px-2 py-1"
                >
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  Staff Portal
                </Link>
                <div className="h-4 w-px bg-slate-200" />
                <Link to="/login">
                  <Button variant="outline" size="sm" leftIcon={<LogIn className="w-3.5 h-3.5" />}>
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm" leftIcon={<UserPlus className="w-3.5 h-3.5" />}>
                    Register as Donor
                  </Button>
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Toggle Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-5 space-y-3 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-800 hover:text-rose-600"
            >
              Home
            </Link>

            {isAuthenticated ? (
              <Link
                to={isAdmin ? '/admin' : '/dashboard'}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2.5 px-3 rounded-lg bg-rose-50 text-sm font-bold text-rose-700 border border-rose-200"
              >
                Open {isAdmin ? 'Coordinator Command Center' : 'Donor Portal'} →
              </Link>
            ) : (
              <div className="pt-2 space-y-2 border-t border-slate-100">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-2.5 text-center text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-2.5 text-center text-sm font-bold text-white bg-rose-600 rounded-xl shadow-sm"
                >
                  Register as Donor
                </Link>
                <Link
                  to="/admin/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-center text-xs text-slate-500 hover:text-slate-700"
                >
                  Hospital Coordinator / Admin Login
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Page Body */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-slate-900 text-sm">HemaCare Blood Donation Network</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-slate-600 font-medium">
              <Link to="/login" className="hover:text-slate-900">Donor Portal</Link>
              <Link to="/admin/login" className="hover:text-slate-900">Staff Portal</Link>
              <Link to="/register" className="hover:text-rose-600">Become a Donor</Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-400 text-2xs">
            <p>© {new Date().getFullYear()} HemaCare Platform. All rights reserved.</p>
            <p className="flex items-center gap-1 text-slate-500">
              <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              Basic donation screening indicators are informational only and do not replace certified medical evaluation.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
