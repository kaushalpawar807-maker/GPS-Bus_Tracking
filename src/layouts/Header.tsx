import { Search, Bell, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Header() {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const q = query.toLowerCase();
            if (q.includes('route')) {
                navigate('/admin/route-studio');
            } else if (q.includes('admin')) {
                navigate('/admin');
            } else if (q.includes('bus')) {
                navigate('/user/track/bus1'); // Mock: Default to Bus 1
            } else if (q.includes('ticket')) {
                navigate('/admin/tickets');
            } else {
                // Default fallback
                navigate('/admin/buses');
            }
        }
    };

    return (
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-6 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4 flex-1">
                <button className="lg:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600">
                    <Menu className="w-5 h-5" />
                </button>

                <div className="relative max-w-md w-full hidden md:block group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Type 'route', 'bus', 'ticket' and hit Enter..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleSearch}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden group-focus-within:flex items-center gap-1">
                        <span className="text-[10px] font-medium text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 bg-white">Enter</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="flex flex-col items-end mr-2 hidden md:flex">
                        <span className="text-xs font-semibold text-slate-700">PMPL Org</span>
                        <span className="text-xs text-slate-500">Pro Plan</span>
                    </div>
                    <button className="relative p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-indigo-600 transition-colors">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse"></span>
                    </button>
                </div>
            </div>
        </header>
    );
}
