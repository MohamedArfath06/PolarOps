import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Archive, Wrench, Users, MapPin, Target,
  AlertTriangle, GitBranch, FlaskConical, CheckSquare, Bell, BarChart3,
  Settings, ChevronLeft, ChevronRight, Zap, RotateCcw, LogOut, User
} from 'lucide-react';
import { resetDemo } from '../services/api';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  badge?: number;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, collapsed, badge }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative
      ${isActive
        ? 'bg-ice-600/20 text-ice-400 border border-ice-600/30'
        : 'text-gray-400 hover:text-white hover:bg-navy-700/80'
      }`
    }
  >
    <span className="flex-shrink-0 w-5 h-5">{icon}</span>
    {!collapsed && (
      <span className="truncate">{label}</span>
    )}
    {badge !== undefined && badge > 0 && (
      <span className={`${collapsed ? 'absolute -top-1 -right-1' : 'ml-auto'} bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold`}>
        {badge > 9 ? '9+' : badge}
      </span>
    )}
    {collapsed && (
      <div className="absolute left-14 bg-navy-700 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-navy-500">
        {label}
      </div>
    )}
  </NavLink>
);

const Divider = ({ label, collapsed }: { label?: string; collapsed: boolean }) => (
  <div className="my-2">
    {!collapsed && label && (
      <p className="text-xs text-gray-600 uppercase tracking-wider px-3 mb-1 font-semibold">{label}</p>
    )}
    <div className="border-t border-navy-700/60" />
  </div>
);

interface SidebarProps {
  alertCount?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ alertCount = 0 }) => {
  const [collapsed, setCollapsed] = useState(false);
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

  const handleReset = async () => {
    if (window.confirm('Reset demo to initial state? All simulations and recovery plans will be cleared.')) {
      try {
        await resetDemo();
        window.location.reload();
      } catch (e) {
        alert('Reset failed. Is the backend running?');
      }
    }
  };

  return (
    <aside
      className={`flex flex-col bg-navy-900 border-r border-navy-700 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-56'
      } min-h-screen relative flex-shrink-0`}
    >
      {/* Logo */}
      <div className="p-4 border-b border-navy-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-ice-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">PO</span>
          </div>
          {!collapsed && (
            <div>
              <div className="text-white font-bold text-sm tracking-wide">POLAROPS</div>
              <div className="text-gray-500 text-xs">Expedition Ops</div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {/* Operational */}
        {!collapsed && <p className="text-xs text-gray-600 uppercase tracking-wider px-1 mb-1 font-semibold">Operations</p>}
        <NavItem to="/dashboard" icon={<LayoutDashboard size={18} />} label="Overview" collapsed={collapsed} />
        <NavItem to="/missions" icon={<Target size={18} />} label="Missions" collapsed={collapsed} />
        <NavItem to="/cargo" icon={<Package size={18} />} label="Cargo" collapsed={collapsed} />
        <NavItem to="/inventory" icon={<Archive size={18} />} label="Inventory" collapsed={collapsed} />
        <NavItem to="/assets" icon={<Wrench size={18} />} label="Assets" collapsed={collapsed} />
        <NavItem to="/personnel" icon={<Users size={18} />} label="Personnel" collapsed={collapsed} />
        <NavItem to="/stations" icon={<MapPin size={18} />} label="Stations" collapsed={collapsed} />

        <Divider label="Intelligence" collapsed={collapsed} />

        <NavItem to="/impact" icon={<GitBranch size={18} />} label="Impact Analysis" collapsed={collapsed} />
        <NavItem to="/scenario-lab" icon={<FlaskConical size={18} />} label="Scenario Lab" collapsed={collapsed} />
        <NavItem to="/recovery" icon={<CheckSquare size={18} />} label="Recovery Plans" collapsed={collapsed} />

        <Divider label="System" collapsed={collapsed} />

        <NavItem to="/alerts" icon={<Bell size={18} />} label="Alerts" collapsed={collapsed} badge={alertCount} />
        <NavItem to="/reports" icon={<BarChart3 size={18} />} label="Reports" collapsed={collapsed} />
        <NavItem to="/emergency" icon={<AlertTriangle size={18} />} label="Emergency" collapsed={collapsed} />
      </nav>

      {/* User Session & Logout */}
      <div className="p-3 border-t border-navy-750 bg-navy-950/40">
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-ice-600/30 border border-ice-500/40 flex items-center justify-center text-ice-300 font-bold text-xs flex-shrink-0">
                {user?.username ? user.username.charAt(0).toUpperCase() : 'C'}
              </div>
              <div className="truncate text-left">
                <p className="text-xs font-semibold text-white truncate">{user?.username || 'Commander'}</p>
                <p className="text-[10px] text-ice-400 font-mono truncate">{user?.role || 'Mission Lead'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-navy-800 transition-colors"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex justify-center py-2 text-gray-400 hover:text-red-400 hover:bg-navy-800 rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>

      {/* Demo Controls */}
      <div className="p-3 border-t border-navy-700 space-y-2">
        <button
          onClick={handleReset}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-amber-400 hover:bg-amber-900/30 border border-amber-700/30 transition-colors ${collapsed ? 'justify-center' : ''}`}
          title="Reset Demo"
        >
          <RotateCcw size={14} />
          {!collapsed && 'Reset Demo'}
        </button>
        {!collapsed && (
          <div className="text-xs text-gray-600 text-center">
            SIH26062 · NCPOR
          </div>
        )}
      </div>

      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-navy-700 border border-navy-600 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors z-10"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
};

export default Sidebar;
