'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Globe,
  Building2,
  MessageSquare,
  Bell,
  Search,
  Settings,
  Shield,
  FileText,
  PlusCircle,
  HelpCircle,
} from 'lucide-react';

interface SidebarProps {
  onOpenCreatePost?: () => void;
}

export default function Sidebar({ onOpenCreatePost }: SidebarProps) {
  const pathname = usePathname();
  const { user, pendingRequestsCount, unreadCount } = useAuth();

  const navItems = [
    {
      label: 'Global Feed',
      href: '/feed',
      icon: Globe,
      active: pathname === '/feed',
    },
    {
      label: 'Departments',
      href: '/departments',
      icon: Building2,
      active: pathname.startsWith('/departments'),
    },
    {
      label: 'Messages',
      href: '/messages',
      icon: MessageSquare,
      active: pathname.startsWith('/messages'),
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
    },
    {
      label: 'Notifications',
      href: '/notifications',
      icon: Bell,
      active: pathname === '/notifications',
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      label: 'Search',
      href: '/search',
      icon: Search,
      active: pathname === '/search',
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings,
      active: pathname === '/settings',
    },
  ];

  return (
    <aside className="sticky top-20 hidden md:flex flex-col w-64 h-[calc(100vh-5rem)] shrink-0 gap-6 pr-4 overflow-y-auto">
      {/* Primary Actions */}
      {user && onOpenCreatePost && (
        <button
          onClick={onOpenCreatePost}
          className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-950/40 hover:from-emerald-400 hover:to-teal-500 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <PlusCircle className="w-5 h-5" />
          <span>New Discussion</span>
        </button>
      )}

      {/* Main Navigation */}
      <nav className="flex flex-col gap-1.5">
        <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Navigation</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                item.active
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-300 hover:bg-slate-850 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${item.active ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[11px] font-bold text-slate-950">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Quick Departments Highlights */}
      <div className="flex flex-col gap-1.5 pt-4 border-t border-slate-800/80">
        <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Popular Hubs</p>
        <Link
          href="/departments/department-of-computer-science"
          className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-emerald-300 hover:bg-slate-850 rounded-lg transition truncate"
        >
          # Computer Science
        </Link>
        <Link
          href="/departments/department-of-law-and-governance"
          className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-emerald-300 hover:bg-slate-850 rounded-lg transition truncate"
        >
          # Law & Governance
        </Link>
        <Link
          href="/departments/department-of-biotechnology"
          className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-emerald-300 hover:bg-slate-850 rounded-lg transition truncate"
        >
          # Biotechnology
        </Link>
        <Link
          href="/departments"
          className="px-3.5 py-1.5 text-[11px] font-semibold text-emerald-400 hover:underline"
        >
          View all 29 departments →
        </Link>
      </div>

      {/* Legal & Safety Links */}
      <div className="mt-auto pt-4 border-t border-slate-800/80">
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 px-3 text-[11px] text-slate-400">
          <Link href="/guidelines" className="hover:text-slate-300 flex items-center gap-1">
            <Shield className="w-3 h-3 text-emerald-500" />
            <span>Guidelines</span>
          </Link>
          <Link href="/privacy" className="hover:text-slate-300 flex items-center gap-1">
            <FileText className="w-3 h-3" />
            <span>Privacy</span>
          </Link>
          <Link href="/terms" className="hover:text-slate-300 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            <span>Terms</span>
          </Link>
        </div>
        <p className="px-3 mt-2 text-[10px] text-slate-400 leading-tight">
          Incognito CUSB is an independent student platform.
        </p>
      </div>
    </aside>
  );
}
