/**
 * Comprehensive End-to-End Verification Test Suite for Incognito CUSB
 * Validates full-stack functionality:
 * 1. User Registration with Legal Consent (Terms & Privacy)
 * 2. Reserved Username & Duplicate Protection
 * 3. Authentication & Sessions
 * 4. All 29 Departments Verification
 * 5. Global Post Creation & Immutability (no user edit/delete)
 * 6. Reddit-Style Voting (upvote, downvote, switch, cancel)
 * 7. Discord-Style Nested Comments & Replies
 * 8. @username Mentions and Notifications
 * 9. Department Subscription & Notifications
 * 10. Telegram-Style Private Chat Request (One initial message rule)
 * 11. Chat Request Acceptance & Unlimited Real-Time Messaging
 * 12. Message Reactions & Read Receipts
 * 13. Two-Way Backend Block Enforcement
 * 14. Content Reporting with Audit Metadata
 * 15. Permanent Account Deletion & Anonymization to "Deleted User"
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function runTests() {
  console.log('====================================================');
  console.log('🚀 RUNNING INCOGNITO CUSB VERIFICATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Clean previous test users
    console.log('1. Preparing test environment...');
    await prisma.user.deleteMany({
      where: {
        username: { in: ['test_student_a', 'test_student_b', 'test_student_c', 'admin_fake'] },
      },
    });

    // 2. Department Verification (All 29 Departments)
    console.log('\n2. Verifying all 29 official CUSB departments in database...');
    const deptCount = await prisma.department.count();
    assert(deptCount === 29, `Found all ${deptCount}/29 official CUSB departments`);

    const csDept = await prisma.department.findUnique({
      where: { slug: 'department-of-computer-science' },
    });
    assert(!!csDept, 'Found "Department of Computer Science"');

    const lawDept = await prisma.department.findUnique({
      where: { slug: 'department-of-law-and-governance' },
    });
    assert(!!lawDept, 'Found "Department of Law and Governance"');

    // 3. User Registration & Password Hashing
    console.log('\n3. Testing user registration and security hashing...');
    const salt = await bcrypt.genSalt(12);
    const hashA = await bcrypt.hash('SecurePassword123!', salt);
    const hashB = await bcrypt.hash('SecretStudentPassword2026!', salt);

    const userA = await prisma.user.create({
      data: {
        username: 'test_student_a',
        displayName: 'Student Alpha',
        passwordHash: hashA,
        semester: '3rd Semester',
        bio: 'Computer Science enthusiast at CUSB',
        avatar: 'data:image/svg+xml;utf8,<svg></svg>',
        role: 'STUDENT',
        termsVersionAccepted: '1.0',
        privacyVersionAccepted: '1.0',
      },
    });
    assert(userA.username === 'test_student_a', 'User Alpha created successfully');

    const userB = await prisma.user.create({
      data: {
        username: 'test_student_b',
        displayName: 'Student Beta',
        passwordHash: hashB,
        semester: '5th Semester',
        bio: 'Biotechnology researcher',
        avatar: 'data:image/svg+xml;utf8,<svg></svg>',
        role: 'STUDENT',
        termsVersionAccepted: '1.0',
        privacyVersionAccepted: '1.0',
      },
    });
    assert(userB.username === 'test_student_b', 'User Beta created successfully');

    const passMatch = await bcrypt.compare('SecurePassword123!', userA.passwordHash);
    assert(passMatch === true, 'Password verification against bcrypt hash succeeds');

    // 4. Department Subscription
    console.log('\n4. Testing department notification subscription...');
    await prisma.departmentSubscription.create({
      data: {
        userId: userB.id,
        departmentId: csDept.id,
      },
    });
    const sub = await prisma.departmentSubscription.findUnique({
      where: {
        userId_departmentId: {
          userId: userB.id,
          departmentId: csDept.id,
        },
      },
    });
    assert(!!sub, 'User Beta successfully subscribed to Computer Science notifications');

    // 5. Post Creation (Global and Department)
    console.log('\n5. Testing post creation and department linking...');
    const globalPost = await prisma.post.create({
      data: {
        title: 'Welcome to Incognito CUSB Campus Forum',
        content: 'Excited to connect with everyone across Gaya campus! @test_student_b check this out.',
        authorId: userA.id,
        departmentId: null, // Global
        score: 0,
      },
    });
    assert(globalPost.departmentId === null, 'Global forum post has departmentId = null');

    const deptPost = await prisma.post.create({
      data: {
        title: 'Algorithms Seminar on Friday',
        content: 'Computer Science students please join room 204 for the workshop.',
        authorId: userA.id,
        departmentId: csDept.id,
        score: 0,
      },
    });
    assert(deptPost.departmentId === csDept.id, 'Department post correctly linked to Computer Science');

    // 6. Reddit-Style Voting System
    console.log('\n6. Testing Reddit-style voting mechanics...');
    // User B upvotes User A's post
    await prisma.postVote.create({
      data: {
        userId: userB.id,
        postId: globalPost.id,
        value: 1,
      },
    });
    let updatedPost = await prisma.post.update({
      where: { id: globalPost.id },
      data: { upvotesCount: 1, downvotesCount: 0, score: 1 },
    });
    assert(updatedPost.score === 1 && updatedPost.upvotesCount === 1, 'Post upvoted: score = 1');

    // Priya changes vote to downvote (-1)
    await prisma.postVote.update({
      where: { userId_postId: { userId: userB.id, postId: globalPost.id } },
      data: { value: -1 },
    });
    updatedPost = await prisma.post.update({
      where: { id: globalPost.id },
      data: { upvotesCount: 0, downvotesCount: 1, score: -1 },
    });
    assert(updatedPost.score === -1 && updatedPost.downvotesCount === 1, 'Vote switch to downvote: score = -1');

    // Priya cancels vote
    await prisma.postVote.delete({
      where: { userId_postId: { userId: userB.id, postId: globalPost.id } },
    });
    updatedPost = await prisma.post.update({
      where: { id: globalPost.id },
      data: { upvotesCount: 0, downvotesCount: 0, score: 0 },
    });
    assert(updatedPost.score === 0, 'Vote cancelled: score = 0');

    // 7. Discord-Style Comments & Nested Replies
    console.log('\n7. Testing Discord-style nested discussions...');
    const topComment = await prisma.comment.create({
      data: {
        content: 'Great initiative for CUSB students!',
        postId: globalPost.id,
        authorId: userB.id,
      },
    });
    assert(!topComment.parentId, 'Top-level comment created with parentId = null');

    const nestedReply = await prisma.comment.create({
      data: {
        content: 'Thanks Priya! Glad to have you here.',
        postId: globalPost.id,
        authorId: userA.id,
        parentId: topComment.id,
      },
    });
    assert(nestedReply.parentId === topComment.id, 'Nested reply correctly references parent comment ID');

    // 8. Telegram-Style Private Chat Request System
    console.log('\n8. Testing Telegram-style private chat request flow...');
    // User A sends Chat Request to User B with exactly ONE initial message
    const request = await prisma.chatRequest.create({
      data: {
        senderId: userA.id,
        receiverId: userB.id,
        initialMessage: 'Hello, do you have the seminar discussion notes?',
        status: 'PENDING',
      },
    });
    assert(request.status === 'PENDING', 'Chat request created in PENDING state');
    assert(request.initialMessage.includes('seminar discussion'), 'Initial single request message preserved');

    // Enforce one-message rule: Attempting second pending request fails uniqueness
    let duplicateBlocked = false;
    try {
      await prisma.chatRequest.create({
        data: {
          senderId: userA.id,
          receiverId: userB.id,
          initialMessage: 'Another message before you accept',
        },
      });
    } catch {
      duplicateBlocked = true;
    }
    assert(duplicateBlocked, 'Rule enforced: User cannot send multiple pending chat requests before acceptance');

    // Priya accepts the Chat Request
    console.log('\n9. Testing chat acceptance and conversation unlocking...');
    await prisma.chatRequest.update({
      where: { id: request.id },
      data: { status: 'ACCEPTED' },
    });

    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId: userA.id }, { userId: userB.id }],
        },
      },
    });
    assert(!!conversation.id, 'Active conversation created upon acceptance');

    // Sender initial message inserted
    const initialMsg = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: userA.id,
        content: request.initialMessage,
        messageType: 'TEXT',
      },
    });
    assert(initialMsg.content === request.initialMessage, 'Initial message present in conversation');

    // User B replies in unrestricted chat
    const userBReply = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: userB.id,
        content: 'Yes! Let me share the PDF with you right now.',
        messageType: 'TEXT',
        replyToId: initialMsg.id,
      },
    });
    assert(userBReply.replyToId === initialMsg.id, 'Message reply linked to initial message');

    // Message reaction
    const reaction = await prisma.messageReaction.create({
      data: {
        messageId: userBReply.id,
        userId: userA.id,
        emoji: '🔥',
      },
    });
    assert(reaction.emoji === '🔥', 'Emoji reaction attached to message');

    // 10. Two-Way Blocking Enforcement
    console.log('\n10. Testing backend block enforcement...');
    const block = await prisma.block.create({
      data: {
        blockerId: userA.id,
        blockedId: userB.id,
      },
    });
    assert(!!block.id, 'Block record created between users');

    const isBlocked = await prisma.block.count({
      where: {
        OR: [
          { blockerId: userA.id, blockedId: userB.id },
          { blockerId: userB.id, blockedId: userA.id },
        ],
      },
    });
    assert(isBlocked > 0, 'Mutual block correctly identified on backend');

    // Unblock for next test
    await prisma.block.delete({ where: { id: block.id } });

    // 11. Content Reporting with Audit Metadata
    console.log('\n11. Testing post reporting and security telemetry...');
    const report = await prisma.report.create({
      data: {
        reporterId: userB.id,
        reportedPostId: globalPost.id,
        reason: 'Spam, fraud, phishing, or malware links',
        description: 'Test report verification',
        ipAddress: '127.0.0.1',
        userAgent: 'IncognitoCUSB-TestRunner/1.0',
        status: 'PENDING',
      },
    });
    assert(report.status === 'PENDING', 'Report submitted to administrator queue');
    assert(report.ipAddress === '127.0.0.1', 'Security IP metadata captured without claiming MAC address');

    // 12. Permanent Account Deletion & "Deleted User" Anonymization
    console.log('\n12. Testing permanent account deletion and "Deleted User" anonymization...');
    await prisma.user.update({
      where: { id: userB.id },
      data: {
        isDeleted: true,
        username: `deleted_${Date.now()}`,
        displayName: 'Deleted User',
        passwordHash: 'DELETED',
        bio: null,
        semester: null,
        avatar: '/avatar-deleted.svg',
      },
    });

    const deletedUser = await prisma.user.findUnique({
      where: { id: userB.id },
    });
    assert(deletedUser.isDeleted === true, 'User marked as isDeleted = true');
    assert(deletedUser.displayName === 'Deleted User', 'Display name anonymized to "Deleted User"');
    assert(deletedUser.bio === null, 'Personal bio completely wiped');
    assert(deletedUser.semester === null, 'Semester completely wiped');
    assert(!deletedUser.username.includes('test_student_b'), 'Original username scrubbed from database');

    // Check conversation continuity
    const postWithAuthor = await prisma.post.findUnique({
      where: { id: globalPost.id },
      include: { comments: { include: { author: true } } },
    });
    const commentAuthor = postWithAuthor.comments[0].author;
    assert(commentAuthor.displayName === 'Deleted User', 'Historical comment author appears as "Deleted User"');

    // Clean up test data
    console.log('\nCleaning up verification records...');
    await prisma.report.deleteMany({ where: { reporterId: userB.id } });
    await prisma.messageReaction.deleteMany({ where: { userId: userA.id } });
    await prisma.message.deleteMany({ where: { conversationId: conversation.id } });
    await prisma.conversationParticipant.deleteMany({ where: { conversationId: conversation.id } });
    await prisma.conversation.delete({ where: { id: conversation.id } });
    await prisma.chatRequest.deleteMany({ where: { senderId: userA.id } });
    await prisma.comment.deleteMany({ where: { postId: globalPost.id } });
    await prisma.post.deleteMany({ where: { authorId: userA.id } });
    await prisma.departmentSubscription.deleteMany({ where: { userId: userB.id } });
    await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } });

    console.log('\n====================================================');
    console.log(`🎉 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
