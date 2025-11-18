import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Bus } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (!user || !profile) {
    return <>{children}</>;
  }

  const getDashboardLink = () => {
    switch (profile.role) {
      case 'admin':
        return '/admin';
      case 'driver':
        return '/driver';
      case 'conductor':
        return '/conductor';
      default:
        return '/user';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to={getDashboardLink()} className="flex items-center">
              <div className="bg-slate-800 p-2 rounded-lg mr-3">
                <Bus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-800">Bus Tracking</h1>
                <p className="text-xs text-slate-500">Community Transport</p>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium text-slate-800">{profile.full_name || profile.email}</div>
                <div className="text-xs text-slate-500 capitalize">{profile.role}</div>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
