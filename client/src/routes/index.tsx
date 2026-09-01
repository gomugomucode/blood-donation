import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout.js';
import { DonorLayout } from '../layouts/DonorLayout.js';
import { AdminLayout } from '../layouts/AdminLayout.js';
import { ProtectedRoute } from '../components/auth/ProtectedRoute.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.js';
import { ErrorBoundary } from '../components/common/ErrorBoundary.js';
import { lazyWithRetry } from '../lib/lazyRetry.js';

// Public Pages (Code-split)
const HomePage = lazyWithRetry(() => import('../pages/HomePage.js'), 'HomePage');
const LoginPage = lazyWithRetry(() => import('../pages/LoginPage.js'), 'LoginPage');
const RegisterPage = lazyWithRetry(() => import('../pages/RegisterPage.js'), 'RegisterPage');
const AdminLoginPage = lazyWithRetry(() => import('../pages/AdminLoginPage.js'), 'AdminLoginPage');
const ForgotPasswordPage = lazyWithRetry(() => import('../pages/auth/ForgotPasswordPage.js'), 'ForgotPasswordPage');
const ResetPasswordPage = lazyWithRetry(() => import('../pages/auth/ResetPasswordPage.js'), 'ResetPasswordPage');

// Donor Pages (Code-split)
const DonorDashboardPage = lazyWithRetry(() => import('../pages/donor/DonorDashboardPage.js'), 'DonorDashboardPage');
const DonorProfilePage = lazyWithRetry(() => import('../pages/donor/DonorProfilePage.js'), 'DonorProfilePage');
const DonorHistoryPage = lazyWithRetry(() => import('../pages/donor/DonorHistoryPage.js'), 'DonorHistoryPage');
const DonorOpportunitiesPage = lazyWithRetry(() => import('../pages/donor/DonorOpportunitiesPage.js'), 'DonorOpportunitiesPage');
const DonorOpportunityDetailPage = lazyWithRetry(() => import('../pages/donor/DonorOpportunityDetailPage.js'), 'DonorOpportunityDetailPage');

// Admin Pages (Code-split)
const AdminDashboardPage = lazyWithRetry(() => import('../pages/admin/AdminDashboardPage.js'), 'AdminDashboardPage');
const AdminDonorsPage = lazyWithRetry(() => import('../pages/admin/AdminDonorsPage.js'), 'AdminDonorsPage');
const AdminDonorDetailPage = lazyWithRetry(() => import('../pages/admin/AdminDonorDetailPage.js'), 'AdminDonorDetailPage');
const AdminBloodRequestsPage = lazyWithRetry(() => import('../pages/admin/AdminBloodRequestsPage.js'), 'AdminBloodRequestsPage');
const AdminCreateBloodRequestPage = lazyWithRetry(() => import('../pages/admin/AdminCreateBloodRequestPage.js'), 'AdminCreateBloodRequestPage');
const AdminBloodRequestDetailPage = lazyWithRetry(() => import('../pages/admin/AdminBloodRequestDetailPage.js'), 'AdminBloodRequestDetailPage');
const AdminAuditLogsPage = lazyWithRetry(() => import('../pages/admin/AdminAuditLogsPage.js'), 'AdminAuditLogsPage');
const AdminOperationsPage = lazyWithRetry(() => import('../pages/admin/AdminOperationsPage.js'), 'AdminOperationsPage');

const RouteSuspenseFallback = () => (
  <div className="min-h-[50vh] flex items-center justify-center p-8">
    <LoadingSpinner label="Loading view..." size="md" />
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<RouteSuspenseFallback />}>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>

          {/* Admin Login (Isolated) */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Donor Protected Routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['DONOR', 'ADMIN']}>
                <DonorLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DonorDashboardPage />} />
            <Route path="/dashboard/opportunities" element={<DonorOpportunitiesPage />} />
            <Route path="/dashboard/opportunities/:id" element={<DonorOpportunityDetailPage />} />
            <Route path="/profile" element={<DonorProfilePage />} />
            <Route path="/history" element={<DonorHistoryPage />} />
          </Route>

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="donors" element={<AdminDonorsPage />} />
            <Route path="donors/:id" element={<AdminDonorDetailPage />} />
            <Route path="requests" element={<AdminBloodRequestsPage />} />
            <Route path="requests/create" element={<AdminCreateBloodRequestPage />} />
            <Route path="requests/:id" element={<AdminBloodRequestDetailPage />} />
            <Route path="operations" element={<AdminOperationsPage />} />
            <Route path="audit-logs" element={<AdminAuditLogsPage />} />
          </Route>

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};
