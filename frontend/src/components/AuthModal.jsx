import { useState } from 'react';
import { X, Lock, Mail, User, AlertCircle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function AuthModal({ isOpen, onClose }) {
  const { login, register, confirm } = useAuth();
  const [tab, setTab] = useState('signin'); // 'signin' | 'signup' | 'confirm'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      onClose();
    } catch (err) {
      if (err.message.includes('UserNotConfirmedException')) {
        setTab('confirm');
        setError('Please enter the confirmation code sent to your email.');
      } else {
        setError(err.message || 'Invalid credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password, username);
      setTab('confirm');
      setSuccess('Verification code sent to your email.');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await confirm(email, code);
      setSuccess('Email confirmed! Logging you in...');
      await login(email, password);
      setTimeout(() => onClose(), 1000);
    } catch (err) {
      setError(err.message || 'Invalid confirmation code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-cinema-border bg-gradient-to-b from-cinema-card to-cinema-surface p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-cinema-muted transition hover:bg-cinema-border hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Tab switch */}
        {tab !== 'confirm' && (
          <div className="mb-6 flex border-b border-cinema-border">
            <button
              onClick={() => {
                setTab('signin');
                setError('');
              }}
              className={`flex-1 pb-3 text-sm font-semibold transition ${
                tab === 'signin'
                  ? 'border-b-2 border-gold text-gold'
                  : 'text-cinema-muted hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setTab('signup');
                setError('');
              }}
              className={`flex-1 pb-3 text-sm font-semibold transition ${
                tab === 'signup'
                  ? 'border-b-2 border-gold text-gold'
                  : 'text-cinema-muted hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Sign In Form */}
        {tab === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-cinema-muted">Email Address</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cinema-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cinephile@reelquest.io"
                  className="w-full rounded-xl border border-cinema-border bg-cinema-surface py-2.5 pl-10 pr-3 text-xs text-white placeholder-cinema-muted outline-none focus:border-gold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-cinema-muted">Password</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cinema-muted" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-cinema-border bg-cinema-surface py-2.5 pl-10 pr-3 text-xs text-white placeholder-cinema-muted outline-none focus:border-gold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-2.5 text-xs font-bold text-cinema-black shadow-gold-glow transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Sign In</span>}
            </button>
          </form>
        )}

        {/* Sign Up Form */}
        {tab === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-cinema-muted">Username</label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cinema-muted" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="NolanArchitect"
                  className="w-full rounded-xl border border-cinema-border bg-cinema-surface py-2.5 pl-10 pr-3 text-xs text-white placeholder-cinema-muted outline-none focus:border-gold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-cinema-muted">Email Address</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cinema-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full rounded-xl border border-cinema-border bg-cinema-surface py-2.5 pl-10 pr-3 text-xs text-white placeholder-cinema-muted outline-none focus:border-gold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-cinema-muted">Password (min 8 chars, 1 uppercase, 1 number)</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cinema-muted" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-cinema-border bg-cinema-surface py-2.5 pl-10 pr-3 text-xs text-white placeholder-cinema-muted outline-none focus:border-gold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-2.5 text-xs font-bold text-cinema-black shadow-gold-glow transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Create Account</span>}
            </button>
          </form>
        )}

        {/* Confirm Email Form */}
        {tab === 'confirm' && (
          <form onSubmit={handleConfirm} className="space-y-4">
            <div className="text-center">
              <h4 className="text-base font-bold text-white">Enter Verification Code</h4>
              <p className="mt-1 text-xs text-cinema-muted">
                We sent a 6-digit confirmation code to <strong className="text-slate-200">{email}</strong>.
              </p>
            </div>

            <div>
              <input
                type="text"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className="w-full rounded-xl border border-cinema-border bg-cinema-surface py-3 text-center text-lg font-mono tracking-widest text-white outline-none focus:border-gold"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-2.5 text-xs font-bold text-cinema-black shadow-gold-glow transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Verify & Continue</span>}
            </button>

            <button
              type="button"
              onClick={() => setTab('signin')}
              className="w-full text-center text-xs text-cinema-muted hover:text-white"
            >
              Back to Sign In
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
