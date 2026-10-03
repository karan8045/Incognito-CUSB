import prisma from './prisma';
import { isBlockActive } from './blocks';
import { broadcastToUser } from './realtime';

export type NotificationType =
  | 'POST_REPLY'
  | 'COMMENT_REPLY'
  | 'MENTION'
  | 'UPVOTE'
  | 'CHAT_REQUEST'
  | 'CHAT_ACCEPTED'
  | 'NEW_MESSAGE'
  | 'DEPT_POST';

export interface CreateNotificationParams {
  userId: string;
  actorId?: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export async function sendNotification(params: CreateNotificationParams) {
  // Do not send notification to oneself
  if (params.actorId && params.actorId === params.userId) {
    return null;
  }

  // Check if mutual blocking is active between actor and target user
  if (params.actorId) {
    const blocked = await isBlockActive(params.actorId, params.userId);
    if (blocked) {
      return null;
    }
  }

  try {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        actorId: params.actorId || null,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link || null,
      },
      include: {
        actor: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    // Real-time broadcast
    broadcastToUser(params.userId, {
      type: 'notification',
      data: notification as unknown as Record<string, unknown>,
    });

    return notification;
  } catch (error) {
    console.error('[SEND_NOTIFICATION_ERROR]', error);
    return null;
  }
}

/**
 * Extracts all unique @username mentions from text.
 * Returns array of lowercased usernames without '@'.
 */
export function extractMentions(text: string): string[] {
  if (!text) return [];
  const regex = /@([a-zA-Z0-9_]{3,25})/g;
  const matches = new Set<string>();
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.add(match[1].toLowerCase());
  }
  return Array.from(matches);
}

/**
 * Handles mention extraction, DB records, and user notifications.
 */
export async function processMentions(
  content: string,
  actorId: string,
  actorUsername: string,
  targetPostId?: string,
  targetCommentId?: string
) {
  const usernames = extractMentions(content);
  if (usernames.length === 0) return;

  const users = await prisma.user.findMany({
    where: {
      username: { in: usernames },
      isDeleted: false,
    },
    select: {
      id: true,
      username: true,
    },
  });

  for (const user of users) {
    if (user.id === actorId) continue;

    // Check block
    const blocked = await isBlockActive(actorId, user.id);
    if (blocked) continue;

    // Record mention in DB
    await prisma.mention.create({
      data: {
        username: user.username,
        postId: targetPostId || null,
        commentId: targetCommentId || null,
      },
    });

    // Send notification
    const link = targetPostId ? `/post/${targetPostId}` : undefined;
    await sendNotification({
      userId: user.id,
      actorId,
      type: 'MENTION',
      title: 'New Mention',
      message: `@${actorUsername} mentioned you in a discussion`,
      link,
    });
  }
}
