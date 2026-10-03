'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import PostCard, { PostItem } from '@/components/PostCard';
import CreatePostModal from '@/components/CreatePostModal';
import { useAuth } from '@/context/AuthContext';
import {
  Sparkles,
  Flame,
  Clock,
  PlusCircle,
  Building2,
  RefreshCw,
  MessageSquare,
  Globe,
} from 'lucide-react';
import Link from 'next/link';

export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<'latest' | 'popular'>('latest');
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchPosts = useCallback(
    async (currentPage = 1, append = false, activeSort = sort) => {
      try {
        setLoading(true);
        const res = await fetch(`/api/posts?feed=global&sort=${activeSort}&page=${currentPage}&limit=15`);
        if (res.ok) {
          const data = await res.json();
          if (append) {
            setPosts((prev) => [...prev, ...data.posts]);
          } else {
            setPosts(data.posts);
          }
          setHasMore(data.hasMore);
        }
      } catch (err) {
        console.error('Failed to load posts', err);
      } finally {
        setLoading(false);
      }
    },
    [sort]
  );

  useEffect(() => {
    setPage(1);
    fetchPosts(1, false, sort);
  }, [sort, fetchPosts]);

  const handleSortChange = (newSort: 'latest' | 'popular') => {
    if (newSort === sort) return;
    setSort(newSort);
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
      {/* Desktop Left Sidebar Navigation */}
      <Sidebar onOpenCreatePost={() => setCreatePostOpen(true)} />

      {/* Center Feed Column */}
      <main className="flex-1 max-w-2xl min-w-0 pb-16 md:pb-6">
        {/* Mobile Quick Composer Trigger */}
        {user && (
          <div className="md:hidden glass-card rounded-2xl p-3.5 mb-4 border border-slate-800 flex items-center gap-3">
            <img
              src={user.avatar}
              alt=""
              className="w-8 h-8 rounded-full border border-slate-700 object-cover"
            />
            <button
              onClick={() => setCreatePostOpen(true)}
              className="flex-1 text-left px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 hover:text-slate-200 transition"
            >
              What&apos;s happening on campus? Start a post...
            </button>
          </div>
        )}

        {/* Feed Header & Sort Switcher */}
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800/80">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-400" />
              <span>Global CUSB Forum</span>
            </h1>
            <p className="text-xs text-slate-400">University-wide discussions and campus voices</p>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => handleSortChange('latest')}
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
              onClick={() => handleSortChange('popular')}
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

        {/* Feed Posts List */}
        {loading && posts.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="glass-card rounded-2xl p-5 border border-slate-800 animate-pulse space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800" />
                  <div className="h-4 w-32 bg-slate-800 rounded" />
                </div>
                <div className="h-5 w-3/4 bg-slate-800 rounded" />
                <div className="h-16 bg-slate-900 rounded" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="glass-card rounded-3xl p-10 text-center border border-slate-800 my-4">
            <div className="inline-flex p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 mb-3">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">No Discussions Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
              Be the first Central University of South Bihar student to start an open discussion on the Global Feed!
            </p>
            {user ? (
              <button
                onClick={() => setCreatePostOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 shadow-md transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Discussion</span>
              </button>
            ) : (
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 shadow-md transition"
              >
                <Sparkles className="w-4 h-4" />
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

            {hasMore && (
              <div className="text-center pt-4">
                <button
                  onClick={() => {
                    const nextPage = page + 1;
                    setPage(nextPage);
                    fetchPosts(nextPage, true, sort);
                  }}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-850 transition"
                >
                  {loading ? 'Loading more discussions...' : 'Load Older Discussions'}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Desktop Right Side Panel: Campus Highlights */}
      <aside className="hidden lg:flex flex-col w-72 shrink-0 gap-5">
        {/* CUSB Card */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
            Central University of South Bihar
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Panchanpur, Gaya, Bihar. An independent forum created for 29 academic centres and departments.
          </p>
          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>29 Departments</span>
            <span className="text-emerald-400 font-semibold">100% Student-Run</span>
          </div>
        </div>

        {/* Guidelines Quick Reminder */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
            Campus Rules
          </h3>
          <ul className="text-xs text-slate-400 space-y-2">
            <li>&bull; All public posts identify their author.</li>
            <li>&bull; Free speech &amp; critical inquiry protected.</li>
            <li>&bull; Posts cannot be edited/deleted once published.</li>
            <li>&bull; Doxxing and severe harassment prohibited.</li>
          </ul>
          <Link
            href="/guidelines"
            className="inline-block mt-3 text-xs text-emerald-400 hover:underline font-medium"
          >
            Read Guidelines &rarr;
          </Link>
        </div>
      </aside>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={createPostOpen}
        onClose={() => setCreatePostOpen(false)}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
}
