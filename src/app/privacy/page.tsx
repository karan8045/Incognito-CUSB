import React from 'react';
import Link from 'next/link';
import { Shield, Lock, Eye, Server, RefreshCw, AlertCircle } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
          <Shield className="w-3.5 h-3.5" />
          <span>Platform Privacy Standards</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Effective Date: October 2026 &bull; Version 1.0 &bull; Central University of South Bihar Student Community
        </p>
      </div>

      <div className="glass-card rounded-3xl p-6 sm:p-10 border border-slate-800 space-y-8 text-sm text-slate-300 leading-relaxed">
        {/* Section 1 */}
        <section>
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-400" />
            <span>1. Account Information We Collect</span>
          </h2>
          <p>
            When registering an account on Incognito CUSB, you provide information necessary for community interaction:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-400">
            <li><strong>Username:</strong> A unique identifier chosen by you (e.g., <code>@cusb_student</code>).</li>
            <li><strong>Display Name:</strong> Your chosen campus community name.</li>
            <li><strong>Password Hash:</strong> Passwords are cryptographically hashed using salted bcrypt prior to storage. Plaintext passwords are never stored, logged, or visible to anyone.</li>
            <li><strong>Semester (Optional):</strong> Your academic semester if you choose to provide it.</li>
            <li><strong>Bio (Optional):</strong> A brief profile description.</li>
            <li><strong>Account Timestamps:</strong> Account creation timestamp and last active session status.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section>
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <Eye className="w-5 h-5 text-emerald-400" />
            <span>2. Public Forum Content</span>
          </h2>
          <p>
            Incognito CUSB is fundamentally a public campus forum. All discussions, posts, media, links, comments, and replies published in the Global Feed or Department Hubs are publicly visible to other verified CUSB users.
          </p>
          <p className="mt-2 text-slate-400">
            Every public post always identifies its author through avatar, username, and display name. There is no anonymous public posting on the platform.
          </p>
        </section>

        {/* Section 3 */}
        <section>
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <Server className="w-5 h-5 text-emerald-400" />
            <span>3. Private Messages and Chat Infrastructure</span>
          </h2>
          <p>
            Private messages and chat requests are intended for the participating students. They are processed and stored on our server infrastructure to enable cross-device synchronization, offline delivery, message replies, reactions, and search.
          </p>
          <div className="p-4 mt-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p>
              <strong>Transparency Notice:</strong> We do not falsely claim end-to-end encryption (E2EE) because messages must be routed through server databases for reliable storage and delivery. Messages are guarded by server-side authorization controls preventing access by non-participants.
            </p>
          </div>
        </section>

        {/* Section 4 */}
        <section>
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <span>4. Security and Technical Request Metadata</span>
          </h2>
          <p>
            To prevent fraud, platform attacks, brute-force intrusions, and malicious abuse, our servers record standard HTTP request telemetry:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-400">
            <li>IP address associated with requests</li>
            <li>User-Agent string, browser family, and operating system</li>
            <li>Device category (Mobile, Tablet, Desktop) derived from standard HTTP headers</li>
            <li>Session generation and authentication timestamps</li>
            <li>Security audit events (failed logins, account blocks, reports)</li>
          </ul>
          <div className="p-4 mt-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
            <strong>Device Hardware &amp; MAC Address Disclosure:</strong> Normal web browser security sandboxes do not expose your network interface MAC address. Incognito CUSB does not use deceptive scripts or unsafe browser exploits to attempt to extract MAC addresses, nor do we claim to collect them.
          </div>
        </section>

        {/* Section 5 */}
        <section>
          <h2 className="text-lg font-bold text-white mb-3">5. Uploaded Files and Media</h2>
          <p>
            Files and media uploaded by students (images, video clips, PDFs, study documents) are validated for safe MIME types and stored in secure object/file storage. Executable binaries and scripts (e.g., <code>.exe</code>, <code>.sh</code>, <code>.bat</code>) are blocked to maintain campus cybersecurity.
          </p>
        </section>

        {/* Section 6 */}
        <section>
          <h2 className="text-lg font-bold text-white mb-3">6. Cookies and Sessions</h2>
          <p>
            We use secure <code>httpOnly</code>, <code>SameSite=Lax</code> session cookies strictly to keep you authenticated. We do not use third-party advertising trackers or commercial profiling cookies.
          </p>
        </section>

        {/* Section 7 */}
        <section>
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-emerald-400" />
            <span>7. Permanent Account Deletion (&ldquo;Deleted User&rdquo;)</span>
          </h2>
          <p>
            Students have the right to permanently delete their account at any time via <strong>Settings &rarr; Delete Account</strong>.
          </p>
          <p className="mt-2 text-slate-400">
            Upon confirmation, your personal identity is immediately and permanently anonymized. Your display name is transformed to <strong>Deleted User</strong>, your username is randomized, and your password hash, bio, semester, and avatar are wiped. The conversation and discussion structures are retained to prevent breaking forum context for other students.
          </p>
        </section>

        {/* Section 8 */}
        <section>
          <h2 className="text-lg font-bold text-white mb-3">8. Third-Party Infrastructure</h2>
          <p>
            We utilize reputable hosting, database, and infrastructure providers (such as Vercel, Neon/PostgreSQL, and cloud storage providers) to operate Incognito CUSB reliably. Data is hosted securely with appropriate administrative safeguards.
          </p>
        </section>

        {/* Section 9 */}
        <section>
          <h2 className="text-lg font-bold text-white mb-3">9. Disclaimer and Updates</h2>
          <p className="text-slate-400">
            Incognito CUSB is an independent student community created by and for students of Central University of South Bihar. If this policy is materially updated, an announcement will be posted on the Global forum.
          </p>
        </section>
      </div>

      <div className="mt-8 text-center text-xs text-slate-500">
        Questions about our privacy practices? Review our{' '}
        <Link href="/guidelines" className="text-emerald-400 hover:underline">
          Community Guidelines
        </Link>{' '}
        or{' '}
        <Link href="/terms" className="text-emerald-400 hover:underline">
          Terms of Service
        </Link>
        .
      </div>
    </div>
  );
}
