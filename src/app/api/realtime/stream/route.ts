import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { subscribeToUserEvents } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // Send initial ping to establish connection
  writer.write(encoder.encode(`event: connected\ndata: ${JSON.stringify({ userId: user.id })}\n\n`));

  // Subscribe to user events
  const unsubscribe = subscribeToUserEvents(user.id, (event) => {
    try {
      const payload = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
      writer.write(encoder.encode(payload));
    } catch (err) {
      console.error('[SSE_WRITE_ERROR]', err);
    }
  });

  // Keep-alive heartbeat every 20 seconds
  const interval = setInterval(() => {
    try {
      writer.write(encoder.encode(`: heartbeat\n\n`));
    } catch {
      clearInterval(interval);
      unsubscribe();
    }
  }, 20000);

  req.signal.addEventListener('abort', () => {
    clearInterval(interval);
    unsubscribe();
    writer.close().catch(() => {});
  });

  return new Response(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
