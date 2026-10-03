import React from 'react';
import Link from 'next/link';
import { ShieldCheck, CheckCircle2, XCircle, EyeOff, Flag, Ban } from 'lucide-react';

export default function CommunityGuidelinesPage() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Student Community Norms</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Community Guidelines
        </h1>
        <p className="mt-2 text-sm text-slate-400 max-w-2xl mx-auto">
          Incognito CUSB is a student-driven forum where students of Central University of South Bihar can discuss ideas
          openly, ask questions, disagree, criticize policies, and express opinions without unnecessary censorship.
        </p>
      </div>

      <div className="glass-card rounded-3xl p-6 sm:p-10 border border-slate-800 space-y-8 text-sm text-slate-300 leading-relaxed">
        {/* Core Philosophy Banner */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/20 text-emerald-200">
          <h2 className="text-base font-bold text-emerald-300 mb-1">Our Freedom of Expression Principle</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Ordinary differences of opinion, heated intellectual debates, campus policy critique, hostel reviews, and controversial
            perspectives are natural parts of university life. Content will <strong>never be removed merely because it is unpopular,
            uncomfortable, or critical</strong>. Moderation is focused exclusively on conduct and genuine platform abuse.
          </p>
        </div>

        {/* Allowed Section */}
        <section>
          <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Generally Allowed and Protected</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="font-bold text-emerald-300 block mb-1">Academic &amp; Policy Critique</span>
              Constructive or critical discussions regarding syllabus, exams, facilities, hostels, and administrative policies.
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="font-bold text-emerald-300 block mb-1">Debates &amp; Differing Viewpoints</span>
              Vigorous discourse across political, philosophical, social, and cultural viewpoints.
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="font-bold text-emerald-300 block mb-1">Campus Life Experiences</span>
              Sharing authentic feedback and experiences regarding campus mess, transit, library resources, and events.
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="font-bold text-emerald-300 block mb-1">Satire, Memes &amp; Humor</span>
              Good-faith humor, creative parodies, and student memes that don&apos;t constitute malicious personal attacks.
            </div>
          </div>
        </section>

        {/* Not Allowed Section */}
        <section>
          <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>Strictly Prohibited Abuses</span>
          </h2>
          <div className="space-y-2 text-xs">
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200">
              <strong className="text-rose-300">Doxxing &amp; Non-Consensual Private Data:</strong> Publishing another student’s
              phone numbers, home addresses, hostel room numbers, passwords, OTPs, or private documents without explicit consent.
            </div>
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200">
              <strong className="text-rose-300">Targeted Severe Harassment &amp; Threats:</strong> Repeated stalking, coordinated mobbing,
              blackmail, or credible threats of physical violence.
            </div>
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200">
              <strong className="text-rose-300">Malicious Impersonation:</strong> Deceptive accounts impersonating university officials,
              proctors, professors, or other students.
            </div>
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200">
              <strong className="text-rose-300">Malware &amp; Phishing:</strong> Distributing malicious software, dangerous scripts,
              phishing links, or automated scrapers.
            </div>
          </div>
        </section>

        {/* Protection Tools: Reporting & Blocking */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center gap-2 text-white font-bold mb-2">
              <Flag className="w-4 h-4 text-emerald-400" />
              <span>How Reporting Works</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every public discussion has a Report button. Reports are reviewed by the platform administrator against these guidelines.
              Please report genuine violations rather than opinions you simply disagree with.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center gap-2 text-white font-bold mb-2">
              <Ban className="w-4 h-4 text-rose-400" />
              <span>Two-Way Blocking</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              If another student bothers you, blocking them immediately cuts off mutual profile access, private messaging, chat requests,
              and public interactions on the backend.
            </p>
          </div>
        </section>
      </div>

      <div className="mt-8 text-center text-xs text-slate-500">
        Review our full{' '}
        <Link href="/terms" className="text-emerald-400 hover:underline">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="text-emerald-400 hover:underline">
          Privacy Policy
        </Link>
        .
      </div>
    </div>
  );
}
