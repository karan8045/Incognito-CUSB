'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Bell,
  MessageSquare,
  Search,
  User as UserIcon,
  Sparkles,
  LogOut,
  Settings,
} from 'lucide-react';

export default function Navbar() {
  const { user, unreadCount, pendingRequestsCount, logout } = useAuth();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  // Do not show on auth pages if desired, but good everywhere
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <Link href={user ? '/feed' : '/'} className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 shadow-md shadow-emerald-950/50 group-hover:scale-105 transition-transform">
              <span className="text-lg font-black tracking-tight text-white">IC</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-extrabold tracking-tight text-white">Incognito</span>
                <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                  CUSB
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">Central University of South Bihar</p>
            </div>
          </Link>
        </div>

        {/* Search Bar Shortcut */}
        <div className="hidden md:flex flex-1 max-w-md mx-6">
          <Link
            href="/search"
            className="flex items-center w-full gap-2.5 px-4 py-2 text-sm text-slate-400 bg-slate-900/90 hover:bg-slate-850 hover:text-slate-200 border border-slate-800 rounded-full transition-all cursor-pointer"
          >
            <Search className="w-4 h-4 text-emerald-400" />
            <span>Search students, discussions, departments...</span>
            <kbd className="ml-auto text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
              /
            </kbd>
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Search Icon */}
          <Link
            href="/search"
            className="p-2 text-slate-300 hover:text-white md:hidden hover:bg-slate-850 rounded-lg transition"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </Link>

          {user ? (
            <>
              {/* Messages button with badge */}
              <Link
                href="/messages"
                className={`relative p-2 rounded-xl transition ${
                  pathname.startsWith('/messages')
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'text-slate-300 hover:bg-slate-850 hover:text-white'
                }`}
                aria-label="Messages"
              >
                <MessageSquare className="w-5 h-5" />
                {pendingRequestsCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-slate-950">
                    {pendingRequestsCount}
                  </span>
                )}
              </Link>

              {/* Notifications button with badge */}
              <Link
                href="/notifications"
                className={`relative p-2 rounded-xl transition ${
                  pathname === '/notifications'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'text-slate-300 hover:bg-slate-850 hover:text-white'
                }`}
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-slate-950">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-emerald-500/30 transition"
                >
                  <img
                    src={user.avatar}
                    alt={user.displayName}
                    className="w-8 h-8 rounded-full border border-slate-700 bg-slate-800 object-cover"
                  />
                </button>

                {dropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-800 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-3 py-2 border-b border-slate-800">
                        <p className="text-sm font-semibold text-white truncate">{user.displayName}</p>
                        <p className="text-xs text-emerald-400 font-mono truncate">@{user.username}</p>
                        {user.semester && (
                          <p className="text-[11px] text-slate-400 mt-0.5">{user.semester}</p>
                        )}
                      </div>

                      <div className="py-1">
                        <Link
                          href={`/profile/${user.username}`}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800/80 rounded-xl transition"
                        >
                          <UserIcon className="w-4 h-4 text-emerald-400" />
                          <span>My Profile</span>
                        </Link>
                        <Link
                          href="/settings"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800/80 rounded-xl transition"
                        >
                          <Settings className="w-4 h-4 text-slate-400" />
                          <span>Settings</span>
                        </Link>
                      </div>

                      <div className="pt-1 border-t border-slate-800">
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            logout();
                          }}
                          className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-xl transition"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-950/40 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Join CUSB</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
