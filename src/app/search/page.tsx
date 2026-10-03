'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { Search as SearchIcon, User, Building2, MessageSquare, ArrowRight } from 'lucide-react';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    users: any[];
    posts: any[];
    departments: any[];
  }>({ users: [], posts: [], departments: [] });

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const performSearch = (q: string) => {
    if (!q.trim()) {
      setResults({ users: [], posts: [], departments: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/users/search?q=${encodeURIComponent(q.trim())}`)
      .then((res) => res.json())
      .then((data) => {
        setResults({
          users: data.users || [],
          posts: data.posts || [],
          departments: data.departments || [],
        });
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleInputChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      performSearch(val);
    }, 300); // 300ms debounce
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex-1 flex gap-6">
      <Sidebar />

      <main className="flex-1 max-w-2xl min-w-0 pb-16 md:pb-6">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 mb-2">
            <SearchIcon className="w-6 h-6 text-emerald-400" />
            <span>Campus Search</span>
          </h1>
          <p className="text-xs text-slate-400">
            Search students by exact or partial @username, browse discussions, or find academic departments.
          </p>
        </div>

        {/* Search Bar Input */}
        <div className="relative mb-8">
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Search students (@username...), discussions, departments..."
            className="w-full rounded-2xl bg-slate-900 border border-slate-800 pl-12 pr-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 shadow-xl transition"
          />
          <SearchIcon className="w-5 h-5 text-emerald-400 absolute left-4 top-4" />
          {loading && (
            <div className="absolute right-4 top-4 w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        {/* Results Sections */}
        {query.trim() && !loading && (
          <div className="space-y-6">
            {/* Users section */}
            {results.users.length > 0 && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Students ({results.users.length})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {results.users.map((u) => (
                    <Link
                      key={u.id}
                      href={`/profile/${u.username}`}
                      className="glass-card rounded-2xl p-3.5 border border-slate-800 hover:border-emerald-500/30 transition flex items-center gap-3"
                    >
                      <img
                        src={u.avatar}
                        alt=""
                        className="w-10 h-10 rounded-full border border-slate-700 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">{u.displayName}</p>
                        <p className="text-[11px] text-emerald-400 font-mono truncate">@{u.username}</p>
                        {u.semester && (
                          <p className="text-[10px] text-slate-500 truncate">{u.semester}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Departments section */}
            {results.departments.length > 0 && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-teal-400 mb-3 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Academic Departments ({results.departments.length})</span>
                </h2>
                <div className="space-y-2">
                  {results.departments.map((d) => (
                    <Link
                      key={d.id}
                      href={`/departments/${d.slug}`}
                      className="glass-card rounded-2xl p-4 border border-slate-800 hover:border-teal-500/30 transition flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-xs font-bold text-white">{d.name}</p>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{d.description}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-teal-400 shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Posts section */}
            {results.posts.length > 0 && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-sky-400 mb-3 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Public Discussions ({results.posts.length})</span>
                </h2>
                <div className="space-y-2.5">
                  {results.posts.map((p) => (
                    <Link
                      key={p.id}
                      href={`/post/${p.id}`}
                      className="glass-card rounded-2xl p-4 border border-slate-800 hover:border-sky-500/30 transition block"
                    >
                      <h3 className="text-xs sm:text-sm font-bold text-white mb-1">{p.title}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{p.content}</p>
                      <div className="mt-3 flex items-center gap-3 text-[10px] text-slate-500">
                        <span>by @{p.author.username}</span>
                        <span>&bull;</span>
                        <span>{p.score} points</span>
                        <span>&bull;</span>
                        <span>{p.commentsCount} comments</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {results.users.length === 0 &&
              results.departments.length === 0 &&
              results.posts.length === 0 && (
                <div className="glass-card rounded-2xl p-8 text-center border border-slate-800 text-xs text-slate-400">
                  No matching students, departments, or discussions found for &ldquo;{query}&rdquo;.
                </div>
              )}
          </div>
        )}
      </main>
    </div>
  );
}
