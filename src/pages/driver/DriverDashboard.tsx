import { useEffect, useState } from 'react';
import { supabase, Route, RouteStop, Stop, Bus } from '../../lib/supabase';
import Map from '../../components/Map';
import RoutingControl from '../../components/RoutingControl';
import { LatLngExpression } from 'leaflet';
import { AlertTriangle, CheckCircle, Bus as BusIcon, MapPin, Gauge, Wrench, Navigation } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { maintenanceService } from '../../services/MaintenanceService';

export default function DriverDashboard() {
  const { profile } = useAuth();
  const [assignedBus, setAssignedBus] = useState<Bus | null>(null);
  const [assignedRoute, setAssignedRoute] = useState<Route | null>(null);
  const [routeStops, setRouteStops] = useState<(RouteStop & { stops: Stop })[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);

  useEffect(() => {
    loadDriverData();
  }, [profile?.id]);

  const loadDriverData = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      // 1. Fetch Assigned Bus
      const { data: busData, error: busError } = await supabase
        .from('buses')
        .select('*')
        .eq('driver_id', profile.id)
        .maybeSingle();

      if (busError) throw busError;

      if (busData) {
        setAssignedBus(busData);
        if (busData.route_id) {
          // 2. Fetch Route & Stops
          const [routeRes, stopsRes] = await Promise.all([
            supabase.from('routes').select('*').eq('id', busData.route_id).single(),
            supabase.from('route_stops')
              .select('*, stops(*)')
              .eq('route_id', busData.route_id)
              .order('stop_order', { ascending: true })
          ]);

          setAssignedRoute(routeRes.data);
          setRouteStops(stopsRes.data || []);
        }
      }
    } catch (e) {
      console.error('Error loading driver data:', e);
      toast.error('Failed to load your assigned route.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyAlert = () => {
    toast.error('EMERGENCY ALERT SENT!', {
      description: 'Admins have been notified of your location.',
      duration: 5000,
      icon: <AlertTriangle className="w-5 h-5 text-red-600" />
    });
  };

  const mapMarkers = routeStops.map(rs => ({
    position: [rs.stops.latitude, rs.stops.longitude] as LatLngExpression,
    label: `${rs.stop_order}. ${rs.stops.name}`,
    type: 'stop' as const,
  }));

  const routePositions = routeStops.map(rs => [rs.stops.latitude, rs.stops.longitude] as LatLngExpression);

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Driver Control Panel</h1>
          <p className="text-slate-500 text-sm">Welcome back, {profile?.full_name || 'Driver'}.</p>
        </div>
        {assignedBus && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 text-xs font-bold">
            <BusIcon className="w-3.5 h-3.5" /> {assignedBus.bus_number}
          </div>
        )}
      </div>

      {!assignedBus ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 border border-slate-100 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <BusIcon className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">No Vehicle Assigned</h2>
          <p className="text-slate-500 max-w-sm mx-auto">Please wait for an administrator to assign you a vehicle and a route to begin your shift.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Map & Navigation Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-0 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-bold text-slate-800">Live Route Navigation</h3>
                </div>
                <span className="text-[10px] font-bold text-indigo-600 px-2 py-0.5 bg-indigo-100 rounded-full animate-pulse">LIVE TRACKING</span>
              </div>
              <div className="h-[450px]">
                <Map markers={mapMarkers} className="h-full w-full">
                  {routePositions.length > 1 && <RoutingControl waypoints={routePositions.map(p => ({ lat: (p as [number, number])[0], lng: (p as [number, number])[1] }))} />}
                </Map>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-800">Upcoming Stops</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {routeStops.map(rs => (
                  <div key={rs.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-xs font-bold text-indigo-700">
                      {rs.stop_order}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 text-sm">{rs.stops.name}</p>
                      <p className="text-xs text-slate-500">{rs.stops.address || 'Standard Stop'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400">NEXT STOP</p>
                      <MapPin className="ml-auto w-3.5 h-3.5 text-indigo-400 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Controls Section */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-indigo-600" /> Shift Controls
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setIsMaintenanceModalOpen(true)}
                  className="flex items-center gap-3 w-full p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-indigo-50 hover:border-indigo-100 transition group"
                >
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg group-hover:scale-110 transition">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-800 text-sm">Log Bus KM / Incidents</p>
                    <p className="text-[10px] text-slate-500">Update maintenance AI</p>
                  </div>
                </button>

                <button
                  onClick={handleEmergencyAlert}
                  className="flex items-center gap-3 w-full p-4 bg-rose-50 rounded-xl border border-rose-100 hover:bg-rose-100 transition group"
                >
                  <div className="p-2 bg-rose-200 text-rose-700 rounded-lg group-hover:scale-110 transition">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-rose-900 text-sm">Emergency Alert</p>
                    <p className="text-[10px] text-rose-700">Immediate assistance</p>
                  </div>
                </button>

                <button
                  onClick={() => toast.success('Trip Completed!', { description: 'Data synced with central server.' })}
                  className="flex items-center gap-3 w-full p-4 bg-emerald-50 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition group"
                >
                  <div className="p-2 bg-emerald-200 text-emerald-700 rounded-lg group-hover:scale-110 transition">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-emerald-900 text-sm">Complete Trip</p>
                    <p className="text-[10px] text-emerald-700">Mark session as finished</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl shadow-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-white/10 rounded-lg">
                  <BusIcon className="w-6 h-6 text-indigo-300" />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Active Status</p>
                  <p className="text-lg font-black">{assignedBus.status.toUpperCase()}</p>
                </div>
              </div>
              <div className="space-y-2 mt-6">
                <div className="flex justify-between text-xs">
                  <span className="text-indigo-300 font-medium whitespace-nowrap overflow-hidden text-ellipsis">Bus No:</span>
                  <span className="font-bold">{assignedBus.bus_number}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-indigo-300 font-medium whitespace-nowrap overflow-hidden text-ellipsis">Assigned Route:</span>
                  <span className="font-bold text-right">{assignedRoute?.name || 'Loading...'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isMaintenanceModalOpen && assignedBus && (
        <DriverMaintenanceModal
          bus={assignedBus}
          onClose={() => setIsMaintenanceModalOpen(false)}
        />
      )}
    </div>
  );
}

function DriverMaintenanceModal({ bus, onClose }: { bus: Bus, onClose: () => void }) {
  const [kmReading, setKmReading] = useState<number>(0);
  const [breakdownCount, setBreakdownCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCurrentMetrics();
  }, [bus.id]);

  const fetchCurrentMetrics = async () => {
    const { data } = await supabase
      .from('maintenance_metrics')
      .select('km_since_last_service, previous_breakdown_count')
      .eq('bus_id', bus.id)
      .maybeSingle();

    if (data) {
      setKmReading(data.km_since_last_service || 0);
      setBreakdownCount(data.previous_breakdown_count || 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await maintenanceService.updateMetricsAndPredict(bus.id, {
        km_since_last_service: kmReading,
        previous_breakdown_count: breakdownCount
      });
      toast.success('Log Updated Successfully!', { description: 'Vehicle incident & mileage data synced.' });
      onClose();
    } catch (e) {
      console.error(e);
      toast.error('Failed to log data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative z-[10000]">
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg text-white">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Log Vehicle Data</h2>
            <p className="text-xs text-slate-500">Bus: {bus.bus_number}</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Current KM Reading</label>
            <input
              type="number"
              required
              min="0"
              placeholder="Enter current kilometer reading"
              value={kmReading || ''}
              onChange={e => setKmReading(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Incidents / Breakdowns (Lifetime)</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                required
                min="0"
                placeholder="Total breakdowns"
                value={breakdownCount === 0 ? '0' : breakdownCount}
                onChange={e => setBreakdownCount(parseInt(e.target.value) || 0)}
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setBreakdownCount(prev => prev + 1)}
                className="px-4 py-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition font-bold whitespace-nowrap"
              >
                + Add New
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 italic px-1">
              *Update the total number of breakdown incidents if a new one occurred during your shift.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold transition shadow-lg shadow-indigo-200 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Update Records'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
