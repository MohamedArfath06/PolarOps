import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import Sidebar from './Sidebar';
import { getAlerts } from '../services/api';

const TopBar: React.FC<{ alertCount: number }> = ({ alertCount }) => {
  const now = new Date();
  const navigate = useNavigate();

  let user: { username: string; role: string } | null = null;
  try {
    const raw = localStorage.getItem('polarops_user') || localStorage.getItem('polaris_user');
    if (raw) user = JSON.parse(raw);
  } catch {}

  const handleLogout = () => {
    localStorage.removeItem('polarops_user');
    localStorage.removeItem('polaris_user');
    navigate('/login', { replace: true });
  };

  return (
    <div className="h-12 bg-navy-900/80 border-b border-navy-700 flex items-center justify-between px-6 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs text-green-400 font-medium">SYSTEM ONLINE</span>
        </div>
        <span className="text-xs text-gray-600">|</span>
        <span className="text-xs text-gray-500">
          {now.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
          {' '}
          {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-xs text-amber-400 bg-amber-900/20 border border-amber-700/30 px-2 py-1 rounded">
          ⚠ SYNTHETIC DATA — PROTOTYPE
        </div>
        {alertCount > 0 && (
          <div className="text-xs text-red-400 bg-red-900/20 border border-red-700/30 px-2 py-1 rounded animate-pulse">
            {alertCount} ACTIVE ALERT{alertCount > 1 ? 'S' : ''}
          </div>
        )}
        <div className="flex items-center gap-3 pl-3 border-l border-navy-700">
          <div className="text-right hidden sm:block">
            <span className="text-xs font-semibold text-white block leading-tight">{user?.username || 'Commander'}</span>
            <span className="text-[10px] text-ice-400 font-mono block leading-tight">{user?.role || 'Commander'}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-300 bg-navy-800/80 hover:bg-navy-700/80 border border-navy-600/80 px-2.5 py-1 rounded-lg transition-colors"
            title="Sign out of POLAROPS"
          >
            <LogOut size={12} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const alerts = await getAlerts();
        setAlertCount(alerts.filter((a: any) => !a.acknowledged).length);
      } catch {}
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen bg-navy-950">
      <Sidebar alertCount={alertCount} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar alertCount={alertCount} />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
