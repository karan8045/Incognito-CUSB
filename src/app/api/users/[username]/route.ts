import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isBlockActive } from '@/lib/blocks';

export async function GET(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const rawUsername = params.username.replace(/^@/, '').toLowerCase().trim();
    const currentUser = await getCurrentUser();

    const targetUser = await prisma.user.findUnique({
      where: { username: rawUsername },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        semester: true,
        bio: true,
        role: true,
        isDeleted: true,
        createdAt: true,
        _count: {
          select: {
            posts: {
              where: { isReported: false },
            },
          },
        },
      },
    });

    if (!targetUser || targetUser.isDeleted) {
      return NextResponse.json({ error: 'User not found or account deleted.' }, { status: 404 });
    }

    // Check mutual blocking
    if (currentUser) {
      const blocked = await isBlockActive(currentUser.id, targetUser.id);
      if (blocked) {
        return NextResponse.json(
          { error: 'Profile unavailable due to privacy or block restrictions.' },
          { status: 403 }
        );
      }
    }

    // Check chat status between current user and target user
    let chatStatus: 'NONE' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'ACTIVE' = 'NONE';
    let conversationId: string | null = null;

    if (currentUser && currentUser.id !== targetUser.id) {
      // Check active conversation
      const sharedConversation = await prisma.conversation.findFirst({
        where: {
          AND: [
            { participants: { some: { userId: currentUser.id } } },
            { participants: { some: { userId: targetUser.id } } },
          ],
        },
      });

      if (sharedConversation) {
        chatStatus = 'ACTIVE';
        conversationId = sharedConversation.id;
      } else {
        // Check chat requests
        const reqSent = await prisma.chatRequest.findUnique({
          where: {
            senderId_receiverId: {
              senderId: currentUser.id,
              receiverId: targetUser.id,
            },
          },
        });

        if (reqSent && reqSent.status === 'PENDING') {
          chatStatus = 'REQUEST_SENT';
        } else {
          const reqRecv = await prisma.chatRequest.findUnique({
            where: {
              senderId_receiverId: {
                senderId: targetUser.id,
                receiverId: currentUser.id,
              },
            },
          });
          if (reqRecv && reqRecv.status === 'PENDING') {
            chatStatus = 'REQUEST_RECEIVED';
          }
        }
      }
    }

    // Fetch user's public posts
    const posts = await prisma.post.findMany({
      where: {
        authorId: targetUser.id,
        isReported: false,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        department: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        votes: currentUser
          ? {
              where: { userId: currentUser.id },
              select: { value: true },
            }
          : false,
      },
    });

    const formattedPosts = posts.map((p) => ({
      id: p.id,
      title: p.title,
      content: p.content,
      postType: p.postType,
      mediaUrl: p.mediaUrl,
      mediaType: p.mediaType,
      upvotesCount: p.upvotesCount,
      downvotesCount: p.downvotesCount,
      score: p.score,
      commentsCount: p.commentsCount,
      createdAt: p.createdAt,
      department: p.department,
      userVote: currentUser && p.votes && p.votes.length > 0 ? p.votes[0].value : 0,
    }));

    return NextResponse.json({
      profile: {
        id: targetUser.id,
        username: targetUser.username,
        displayName: targetUser.displayName,
        avatar: targetUser.avatar,
        semester: targetUser.semester,
        bio: targetUser.bio,
        role: targetUser.role,
        joinedAt: targetUser.createdAt,
        postsCount: targetUser._count.posts,
        chatStatus,
        conversationId,
        posts: formattedPosts,
      },
    });
  } catch (error) {
    console.error('[GET_USER_PROFILE_ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch user profile.' }, { status: 500 });
  }
}
