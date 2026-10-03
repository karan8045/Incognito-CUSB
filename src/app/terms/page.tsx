import React from 'react';
import Link from 'next/link';
import { FileText, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
          <FileText className="w-3.5 h-3.5" />
          <span>User Agreement</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Effective Date: October 2026 &bull; Version 1.0 &bull; Central University of South Bihar Student Community
        </p>
      </div>

      <div className="glass-card rounded-3xl p-6 sm:p-10 border border-slate-800 space-y-8 text-sm text-slate-300 leading-relaxed">
        {/* Section 1 */}
        <section>
          <h2 className="text-lg font-bold text-white mb-3">1. Eligibility &amp; Community Scope</h2>
          <p>
            Incognito CUSB is an independent student platform built exclusively for students enrolled at{' '}
            <strong>Central University of South Bihar (CUSB), Gaya, Bihar, India</strong>. By creating an account,
            you represent that you are a student of CUSB and agree to adhere to these Terms of Service.
          </p>
        </section>

        {/* Section 2 - No Password Recovery */}
        <section>
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2 text-amber-400">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>2. Strict Password Policy &amp; No Account Recovery</span>
          </h2>
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs leading-relaxed space-y-2">
            <p className="font-bold uppercase tracking-wider text-amber-300">
              Important: Account recovery is not supported
            </p>
            <p>
              To protect student privacy and minimize attack vectors, Incognito CUSB intentionally does not operate
              password recovery mechanisms (no forgot-password emails, SMS OTPs, security questions, or administrative resets).
            </p>
            <p>
              You are solely responsible for memorizing or securely storing your password. If you lose your password,
              <strong> your account cannot be recovered</strong> by anyone, including the platform administrator.
            </p>
          </div>
        </section>

        {/* Section 3 - Public Content & Immutability */}
        <section>
          <h2 className="text-lg font-bold text-white mb-3">3. Public Posts Cannot Be Edited or Deleted</h2>
          <p>
            To preserve the authenticity, chronology, and accountability of campus discussions:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-400">
            <li>Once published, <strong>posts cannot be edited or deleted by the author</strong>.</li>
            <li>Every public post displays your username, display name, avatar, and timestamp. There is no anonymous posting.</li>
            <li>If a post violates platform rules, students may report it for administrator review.</li>
          </ul>
        </section>

        {/* Section 4 - Private Messaging */}
        <section>
          <h2 className="text-lg font-bold text-white mb-3">4. Private Chat Request System</h2>
          <p>
            Private communications operate via our chat-request model. When initiating contact with another student,
            you can send <strong>exactly one initial message</strong>. The recipient can Accept, Reject, or Block.
            Unlimited private messaging is unlocked only after the recipient explicitly accepts your request.
          </p>
        </section>

        {/* Section 5 - Prohibited Conduct */}
        <section>
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2 text-rose-400">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>5. Prohibited Abuse and Platform Violations</span>
          </h2>
          <p>While Incognito CUSB champions robust freedom of expression, the following conduct is strictly prohibited:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1.5 text-slate-400">
            <li><strong>Severe Targeted Harassment:</strong> Relentless stalking, cyberbullying, or hate speech targeting individuals.</li>
            <li><strong>Doxxing:</strong> Publishing another student’s private phone numbers, home addresses, credentials, or private sensitive records without consent.</li>
            <li><strong>Credible Threats:</strong> Inciting violence or threatening physical harm.</li>
            <li><strong>Malicious Impersonation:</strong> Falsely representing university administration, proctors, faculty, or system administrators.</li>
            <li><strong>Malware &amp; Attacks:</strong> Uploading exploits, malware, phishing links, or executing denial-of-service/automated scraper attacks.</li>
          </ul>
        </section>

        {/* Section 6 - Administrator Authority */}
        <section>
          <h2 className="text-lg font-bold text-white mb-3">6. Administrator Review &amp; Enforcement</h2>
          <p>
            The platform owner acts as the sole platform administrator. The administrator reserves the right to review
            reported content and take corrective action, including removing violative content, issuing warnings, or permanently
            banning accounts that engage in platform abuse.
          </p>
        </section>

        {/* Section 7 - Account Deletion */}
        <section>
          <h2 className="text-lg font-bold text-white mb-3">7. Voluntary Account Deletion</h2>
          <p>
            You may permanently delete your account through Settings. Upon deletion, your identity is anonymized to{' '}
            <strong>Deleted User</strong> across all historical public posts, comments, and private conversations.
          </p>
        </section>

        {/* Section 8 - University Disclaimer */}
        <section>
          <h2 className="text-lg font-bold text-white mb-3">8. Disclaimer of University Affiliation</h2>
          <p className="text-slate-400">
            Incognito CUSB is an independent student initiative and is not an official university website, administrative
            portal, or endorsed entity of Central University of South Bihar. The service is provided &ldquo;as is&rdquo;
            without guarantees of uninterrupted availability.
          </p>
        </section>
      </div>

      <div className="mt-8 text-center text-xs text-slate-500">
        Read our{' '}
        <Link href="/guidelines" className="text-emerald-400 hover:underline">
          Community Guidelines
        </Link>{' '}
        for student discussion norms, or review our{' '}
        <Link href="/privacy" className="text-emerald-400 hover:underline">
          Privacy Policy
        </Link>
        .
      </div>
    </div>
  );
}
