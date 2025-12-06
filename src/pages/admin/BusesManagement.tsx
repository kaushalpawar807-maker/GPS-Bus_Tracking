import { useEffect, useState } from 'react';
import { supabase, Bus, Route } from '../../lib/supabase';
import { Plus } from 'lucide-react';
import DataGrid, { Column } from '../../components/DataGrid';

import { useNavigate } from 'react-router-dom';

export default function BusesManagement() {
  const [buses, setBuses] = useState<(Bus & { routes?: Route })[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  const handleRowAction = (action: string, bus: Bus) => {
    if (action === 'view_map') {
      // Navigate to the live tracking view for this bus
      navigate(`/user/track/${bus.id}`);
    } else if (action === 'edit') {
      // TODO: Implement Edit Modal
      setShowCreateModal(true);
    } else if (action === 'delete') {
      // TODO: Implement Delete
      alert(`Delete bus ${bus.bus_number}?`);
    }
  };

  const columns: Column<Bus & { routes?: Route }>[] = [
    {
      key: 'bus_number',
      header: 'Bus Number',
      render: (bus) => <span className="font-semibold text-slate-800">{bus.bus_number}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (bus) => {
        const colors = {
          active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
          maintenance: 'bg-amber-50 text-amber-700 ring-amber-600/20',
          inactive: 'bg-slate-100 text-slate-600 ring-slate-600/20'
        };
        return (
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ring-1 ring-inset ${colors[bus.status as keyof typeof colors]}`}>
            {bus.status.charAt(0).toUpperCase() + bus.status.slice(1)}
          </span>
        );
      },
    },
    {
      key: 'capacity',
      header: 'Capacity',
      render: (bus) => <span className="text-slate-600">{bus.capacity} Seats</span>,
    },
    {
      key: 'route',
      header: 'Assigned Route',
      render: (bus) => (
        bus.routes ? (
          <div className="flex flex-col">
            <span className="font-medium text-slate-800">{bus.routes.name}</span>
            <span className="text-xs text-slate-400 truncate max-w-[200px]">{bus.routes.description}</span>
          </div>
        ) : (
          <span className="text-slate-400 italic">Unassigned</span>
        )
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: () => (
        <button className="text-indigo-600 hover:text-indigo-900 font-medium text-xs">Edit</button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Fleet Management</h1>
          <p className="text-slate-500">Manage your bus fleet and assignments.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Vehicle
        </button>
      </div>

      <DataGrid
        columns={columns}
        data={buses}
        loading={loading}
        title="All Vehicles"
        description="Overview of all buses in the fleet."
        onRowAction={handleRowAction}
        onRowClick={(bus) => navigate(`/user/track/${bus.id}`)}
      />

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Add New Vehicle</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Bus Number</label>
            <input
              type="text"
              value={busNumber}
              onChange={(e) => setBusNumber(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
              placeholder="e.g., MH-12-AB-1234"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Capacity</label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              required
              min="1"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Assign to Route</label>
            <select
              value={routeId}
              onChange={(e) => setRouteId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            >
              <option value="">Not assigned</option>
              {routes.map(route => (
                <option key={route.id} value={route.id}>{route.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
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
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-medium shadow-lg shadow-indigo-200"
            >
              {loading ? 'Adding...' : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
