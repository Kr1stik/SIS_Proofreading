'use client';

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Flame, CheckCircle2, FileCheck, Layers, ShieldCheck, AlertCircle } from 'lucide-react';
import { loginUser } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const cleanIdentifier = email.trim();
    if (!cleanIdentifier || !password) {
      setErrorMsg('Please enter both username/email and password.');
      setIsLoading(false);
      return;
    }

    try {
      const data = await loginUser(cleanIdentifier, password);
      if (data && (data.token || data.success)) {
        const token = data.token || 'authenticated-session';
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', token);
          sessionStorage.setItem('auth_token', token);
          if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
          } else {
            localStorage.setItem('user', JSON.stringify({ email: cleanIdentifier }));
          }
        }
        router.push('/proofread');
      } else {
        setErrorMsg('Invalid Username or Password.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg(err.message || 'Invalid Username or Password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen flex items-center justify-center p-4 font-sans text-slate-900">
      {/* 2-COLUMN CENTERED CARD CONTAINER */}
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row p-3 md:p-4 min-h-[580px] border border-slate-200/60">
        
        {/* LEFT COLUMN: WHITE FORM PANEL */}
        <div className="flex-1 p-6 md:p-10 flex flex-col justify-between">
          
          {/* Brand Badge: THE TORCH BEARER 2027 */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center border border-[#DC95FF]/30">
              <Flame className="w-5 h-5 text-[#DC95FF]" />
            </div>
            <span className="font-extrabold text-slate-900 text-xs tracking-wider uppercase font-mono bg-purple-50 text-purple-900 px-2.5 py-1 rounded-md border border-[#DC95FF]/20">
              THE TORCH BEARER 2027
            </span>
          </div>

          {/* Form Content */}
          <div className="my-auto py-6">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Torch Bearer 2027 - Proofreading Studio & SIS Management
            </h2>
            <p className="text-slate-500 text-sm mt-1 mb-6 leading-relaxed">
              Official proofreading portal for Torch Bearer 2027 editorial staff and layout team
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Staff Email Address
                </label>
                <input
                  type="email"
                  placeholder="staff@torchbearer.edu.ph"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#DC95FF] focus:outline-none mb-1 text-slate-800 placeholder-slate-400 font-medium transition-all shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#DC95FF] focus:outline-none mb-1 text-slate-800 placeholder-slate-400 font-medium transition-all shadow-xs"
                />
              </div>

              {/* Controls Row */}
              <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded border-slate-300 text-[#DC95FF] focus:ring-[#DC95FF] cursor-pointer"
                  />
                  <span className="font-medium text-slate-700">Remember me</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#DC95FF] hover:bg-[#c87deb] active:scale-[0.99] text-white font-semibold py-3 rounded-lg shadow-md transition-all cursor-pointer text-sm mt-2 tracking-wide flex items-center justify-center space-x-2"
              >
                <span>{isLoading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
              </button>
            </form>

            {/* Ask Assistance Trigger Banner */}
            <div className="mt-4 p-3 bg-purple-50/80 rounded-xl border border-purple-100 text-center">
              <p className="text-xs text-slate-600 font-medium">
                Forgot your login credentials or need account access?
              </p>
              <button 
                type="button"
                onClick={() => alert("Please contact the Torch Bearer 2027 System Administrator or Lead Developer for credential resets and account provisioning.")}
                className="mt-1 text-xs font-bold text-[#DC95FF] hover:underline cursor-pointer"
              >
                Ask Assistance (Contact Admin)
              </button>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-xs text-slate-400 text-center md:text-left">
            Torch Bearer 2027 Editorial System • Confidential Access
          </div>
        </div>

        {/* RIGHT COLUMN: ROUNDED ILLUSTRATION PANEL */}
        <div className="hidden md:flex flex-1 bg-gradient-to-br from-[#DC95FF] via-purple-600 to-indigo-700 rounded-3xl p-8 items-center justify-center relative overflow-hidden flex-col text-white text-center">
          
          {/* Background Ambient Glow */}
          <div className="absolute top-6 left-6 w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-36 h-36 bg-purple-400/20 rounded-full blur-2xl pointer-events-none" />

          {/* Top Editorial Status Badges */}
          <div className="w-full flex justify-between items-center z-10">
            <div className="bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 border border-white/20 shadow-xs">
              <FileCheck className="w-3.5 h-3.5 text-white" />
              <span>Yearbook 2027</span>
            </div>
            <div className="bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 border border-white/20 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>Verified Portal</span>
            </div>
          </div>

          {/* Center Graphic Emblem & Floating Verification Cards */}
          <div className="relative z-10 flex flex-col items-center justify-center my-auto px-4">
            
            {/* Central Flame Torch Emblem Container */}
            <div className="relative w-44 h-44 mb-6 flex items-center justify-center">
              <div className="absolute inset-0 bg-white/10 rounded-full animate-ping opacity-20" />
              <div className="absolute inset-2 bg-white/15 rounded-full backdrop-blur-xs border border-white/20" />
              
              <div className="relative z-10 w-28 h-28 bg-white/20 backdrop-blur-md rounded-2xl border border-white/40 flex items-center justify-center shadow-2xl">
                <Flame className="w-16 h-16 text-white drop-shadow-md" />
              </div>

              {/* Floating Editorial Verification Card 1 */}
              <div className="absolute -top-3 -left-6 bg-white/90 backdrop-blur text-purple-900 px-3 py-1.5 rounded-2xl shadow-lg border border-white flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-[10px] font-bold">Page Plan Verified</span>
              </div>

              {/* Floating Editorial Verification Card 2 */}
              <div className="absolute -bottom-3 -right-6 bg-white/90 backdrop-blur text-purple-900 px-3 py-1.5 rounded-2xl shadow-lg border border-white flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-purple-600" />
                <span className="text-[10px] font-bold">SIS Copy Matched</span>
              </div>
            </div>

            <h3 className="text-xl font-extrabold tracking-wide mb-1">
              Torch Bearer 2027
            </h3>
            <p className="text-xs text-purple-100/80 max-w-xs leading-relaxed">
              Official yearbook proofreading suite & SIS management for editorial board members and layout staff.
            </p>
          </div>

          {/* Bottom Pagination Dots */}
          <div className="z-10 flex items-center space-x-2">
            <span className="w-6 h-2 bg-white rounded-full transition-all" />
            <span className="w-2 h-2 bg-white/40 rounded-full transition-all" />
            <span className="w-2 h-2 bg-white/40 rounded-full transition-all" />
          </div>

        </div>

      </div>
    </div>
  );
}
