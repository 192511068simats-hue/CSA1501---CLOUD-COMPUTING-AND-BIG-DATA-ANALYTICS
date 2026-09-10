import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ToastProvider } from './components/ui/Toast';
import { DashboardLayout } from './layouts/DashboardLayout';
import { PublicLayout } from './layouts/PublicLayout';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CertificateUpload } from './pages/CertificateUpload';
import { Certificates } from './pages/Certificates';
import { Blockchain } from './pages/Blockchain';
import { Verify } from './pages/Verify';
import { Users } from './pages/Users';
import { Profile } from './pages/Profile';
import { AdminStudents } from './pages/admin/AdminStudents';
import { AdminCertificateReview } from './pages/admin/AdminCertificateReview';
import { AdminActivityLogs } from './pages/admin/AdminActivityLogs';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-50/50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-navy-500 mt-3">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/verify/:id" element={<Verify />} />
      </Route>

      {/* Auth */}
      <Route path="/login" element={<Login />} />

      {/* Protected Dashboard Routes */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route
          path="certificates/upload"
          element={
            <ProtectedRoute allowedRoles={['admin', 'institution', 'student']}>
              <CertificateUpload />
            </ProtectedRoute>
          }
        />
        <Route path="certificates" element={<Certificates />} />
        <Route path="blockchain" element={<Blockchain />} />
        
        {/* Admin Specific Routes */}
        <Route
          path="admin/certificates/:certificateId"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminCertificateReview />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/students"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminStudents />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/activity-logs"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminActivityLogs />
            </ProtectedRoute>
          }
        />

        <Route
          path="users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Profile />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
