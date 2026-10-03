import prisma from './prisma';

/**
 * Checks whether an active block exists between two users in either direction.
 * If User A blocked User B OR User B blocked User A, mutual interaction is prevented.
 */
export async function isBlockActive(userIdA: string, userIdB: string): Promise<boolean> {
  if (!userIdA || !userIdB || userIdA === userIdB) return false;

  const count = await prisma.block.count({
    where: {
      OR: [
        { blockerId: userIdA, blockedId: userIdB },
        { blockerId: userIdB, blockedId: userIdA },
      ],
    },
  });

  return count > 0;
}

/**
 * Returns a set of all user IDs that have a mutual block relationship with the given user
 * (either users blocked by this user, or users who blocked this user).
 */
export async function getMutualBlockedUserIds(userId: string): Promise<string[]> {
  if (!userId) return [];

  const blocks = await prisma.block.findMany({
    where: {
      OR: [
        { blockerId: userId },
        { blockedId: userId },
      ],
    },
    select: {
      blockerId: true,
      blockedId: true,
    },
  });

  const blockedSet = new Set<string>();
  for (const b of blocks) {
    if (b.blockerId === userId) blockedSet.add(b.blockedId);
    if (b.blockedId === userId) blockedSet.add(b.blockerId);
  }

  return Array.from(blockedSet);
}
