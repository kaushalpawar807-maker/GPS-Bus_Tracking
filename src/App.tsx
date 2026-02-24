import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';

import AdminDashboard from './pages/admin/AdminDashboard';
import RoutesManagement from './pages/admin/RoutesManagement';
import RouteStudio from './pages/admin/RouteStudio';
import BusesManagement from './pages/admin/BusesManagement';
import TicketsView from './pages/admin/TicketsView';
import Reports from './pages/admin/Reports';
import MaintenanceDashboard from './pages/admin/MaintenanceDashboard';

import UserDashboard from './pages/user/UserDashboard';
import RoutesSearch from './pages/user/RoutesSearch';
import BookTicket from './pages/user/BookTicket';
import MyTickets from './pages/user/MyTickets';
import NearbyStops from './pages/user/NearbyStops';
import LiveTrack from './pages/user/LiveTrack';

import DriverDashboard from './pages/driver/DriverDashboard';
import ConductorDashboard from './pages/conductor/ConductorDashboard';

function RootRedirect() {
  const { profile } = useAuth();

  if (!profile) {
    return <Navigate to="/login" />;
  }

  switch (profile.role) {
    case 'admin':
      return <Navigate to="/admin" />;
    case 'driver':
      return <Navigate to="/driver" />;
    case 'conductor':
      return <Navigate to="/conductor" />;
    default:
      return <Navigate to="/user" />;
  }
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          <Route path="/" element={
            <ProtectedRoute>
              <RootRedirect />
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout><AdminDashboard /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/routes" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout><RoutesManagement /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/route-studio" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout><RouteStudio /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/buses" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout><BusesManagement /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/tickets" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout><TicketsView /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/reports" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout><Reports /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/maintenance" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout><MaintenanceDashboard /></DashboardLayout>
            </ProtectedRoute>
          } />

          {/* User Routes */}
          <Route path="/user" element={
            <ProtectedRoute allowedRoles={['user']}>
              <DashboardLayout><UserDashboard /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/user/routes" element={
            <ProtectedRoute allowedRoles={['user']}>
              <DashboardLayout><RoutesSearch /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/user/book" element={
            <ProtectedRoute allowedRoles={['user']}>
              <DashboardLayout><BookTicket /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/user/tickets" element={
            <ProtectedRoute allowedRoles={['user']}>
              <DashboardLayout><MyTickets /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/user/nearby" element={
            <ProtectedRoute allowedRoles={['user']}>
              <DashboardLayout><NearbyStops /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/user/track/:busId" element={
            <ProtectedRoute allowedRoles={['user']}>
              <DashboardLayout><LiveTrack /></DashboardLayout>
            </ProtectedRoute>
          } />

          {/* Driver/Conductor Routes */}
          <Route path="/driver" element={
            <ProtectedRoute allowedRoles={['driver']}>
              <DashboardLayout><DriverDashboard /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/conductor" element={
            <ProtectedRoute allowedRoles={['conductor']}>
              <DashboardLayout><ConductorDashboard /></DashboardLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
