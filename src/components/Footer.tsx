import React from 'react';
import Link from 'next/link';
import { Shield, FileText, HelpCircle, Lock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-850 bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 text-slate-400 mt-auto">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 font-black text-slate-950 text-sm">
              IC
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight">Incognito CUSB</span>
              <p className="text-xs text-slate-400">Your Campus. Your Voice.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-400">
            <Link href="/guidelines" className="hover:text-emerald-400 transition flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>Community Guidelines</span>
            </Link>
            <Link href="/privacy" className="hover:text-emerald-400 transition flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Privacy Policy</span>
            </Link>
            <Link href="/terms" className="hover:text-emerald-400 transition flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>Terms of Service</span>
            </Link>
          </div>
        </div>

        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-400 text-center md:text-left">
          <p>
            Disclaimer: Incognito CUSB is an independent student platform created exclusively for students of Central
            University of South Bihar (CUSB), Gaya, Bihar, India. It is not affiliated with, endorsed by, or operated
            by the university administration.
          </p>
          <p className="shrink-0 text-slate-400">
            &copy; {new Date().getFullYear()} Incognito CUSB. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
