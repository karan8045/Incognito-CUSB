'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Image as ImageIcon,
  Video,
  FileText,
  Link as LinkIcon,
  Building2,
  Globe,
  AlertCircle,
  UploadCloud,
  CheckCircle2,
} from 'lucide-react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDepartmentSlug?: string;
  onPostCreated?: (newPost: any) => void;
}

export default function CreatePostModal({
  isOpen,
  onClose,
  defaultDepartmentSlug,
  onPostCreated,
}: CreatePostModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<'TEXT' | 'MEDIA' | 'LINK' | 'DOCUMENT'>('TEXT');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [linkUrl, setLinkUrl] = useState('');
  const [departments, setDepartments] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  
  // Media upload state
  const [file, setFile] = useState<File | null>(null);
  const [uploadedMedia, setUploadedMedia] = useState<{
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  } | null>(null);

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/departments')
      .then((res) => res.json())
      .then((data) => {
        if (data.departments) {
          setDepartments(data.departments);
          if (defaultDepartmentSlug) {
            const found = data.departments.find((d: any) => d.slug === defaultDepartmentSlug);
            if (found) setSelectedDeptId(found.id);
          }
        }
      })
      .catch(() => {});
  }, [isOpen, defaultDepartmentSlug]);

  if (!isOpen) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selected);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadedMedia({
        url: data.url,
        fileName: data.fileName,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
      });
      setPostType(data.category === 'DOCUMENT' ? 'DOCUMENT' : 'MEDIA');
    } catch (err: any) {
      setError(err.message || 'File upload error');
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title for your post.');
      return;
    }
    if (!content.trim()) {
      setError('Please write content for your post.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload: any = {
        title: title.trim(),
        content: content.trim(),
        postType,
        departmentId: selectedDeptId || null,
      };

      if (uploadedMedia) {
        payload.mediaUrl = uploadedMedia.url;
        payload.mediaType = uploadedMedia.mimeType;
        payload.fileName = uploadedMedia.fileName;
        payload.fileSize = uploadedMedia.fileSize;
      }

      if (postType === 'LINK' && linkUrl.trim()) {
        payload.linkUrl = linkUrl.trim();
      }

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create post');
      }

      // Reset form
      setTitle('');
      setContent('');
      setFile(null);
      setUploadedMedia(null);
      setLinkUrl('');
      if (onPostCreated) onPostCreated(data.post);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the post');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-6 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 text-slate-400 hover:text-white rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-bold text-white mb-1">Create Student Discussion</h2>
        <p className="text-xs text-slate-400 mb-4">
          Share your voice with the CUSB community.
        </p>

        {/* Permanent Post Notice */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs mb-4">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="leading-tight">
            <strong>Platform Rule:</strong> Once published, public posts cannot be edited or deleted by normal users.
            Please review your content before posting.
          </p>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Destination Selector: Global vs Department */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Posting Destination
            </label>
            <div className="relative">
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">🌐 Global (University-Wide Community)</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    🏛️ {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's happening on campus?"
              maxLength={200}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Content Body */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Discussion Content (Supports @mentions)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Elaborate your thoughts, questions, or campus news... Mention students with @username"
              rows={4}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
            />
          </div>

          {/* Attachment Selector Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                fileInputRef.current?.click();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-xs font-medium text-slate-300 transition"
            >
              <UploadCloud className="w-4 h-4 text-emerald-400" />
              <span>Attach Media / File</span>
            </button>

            <button
              type="button"
              onClick={() => setPostType(postType === 'LINK' ? 'TEXT' : 'LINK')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                postType === 'LINK'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <LinkIcon className="w-4 h-4 text-sky-400" />
              <span>Add Link</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
            />
          </div>

          {/* Upload Status */}
          {uploading && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
              <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              <span>Uploading and validating campus media...</span>
            </div>
          )}

          {uploadedMedia && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
              <div className="flex items-center gap-2 truncate">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">{uploadedMedia.fileName}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUploadedMedia(null);
                  setFile(null);
                  setPostType('TEXT');
                }}
                className="text-slate-400 hover:text-white ml-2 text-xs"
              >
                Remove
              </button>
            </div>
          )}

          {/* Link URL input */}
          {postType === 'LINK' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Website / Resource URL
              </label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="px-5 py-2.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl shadow-lg shadow-emerald-950/40 transition disabled:opacity-50"
            >
              {submitting ? 'Publishing...' : 'Publish Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
