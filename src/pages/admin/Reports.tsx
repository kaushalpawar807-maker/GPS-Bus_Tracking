import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const driverData = [
    { name: 'Ramesh', score: 92, incidents: 1 },
    { name: 'Suresh', score: 88, incidents: 2 },
    { name: 'Mahesh', score: 98, incidents: 0 },
    { name: 'Ganesh', score: 75, incidents: 5 },
    { name: 'Dinesh', score: 85, incidents: 2 },
];

const fuelData = [
    { name: 'Mon', consumption: 450 },
    { name: 'Tue', consumption: 420 },
    { name: 'Wed', consumption: 480 },
    { name: 'Thu', consumption: 460 },
    { name: 'Fri', consumption: 500 },
    { name: 'Sat', consumption: 380 },
    { name: 'Sun', consumption: 350 },
];

export default function Reports() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Analytics Reports</h1>
                <p className="text-slate-500">Detailed insights into fleet performance and operational costs.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Driver Performance */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[400px]">
                    <h2 className="text-lg font-semibold text-slate-800 mb-6">Driver Safety Scores</h2>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <BarChart data={driverData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" domain={[0, 100]} hide />
                                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Bar dataKey="score" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 text-xs text-slate-500 text-center">
                        *Score based on harsh braking, speeding, and cornering events.
                    </div>
                </div>

                {/* Fuel Consumption */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-800 mb-6">Weekly Fuel Consumption (Litres)</h2>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={fuelData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="consumption" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
