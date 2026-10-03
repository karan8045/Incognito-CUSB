'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Trash2,
  Ban,
  AlertTriangle,
  CheckCircle2,
  GraduationCap,
  BookOpen,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'profile' | 'privacy' | 'danger'>('profile');

  // Profile Form state
  const [displayName, setDisplayName] = useState('');
  const [semester, setSemester] = useState('');
  const [bio, setBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Blocked users
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);

  // Account deletion modal state
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setSemester(user.semester || '');
      setBio(user.bio || '');
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'privacy') {
      setLoadingBlocked(true);
      fetch('/api/blocks')
        .then((res) => res.json())
        .then((data) => setBlockedUsers(data.blockedUsers || []))
        .catch((err) => console.error(err))
        .finally(() => setLoadingBlocked(false));
    }
  }, [activeTab]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError('');
    setProfileSuccess(false);

    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, semester, bio }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      await refreshUser();
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 2000);
    } catch (err: any) {
      setProfileError(err.message || 'Error updating profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUnblock = async (targetUserId: string) => {
    try {
      const res = await fetch('/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, action: 'UNBLOCK' }),
      });
      if (res.ok) {
        setBlockedUsers((prev) => prev.filter((u) => u.id !== targetUserId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmation !== 'DELETE MY ACCOUNT') {
      setDeleteError('Please type "DELETE MY ACCOUNT" exactly to confirm.');
      return;
    }

    setDeleting(true);
    setDeleteError('');

    try {
      const res = await fetch('/api/settings/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmation: deleteConfirmation,
          password: deletePassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete account');

      await logout();
      router.push('/');
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 flex gap-6 text-center justify-center">
        <div className="glass-card rounded-3xl p-8 border border-slate-800">
          <p className="text-sm text-slate-300 mb-4">Please sign in to access your account settings.</p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex-1 flex gap-6">
      <Sidebar />

      <main className="flex-1 max-w-2xl min-w-0 pb-16 md:pb-6">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 mb-1">
            <SettingsIcon className="w-6 h-6 text-emerald-400" />
            <span>Account Settings</span>
          </h1>
          <p className="text-xs text-slate-400">Manage your student profile, privacy, and account controls</p>
        </div>

        {/* Settings Navigation Tabs */}
        <div className="flex gap-2 p-1.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-semibold mb-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition ${
              activeTab === 'profile' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition ${
              activeTab === 'privacy' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Privacy &amp; Blocking</span>
          </button>

          <button
            onClick={() => setActiveTab('danger')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition ${
              activeTab === 'danger' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Account</span>
          </button>
        </div>

        {/* Tab 1: Profile Settings */}
        {activeTab === 'profile' && (
          <div className="glass-card rounded-3xl p-6 border border-slate-800">
            <h2 className="text-base font-bold text-white mb-4">Edit Profile</h2>

            {profileSuccess && (
              <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Profile updated successfully!</span>
              </div>
            )}

            {profileError && (
              <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {profileError}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Unique Username (Permanent)
                </label>
                <input
                  type="text"
                  disabled
                  value={`@${user.username}`}
                  className="w-full rounded-xl bg-slate-950/50 border border-slate-800/80 px-3.5 py-2 text-slate-500 font-mono cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Usernames cannot be modified after registration.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Academic Semester
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    placeholder="e.g. 3rd Semester"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-9 pr-3.5 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                  <GraduationCap className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Bio / Interests
                </label>
                <div className="relative">
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    placeholder="Brief description about your studies or campus interests..."
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3.5 text-white focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Privacy & Blocking */}
        {activeTab === 'privacy' && (
          <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-6 text-xs">
            <div>
              <h2 className="text-base font-bold text-white mb-1">Blocked Students</h2>
              <p className="text-slate-400">
                Blocked students cannot send you messages or chat requests, view your profile, or interact with your posts.
              </p>
            </div>

            {loadingBlocked ? (
              <p className="text-slate-500 py-4">Loading blocked list...</p>
            ) : blockedUsers.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                <Ban className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p>You have not blocked any students.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800 border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60">
                {blockedUsers.map((b) => (
                  <div key={b.id} className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <img src={b.avatar} alt="" className="w-8 h-8 rounded-full border border-slate-700 object-cover" />
                      <div>
                        <p className="font-bold text-white text-xs">{b.displayName}</p>
                        <p className="text-[10px] text-emerald-400 font-mono">@{b.username}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnblock(b.id)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs transition"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Permanent Account Deletion (Requirements 29 & 30) */}
        {activeTab === 'danger' && (
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-rose-500/20 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Permanent Account Deletion</h2>
                <p className="text-xs text-rose-300">Irreversible anonymization of your CUSB student profile</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed">
              <strong className="text-white block font-semibold">What happens upon deletion:</strong>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li>Your username, display name, bio, semester, and personal avatar are permanently wiped.</li>
                <li>Your identity across all public posts, comments, and private messages becomes &ldquo;<strong>Deleted User</strong>&rdquo;.</li>
                <li>Your active sessions will be terminated immediately.</li>
                <li>You will never be able to log back into this account.</li>
              </ul>
            </div>

            {deleteError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {deleteError}
              </div>
            )}

            <form onSubmit={handleDeleteAccount} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Type <span className="font-mono text-rose-400">DELETE MY ACCOUNT</span> to confirm:
                </label>
                <input
                  type="text"
                  required
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="DELETE MY ACCOUNT"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-white font-mono focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Confirm Account Password:
                </label>
                <input
                  type="password"
                  required
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={deleting || deleteConfirmation !== 'DELETE MY ACCOUNT' || !deletePassword}
                  className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg shadow-rose-950/50 transition disabled:opacity-40"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{deleting ? 'Anonymizing and deleting...' : 'Permanently Delete My Account'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
