import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { Sparkles, Mail, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';

export interface VendorAuthProps {
  onAuthSuccess: (user: any) => void;
}

export function VendorAuth({ onAuthSuccess }: VendorAuthProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      onAuthSuccess(res.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      onAuthSuccess(res.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      onAuthSuccess(res.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Google sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg('Password reset link sent to your email.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf5f8] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-8 border border-[#f2e4ec] shadow-xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-brand-primary text-white font-black text-2xl flex items-center justify-center mx-auto shadow-md">
            P
          </div>
          <h1 className="text-2xl font-extrabold text-[#1a0812] tracking-tight font-display pt-2">
            PARVA Partner Hub
          </h1>
          <p className="text-xs text-[#745b68]">
            Grow your celebration business & manage event bookings
          </p>
        </div>

        {/* Tab Switcher */}
        {mode !== 'forgot' && (
          <div className="flex bg-[#faf5f8] p-1 rounded-2xl border border-[#f2e4ec]">
            <button
              type="button"
              onClick={() => { setMode('signin'); setErrorMsg(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                mode === 'signin' ? 'bg-white text-[#1a0812] shadow-xs' : 'text-[#745b68] hover:text-[#1a0812]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMsg(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                mode === 'signup' ? 'bg-white text-[#1a0812] shadow-xs' : 'text-[#745b68] hover:text-[#1a0812]'
              }`}
            >
              Register Partner
            </button>
          </div>
        )}

        {/* Messages */}
        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-200">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-200">
            {successMsg}
          </div>
        )}

        {/* Form */}
        {mode === 'signin' && (
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1a0812] block">Business Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="partner@yourbrand.com"
                className="w-full bg-[#faf5f8] border border-[#f2e4ec] rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-primary"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-[#1a0812] block">Password</label>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-[11px] font-bold text-brand-primary hover:underline"
                >
                  Forgot?
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#faf5f8] border border-[#f2e4ec] rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-primary"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Signing In...' : 'Access Partner Dashboard'}
            </button>
          </form>
        )}

        {mode === 'signup' && (
          <form onSubmit={handleEmailSignUp} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1a0812] block">Brand / Business Name</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Royal Caterers & Events"
                className="w-full bg-[#faf5f8] border border-[#f2e4ec] rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1a0812] block">Contact Phone / WhatsApp</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-[#faf5f8] border border-[#f2e4ec] rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1a0812] block">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="partner@yourbrand.com"
                className="w-full bg-[#faf5f8] border border-[#f2e4ec] rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1a0812] block">Create Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#faf5f8] border border-[#f2e4ec] rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-primary"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Register Partner Account'}
            </button>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1a0812] block">Registered Business Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="partner@yourbrand.com"
                className="w-full bg-[#faf5f8] border border-[#f2e4ec] rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-primary"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Sending Link...' : 'Send Password Reset Link'}
            </button>
            <button
              type="button"
              onClick={() => setMode('signin')}
              className="w-full text-center text-xs font-bold text-[#745b68] hover:text-[#1a0812]"
            >
              Back to Sign In
            </button>
          </form>
        )}

        {/* 1-Click Google Partner Auth */}
        <div className="pt-2">
          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-gray-200 w-full"></div>
            <span className="bg-white px-3 text-[10px] text-gray-400 font-bold uppercase">or</span>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-[#1a0812] font-bold text-xs py-3 rounded-xl shadow-2xs transition flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>
      </div>
    </div>
  );
}
