'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import PostCard, { PostItem } from '@/components/PostCard';
import CreatePostModal from '@/components/CreatePostModal';
import { useAuth } from '@/context/AuthContext';
import {
  Building2,
  Bell,
  BellOff,
  PlusCircle,
  Clock,
  Flame,
  ArrowLeft,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';

export default function DepartmentForumPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useAuth();

  const [department, setDepartment] = useState<any>(null);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<'latest' | 'popular'>('latest');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);

  // Fetch department details
  useEffect(() => {
    fetch(`/api/departments/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.department) {
          setDepartment(data.department);
          setIsSubscribed(data.department.isSubscribed);
        }
      })
      .catch((err) => console.error(err));
  }, [slug]);

  // Fetch department posts
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/posts?department=${slug}&sort=${sort}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [slug, sort]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const toggleSubscribe = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    if (subscribing) return;

    setSubscribing(true);
    try {
      const res = await fetch(`/api/departments/${slug}/subscribe`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setIsSubscribed(data.subscribed);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubscribing(false);
    }
  };

  const handlePostCreated = (newPost: any) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handleVoteChange = (postId: string, newScore: number, userVote: number) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, score: newScore, userVote } : p
      )
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex-1 flex gap-6">
      <Sidebar onOpenCreatePost={() => setCreatePostOpen(true)} />

      <main className="flex-1 max-w-2xl min-w-0 pb-16 md:pb-6">
        {/* Back Link */}
        <Link
          href="/departments"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 mb-4 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Departments</span>
        </Link>

        {/* Department Banner Header */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold mb-2">
                <Building2 className="w-3.5 h-3.5" />
                <span>Department Forum</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {department?.name || 'Department Hub'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                {department?.description}
              </p>
            </div>

            {/* Notification Subscription Button */}
            <div className="shrink-0 flex items-center gap-2">
              <button
                onClick={toggleSubscribe}
                disabled={subscribing}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition shadow-md ${
                  isSubscribed
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                {isSubscribed ? (
                  <>
                    <Bell className="w-4 h-4 text-emerald-400 fill-current" />
                    <span>Notifications On</span>
                  </>
                ) : (
                  <>
                    <BellOff className="w-4 h-4 text-slate-400" />
                    <span>Turn On Alerts</span>
                  </>
                )}
              </button>

              {user && (
                <button
                  onClick={() => setCreatePostOpen(true)}
                  className="p-2.5 rounded-2xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition"
                  title="Create post in this department"
                >
                  <PlusCircle className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/80">
          <span className="text-xs font-semibold text-slate-400">
            {posts.length} {posts.length === 1 ? 'Discussion' : 'Discussions'}
          </span>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setSort('latest')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
                sort === 'latest'
                  ? 'bg-emerald-500/15 text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Latest</span>
            </button>
            <button
              onClick={() => setSort('popular')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
                sort === 'popular'
                  ? 'bg-emerald-500/15 text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Popular</span>
            </button>
          </div>
        </div>

        {/* Posts List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="glass-card rounded-2xl p-5 border border-slate-800 animate-pulse space-y-3"
              >
                <div className="h-5 w-3/4 bg-slate-800 rounded" />
                <div className="h-14 bg-slate-900 rounded" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="glass-card rounded-3xl p-10 text-center border border-slate-800 my-4">
            <div className="inline-flex p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 mb-3">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">No Discussions In This Hub Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
              Start the first academic discourse or share materials for {department?.name || 'this department'}!
            </p>
            {user ? (
              <button
                onClick={() => setCreatePostOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 shadow-md transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Start Discussion</span>
              </button>
            ) : (
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 shadow-md transition"
              >
                <span>Join &amp; Post</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onVoteChange={handleVoteChange}
              />
            ))}
          </div>
        )}
      </main>

      <CreatePostModal
        isOpen={createPostOpen}
        onClose={() => setCreatePostOpen(false)}
        defaultDepartmentSlug={slug}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
}
