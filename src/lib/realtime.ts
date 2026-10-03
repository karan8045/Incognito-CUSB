type RealtimeEvent = {
  type: 'message' | 'notification' | 'chat_request' | 'typing' | 'read' | 'reaction';
  targetUserId: string;
  data: Record<string, unknown>;
};

// Global in-memory subscriber map for Server-Sent Events (SSE)
// Supports multi-tab / mobile connections per user
declare global {
  // eslint-disable-next-line no-var
  var __realtimeClients: Map<string, Set<(event: RealtimeEvent) => void>> | undefined;
}

const clients = globalThis.__realtimeClients ?? new Map<string, Set<(event: RealtimeEvent) => void>>();
if (process.env.NODE_ENV !== 'production') {
  globalThis.__realtimeClients = clients;
}

export function subscribeToUserEvents(
  userId: string,
  callback: (event: RealtimeEvent) => void
): () => void {
  if (!clients.has(userId)) {
    clients.set(userId, new Set());
  }
  const userSubs = clients.get(userId)!;
  userSubs.add(callback);

  return () => {
    userSubs.delete(callback);
    if (userSubs.size === 0) {
      clients.delete(userId);
    }
  };
}

export function broadcastToUser(targetUserId: string, event: Omit<RealtimeEvent, 'targetUserId'>) {
  const fullEvent: RealtimeEvent = { ...event, targetUserId };
  const userSubs = clients.get(targetUserId);
  if (userSubs && userSubs.size > 0) {
    userSubs.forEach((cb) => {
      try {
        cb(fullEvent);
      } catch (err) {
        console.error('[REALTIME_DISPATCH_ERROR]', err);
      }
    });
  }
}
