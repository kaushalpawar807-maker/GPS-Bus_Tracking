import { useEffect, useState } from 'react';
import { supabase, Stop } from '../../lib/supabase';
import Map from '../../components/Map';
import { LatLngExpression } from 'leaflet';
import { RevenueChart } from '../../components/AnalyticsCharts';
import { Activity, Zap, TrendingUp, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { getSimulatedBusMarkers } from '../../utils/simulatedBus';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import HardwareMonitor from '../../components/HardwareMonitor';
import { hardwareService } from '../../services/HardwareService';

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const chartData = data.map((val, i) => ({ i, val }));
  return (
    <div className="h-10 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <Area type="monotone" dataKey="val" stroke={color} fill={color} fillOpacity={0.2} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function KPIWidget({ title, value, change, icon: Icon, data, color }: any) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className={`p-1.5 rounded-lg ${color.bg} ${color.text}`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium text-slate-500">{title}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900">{value}</span>
          <span className={`text-xs font-medium ${change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {change > 0 ? '+' : ''}{change}%
          </span>
        </div>
      </div>
      <Sparkline data={data} color={color.hex} />
    </div>
  );
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalBuses: 0, totalRoutes: 0, totalUsers: 0, totalTickets: 0 });
  const [stops, setStops] = useState<Stop[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);

  useEffect(() => {
    // Subscribe to Hardware Alerts
    hardwareService.subscribeToGlobalEvents((data: any) => {
      if (data && (data.type === 'COLLISION' || data.type === 'ROLLOVER')) {
        setRecentAlerts(prev => {
          // Prevent duplicates roughly by timestamp if needed, or just prepend
          // For now, simple prepend and slice
          const newAlert = { ...data, timestamp: data.timestamp || new Date().toISOString() };
          return [newAlert, ...prev].slice(0, 5);
        });
      }
    });

    // Cleanup if service supported returning an unsubscribe function directly, 
    // but our service currently doesn't return one from this method.
    // We can leave it for now as dashboard usually stays mounted, or add unsubscribe logic later.

    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [busesRes, routesRes, usersRes, ticketsRes, stopsRes] = await Promise.all([
        supabase.from('buses').select('id', { count: 'exact' }),
        supabase.from('routes').select('id', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'user'),
        supabase.from('tickets').select('id', { count: 'exact' }),
        supabase.from('stops').select('*'),
      ]);

      setStats({
        totalBuses: busesRes.count || 0,
        totalRoutes: routesRes.count || 0,
        totalUsers: usersRes.count || 0,
        totalTickets: ticketsRes.count || 0,
      });
      setStops(stopsRes.data || []);
    } catch (e) {
      console.error(e);
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

  if (loading) return <div className="p-8">Loading Dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Control Tower</h1>
          <p className="text-slate-500 text-sm">Overview of fleet operations and real-time safety.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 animate-pulse">
          <Activity className="w-3 h-3" /> System Operational
        </div>
      </div>

      {/* Real-time Hardware Monitor */}
      <HardwareMonitor />

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIWidget
          title="Total Revenue"
          value="₹12.5k"
          change={12}
          icon={TrendingUp}
          data={[40, 30, 45, 50, 49, 60, 70]}
          color={{ bg: 'bg-indigo-50', text: 'text-indigo-600', hex: '#6366f1' }}
        />
        <KPIWidget
          title="Active Fleet"
          value={`${stats.totalBuses} / 15`}
          change={-5}
          icon={Activity}
          data={[10, 12, 11, 13, 12, 12, 10]}
          color={{ bg: 'bg-emerald-50', text: 'text-emerald-600', hex: '#10b981' }}
        />
        <KPIWidget
          title="Total Users"
          value={stats.totalUsers}
          change={8}
          icon={Users}
          data={[100, 120, 130, 140, 135, 150, 160]}
          color={{ bg: 'bg-blue-50', text: 'text-blue-600', hex: '#3b82f6' }}
        />
        <KPIWidget
          title="Conversions"
          value="2.4%"
          change={-1}
          icon={Zap}
          data={[3, 2.5, 2.8, 2.4, 2.6, 2.3, 2.4]}
          color={{ bg: 'bg-amber-50', text: 'text-amber-600', hex: '#f59e0b' }}
        />
      </div>

      {/* Middle Row: Charts & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-0 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800">Fleet Health</h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${recentAlerts.length > 0 ? 'bg-rose-100 text-rose-700' : 'bg-green-100 text-green-700'}`}>
              {recentAlerts.length} Alerts
            </span>
          </div>
          <div className="divide-y divide-slate-100 overflow-y-auto flex-1 max-h-[300px]">
            {recentAlerts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-200" />
                <p>All System Normal</p>
                <p className="text-xs mt-1">No recent safety incidents reported.</p>
              </div>
            ) : (
              recentAlerts.map((alert, idx) => (
                <div key={`${alert.timestamp}-${idx}`} className="p-4 flex gap-3 hover:bg-slate-50 transition-colors cursor-pointer animate-in slide-in-from-right-2 duration-300">
                  <div className={`mt-1 p-1.5 rounded-md ${alert.type === 'COLLISION' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                    {alert.type === 'COLLISION' ? <AlertTriangle className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      {alert.type} ALERT
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 font-mono">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Severity: {alert.severity || 'Unknown'} • Force: {alert.impact_force || alert.impact_g_force || 0}G
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-3 bg-slate-50 text-center border-t border-slate-100">
            <button className="text-xs font-medium text-indigo-600 hover:text-indigo-700">View All Maintenance Logs</button>
          </div>
        </div>
      </div>

      {/* Map Widget */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800">Live Traffic & Fleet Map</h3>
        </div>
        <div className="h-[400px] bg-slate-100 relative">
          <Map markers={mapMarkers} className="h-full w-full" />
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur p-2 rounded-lg text-xs font-medium shadow-sm border border-slate-200 z-[1000]">
            Updates every 5s
          </div>
        </div>
      </div>
    </div>
  );
}
