import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, Bus, Route } from '../../lib/supabase';
import { Plus, ArrowLeft, Bus as BusIcon } from 'lucide-react';

export default function BusesManagement() {
  const [buses, setBuses] = useState<(Bus & { routes?: Route })[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBuses();
  }, []);

  const loadBuses = async () => {
    const { data } = await supabase
      .from('buses')
      .select('*, routes(*)')
      .order('created_at', { ascending: false });

    setBuses(data || []);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-50 text-green-700';
      case 'maintenance':
        return 'bg-amber-50 text-amber-700';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link to="/admin" className="mr-4">
              <ArrowLeft className="w-6 h-6 text-slate-600 hover:text-slate-800" />
            </Link>
            <div>
              <h1 className="text-3xl font-semibold text-slate-800">Buses Management</h1>
              <p className="text-slate-500 mt-1">Add and manage bus fleet</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Bus
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {buses.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl shadow-sm p-12 border border-slate-100 text-center">
              <BusIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No buses added yet</p>
            </div>
          ) : (
            buses.map(bus => (
              <div key={bus.id} className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-slate-100 p-3 rounded-lg">
                    <BusIcon className="w-6 h-6 text-slate-700" />
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${getStatusColor(bus.status)}`}>
                    {bus.status}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-slate-800 mb-2">{bus.bus_number}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Capacity</span>
                    <span className="text-slate-800 font-medium">{bus.capacity} seats</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Route</span>
                    <span className="text-slate-800 font-medium">
                      {bus.routes?.name || 'Not assigned'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateBusModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadBuses();
          }}
        />
      )}
    </div>
  );
}

function CreateBusModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [busNumber, setBusNumber] = useState('');
  const [capacity, setCapacity] = useState('40');
  const [routeId, setRouteId] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive' | 'maintenance'>('active');
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    const { data } = await supabase
      .from('routes')
      .select('*')
      .eq('is_active', true);

    setRoutes(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('buses')
        .insert([{
          bus_number: busNumber,
          capacity: parseInt(capacity),
          route_id: routeId || null,
          status,
          created_by: user?.id
        }]);

      if (error) throw error;

      onSuccess();
    } catch (error) {
      console.error('Error creating bus:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-semibold text-slate-800 mb-6">Add New Bus</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Bus Number</label>
            <input
              type="text"
              value={busNumber}
              onChange={(e) => setBusNumber(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none"
              placeholder="e.g., MH-12-AB-1234"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Capacity</label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              required
              min="1"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Assign to Route</label>
            <select
              value={routeId}
              onChange={(e) => setRouteId(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none bg-white"
            >
              <option value="">Not assigned</option>
              {routes.map(route => (
                <option key={route.id} value={route.id}>{route.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none bg-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Bus'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
