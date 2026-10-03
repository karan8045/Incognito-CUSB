'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Globe,
  Building2,
  Plus,
  MessageSquare,
  User as UserIcon,
} from 'lucide-react';

interface MobileBottomNavProps {
  onOpenCreatePost?: () => void;
}

export default function MobileBottomNav({ onOpenCreatePost }: MobileBottomNavProps) {
  const pathname = usePathname();
  const { user, pendingRequestsCount } = useAuth();

  // Hide on deep chat view on mobile for keyboard space
  const isDeepChat = pathname.startsWith('/messages') && pathname.includes('cid=');

  if (isDeepChat) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-lg pb-safe">
      <div className="flex h-16 items-center justify-around px-2">
        {/* Global Feed */}
        <Link
          href="/feed"
          className={`flex flex-col items-center justify-center w-14 h-full gap-1 transition ${
            pathname === '/feed' ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="w-5 h-5" />
          <span className="text-[10px]">Global</span>
        </Link>

        {/* Departments */}
        <Link
          href="/departments"
          className={`flex flex-col items-center justify-center w-14 h-full gap-1 transition ${
            pathname.startsWith('/departments') ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-5 h-5" />
          <span className="text-[10px]">Hubs</span>
        </Link>

        {/* Create Post Action Button */}
        {user ? (
          <button
            onClick={onOpenCreatePost}
            className="flex items-center justify-center w-12 h-12 -mt-4 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-950/60 active:scale-95 transition"
            aria-label="Create Post"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center w-12 h-12 -mt-4 rounded-full bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-950/60 active:scale-95 transition"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </Link>
        )}

        {/* Messages */}
        <Link
          href="/messages"
          className={`relative flex flex-col items-center justify-center w-14 h-full gap-1 transition ${
            pathname.startsWith('/messages') ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          {pendingRequestsCount > 0 && (
            <span className="absolute top-2 right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-slate-950">
              {pendingRequestsCount}
            </span>
          )}
          <span className="text-[10px]">Chats</span>
        </Link>

        {/* Profile */}
        <Link
          href={user ? `/profile/${user.username}` : '/login'}
          className={`flex flex-col items-center justify-center w-14 h-full gap-1 transition ${
            user && pathname === `/profile/${user.username}` ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {user ? (
            <img
              src={user.avatar}
              alt=""
              className="w-5 h-5 rounded-full border border-slate-700 object-cover"
            />
          ) : (
            <UserIcon className="w-5 h-5" />
          )}
          <span className="text-[10px]">{user ? 'Me' : 'Sign In'}</span>
        </Link>
      </div>
    </nav>
  );
}
