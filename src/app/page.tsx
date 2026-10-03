'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Globe,
  Building2,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Flame,
  CheckCircle2,
  Users,
} from 'lucide-react';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 px-4 sm:px-6 lg:px-8 border-b border-slate-800/60">
        {/* Subtle decorative glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 mb-6">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Exclusively for Central University of South Bihar</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight sm:leading-none">
            Your Campus. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
              Your Voice.
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Welcome to <strong>Incognito CUSB</strong> — an independent student-driven platform uniting CUSB students
            across all 29 academic departments. Explore open discussions, nested debates, and private peer messaging.
          </p>

          {/* Call to Actions */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {user ? (
              <Link
                href="/feed"
                className="flex items-center gap-2.5 rounded-2xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-emerald-950/50 hover:bg-emerald-400 transition transform hover:-translate-y-0.5"
              >
                <span>Enter Global Forum</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-emerald-950/50 hover:from-emerald-400 hover:to-teal-400 transition transform hover:-translate-y-0.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Join Incognito CUSB</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="flex items-center gap-2 rounded-2xl bg-slate-900 border border-slate-800 px-6 py-3.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition"
                >
                  <span>Student Sign In</span>
                </Link>
              </>
            )}
          </div>

          {/* Trust points */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>No Anonymous Trolling</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>All 29 Departments</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>One-Message Request Protection</span>
            </span>
          </div>
        </div>
      </section>

      {/* Core Feature Pillars */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Designed Exclusively for Campus Discourse
          </h2>
          <p className="mt-2 text-sm text-slate-400 max-w-xl mx-auto">
            Combining the public discovery of a campus forum with modern nested replies and respectful peer messaging.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Feature 1 */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-5">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">University-Wide Global Feed</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Post questions, campus announcements, event notices, hostel reviews, and student debates open to the
                entire CUSB body. Every author is identified by their unique avatar and handle.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-2 text-xs text-emerald-400 font-semibold">
              <Flame className="w-4 h-4" />
              <span>Reddit-style Upvoting &amp; Downvoting</span>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 mb-5">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">29 Academic Department Hubs</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                From Computer Science to Law, Biotechnology to Agriculture — each department has its dedicated forum.
                Subscribe to your department to receive instant alerts when peers share notes or news.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-2 text-xs text-teal-400 font-semibold">
              <Users className="w-4 h-4" />
              <span>Open to all students to read &amp; participate</span>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 mb-5">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Controlled Private Chat Requests</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Connect peer-to-peer with strict anti-spam protection. A student can send exactly one message request.
                Once you accept, unlock unlimited real-time chat with replies, media sharing, and read receipts.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-2 text-xs text-sky-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Full Two-Way Blocking &amp; Moderation</span>
            </div>
          </div>
        </div>
      </section>

      {/* Community Banner */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pb-20">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/20 p-8 sm:p-12 text-center relative overflow-hidden">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
            Ready to participate in CUSB discourse?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto mb-6">
            Create your account in 30 seconds. No email required. Pure peer-driven student community.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-xs sm:text-sm font-bold text-slate-950 shadow-lg shadow-emerald-950/50 hover:bg-emerald-400 transition"
          >
            <span>Get Started Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
