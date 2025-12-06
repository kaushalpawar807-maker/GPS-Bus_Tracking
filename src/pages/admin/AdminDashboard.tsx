import { useEffect, useState } from 'react';
import { supabase, Route, Stop } from '../../lib/supabase';
import Map from '../../components/Map';
import { LatLngExpression } from 'leaflet';
import { RevenueChart } from '../../components/AnalyticsCharts'; // FleetStatusChart removed/replaced by FleetList
import { Activity, Zap, TrendingUp, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { getSimulatedBusMarkers } from '../../utils/simulatedBus';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

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

  useEffect(() => {
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
      console.log('Stats loaded:', { buses: busesRes.count, routes: routesRes.count });
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
          <p className="text-slate-500 text-sm">Overview of fleet operations.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 animate-pulse">
          <Activity className="w-3 h-3" /> System Operational
        </div>
      </div>

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
            <span className="text-xs font-medium bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">2 Alerts</span>
          </div>
          <div className="divide-y divide-slate-100 overflow-y-auto flex-1 max-h-[300px]">
            {/* Mock Alerts */}
            <div className="p-4 flex gap-3 hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="mt-1 bg-rose-50 p-1.5 rounded-md text-rose-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Bus MH-12-Code-Red</p>
                <p className="text-xs text-slate-500">Engine Overheat Warning • 2m ago</p>
              </div>
            </div>
            <div className="p-4 flex gap-3 hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="mt-1 bg-amber-50 p-1.5 rounded-md text-amber-600">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Bus MH-14-AZ-99</p>
                <p className="text-xs text-slate-500">Scheduled Maintenance Due • 2h ago</p>
              </div>
            </div>
            <div className="p-4 flex gap-3 hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="mt-1 bg-emerald-50 p-1.5 rounded-md text-emerald-600">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Bus MH-12-FC-22</p>
                <p className="text-xs text-slate-500">Back Online • 5h ago</p>
              </div>
            </div>
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
