'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowBigUp,
  ArrowBigDown,
  MessageSquare,
  Share2,
  Flag,
  FileText,
  ExternalLink,
  Building2,
  Globe,
  Check,
} from 'lucide-react';
import ReportModal from './ReportModal';

export interface PostItem {
  id: string;
  title: string;
  content: string;
  postType: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  linkUrl?: string | null;
  upvotesCount: number;
  downvotesCount: number;
  score: number;
  commentsCount: number;
  createdAt: string;
  userVote: number;
  department?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
    semester?: string | null;
    isDeleted?: boolean;
  };
}

interface PostCardProps {
  post: PostItem;
  onVoteChange?: (postId: string, newScore: number, userVote: number) => void;
}

export default function PostCard({ post, onVoteChange }: PostCardProps) {
  const { user } = useAuth();
  const [score, setScore] = useState(post.score);
  const [userVote, setUserVote] = useState(post.userVote);
  const [voting, setVoting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const handleVote = async (direction: 1 | -1) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    if (voting) return;

    // Optimistic UI calculation
    const previousVote = userVote;
    const previousScore = score;
    const newVote = previousVote === direction ? 0 : direction;
    const diff = newVote - previousVote;
    const optimisticScore = previousScore + diff;

    setUserVote(newVote);
    setScore(optimisticScore);
    setVoting(true);

    try {
      const res = await fetch(`/api/posts/${post.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: newVote }),
      });

      if (!res.ok) {
        throw new Error('Vote failed');
      }

      const data = await res.json();
      setScore(data.score);
      setUserVote(data.userVote);
      if (onVoteChange) {
        onVoteChange(post.id, data.score, data.userVote);
      }
    } catch {
      // Revert on failure
      setUserVote(previousVote);
      setScore(previousScore);
    } finally {
      setVoting(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return new Date(isoString).toLocaleDateString();
    } catch {
      return '';
    }
  };

  return (
    <article className="glass-card rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-slate-950/40 border border-slate-800/80">
      <div className="flex">
        {/* Reddit-style Left Vote Column */}
        <div className="flex flex-col items-center justify-start p-2.5 sm:p-3 bg-slate-950/40 border-r border-slate-800/60 shrink-0 select-none">
          <button
            onClick={() => handleVote(1)}
            disabled={voting}
            className={`p-1 rounded-lg transition ${
              userVote === 1
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800/80'
            }`}
            aria-label="Upvote"
          >
            <ArrowBigUp className={`w-6 h-6 ${userVote === 1 ? 'fill-current' : ''}`} />
          </button>

          <span
            className={`text-xs font-bold py-1 ${
              userVote === 1
                ? 'text-emerald-400'
                : userVote === -1
                ? 'text-rose-400'
                : 'text-slate-300'
            }`}
          >
            {score}
          </span>

          <button
            onClick={() => handleVote(-1)}
            disabled={voting}
            className={`p-1 rounded-lg transition ${
              userVote === -1
                ? 'text-rose-400 bg-rose-500/10'
                : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800/80'
            }`}
            aria-label="Downvote"
          >
            <ArrowBigDown className={`w-6 h-6 ${userVote === -1 ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Post Content Body */}
        <div className="flex-1 p-3.5 sm:p-5 flex flex-col justify-between overflow-hidden">
          {/* Header Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              {/* Author Info */}
              <Link
                href={post.author.isDeleted ? '#' : `/profile/${post.author.username}`}
                className="flex items-center gap-2 group"
              >
                <img
                  src={post.author.avatar}
                  alt={post.author.displayName}
                  className="w-6 h-6 rounded-full border border-slate-700 object-cover"
                />
                <span className="font-semibold text-slate-200 group-hover:text-emerald-400 transition truncate max-w-[120px] sm:max-w-[160px]">
                  {post.author.displayName}
                </span>
                <span className="text-slate-400 font-mono text-[11px] truncate">
                  @{post.author.username}
                </span>
              </Link>

              {post.author.semester && (
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">
                  {post.author.semester}
                </span>
              )}

              <span className="text-slate-400 text-[11px]">·</span>
              <span className="text-slate-400 text-[11px]">{formatTime(post.createdAt)}</span>
            </div>

            {/* Department Badge */}
            {post.department ? (
              <Link
                href={`/departments/${post.department.slug}`}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition shrink-0"
              >
                <Building2 className="w-3 h-3" />
                <span className="truncate max-w-[130px] sm:max-w-[180px]">{post.department.name}</span>
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300 shrink-0">
                <Globe className="w-3 h-3 text-slate-400" />
                <span>Global</span>
              </span>
            )}
          </div>

          {/* Post Title & Text */}
          <Link href={`/post/${post.id}`} className="group block">
            <h2 className="text-base sm:text-lg font-bold text-white group-hover:text-emerald-300 transition-colors leading-snug mb-2">
              {post.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 line-clamp-3 leading-relaxed whitespace-pre-wrap">
              {post.content}
            </p>
          </Link>

          {/* Media Attachments Preview */}
          {post.mediaUrl && (
            <div className="mt-3.5 rounded-xl overflow-hidden border border-slate-800 bg-slate-950/60 max-h-96">
              {post.postType === 'MEDIA' && post.mediaType?.startsWith('video/') ? (
                <video
                  src={post.mediaUrl}
                  controls
                  preload="metadata"
                  className="w-full max-h-96 object-contain bg-black"
                />
              ) : post.postType === 'MEDIA' || post.postType === 'IMAGE' || post.postType === 'GIF' ? (
                <Link href={`/post/${post.id}`}>
                  <img
                    src={post.mediaUrl}
                    alt={post.title}
                    loading="lazy"
                    className="w-full max-h-96 object-cover hover:scale-[1.01] transition-transform duration-300 cursor-pointer"
                  />
                </Link>
              ) : (
                <a
                  href={post.mediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 text-xs text-slate-200 hover:bg-slate-800/80 transition"
                >
                  <FileText className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div className="truncate">
                    <p className="font-semibold truncate">{post.fileName || 'View Document'}</p>
                    {post.fileSize && (
                      <p className="text-[10px] text-slate-400">
                        {(post.fileSize / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    )}
                  </div>
                  <ExternalLink className="w-4 h-4 ml-auto text-slate-400" />
                </a>
              )}
            </div>
          )}

          {/* Link URL preview */}
          {post.linkUrl && (
            <a
              href={post.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/30 transition truncate"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{post.linkUrl}</span>
            </a>
          )}

          {/* Bottom Actions Row */}
          <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-800/60 text-xs text-slate-400">
            <Link
              href={`/post/${post.id}`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 hover:text-slate-200 transition font-medium"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{post.commentsCount} {post.commentsCount === 1 ? 'Comment' : 'Comments'}</span>
            </Link>

            <div className="flex items-center gap-1">
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 hover:text-slate-200 transition"
                title="Share link"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                <span className="hidden sm:inline">{copied ? 'Copied' : 'Share'}</span>
              </button>

              <button
                onClick={() => setReportOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition"
                title="Report violation"
              >
                <Flag className="w-4 h-4" />
                <span className="hidden sm:inline">Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <ReportModal
        postId={post.id}
        postTitle={post.title}
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </article>
  );
}
