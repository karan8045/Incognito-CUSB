'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowBigUp,
  ArrowBigDown,
  MessageSquare,
  Share2,
  Flag,
  CornerDownRight,
  ChevronDown,
  ChevronRight,
  Building2,
  Globe,
  FileText,
  ExternalLink,
  Send,
  ArrowLeft,
  Check,
  AlertCircle,
} from 'lucide-react';
import ReportModal from '@/components/ReportModal';

interface CommentItem {
  id: string;
  content: string;
  parentId?: string | null;
  upvotesCount: number;
  createdAt: string;
  userVote: number;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
    semester?: string | null;
    isDeleted?: boolean;
  };
}

export default function PostDetailPage() {
  const params = useParams();
  const postId = params.id as string;
  const { user } = useAuth();

  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Post voting state
  const [score, setScore] = useState(0);
  const [userVote, setUserVote] = useState(0);
  const [copied, setCopied] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  // New comment input
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Active reply target
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Collapsed comment threads map
  const [collapsedThreads, setCollapsedThreads] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch(`/api/posts/${postId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Post not found or unavailable');
        return res.json();
      })
      .then((data) => {
        setPost(data.post);
        setScore(data.post.score);
        setUserVote(data.post.userVote);
        setComments(data.post.comments || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [postId]);

  const handlePostVote = async (direction: 1 | -1) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    const previousVote = userVote;
    const previousScore = score;
    const newVote = previousVote === direction ? 0 : direction;
    const diff = newVote - previousVote;

    setUserVote(newVote);
    setScore(previousScore + diff);

    try {
      const res = await fetch(`/api/posts/${postId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: newVote }),
      });
      if (res.ok) {
        const data = await res.json();
        setScore(data.score);
        setUserVote(data.userVote);
      }
    } catch {
      setUserVote(previousVote);
      setScore(previousScore);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      window.location.href = '/login';
      return;
    }
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, data.comment]);
        setNewComment('');
        setPost((prev: any) => ({ ...prev, commentsCount: prev.commentsCount + 1 }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleAddReply = async (parentId: string) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    if (!replyContent.trim()) return;

    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent.trim(), parentId }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, data.comment]);
        setReplyingToId(null);
        setReplyContent('');
        setPost((prev: any) => ({ ...prev, commentsCount: prev.commentsCount + 1 }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleCommentVote = async (commentId: string, direction: 1 | -1) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    const target = comments.find((c) => c.id === commentId);
    if (!target) return;

    const previousVote = target.userVote;
    const newVote = previousVote === direction ? 0 : direction;

    try {
      const res = await fetch(`/api/comments/${commentId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: newVote }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? { ...c, upvotesCount: data.upvotesCount, userVote: data.userVote }
              : c
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleCollapse = (commentId: string) => {
    setCollapsedThreads((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  // Build recursive comment tree
  const commentMap = new Map<string, CommentItem[]>();
  const rootComments: CommentItem[] = [];

  for (const c of comments) {
    if (!c.parentId) {
      rootComments.push(c);
    } else {
      if (!commentMap.has(c.parentId)) commentMap.set(c.parentId, []);
      commentMap.get(c.parentId)!.push(c);
    }
  }

  const renderCommentNode = (c: CommentItem, depth = 0) => {
    const isCollapsed = collapsedThreads[c.id];
    const replies = commentMap.get(c.id) || [];
    const isReplying = replyingToId === c.id;

    return (
      <div
        key={c.id}
        className={`relative ${depth > 0 ? 'ml-3 sm:ml-6 pl-3 sm:pl-4 border-l-2 border-slate-800' : 'mt-4'}`}
      >
        <div className="glass-card rounded-2xl p-3.5 border border-slate-800/90 text-xs">
          {/* Comment Author Header */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleCollapse(c.id)}
                className="text-slate-400 hover:text-white p-0.5"
                title={isCollapsed ? 'Expand thread' : 'Collapse thread'}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              <Link
                href={c.author.isDeleted ? '#' : `/profile/${c.author.username}`}
                className="flex items-center gap-1.5 font-semibold text-slate-200 hover:text-emerald-400 transition"
              >
                <img
                  src={c.author.avatar}
                  alt=""
                  className="w-5 h-5 rounded-full border border-slate-700 object-cover"
                />
                <span>{c.author.displayName}</span>
                <span className="font-mono text-slate-400 text-[11px]">@{c.author.username}</span>
              </Link>

              {c.author.semester && (
                <span className="rounded bg-slate-800 px-1 py-0.5 text-[9px] text-slate-300">
                  {c.author.semester}
                </span>
              )}
            </div>

            <span className="text-[10px] text-slate-400">
              {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {!isCollapsed && (
            <>
              {/* Comment Content */}
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap pl-6 mb-3">
                {c.content}
              </p>

              {/* Comment Controls */}
              <div className="flex items-center gap-3 pl-6 text-slate-400 text-[11px]">
                {/* Vote buttons */}
                <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                  <button
                    onClick={() => handleCommentVote(c.id, 1)}
                    className={`hover:text-emerald-400 ${c.userVote === 1 ? 'text-emerald-400 font-bold' : ''}`}
                    aria-label="Upvote comment"
                  >
                    ▲
                  </button>
                  <span className="px-1 text-xs font-semibold text-slate-300">{c.upvotesCount}</span>
                  <button
                    onClick={() => handleCommentVote(c.id, -1)}
                    className={`hover:text-rose-400 ${c.userVote === -1 ? 'text-rose-400 font-bold' : ''}`}
                    aria-label="Downvote comment"
                  >
                    ▼
                  </button>
                </div>

                {/* Reply toggle */}
                <button
                  onClick={() => {
                    setReplyingToId(isReplying ? null : c.id);
                    setReplyContent(`@${c.author.username} `);
                  }}
                  className="flex items-center gap-1 hover:text-emerald-400 font-medium transition"
                >
                  <CornerDownRight className="w-3.5 h-3.5" />
                  <span>Reply</span>
                </button>
              </div>

              {/* Inline Reply Box */}
              {isReplying && (
                <div className="mt-3 pl-6 pt-3 border-t border-slate-800/60">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={`Reply to @${c.author.username}...`}
                      className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      onClick={() => handleAddReply(c.id)}
                      disabled={submittingReply}
                      className="px-3 py-1.5 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-emerald-400 transition"
                    >
                      {submittingReply ? 'Sending...' : 'Reply'}
                    </button>
                    <button
                      onClick={() => setReplyingToId(null)}
                      className="px-2 text-slate-400 hover:text-white text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Nested replies */}
        {!isCollapsed && replies.length > 0 && (
          <div className="space-y-2 mt-2">
            {replies.map((reply) => renderCommentNode(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 flex gap-6">
        <Sidebar />
        <div className="flex-1 max-w-3xl glass-card rounded-3xl p-8 border border-slate-800 animate-pulse space-y-4">
          <div className="h-6 w-1/3 bg-slate-800 rounded" />
          <div className="h-8 w-3/4 bg-slate-800 rounded" />
          <div className="h-32 bg-slate-900 rounded" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Discussion Unavailable</h2>
        <p className="text-xs text-slate-400 mb-6">{error || 'This post could not be loaded.'}</p>
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-slate-950 rounded-xl font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Feed</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex-1 flex gap-6">
      <Sidebar />

      <main className="flex-1 max-w-3xl min-w-0 pb-16 md:pb-6">
        {/* Back Link */}
        <Link
          href="/feed"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 mb-4 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Feed</span>
        </Link>

        {/* Main Post Card */}
        <article className="glass-card rounded-3xl border border-slate-800 overflow-hidden mb-6">
          <div className="flex">
            {/* Reddit Vote Column */}
            <div className="flex flex-col items-center justify-start p-3 sm:p-4 bg-slate-950/40 border-r border-slate-800/60 shrink-0 select-none">
              <button
                onClick={() => handlePostVote(1)}
                className={`p-1 rounded-lg transition ${
                  userVote === 1 ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-emerald-400'
                }`}
                aria-label="Upvote"
              >
                <ArrowBigUp className={`w-7 h-7 ${userVote === 1 ? 'fill-current' : ''}`} />
              </button>

              <span className={`text-sm font-bold py-1 ${userVote === 1 ? 'text-emerald-400' : userVote === -1 ? 'text-rose-400' : 'text-slate-300'}`}>
                {score}
              </span>

              <button
                onClick={() => handlePostVote(-1)}
                className={`p-1 rounded-lg transition ${
                  userVote === -1 ? 'text-rose-400 bg-rose-500/10' : 'text-slate-400 hover:text-rose-400'
                }`}
                aria-label="Downvote"
              >
                <ArrowBigDown className={`w-7 h-7 ${userVote === -1 ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Post Detail Body */}
            <div className="flex-1 p-4 sm:p-6 overflow-hidden">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs">
                <div className="flex items-center gap-2">
                  <Link
                    href={post.author.isDeleted ? '#' : `/profile/${post.author.username}`}
                    className="flex items-center gap-2 group font-semibold text-slate-200"
                  >
                    <img
                      src={post.author.avatar}
                      alt=""
                      className="w-7 h-7 rounded-full border border-slate-700 object-cover"
                    />
                    <span className="group-hover:text-emerald-400 transition">{post.author.displayName}</span>
                    <span className="text-slate-400 font-mono text-[11px]">@{post.author.username}</span>
                  </Link>

                  {post.author.semester && (
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
                      {post.author.semester}
                    </span>
                  )}
                  <span className="text-slate-400">&bull;</span>
                  <span className="text-slate-400">{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>

                {post.department ? (
                  <Link
                    href={`/departments/${post.department.slug}`}
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20"
                  >
                    <Building2 className="w-3 h-3" />
                    <span>{post.department.name}</span>
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300">
                    <Globe className="w-3 h-3" />
                    <span>Global</span>
                  </span>
                )}
              </div>

              {/* Title & Body */}
              <h1 className="text-xl sm:text-2xl font-black text-white mb-3 leading-snug">
                {post.title}
              </h1>

              <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap mb-4">
                {post.content}
              </div>

              {/* Media viewer */}
              {post.mediaUrl && (
                <div className="mb-4 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                  {post.mediaType?.startsWith('video/') ? (
                    <video src={post.mediaUrl} controls className="w-full max-h-[500px] object-contain" />
                  ) : post.mediaType?.startsWith('image/') || post.postType === 'IMAGE' || post.postType === 'GIF' ? (
                    <img src={post.mediaUrl} alt={post.title} className="w-full max-h-[500px] object-contain bg-slate-950" />
                  ) : (
                    <a
                      href={post.mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 hover:bg-slate-800/80 transition"
                    >
                      <FileText className="w-7 h-7 text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-white">{post.fileName || 'Open Document'}</p>
                        <p className="text-[10px] text-slate-400">Click to view/download attachment</p>
                      </div>
                      <ExternalLink className="w-4 h-4 ml-auto text-slate-400" />
                    </a>
                  )}
                </div>
              )}

              {/* Link preview */}
              {post.linkUrl && (
                <a
                  href={post.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-400 hover:text-emerald-300 transition"
                >
                  <ExternalLink className="w-4 h-4 shrink-0" />
                  <span className="truncate">{post.linkUrl}</span>
                </a>
              )}

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <MessageSquare className="w-4 h-4" />
                  <span>{post.commentsCount} {post.commentsCount === 1 ? 'Comment' : 'Comments'}</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 transition"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                    <span>{copied ? 'Copied' : 'Share'}</span>
                  </button>

                  <button
                    onClick={() => setReportOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition"
                  >
                    <Flag className="w-4 h-4" />
                    <span>Report</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* Discord-Style Comment Discussion Thread Section */}
        <section className="glass-card rounded-3xl p-5 sm:p-7 border border-slate-800">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <span>Student Discussion</span>
            <span className="text-xs font-normal text-slate-400">({comments.length})</span>
          </h2>

          {/* New Top-Level Comment Composer */}
          {user ? (
            <form onSubmit={handleAddComment} className="mb-6">
              <div className="flex items-start gap-3">
                <img
                  src={user.avatar}
                  alt=""
                  className="w-8 h-8 rounded-full border border-slate-700 object-cover mt-1"
                />
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add to the discussion... Mention peers with @username"
                    rows={3}
                    className="w-full rounded-2xl bg-slate-950 border border-slate-800 p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-slate-400">
                      Discussions are permanent and cannot be deleted.
                    </span>
                    <button
                      type="submit"
                      disabled={submittingComment || !newComment.trim()}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl hover:bg-emerald-400 transition disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submittingComment ? 'Posting...' : 'Comment'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center mb-6 text-xs text-slate-400">
              <Link href="/login" className="text-emerald-400 font-bold hover:underline">
                Sign in
              </Link>{' '}
              to participate in this campus discussion thread.
            </div>
          )}

          {/* Thread List */}
          <div className="space-y-4">
            {rootComments.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                No replies yet. Be the first to share your perspective!
              </p>
            ) : (
              rootComments.map((root) => renderCommentNode(root, 0))
            )}
          </div>
        </section>
      </main>

      <ReportModal
        postId={post.id}
        postTitle={post.title}
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </div>
  );
}
