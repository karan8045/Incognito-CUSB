'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import PostCard from '@/components/PostCard';
import { useAuth } from '@/context/AuthContext';
import {
  User as UserIcon,
  MessageSquare,
  Ban,
  Calendar,
  GraduationCap,
  BookOpen,
  Send,
  X,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export default function UserProfilePage() {
  const params = useParams();
  const rawUsername = params.username as string;
  const username = rawUsername.replace(/^@/, '');
  const { user } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Chat Request Modal state
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [modalError, setModalError] = useState('');

  // Block state
  const [blocking, setBlocking] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(`/api/users/${username}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 403) throw new Error('This profile is unavailable due to privacy or block restrictions.');
          throw new Error('User not found.');
        }
        return res.json();
      })
      .then((data) => {
        setProfile(data.profile);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [username]);

  const handleMessageClick = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (profile.chatStatus === 'ACTIVE') {
      router.push(`/messages?cid=${profile.conversationId}`);
    } else if (profile.chatStatus === 'REQUEST_RECEIVED') {
      router.push('/messages?tab=requests');
    } else if (profile.chatStatus === 'REQUEST_SENT') {
      // already pending
    } else {
      setRequestModalOpen(true);
    }
  };

  const handleSendChatRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialMessage.trim()) return;

    setSendingRequest(true);
    setModalError('');

    try {
      const res = await fetch('/api/chat-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: profile.id,
          initialMessage: initialMessage.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send request');

      setRequestSuccess(true);
      setProfile((prev: any) => ({ ...prev, chatStatus: 'REQUEST_SENT' }));
      setTimeout(() => {
        setRequestModalOpen(false);
        setRequestSuccess(false);
      }, 1600);
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setSendingRequest(false);
    }
  };

  const handleBlockUser = async () => {
    if (!confirm(`Are you sure you want to block @${profile.username}? Mutual messaging and interactions will be terminated.`)) {
      return;
    }

    setBlocking(true);
    try {
      const res = await fetch('/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: profile.id }),
      });
      if (res.ok) {
        setIsBlocked(true);
        router.push('/feed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBlocking(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 flex gap-6">
        <Sidebar />
        <div className="flex-1 max-w-2xl glass-card rounded-3xl p-8 border border-slate-800 animate-pulse space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-800" />
          <div className="h-6 w-48 bg-slate-800 rounded" />
          <div className="h-4 w-32 bg-slate-800 rounded" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Profile Unavailable</h2>
        <p className="text-xs text-slate-400 mb-6">{error || 'This user does not exist.'}</p>
        <button
          onClick={() => router.push('/feed')}
          className="px-4 py-2 bg-emerald-500 text-slate-950 rounded-xl font-bold text-xs"
        >
          Back to Feed
        </button>
      </div>
    );
  }

  const isMe = user?.id === profile.id;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex-1 flex gap-6">
      <Sidebar />

      <main className="flex-1 max-w-2xl min-w-0 pb-16 md:pb-6">
        {/* Profile Card Header */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 mb-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
            <div className="flex items-center gap-4">
              <img
                src={profile.avatar}
                alt={profile.displayName}
                className="w-20 h-20 rounded-3xl border-2 border-emerald-500/30 object-cover shadow-lg"
              />
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white">{profile.displayName}</h1>
                <p className="text-xs text-emerald-400 font-mono font-semibold">@{profile.username}</p>
                {profile.semester && (
                  <div className="inline-flex items-center gap-1.5 mt-2 rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-slate-300 font-medium">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{profile.semester}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            {!isMe && user && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleMessageClick}
                  disabled={profile.chatStatus === 'REQUEST_SENT'}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition shadow-md ${
                    profile.chatStatus === 'REQUEST_SENT'
                      ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-emerald-950/40'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>
                    {profile.chatStatus === 'ACTIVE'
                      ? 'Open Chat'
                      : profile.chatStatus === 'REQUEST_SENT'
                      ? 'Request Sent'
                      : profile.chatStatus === 'REQUEST_RECEIVED'
                      ? 'Respond to Request'
                      : 'Message'}
                  </span>
                </button>

                <button
                  onClick={handleBlockUser}
                  disabled={blocking}
                  className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-rose-400 hover:bg-rose-500/10 transition"
                  title="Block this user"
                >
                  <Ban className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="mt-5 pt-4 border-t border-slate-800/80 text-xs text-slate-300 leading-relaxed flex items-start gap-2">
              <BookOpen className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>{profile.bio}</span>
            </div>
          )}

          {/* Stats Bar */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Joined {new Date(profile.joinedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
            </span>
            <span className="font-semibold text-slate-300">
              {profile.postsCount} {profile.postsCount === 1 ? 'Public Post' : 'Public Posts'}
            </span>
          </div>
        </div>

        {/* Public Posts Section */}
        <div>
          <h2 className="text-base font-bold text-white mb-4">
            Discussions by @{profile.username}
          </h2>

          {profile.posts && profile.posts.length > 0 ? (
            <div className="space-y-4">
              {profile.posts.map((p: any) => (
                <PostCard
                  key={p.id}
                  post={{
                    ...p,
                    author: {
                      id: profile.id,
                      username: profile.username,
                      displayName: profile.displayName,
                      avatar: profile.avatar,
                      semester: profile.semester,
                    },
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-8 text-center border border-slate-800 text-xs text-slate-400">
              No public posts published yet by this student.
            </div>
          )}
        </div>
      </main>

      {/* Chat Request Modal */}
      {requestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl relative">
            <button
              onClick={() => setRequestModalOpen(false)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1">
              Start Conversation with @{profile.username}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Send an introductory message request.
            </p>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs mb-4 leading-relaxed">
              <strong>Telegram-style Chat Protection:</strong> You can send <strong>exactly one initial message</strong>.
              If @{profile.username} accepts your request, unlimited real-time chat will be enabled.
            </div>

            {modalError && (
              <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {modalError}
              </div>
            )}

            {requestSuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
                <p className="text-sm font-bold text-white">Chat Request Sent!</p>
                <p className="text-xs text-slate-400">
                  You will receive a notification when @{profile.username} accepts your conversation.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendChatRequest} className="space-y-4">
                <textarea
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  placeholder="Introduce yourself or mention why you'd like to connect..."
                  rows={4}
                  required
                  className="w-full rounded-2xl bg-slate-950 border border-slate-800 p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
                />

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setRequestModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingRequest || !initialMessage.trim()}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-emerald-400 transition shadow-md disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sendingRequest ? 'Sending...' : 'Send Request'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
