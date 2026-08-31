import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout.js';
import { DonorLayout } from '../layouts/DonorLayout.js';
import { AdminLayout } from '../layouts/AdminLayout.js';
import { ProtectedRoute } from '../components/auth/ProtectedRoute.js';

// Public Pages
import { HomePage } from '../pages/HomePage.js';
import { LoginPage } from '../pages/LoginPage.js';
import { RegisterPage } from '../pages/RegisterPage.js';
import { AdminLoginPage } from '../pages/AdminLoginPage.js';

// Donor Pages
import { DonorDashboardPage } from '../pages/donor/DonorDashboardPage.js';
import { DonorProfilePage } from '../pages/donor/DonorProfilePage.js';
import { DonorHistoryPage } from '../pages/donor/DonorHistoryPage.js';

// Admin Pages
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage.js';
import { AdminDonorsPage } from '../pages/admin/AdminDonorsPage.js';
import { AdminDonorDetailPage } from '../pages/admin/AdminDonorDetailPage.js';
import { AdminBloodRequestsPage } from '../pages/admin/AdminBloodRequestsPage.js';
import { AdminCreateBloodRequestPage } from '../pages/admin/AdminCreateBloodRequestPage.js';
import { AdminBloodRequestDetailPage } from '../pages/admin/AdminBloodRequestDetailPage.js';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
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
      </Route>

      {/* Catch-all Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
