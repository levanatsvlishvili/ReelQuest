import React, { useState } from 'react';
import { Shield, Lock, Mail, AlertCircle, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';

export function LoginView() {
  const { login, loading, authError } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setLocalError('Please enter both administrative email and password.');
      return;
    }
    setLocalError(null);
    try {
      await login(email, password);
    } catch (err) {
      // Handled in context
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#07090e] p-4 relative overflow-hidden">
      {/* Background cinematic aura */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/20 to-amber-500/10 border border-gold/40 shadow-gold-glow">
            <Shield className="h-8 w-8 text-gold" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-gold/80 block">
              Internal Control System
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              ReelQuest Admin Portal
            </h1>
          </div>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Authorized Personnel Only. Access is restricted to members of the AWS Cognito <span className="text-gold font-mono">Admins</span> group.
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-cinema-border/80 bg-cinema-card/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-5">
          {(authError || localError) && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 flex items-start gap-3 text-xs text-rose-300 animate-fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block">Authentication Notice</span>
                <span>{authError || localError}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@reelquest.io"
                  className="w-full rounded-xl border border-cinema-border bg-cinema-surface pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-cinema-border bg-cinema-surface pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-amber-500 py-3 text-sm font-extrabold text-cinema-black shadow-gold-glow hover:opacity-95 transition active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating with Cognito...</span>
              ) : (
                <>
                  <span>Sign In to Admin Portal</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

        </div>

        {/* Security watermark footer */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          <span>Protected by AWS Cognito JWT & Amazon CloudWatch Audit Logging</span>
        </div>
      </div>
    </div>
  );
}
