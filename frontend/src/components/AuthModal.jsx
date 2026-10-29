import { useState, useMemo } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  Check,
  Film,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCountryByCode } from '../utils/countries';
import { CountrySelect } from './CountrySelect';

export function AuthModal({ isOpen, onClose }) {
  const { login, register, confirm } = useAuth();
  const [tab, setTab] = useState('signin'); // 'signin' | 'signup' | 'confirm'

  // Common fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile-specific fields for Registration
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [countryCode, setCountryCode] = useState('GE');

  // Confirmation step code
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password Validation Checklist
  const passwordCriteria = useMemo(() => {
    return {
      length: password.length >= 8,
      hasNumber: /\d/.test(password),
      hasUpper: /[A-Z]/.test(password),
      match: password.length > 0 && confirmPassword.length > 0 && password === confirmPassword
    };
  }, [password, confirmPassword]);

  const isFormValid =
    tab === 'signup'
      ? passwordCriteria.length &&
        passwordCriteria.hasNumber &&
        passwordCriteria.hasUpper &&
        passwordCriteria.match &&
        username.trim().length >= 3 &&
        email.trim().length > 0
      : true;

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
        setError(err.message || 'Invalid email or password credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter identical passwords.');
      return;
    }

    if (!passwordCriteria.length || !passwordCriteria.hasNumber || !passwordCriteria.hasUpper) {
      setError('Password must be at least 8 characters long, contain at least 1 number and 1 uppercase letter.');
      return;
    }

    setLoading(true);
    try {
      const selectedCountry = getCountryByCode(countryCode);
      const userMeta = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        countryCode: selectedCountry.code,
        nationality: selectedCountry.name,
        countryFlag: selectedCountry.flag
      };

      await register(email, password, username.trim(), userMeta);
      setTab('confirm');
      setSuccess(`Verification code sent to ${email}. Please check your inbox.`);
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details.');
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
      setSuccess('Email successfully confirmed! Signing you into ReelQuest...');
      await login(email, password);
      setTimeout(() => onClose(), 1000);
    } catch (err) {
      setError(err.message || 'Invalid or expired confirmation code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl border border-cinema-border/90 bg-gradient-to-b from-cinema-card via-cinema-surface to-cinema-black p-5 sm:p-7 shadow-2xl scrollbar-thin">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-cinema-muted transition hover:bg-cinema-border hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold border border-gold/30 shadow-gold-glow/20">
            <Film className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">
              {tab === 'signin' ? 'Welcome Back, Cinephile' : tab === 'signup' ? 'Create Cinephile Account' : 'Verify Email'}
            </h3>
            <p className="text-xs text-cinema-muted">
              {tab === 'signin'
                ? 'Sign in to access your stats, streaks, and global rankings'
                : tab === 'signup'
                ? 'Join thousands of film trivia enthusiasts worldwide'
                : 'Enter the code sent to your registered email'}
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        {tab !== 'confirm' && (
          <div className="mb-5 grid grid-cols-2 rounded-xl bg-cinema-black/60 p-1 border border-cinema-border/60">
            <button
              onClick={() => {
                setTab('signin');
                setError('');
              }}
              className={`py-2 text-xs font-extrabold rounded-lg transition ${
                tab === 'signin'
                  ? 'bg-gold text-cinema-black shadow-gold-glow'
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
              className={`py-2 text-xs font-extrabold rounded-lg transition ${
                tab === 'signup'
                  ? 'bg-gold text-cinema-black shadow-gold-glow'
                  : 'text-cinema-muted hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* 1. SIGN IN FORM                                           */}
        {/* ========================================================= */}
        {tab === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cinema-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cinephile@reelquest.io"
                  className="w-full rounded-xl border border-cinema-border bg-cinema-surface py-2.5 pl-10 pr-3.5 text-xs text-white placeholder-cinema-muted outline-none focus:border-gold transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cinema-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-cinema-border bg-cinema-surface py-2.5 pl-10 pr-10 text-xs text-white placeholder-cinema-muted outline-none focus:border-gold transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cinema-muted hover:text-white p-1"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-3 text-xs font-black text-cinema-black shadow-gold-glow transition hover:opacity-95 disabled:opacity-50 active:scale-95"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Sign In to Account</span>}
            </button>
          </form>
        )}

        {/* ========================================================= */}
        {/* 2. REGISTRATION FORM (STRICTLY ENGLISH, SEARCHABLE COUNTRY) */}
        {/* ========================================================= */}
        {tab === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-3.5">
            {/* First Name & Last Name (Side-by-Side) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. John"
                  className="w-full rounded-xl border border-cinema-border bg-cinema-surface py-2 px-3 text-xs text-white placeholder-cinema-muted outline-none focus:border-gold transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Smith"
                  className="w-full rounded-xl border border-cinema-border bg-cinema-surface py-2 px-3 text-xs text-white placeholder-cinema-muted outline-none focus:border-gold transition"
                />
              </div>
            </div>

            {/* Username & Nationality (Searchable) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cinema-muted" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="CinemaOracle"
                    className="w-full rounded-xl border border-cinema-border bg-cinema-surface py-2 pl-9 pr-3 text-xs text-white placeholder-cinema-muted outline-none focus:border-gold transition"
                  />
                </div>
              </div>

              {/* Searchable Sovereign Country Selector */}
              <div>
                <CountrySelect
                  value={countryCode}
                  onChange={setCountryCode}
                  label="Nationality"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cinema-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full rounded-xl border border-cinema-border bg-cinema-surface py-2 pl-9 pr-3 text-xs text-white placeholder-cinema-muted outline-none focus:border-gold transition"
                />
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cinema-muted" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full rounded-xl border border-cinema-border bg-cinema-surface py-2 pl-9 pr-8 text-xs text-white placeholder-cinema-muted outline-none focus:border-gold transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-cinema-muted hover:text-white p-1"
                  >
                    {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cinema-muted" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className={`w-full rounded-xl border bg-cinema-surface py-2 pl-9 pr-8 text-xs text-white placeholder-cinema-muted outline-none transition ${
                      confirmPassword && !passwordCriteria.match
                        ? 'border-red-500/70 focus:border-red-500'
                        : confirmPassword && passwordCriteria.match
                        ? 'border-emerald-500/70 focus:border-emerald-500'
                        : 'border-cinema-border focus:border-gold'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-cinema-muted hover:text-white p-1"
                  >
                    {showConfirmPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Password Validation Requirements Checklist */}
            <div className="rounded-xl border border-cinema-border/60 bg-cinema-surface/40 p-2.5 space-y-1.5 text-[11px]">
              <span className="text-[10px] uppercase font-bold text-cinema-muted block">
                Security Checklist
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <span className={`flex items-center gap-1.5 ${passwordCriteria.length ? 'text-emerald-400 font-bold' : 'text-cinema-muted'}`}>
                  <Check className={`h-3 w-3 ${passwordCriteria.length ? 'opacity-100' : 'opacity-30'}`} />
                  <span>8+ characters</span>
                </span>
                <span className={`flex items-center gap-1.5 ${passwordCriteria.hasNumber ? 'text-emerald-400 font-bold' : 'text-cinema-muted'}`}>
                  <Check className={`h-3 w-3 ${passwordCriteria.hasNumber ? 'opacity-100' : 'opacity-30'}`} />
                  <span>1+ number</span>
                </span>
                <span className={`flex items-center gap-1.5 ${passwordCriteria.hasUpper ? 'text-emerald-400 font-bold' : 'text-cinema-muted'}`}>
                  <Check className={`h-3 w-3 ${passwordCriteria.hasUpper ? 'opacity-100' : 'opacity-30'}`} />
                  <span>1+ uppercase</span>
                </span>
                <span className={`flex items-center gap-1.5 ${passwordCriteria.match ? 'text-emerald-400 font-bold' : confirmPassword ? 'text-rose-400' : 'text-cinema-muted'}`}>
                  <Check className={`h-3 w-3 ${passwordCriteria.match ? 'opacity-100' : 'opacity-30'}`} />
                  <span>Passwords match</span>
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-gold-dark py-3 text-xs font-black text-cinema-black shadow-gold-glow transition hover:opacity-95 disabled:opacity-40 active:scale-95"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Create Cinephile Account</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ========================================================= */}
        {/* 3. CONFIRM EMAIL CODE                                     */}
        {/* ========================================================= */}
        {tab === 'confirm' && (
          <form onSubmit={handleConfirm} className="space-y-4">
            <div className="text-center">
              <h4 className="text-base font-bold text-white">Enter 6-Digit Code</h4>
              <p className="mt-1 text-xs text-cinema-muted">
                We sent a verification code to <strong className="text-white">{email}</strong>.
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
                className="w-full rounded-xl border border-cinema-border bg-cinema-surface py-3 text-center text-lg font-mono tracking-widest text-white outline-none focus:border-gold transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-2.5 text-xs font-black text-cinema-black shadow-gold-glow transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Verify Email & Enter</span>}
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
