import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, Route, Stop, Bus, Ticket } from '../../lib/supabase';
import Map from '../../components/Map';
import { LatLngExpression } from 'leaflet';
import { Bus as BusIcon, Route as RouteIcon, MapPin, Ticket as TicketIcon, AlertTriangle, Wrench } from 'lucide-react';
import { getSimulatedBusMarkers } from '../../utils/simulatedBus';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalBuses: 0,
    totalRoutes: 0,
    totalUsers: 0,
    totalTickets: 0,
  });
  const [routes, setRoutes] = useState<Route[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [busesRes, routesRes, usersRes, ticketsRes, stopsRes] = await Promise.all([
        supabase.from('buses').select('id'),
        supabase.from('routes').select('*'),
        supabase.from('profiles').select('id').eq('role', 'user'),
        supabase.from('tickets').select('id'),
        supabase.from('stops').select('*'),
      ]);

      setStats({
        totalBuses: busesRes.data?.length || 0,
        totalRoutes: routesRes.data?.length || 0,
        totalUsers: usersRes.data?.length || 0,
        totalTickets: ticketsRes.data?.length || 0,
      });

      setRoutes(routesRes.data || []);
      setStops(stopsRes.data || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const mapMarkers = [
    ...stops.map(stop => ({
      position: [stop.latitude, stop.longitude] as LatLngExpression,
      label: stop.name,
      type: 'stop' as const,
    })),
    ...getSimulatedBusMarkers(),
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-800">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage your bus tracking system</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<BusIcon className="w-6 h-6" />}
            label="Total Buses"
            value={stats.totalBuses}
            color="bg-blue-50 text-blue-600"
          />
          <StatCard
            icon={<RouteIcon className="w-6 h-6" />}
            label="Total Routes"
            value={stats.totalRoutes}
            color="bg-green-50 text-green-600"
          />
          <StatCard
            icon={<MapPin className="w-6 h-6" />}
            label="Total Users"
            value={stats.totalUsers}
            color="bg-amber-50 text-amber-600"
          />
          <StatCard
            icon={<TicketIcon className="w-6 h-6" />}
            label="Total Tickets"
            value={stats.totalTickets}
            color="bg-slate-50 text-slate-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Link
            to="/admin/routes"
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition border border-slate-100"
          >
            <RouteIcon className="w-8 h-8 text-slate-700 mb-3" />
            <h3 className="text-lg font-medium text-slate-800 mb-1">Manage Routes</h3>
            <p className="text-slate-500 text-sm">Create and edit bus routes</p>
          </Link>

          <Link
            to="/admin/buses"
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition border border-slate-100"
          >
            <BusIcon className="w-8 h-8 text-slate-700 mb-3" />
            <h3 className="text-lg font-medium text-slate-800 mb-1">Manage Buses</h3>
            <p className="text-slate-500 text-sm">Add and assign buses to routes</p>
          </Link>

          <Link
            to="/admin/tickets"
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition border border-slate-100"
          >
            <TicketIcon className="w-8 h-8 text-slate-700 mb-3" />
            <h3 className="text-lg font-medium text-slate-800 mb-1">View Tickets</h3>
            <p className="text-slate-500 text-sm">Monitor ticket bookings</p>
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-slate-100">
          <h2 className="text-xl font-medium text-slate-800 mb-4">Routes & Stops Map</h2>
          <Map markers={mapMarkers} className="h-[500px]" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-slate-700 mr-2" />
              <h3 className="text-lg font-medium text-slate-800">Accident Alerts</h3>
            </div>
            <p className="text-slate-500 text-sm mb-4">
              Real-time accident detection and alert system will be available in Phase-2 with hardware integration.
            </p>
            <div className="text-sm text-slate-400">Coming soon...</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center mb-4">
              <Wrench className="w-6 h-6 text-slate-700 mr-2" />
              <h3 className="text-lg font-medium text-slate-800">Maintenance Predictions</h3>
            </div>
            <p className="text-slate-500 text-sm mb-4">
              AI-powered predictive maintenance analytics will be available in Phase-2 with machine learning integration.
            </p>
            <div className="text-sm text-slate-400">Coming soon...</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
      <div className={`inline-flex p-3 rounded-lg ${color} mb-3`}>
        {icon}
      </div>
      <div className="text-2xl font-semibold text-slate-800 mb-1">{value}</div>
      <div className="text-slate-500 text-sm">{label}</div>
    </div>
  );
}
