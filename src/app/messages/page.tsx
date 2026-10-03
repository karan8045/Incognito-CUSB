'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import {
  MessageSquare,
  Send,
  Paperclip,
  Check,
  CheckCheck,
  Smile,
  X,
  ArrowLeft,
  Search,
  UserCheck,
  UserX,
  Ban,
  FileText,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';

interface ConversationItem {
  id: string;
  lastMessageAt: string;
  otherUser: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
    semester?: string | null;
    isDeleted?: boolean;
  };
  lastMessage?: {
    id: string;
    content: string;
    messageType: string;
    mediaUrl?: string | null;
    createdAt: string;
    senderId: string;
    isRead: boolean;
  } | null;
}

interface ChatRequestItem {
  id: string;
  initialMessage: string;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
    semester?: string | null;
  };
}

interface MessageItem {
  id: string;
  content: string;
  messageType: string;
  mediaUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  senderId: string;
  isRead: boolean;
  createdAt: string;
  isMine: boolean;
  sender: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
  };
  replyTo?: {
    id: string;
    content: string;
    authorName: string;
  } | null;
  reactions: Array<{
    id: string;
    emoji: string;
    userId: string;
    username: string;
  }>;
}

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '😂', '👏', '🎓'];

function MessagesContent() {
  const { user, setPendingRequestsCount } = useAuth();
  const searchParams = useSearchParams();
  const initialCid = searchParams.get('cid');
  const initialTab = searchParams.get('tab') === 'requests' ? 'requests' : 'chats';

  const [tab, setTab] = useState<'chats' | 'requests'>(initialTab);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [requests, setRequests] = useState<ChatRequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Active chat state
  const [activeConversationId, setActiveConversationId] = useState<string | null>(initialCid);
  const [activePartner, setActivePartner] = useState<any>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Composer
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<MessageItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);

  // Search filter
  const [chatSearch, setChatSearch] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Fetch conversations list
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Fetch pending chat requests
  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch('/api/chat-requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
        setPendingRequestsCount(data.requests?.length || 0);
      }
    } catch (err) {
      console.error(err);
    }
  }, [setPendingRequestsCount]);

  useEffect(() => {
    Promise.all([fetchConversations(), fetchRequests()]).finally(() => setLoading(false));
  }, [fetchConversations, fetchRequests]);

  // Load active conversation messages
  const loadConversation = useCallback(
    async (cid: string) => {
      try {
        setMessagesLoading(true);
        const res = await fetch(`/api/conversations/${cid}`);
        if (res.ok) {
          const data = await res.json();
          setActivePartner(data.conversation.otherUser);
          setMessages(data.conversation.messages || []);
          setTimeout(() => scrollToBottom('auto'), 100);

          // Mark as read
          fetch(`/api/conversations/${cid}/read`, { method: 'POST' }).catch(() => {});
        }
      } catch (err) {
        console.error(err);
      } finally {
        setMessagesLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (activeConversationId) {
      loadConversation(activeConversationId);
    }
  }, [activeConversationId, loadConversation]);

  // Real-time Event listeners (SSE integration via AuthContext dispatch)
  useEffect(() => {
    const handleNewMessage = (e: any) => {
      const { conversationId, message } = e.detail;
      if (conversationId === activeConversationId) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
        // Send read receipt
        fetch(`/api/conversations/${conversationId}/read`, { method: 'POST' }).catch(() => {});
      }
      fetchConversations();
    };

    const handleTyping = (e: any) => {
      const { conversationId, isTyping } = e.detail;
      if (conversationId === activeConversationId) {
        setPartnerTyping(isTyping);
      }
    };

    const handleRead = (e: any) => {
      const { conversationId } = e.detail;
      if (conversationId === activeConversationId) {
        setMessages((prev) =>
          prev.map((m) => (m.isMine ? { ...m, isRead: true } : m))
        );
      }
    };

    const handleReaction = (e: any) => {
      const { messageId, reactions } = e.detail;
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reactions } : m))
      );
    };

    const handleNewRequest = () => {
      fetchRequests();
    };

    window.addEventListener('cusb:message', handleNewMessage);
    window.addEventListener('cusb:typing', handleTyping);
    window.addEventListener('cusb:read', handleRead);
    window.addEventListener('cusb:reaction', handleReaction);
    window.addEventListener('cusb:chat_request', handleNewRequest);

    return () => {
      window.removeEventListener('cusb:message', handleNewMessage);
      window.removeEventListener('cusb:typing', handleTyping);
      window.removeEventListener('cusb:read', handleRead);
      window.removeEventListener('cusb:reaction', handleReaction);
      window.removeEventListener('cusb:chat_request', handleNewRequest);
    };
  }, [activeConversationId, fetchConversations, fetchRequests]);

  // Send typing indicator
  const handleTypingChange = (text: string) => {
    setInputText(text);
    if (!activeConversationId) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    fetch(`/api/conversations/${activeConversationId}/typing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isTyping: true }),
    }).catch(() => {});

    typingTimeoutRef.current = setTimeout(() => {
      fetch(`/api/conversations/${activeConversationId}/typing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTyping: false }),
      }).catch(() => {});
    }, 2000);
  };

  // Send message
  const handleSendMessage = async (payload: {
    content?: string;
    mediaUrl?: string;
    messageType?: string;
    fileName?: string;
    fileSize?: number;
  }) => {
    if (!activeConversationId) return;
    if (!payload.content && !payload.mediaUrl) return;

    const body: any = {
      content: payload.content || '',
      messageType: payload.messageType || 'TEXT',
      mediaUrl: payload.mediaUrl || null,
      fileName: payload.fileName || null,
      fileSize: payload.fileSize || null,
      replyToId: replyingTo ? replyingTo.id : null,
    };

    setInputText('');
    setReplyingTo(null);

    try {
      const res = await fetch(`/api/conversations/${activeConversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        scrollToBottom();
        fetchConversations();
      }
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  // Upload attachment
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversationId) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      await handleSendMessage({
        content: '',
        mediaUrl: data.url,
        messageType: data.category,
        fileName: data.fileName,
        fileSize: data.fileSize,
      });
    } catch (err: any) {
      alert(err.message || 'File upload error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Reaction toggle
  const handleReactionClick = async (messageId: string, emoji: string) => {
    try {
      const res = await fetch(`/api/messages/${messageId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, reactions: data.reactions } : m))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Action on Chat Request (ACCEPT | REJECT | BLOCK)
  const handleRequestAction = async (requestId: string, action: 'ACCEPT' | 'REJECT' | 'BLOCK') => {
    try {
      const res = await fetch(`/api/chat-requests/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        const data = await res.json();
        fetchRequests();
        fetchConversations();
        if (action === 'ACCEPT' && data.conversationId) {
          setActiveConversationId(data.conversationId);
          setTab('chats');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.otherUser.displayName.toLowerCase().includes(chatSearch.toLowerCase()) ||
    c.otherUser.username.toLowerCase().includes(chatSearch.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1 flex gap-6 h-[calc(100vh-4.5rem)]">
      <Sidebar />

      <main className="flex-1 flex glass-card rounded-3xl border border-slate-800 overflow-hidden shadow-2xl relative">
        {/* Left Pane: Conversation List / Requests Tabs */}
        <div
          className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-slate-800 bg-slate-950/70 shrink-0 ${
            activeConversationId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header & Tabs */}
          <div className="p-4 border-b border-slate-800">
            <h1 className="text-lg font-black text-white mb-3">Student Messages</h1>

            {/* Tab switch */}
            <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setTab('chats')}
                className={`py-1.5 rounded-lg transition ${
                  tab === 'chats' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Chats ({conversations.length})
              </button>
              <button
                onClick={() => setTab('requests')}
                className={`py-1.5 rounded-lg transition relative ${
                  tab === 'requests' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Requests</span>
                {requests.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px]">
                    {requests.length}
                  </span>
                )}
              </button>
            </div>

            {/* Search filter in chats */}
            {tab === 'chats' && (
              <div className="relative mt-3">
                <input
                  type="text"
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  placeholder="Filter conversations..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              </div>
            )}
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto">
            {tab === 'chats' ? (
              filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p>No active conversations.</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Send a chat request from any student&apos;s profile to connect!
                  </p>
                </div>
              ) : (
                filteredConversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveConversationId(c.id)}
                    className={`w-full text-left p-3.5 flex items-center gap-3 border-b border-slate-900 hover:bg-slate-900/60 transition ${
                      activeConversationId === c.id ? 'bg-slate-900/90 border-l-4 border-l-emerald-400' : ''
                    }`}
                  >
                    <img
                      src={c.otherUser.avatar}
                      alt=""
                      className="w-11 h-11 rounded-full border border-slate-700 object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-xs text-white truncate">
                          {c.otherUser.displayName}
                        </span>
                        <span className="text-[10px] text-slate-500 shrink-0">
                          {c.lastMessage
                            ? new Date(c.lastMessage.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-400 font-mono truncate">
                        @{c.otherUser.username}
                      </p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {c.lastMessage?.content || (c.lastMessage?.mediaUrl ? '[Attachment]' : 'Active chat')}
                      </p>
                    </div>
                  </button>
                ))
              )
            ) : (
              /* Message Requests Tab (Requirement 18) */
              requests.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  <UserCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p>No pending message requests.</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    New message requests from peers will appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-900 p-2 space-y-2">
                  {requests.map((r) => (
                    <div key={r.id} className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                      <div className="flex items-center gap-2.5 mb-2">
                        <img
                          src={r.sender.avatar}
                          alt=""
                          className="w-8 h-8 rounded-full border border-slate-700 object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate">{r.sender.displayName}</p>
                          <p className="text-[10px] text-emerald-400 font-mono">@{r.sender.username}</p>
                        </div>
                        <span className="text-[9px] text-slate-500">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/60 text-xs text-slate-300 mb-3 italic">
                        &ldquo;{r.initialMessage}&rdquo;
                      </div>

                      <div className="flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => handleRequestAction(r.id, 'ACCEPT')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => handleRequestAction(r.id, 'REJECT')}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg text-xs transition"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleRequestAction(r.id, 'BLOCK')}
                          className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                          title="Block this sender"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>

        {/* Right Pane: Active Conversation Window */}
        <div
          className={`flex-1 flex flex-col bg-slate-950/40 min-w-0 ${
            !activeConversationId ? 'hidden md:flex items-center justify-center' : 'flex'
          }`}
        >
          {activeConversationId && activePartner ? (
            <>
              {/* Chat Top Header */}
              <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
                <div className="flex items-center gap-3">
                  {/* Mobile Back to List Button */}
                  <button
                    onClick={() => setActiveConversationId(null)}
                    className="md:hidden p-1.5 -ml-1 text-slate-400 hover:text-white"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <img
                    src={activePartner.avatar}
                    alt=""
                    className="w-9 h-9 rounded-full border border-slate-700 object-cover"
                  />

                  <div>
                    <Link
                      href={activePartner.isDeleted ? '#' : `/profile/${activePartner.username}`}
                      className="font-bold text-xs sm:text-sm text-white hover:text-emerald-400 transition"
                    >
                      {activePartner.displayName}
                    </Link>
                    <p className="text-[10px] text-emerald-400 font-mono">
                      @{activePartner.username} {activePartner.semester ? `• ${activePartner.semester}` : ''}
                    </p>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400">
                  {partnerTyping ? (
                    <span className="text-emerald-400 animate-pulse font-medium">typing...</span>
                  ) : (
                    <span>Real-time Active</span>
                  )}
                </div>
              </div>

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messagesLoading ? (
                  <div className="text-center py-10 text-xs text-slate-500">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-400">
                    Conversation established! Say hello to your campus peer.
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${m.isMine ? 'items-end' : 'items-start'} group`}
                    >
                      {/* Replying-to preview bubble */}
                      {m.replyTo && (
                        <div
                          className={`text-[10px] px-2.5 py-1 mb-1 rounded-lg max-w-xs truncate border ${
                            m.isMine
                              ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}
                        >
                          <span className="font-semibold">{m.replyTo.authorName}: </span>
                          <span>{m.replyTo.content}</span>
                        </div>
                      )}

                      {/* Main Message Bubble */}
                      <div
                        className={`relative max-w-[85%] sm:max-w-md rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-md ${
                          m.isMine
                            ? 'bg-emerald-600 text-white rounded-br-none'
                            : 'bg-slate-850 text-slate-100 rounded-bl-none border border-slate-800'
                        }`}
                      >
                        {/* Media display */}
                        {m.mediaUrl && (
                          <div className="mb-2 rounded-xl overflow-hidden">
                            {m.messageType === 'IMAGE' || m.messageType === 'GIF' ? (
                              <img
                                src={m.mediaUrl}
                                alt="Attachment"
                                className="w-full max-h-64 object-cover rounded-lg cursor-pointer"
                                onClick={() => window.open(m.mediaUrl!, '_blank')}
                              />
                            ) : m.messageType === 'VIDEO' ? (
                              <video src={m.mediaUrl} controls className="w-full max-h-64 rounded-lg" />
                            ) : (
                              <a
                                href={m.mediaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-2 bg-slate-950/60 rounded-lg hover:underline text-xs"
                              >
                                <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span className="truncate">{m.fileName || 'View Document'}</span>
                                <ExternalLink className="w-3 h-3 ml-auto text-slate-400" />
                              </a>
                            )}
                          </div>
                        )}

                        {m.content && <p className="whitespace-pre-wrap">{m.content}</p>}

                        {/* Timestamp & Read Status */}
                        <div
                          className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                            m.isMine ? 'text-emerald-200' : 'text-slate-400'
                          }`}
                        >
                          <span>
                            {new Date(m.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {m.isMine && (
                            <span>
                              {m.isRead ? (
                                <CheckCheck className="w-3 h-3 text-emerald-200 inline" />
                              ) : (
                                <Check className="w-3 h-3 text-emerald-200/70 inline" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Reactions Display */}
                      {m.reactions && m.reactions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {m.reactions.map((r) => (
                            <span
                              key={r.id}
                              onClick={() => handleReactionClick(m.id, r.emoji)}
                              className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded-full text-[10px] cursor-pointer hover:scale-110 transition"
                            >
                              {r.emoji}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Hover action bar: reply & reaction buttons */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mt-0.5 text-slate-400 text-xs">
                        <button
                          onClick={() => setReplyingTo(m)}
                          className="px-1.5 py-0.5 hover:text-white rounded text-[10px]"
                        >
                          Reply
                        </button>
                        {QUICK_EMOJIS.slice(0, 3).map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleReactionClick(m.id, emoji)}
                            className="hover:scale-125 transition text-xs"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Replying Banner */}
              {replyingTo && (
                <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
                  <div className="truncate">
                    <span className="text-emerald-400 font-semibold">Replying to {replyingTo.sender.displayName}: </span>
                    <span className="text-slate-400 truncate">{replyingTo.content || '[Attachment]'}</span>
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="p-1 text-slate-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Message Composer */}
              <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/90">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage({ content: inputText });
                  }}
                  className="flex items-center gap-2"
                >
                  {/* File attach button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="p-2.5 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-900 transition"
                    title="Attach file / image"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
                  />

                  {/* Input field */}
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => handleTypingChange(e.target.value)}
                    placeholder="Type a message to peer..."
                    className="flex-1 rounded-2xl bg-slate-900 border border-slate-800 px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />

                  {/* Send button */}
                  <button
                    type="submit"
                    disabled={!inputText.trim() || uploading}
                    className="p-2.5 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition disabled:opacity-40 disabled:hover:bg-emerald-500 shadow-md shadow-emerald-950/50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400 max-w-sm">
              <MessageSquare className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <h2 className="text-base font-bold text-white mb-1">Telegram-Style Campus Messaging</h2>
              <p className="text-slate-400 leading-relaxed">
                Select a conversation on the left, or review pending requests. Fast, private, and real-time.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading messages...</div>}>
      <MessagesContent />
    </Suspense>
  );
}
