import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    LayoutDashboard,
    Map,
    Ticket,
    Bus,
    Route as RouteIcon,
    Settings,
    LogOut,
    LifeBuoy,
    ChevronRight,
    FileText,
    MapPin
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

export default function Sidebar() {
    const { profile, signOut } = useAuth();

    const navItems = {
        admin: [
            { icon: LayoutDashboard, label: 'Control Tower', path: '/admin' },
            { icon: Map, label: 'Live Map', path: '/user/track/bus1' },
            { icon: Bus, label: 'Fleet Management', path: '/admin/buses' },
            { icon: RouteIcon, label: 'Routes & Stops', path: '/admin/routes' },
            { icon: MapPin, label: 'Route Studio', path: '/admin/route-studio' },
            { icon: Ticket, label: 'Ticket Bookings', path: '/admin/tickets' },
            { icon: FileText, label: 'Analytics Reports', path: '/admin/reports' },
            { icon: Settings, label: 'Maintenance Control', path: '/admin/maintenance' },
        ],
        user: [
            { icon: LayoutDashboard, label: 'Dashboard', path: '/user' },
            { icon: Ticket, label: 'Book Ticket', path: '/user/book' },
            { icon: Ticket, label: 'My Tickets', path: '/user/tickets' },
            { icon: RouteIcon, label: 'Routes', path: '/user/routes' },
            { icon: Map, label: 'Live Tracking', path: '/user/track/bus1' },
        ],
        driver: [
            { icon: LayoutDashboard, label: 'Dashboard', path: '/driver' },
        ],
        conductor: [
            { icon: LayoutDashboard, label: 'Dashboard', path: '/conductor' },
        ]
    };

    const currentNav = navItems[profile?.role as keyof typeof navItems] || [];

    return (
        <div className="w-64 h-screen bg-slate-900 text-white flex flex-col border-r border-slate-800 sticky top-0 left-0 z-40">
            <div className="p-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <Bus className="text-white w-6 h-6" />
                </div>
                <div>
                    <h1 className="font-bold text-lg tracking-tight">FleetPro</h1>
                    <p className="text-xs text-slate-400 font-medium">Enterprise</p>
                </div>
            </div>

            <div className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">
                    Main Menu
                </div>
                {currentNav.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                                isActive
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400 group-hover:text-white")} />
                                <span className="font-medium text-sm">{item.label}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="activeNav"
                                        className="absolute right-2"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </motion.div>
                                )}
                            </>
                        )}
                    </NavLink>
                ))}

                <div className="mt-8 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">
                    System
                </div>
                <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                        cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                            isActive ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                        )
                    }
                >
                    <Settings className="w-5 h-5" />
                    <span className="font-medium text-sm">Settings</span>
                </NavLink>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-200">
                    <LifeBuoy className="w-5 h-5" />
                    <span className="font-medium text-sm">Support</span>
                </button>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/50 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold ring-2 ring-slate-800">
                        {profile?.email?.[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{profile?.email}</p>
                        <p className="text-xs text-slate-400 capitalize">{profile?.role}</p>
                    </div>
                </div>
                <button
                    onClick={() => signOut()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-rose-900/30 text-slate-300 hover:text-rose-400 transition-colors border border-slate-700 hover:border-rose-900/50 text-sm font-medium"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
            </div>
        </div>
    );
}
