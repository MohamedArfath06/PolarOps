import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Lock, User, ChevronDown, Shield, AlertTriangle } from 'lucide-react';

type Role = 'Commander' | 'Logistics Officer' | 'Station Operator';
const ROLES: Role[] = ['Commander', 'Logistics Officer', 'Station Operator'];

const SNOWFLAKE_POSITIONS = [
  { top: '8%',  left: '5%',  size: 18, opacity: 0.08 },
  { top: '15%', left: '92%', size: 24, opacity: 0.06 },
  { top: '35%', left: '2%',  size: 14, opacity: 0.07 },
  { top: '55%', left: '96%', size: 20, opacity: 0.05 },
  { top: '72%', left: '8%',  size: 16, opacity: 0.09 },
  { top: '85%', left: '88%', size: 22, opacity: 0.06 },
  { top: '92%', left: '30%', size: 12, opacity: 0.07 },
  { top: '20%', left: '50%', size: 10, opacity: 0.04 },
];

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('Commander');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Please enter username and password.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const userObj = JSON.stringify({ username: username.trim(), role });
      localStorage.setItem('polarops_user', userObj);
      localStorage.setItem('polaris_user', userObj);
      navigate('/dashboard', { replace: true });
    }, 600);
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #020817 0%, #041230 40%, #071a45 70%, #0a1628 100%)' }}
    >
      {/* Decorative layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute rounded-full blur-3xl" style={{ width: 520, height: 520, top: '-10%', left: '-8%', background: 'radial-gradient(circle, rgba(56,189,248,0.07) 0%, transparent 70%)' }} />
        <div className="absolute rounded-full blur-3xl" style={{ width: 400, height: 400, bottom: '-5%', right: '-5%', background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)' }} />
        <div className="absolute rounded-full blur-2xl" style={{ width: 280, height: 280, top: '40%', right: '15%', background: 'radial-gradient(circle, rgba(56,189,248,0.05) 0%, transparent 70%)' }} />
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(56,189,248,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.025) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        {SNOWFLAKE_POSITIONS.map((s, i) => (
          <div key={i} className="absolute select-none" style={{ top: s.top, left: s.left, fontSize: s.size, opacity: s.opacity }}>❄</div>
        ))}
      </div>

      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/10 to-transparent" />

      <div className="relative z-10 w-full max-w-md mx-4">
        <div
          className="relative rounded-2xl p-px"
          style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.25) 0%, rgba(56,189,248,0.05) 50%, rgba(99,102,241,0.15) 100%)', boxShadow: '0 0 60px rgba(56,189,248,0.08), 0 25px 50px rgba(0,0,0,0.5)' }}
        >
          <div className="rounded-2xl p-8" style={{ background: 'linear-gradient(160deg, #0c1e40 0%, #091529 100%)' }}>
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center relative"
                  style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)', boxShadow: '0 0 30px rgba(14,165,233,0.35)' }}
                >
                  <Compass className="text-white w-8 h-8" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full border-2 border-navy-900" />
                </div>
              </div>
              <div className="inline-flex items-center gap-2 bg-blue-900/20 border border-blue-700/30 rounded-full px-3 py-1 mb-3">
                <Shield className="w-3 h-3 text-blue-400" />
                <span className="text-xs text-blue-400 font-medium tracking-widest uppercase">Secure Access</span>
              </div>
              <h1
                className="text-3xl font-black tracking-wider mb-1"
                style={{ background: 'linear-gradient(90deg, #e0f2fe 0%, #7dd3fc 50%, #bae6fd 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
              >
                POLAROPS
              </h1>
              <p className="text-gray-400 text-sm tracking-wide">Integrated Polar Expedition Logistics</p>
              <div className="mt-2 h-px bg-gradient-to-r from-transparent via-blue-600/40 to-transparent" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5 font-medium">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="text" className="input w-full pl-9" placeholder="Enter username" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" autoFocus />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5 font-medium">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="password" className="input w-full pl-9" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5 font-medium">Role</label>
                <div className="relative">
                  <select className="select w-full appearance-none pr-8" value={role} onChange={e => setRole(e.target.value as Role)}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-900/30 border border-red-700/40 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span className="text-xs text-red-300">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-sm tracking-wide transition-all duration-200 text-white disabled:opacity-70"
                style={{ background: 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)', boxShadow: '0 4px 20px rgba(14,165,233,0.25)' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
                    Authenticating…
                  </span>
                ) : 'Access System'}
              </button>
            </form>

            {/* Demo credentials */}
            <div className="mt-5 p-3 bg-navy-900/60 border border-navy-600/50 rounded-xl">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">Demo Credentials</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-navy-800/60 rounded-lg px-3 py-2">
                  <span className="text-gray-500">Username</span>
                  <p className="text-blue-400 font-mono font-medium">commander</p>
                </div>
                <div className="bg-navy-800/60 rounded-lg px-3 py-2">
                  <span className="text-gray-500">Password</span>
                  <p className="text-blue-400 font-mono font-medium">polarops2026</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2 text-center">Any credentials accepted · Role selection applies</p>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-center mt-5 space-y-1">
          <p className="text-xs text-gray-600 tracking-widest uppercase">Synthetic Data · SIH26062</p>
          <p className="text-xs text-gray-700">NCPOR — National Centre for Polar &amp; Ocean Research</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
