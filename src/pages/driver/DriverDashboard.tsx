import { useEffect, useState } from 'react';
import { supabase, Route, RouteStop, Stop } from '../../lib/supabase';
import Map from '../../components/Map';
import { LatLngExpression } from 'leaflet';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export default function DriverDashboard() {
  const [assignedRoute, setAssignedRoute] = useState<Route | null>(null);
  const [routeStops, setRouteStops] = useState<(RouteStop & { stops: Stop })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDriverData();
  }, []);

  const loadDriverData = async () => {
    setLoading(false);
  };

  const handleEmergencyAlert = () => {
    alert('Emergency alert feature will be available in Phase-2 with hardware integration.');
  };

  const handleTripComplete = () => {
    alert('Trip completion tracking will be available in Phase-2.');
  };

  const mapMarkers = routeStops.map(rs => ({
    position: [rs.stops.latitude, rs.stops.longitude] as LatLngExpression,
    label: `${rs.stop_order}. ${rs.stops.name}`,
    type: 'stop' as const,
  }));

  const routeLine = routeStops.length > 0 ? [{
    positions: routeStops.map(rs => [rs.stops.latitude, rs.stops.longitude] as LatLngExpression),
    color: '#64748b',
  }] : [];

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-800">Driver Panel</h1>
          <p className="text-slate-500 mt-1">Manage your assigned route</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <button
            onClick={handleEmergencyAlert}
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition border border-red-200 hover:border-red-300"
          >
            <AlertTriangle className="w-8 h-8 text-red-600 mb-3" />
            <h3 className="text-lg font-medium text-slate-800 mb-1">Emergency Alert</h3>
            <p className="text-slate-500 text-sm">Report an emergency situation</p>
          </button>

          <button
            onClick={handleTripComplete}
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition border border-green-200 hover:border-green-300"
          >
            <CheckCircle className="w-8 h-8 text-green-600 mb-3" />
            <h3 className="text-lg font-medium text-slate-800 mb-1">Trip Completed</h3>
            <p className="text-slate-500 text-sm">Mark current trip as complete</p>
          </button>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="text-sm text-slate-500 mb-1">Current Status</div>
            <div className="text-2xl font-semibold text-slate-800">On Route</div>
            <div className="text-sm text-slate-500 mt-2">Phase-2 will include live tracking</div>
          </div>
        </div>

        {assignedRoute ? (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
              <h2 className="text-xl font-medium text-slate-800 mb-2">{assignedRoute.name}</h2>
              <p className="text-slate-500 mb-4">{assignedRoute.description}</p>
              <Map markers={mapMarkers} routes={routeLine} className="h-[400px]" />
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
              <h2 className="text-lg font-medium text-slate-800 mb-4">Route Stops</h2>
              <div className="space-y-2">
                {routeStops.map(rs => (
                  <div key={rs.id} className="flex items-center p-3 border border-slate-200 rounded-lg">
                    <div className="bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-slate-700 mr-3">
                      {rs.stop_order}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-800">{rs.stops.name}</div>
                      <div className="text-sm text-slate-500">{rs.stops.address}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 border border-slate-100 text-center">
            <p className="text-slate-500 mb-2">No route assigned yet</p>
            <p className="text-sm text-slate-400">Contact admin to assign a route</p>
          </div>
        )}
      </div>
    </div>
  );
}
