import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, CheckCircle2, AlertCircle, Eye, EyeOff, Sparkles, ExternalLink } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (token: string, adminData: any) => void;
  adminAlias: string;
  onBackToGame: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, adminAlias, onBackToGame }) => {
  const [email, setEmail] = useState('md16201620@gmail.com');
  const [password, setPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('ludo_admin_token', data.token);
      sessionStorage.setItem('ludo_admin_token', data.token);
      onLoginSuccess(data.token, data.admin);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const autofillCredentials = () => {
    setEmail('md16201620@gmail.com');
    setPassword('admin');
    setError(null);
  };

  return (
    <div className="min-h-screen w-full bg-[#07090e] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans text-slate-100 selection:bg-amber-500 selection:text-black">
      {/* Subtle Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-amber-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-xl shadow-amber-500/20 mb-4 ring-1 ring-white/20">
            <Shield className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            Ludo World Master
            <span className="text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">
              Admin Portal
            </span>
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">
            Executive control panel for live games, users, database & cloud infrastructure.
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800">
            <span>Active Access Path:</span>
            <code className="text-amber-400 font-mono font-bold">https://ludo.omyra.org/{adminAlias}</code>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-[#0e131f]/90 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800/80">
            <h2 className="text-base font-bold text-slate-200">Administrator Sign In</h2>
            <button
              type="button"
              onClick={autofillCredentials}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors px-2 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20"
            >
              <Sparkles className="w-3 h-3" />
              Autofill Credentials
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-400 text-sm animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@domain.com"
                  className="w-full bg-[#141b2d] border border-slate-700/80 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#141b2d] border border-slate-700/80 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Security Notice */}
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Configured Production Credentials:
              </div>
              <p>Email: <span className="text-amber-300 font-mono">md16201620@gmail.com</span></p>
              <p>Password: <span className="text-amber-300 font-mono">admin</span></p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-3 px-4 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Enter Admin Control Center</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={onBackToGame}
            className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors inline-flex items-center gap-1"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Return to Ludo Player Lobby
          </button>
        </div>
      </div>
    </div>
  );
};
