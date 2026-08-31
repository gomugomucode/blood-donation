import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { HeartHandshake, Shield, Menu, X, LogIn, UserPlus } from 'lucide-react';
import { Button } from '../components/common/Button.js';
import { useAuth } from '../hooks/useAuth.js';

export const PublicLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-crimson-600 flex items-center justify-center text-white shadow-xs">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-lg tracking-tight">HemaCare</span>
              <span className="text-2xs text-crimson-600 font-semibold block -mt-1 tracking-wider uppercase">
                Blood Registry
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <Link
              to="/"
              className={`hover:text-crimson-600 transition-colors ${
                location.pathname === '/' ? 'text-crimson-600 font-bold' : ''
              }`}
            >
              Home
            </Link>

            {isAuthenticated ? (
              <Link
                to={isAdmin ? '/admin' : '/dashboard'}
                className="text-crimson-600 font-bold hover:underline"
              >
                Go to {isAdmin ? 'Admin Dashboard' : 'Donor Portal'} →
              </Link>
            ) : (
              <>
                <Link
                  to="/admin/login"
                  className="hover:text-slate-900 flex items-center gap-1 transition-colors"
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
              className="p-2 text-slate-600 hover:text-slate-900 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-3 shadow-lg">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700"
            >
              Home
            </Link>

            {isAuthenticated ? (
              <Link
                to={isAdmin ? '/admin' : '/dashboard'}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-bold text-crimson-600"
              >
                Go to {isAdmin ? 'Admin Dashboard' : 'Donor Portal'}
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm font-semibold text-slate-700"
                >
                  Donor Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm font-bold text-crimson-600"
                >
                  Register as Donor
                </Link>
                <Link
                  to="/admin/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm text-slate-500"
                >
                  Staff / Admin Login
                </Link>
              </>
            )}
          </div>
        )}
      </header>

      {/* Main Page Body */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <div className="flex items-center justify-center gap-2 font-bold text-slate-800">
            <HeartHandshake className="w-4 h-4 text-crimson-600" />
            HemaCare Blood Donation Management Platform
          </div>
          <p>Connecting eligible voluntary blood donors with regional healthcare facilities.</p>
          <p className="text-2xs text-slate-400">
            © {new Date().getFullYear()} HemaCare Foundation. All rights reserved. Not a substitute for formal medical evaluation.
          </p>
        </div>
      </footer>
    </div>
  );
};
