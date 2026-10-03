'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Sparkles,
  AlertTriangle,
  Lock,
  User,
  GraduationCap,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

export default function SignUpPage() {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [semester, setSemester] = useState('');
  const [bio, setBio] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const { refreshUser } = useAuth();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!agreeTerms || !agreePrivacy) {
      setError('You must agree to the Terms of Service and Privacy Policy to register.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          displayName,
          password,
          semester: semester || null,
          bio: bio || null,
          agreeTerms,
          agreePrivacy,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      await refreshUser();
      router.push('/feed');
    } catch (err: any) {
      setError(err.message || 'Something went wrong during sign up.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-lg glass-card rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl relative">
        <div className="text-center mb-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl overflow-hidden bg-slate-900 border border-emerald-500/30 mb-3 shadow-lg shadow-emerald-950/50 p-1.5">
            <Image
              src="/logo.png"
              alt="Incognito CUSB Logo"
              width={56}
              height={56}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Create Student Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Exclusive community for Central University of South Bihar
          </p>
        </div>

        {/* Critical Password Recovery Warning Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="block text-amber-300 font-semibold mb-0.5">
              NOTICE: NO PASSWORD RECOVERY SYSTEM
            </strong>
            Incognito CUSB does not store your email or phone number and cannot reset passwords. If you forget your
            password, your account cannot be recovered through any means. Please record your password safely.
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4 text-xs sm:text-sm">
          {/* Display Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Display Name <span className="text-emerald-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Student Name"
                className="w-full rounded-xl bg-slate-950/80 border border-slate-800 pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Unique Username <span className="text-emerald-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="e.g. cusb_student"
                minLength={3}
                maxLength={25}
                className="w-full rounded-xl bg-slate-950/80 border border-slate-800 pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <span className="text-slate-500 font-mono absolute left-3.5 top-2.5 text-sm">@</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              3-25 characters. Letters, numbers, and underscores only.
            </p>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password <span className="text-emerald-400">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a strong password (min 6 characters)"
                minLength={6}
                className="w-full rounded-xl bg-slate-950/80 border border-slate-800 pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Semester (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Semester <span className="text-slate-500 text-[10px]">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  placeholder="e.g. 4th Semester"
                  className="w-full rounded-xl bg-slate-950/80 border border-slate-800 pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <GraduationCap className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            {/* Bio (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Bio <span className="text-slate-500 text-[10px]">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Brief student interests"
                  maxLength={150}
                  className="w-full rounded-xl bg-slate-950/80 border border-slate-800 pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <BookOpen className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>
          </div>

          {/* Legal Consent Checkboxes */}
          <div className="pt-2 space-y-2.5 border-t border-slate-800/80 text-xs text-slate-300">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900"
              />
              <span>
                I agree to the{' '}
                <Link href="/terms" target="_blank" className="text-emerald-400 hover:underline font-semibold">
                  Terms of Service
                </Link>
                .
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreePrivacy}
                onChange={(e) => setAgreePrivacy(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900"
              />
              <span>
                I have read and accept the{' '}
                <Link href="/privacy" target="_blank" className="text-emerald-400 hover:underline font-semibold">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-950/50 hover:from-emerald-400 hover:to-teal-400 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-4"
          >
            {loading ? (
              <span>Creating your account...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Create Student Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Already registered?{' '}
          <Link href="/login" className="text-emerald-400 font-semibold hover:underline">
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
}
