import React from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

// ─── Status Badge ─────────────────────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'critical' | 'high' | 'medium' | 'low' | 'ok' | 'info';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'info', className = '' }) => {
  const variants = {
    critical: 'badge-critical',
    high: 'badge-high',
    medium: 'badge-medium',
    low: 'badge-low',
    ok: 'badge-ok',
    info: 'badge-info',
  };
  return (
    <span className={`badge ${variants[variant]} ${className}`}>{children}</span>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  severity?: 'normal' | 'warning' | 'critical';
  trend?: 'up' | 'down' | 'stable';
}

export const StatCard: React.FC<StatCardProps> = ({
  title, value, subtitle, icon, severity = 'normal'
}) => {
  const borderColor = {
    normal: 'border-navy-600',
    warning: 'border-amber-700/60',
    critical: 'border-red-700/60',
  }[severity];

  const valueColor = {
    normal: 'text-white',
    warning: 'text-amber-400',
    critical: 'text-red-400',
  }[severity];

  return (
    <div className={`card border ${borderColor} flex flex-col gap-2`}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">{title}</span>
        {icon && <span className="text-gray-500">{icon}</span>}
      </div>
      <div className={`text-2xl font-bold ${valueColor}`}>{value}</div>
      {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
    </div>
  );
};

// ─── Progress Bar ─────────────────────────────────────────────────────────
interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value, max = 100, label, showValue = true, size = 'md'
}) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const color = pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : pct >= 40 ? 'bg-orange-500' : 'bg-red-500';
  const height = size === 'sm' ? 'h-1.5' : 'h-2.5';
  return (
    <div>
      {(label || showValue) && (
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          {label && <span>{label}</span>}
          {showValue && <span>{pct.toFixed(0)}%</span>}
        </div>
      )}
      <div className={`w-full bg-navy-700 rounded-full ${height}`}>
        <div
          className={`${height} rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// ─── Loading Spinner ──────────────────────────────────────────────────────
export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md', className = ''
}) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={`${sizes[size]} border-2 border-navy-600 border-t-ice-500 rounded-full animate-spin ${className}`} />
  );
};

export const LoadingPage: React.FC<{ label?: string }> = ({ label = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center h-64 gap-4">
    <Spinner size="lg" />
    <p className="text-gray-400 text-sm">{label}</p>
  </div>
);

// ─── Error State ──────────────────────────────────────────────────────────
export const ErrorState: React.FC<{ message?: string; onRetry?: () => void }> = ({
  message = 'Failed to load data. Check that the backend is running.',
  onRetry
}) => (
  <div className="flex flex-col items-center justify-center h-64 gap-4">
    <XCircle className="text-red-400 w-12 h-12" />
    <p className="text-gray-300 text-sm max-w-sm text-center">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="btn-secondary text-xs">
        Try Again
      </button>
    )}
  </div>
);

// ─── Empty State ──────────────────────────────────────────────────────────
export const EmptyState: React.FC<{ message?: string }> = ({
  message = 'No data available'
}) => (
  <div className="flex flex-col items-center justify-center h-32 gap-2">
    <Info className="text-gray-600 w-8 h-8" />
    <p className="text-gray-500 text-sm">{message}</p>
  </div>
);

// ─── Page Header ──────────────────────────────────────────────────────────
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, icon, actions }) => (
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-3">
      {icon && <div className="text-ice-400">{icon}</div>}
      <div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

// ─── Score Ring ────────────────────────────────────────────────────────────
export const ScoreRing: React.FC<{ score: number; size?: number; strokeWidth?: number }> = ({
  score, size = 64, strokeWidth = 6
}) => {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? '#22c55e' : score >= 65 ? '#eab308' : score >= 50 ? '#f97316' : '#ef4444';

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e3a6e" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" className="transition-all duration-700"
      />
      <text
        x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize={size / 5} fontWeight="bold"
        className="rotate-90 origin-center"
        transform={`rotate(90, ${size / 2}, ${size / 2})`}
      >
        {score.toFixed(0)}
      </text>
    </svg>
  );
};

// ─── Info Label ───────────────────────────────────────────────────────────
export const InfoLabel: React.FC<{ label: string; value: React.ReactNode; className?: string }> = ({
  label, value, className = ''
}) => (
  <div className={`flex flex-col gap-0.5 ${className}`}>
    <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
    <span className="text-sm text-white font-medium">{value || '—'}</span>
  </div>
);

// ─── Section ──────────────────────────────────────────────────────────────
export const Section: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({
  title, children, className = ''
}) => (
  <div className={`card ${className}`}>
    <h3 className="section-title mb-4">{title}</h3>
    {children}
  </div>
);
