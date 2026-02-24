import { useEffect, useState } from 'react';
import { supabase, Bus, Route, Profile } from '../../lib/supabase';
import { Plus, User } from 'lucide-react';
import DataGrid, { Column } from '../../components/DataGrid';
import { useNavigate } from 'react-router-dom';

export default function BusesManagement() {
  const [buses, setBuses] = useState<(Bus & { routes?: Route })[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBus, setEditingBus] = useState<(Bus & { routes?: Route }) | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadBuses();
  }, []);

  const loadBuses = async () => {
    const { data } = await supabase
      .from('buses')
      .select('*, routes(*), profiles:driver_id(*)')
      .order('created_at', { ascending: false });

    setBuses(data || []);
    setLoading(false);
  };

  const handleCreate = () => {
    setEditingBus(null);
    setIsModalOpen(true);
  };

  const handleEdit = (bus: Bus & { routes?: Route }) => {
    setEditingBus(bus);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingBus(null);
  };

  const handleModalSuccess = () => {
    handleModalClose();
    loadBuses();
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
      key: 'driver',
      header: 'Assigned Driver',
      render: (bus: any) => (
        bus.profiles ? (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
              <User className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-slate-800 text-sm">{bus.profiles.full_name || bus.profiles.email}</span>
              <span className="text-[10px] text-slate-400">{bus.profiles.phone || 'No Phone'}</span>
            </div>
          </div>
        ) : (
          <span className="text-slate-400 text-xs italic">Unassigned</span>
        )
      ),
    },
    {
      key: 'device_id',
      header: 'Hardware Device',
      render: (bus) => (
        bus.device_id ? (
          <code className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-mono border border-slate-200">
            {bus.device_id}
          </code>
        ) : (
          <span className="text-slate-400 text-xs italic">Unlinked</span>
        )
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (bus) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(bus);
          }}
          className="text-indigo-600 hover:text-indigo-900 font-medium text-xs px-2 py-1 rounded hover:bg-slate-100"
        >
          Edit
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Fleet Management</h1>
          <p className="text-slate-500">Manage your bus fleet and hardware assignments.</p>
        </div>
        <button
          onClick={handleCreate}
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
        description="Overview of all buses, routes, and connected hardware."
        onRowClick={(bus) => navigate(`/user/track/${bus.id}`)}
      />

      {isModalOpen && (
        <BusModal
          initialData={editingBus}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}

function BusModal({ initialData, onClose, onSuccess }: { initialData: (Bus & { routes?: Route }) | null, onClose: () => void; onSuccess: () => void }) {
  const [busNumber, setBusNumber] = useState(initialData?.bus_number || '');
  const [capacity, setCapacity] = useState(initialData?.capacity.toString() || '40');
  const [routeId, setRouteId] = useState(initialData?.route_id || '');
  const [driverId, setDriverId] = useState(initialData?.driver_id || '');
  const [deviceId, setDeviceId] = useState(initialData?.device_id || '');
  const [status, setStatus] = useState<'active' | 'inactive' | 'maintenance'>(initialData?.status || 'active');
  const [routes, setRoutes] = useState<Route[]>([]);
  const [drivers, setDrivers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    const [routesRes, driversRes] = await Promise.all([
      supabase.from('routes').select('*').eq('is_active', true),
      supabase.from('profiles').select('*').eq('role', 'driver')
    ]);

    setRoutes(routesRes.data || []);
    setDrivers(driversRes.data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Clean up common device ID issues (whitespace)
      const cleanDeviceId = deviceId?.trim() || null;

      if (initialData) {
        // UPDATE Existing Bus
        const { error } = await supabase
          .from('buses')
          .update({
            bus_number: busNumber,
            capacity: parseInt(capacity),
            route_id: routeId || null,
            driver_id: driverId || null,
            device_id: cleanDeviceId,
            status,
            updated_at: new Date().toISOString()
          })
          .eq('id', initialData.id);

        if (error) throw error;
      } else {
        // CREATE New Bus
        const { error } = await supabase
          .from('buses')
          .insert([{
            bus_number: busNumber,
            capacity: parseInt(capacity),
            route_id: routeId || null,
            driver_id: driverId || null,
            device_id: cleanDeviceId,
            status,
            created_by: user?.id
          }]);

        if (error) throw error;
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving bus:', error);
      alert('Failed to save bus details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
        <h2 className="text-xl font-bold text-slate-800 mb-6">
          {initialData ? 'Edit Vehicle' : 'Add New Vehicle'}
        </h2>
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
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Hardware Device ID</label>
            <input
              type="text"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 font-mono text-sm"
              placeholder="e.g., collision_33161"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Enter the exact key from the Firebase database.
            </p>
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
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Assign Driver</label>
            <select
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            >
              <option value="">No driver assigned</option>
              {drivers.map(driver => (
                <option key={driver.id} value={driver.id}>
                  {driver.full_name || driver.email}
                </option>
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
              {loading ? 'Saving...' : (initialData ? 'Save Changes' : 'Add Vehicle')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
