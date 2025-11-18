import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';

import AdminDashboard from './pages/admin/AdminDashboard';
import RoutesManagement from './pages/admin/RoutesManagement';
import BusesManagement from './pages/admin/BusesManagement';
import TicketsView from './pages/admin/TicketsView';

import UserDashboard from './pages/user/UserDashboard';
import RoutesSearch from './pages/user/RoutesSearch';
import BookTicket from './pages/user/BookTicket';
import MyTickets from './pages/user/MyTickets';
import NearbyStops from './pages/user/NearbyStops';

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

          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout><AdminDashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/routes" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout><RoutesManagement /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/buses" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout><BusesManagement /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/tickets" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout><TicketsView /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/user" element={
            <ProtectedRoute allowedRoles={['user']}>
              <Layout><UserDashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/user/routes" element={
            <ProtectedRoute allowedRoles={['user']}>
              <Layout><RoutesSearch /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/user/book" element={
            <ProtectedRoute allowedRoles={['user']}>
              <Layout><BookTicket /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/user/tickets" element={
            <ProtectedRoute allowedRoles={['user']}>
              <Layout><MyTickets /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/user/nearby" element={
            <ProtectedRoute allowedRoles={['user']}>
              <Layout><NearbyStops /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/driver" element={
            <ProtectedRoute allowedRoles={['driver']}>
              <Layout><DriverDashboard /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/conductor" element={
            <ProtectedRoute allowedRoles={['conductor']}>
              <Layout><ConductorDashboard /></Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
