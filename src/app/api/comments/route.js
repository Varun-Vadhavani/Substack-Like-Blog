import { getAuthSession } from "@/utils/auth";
import prisma from "@/utils/connect";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET ALL COMMENTS OF A POST (hierarchical: top-level with nested replies)
export const GET = async (req) => {
  const { searchParams } = new URL(req.url);
  const postSlug = searchParams.get("postSlug");

  if (!postSlug) {
    return NextResponse.json(
      { message: "postSlug is required" },
      { status: 400 }
    );
  }

  try {
    const session = await getAuthSession();

    // Fetch all comments for this post
    const allComments = await prisma.comment.findMany({
      where: { postSlug },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Check which comments the current user has liked
    let likedCommentIds = new Set();
    if (session?.user?.email && allComments.length > 0) {
      const commentIds = allComments.map((c) => c.id);
      const userLikes = await prisma.commentLike.findMany({
        where: {
          userEmail: session.user.email,
          commentId: { in: commentIds },
        },
        select: { commentId: true },
      });
      likedCommentIds = new Set(userLikes.map((l) => l.commentId));
    }

    // Separate top-level comments and replies
    const commentMap = new Map();
    const topLevelComments = [];

    // Format each comment
    for (const c of allComments) {
      const formatted = {
        id: c.id,
        createdAt: c.createdAt,
        desc: c.desc,
        userEmail: c.userEmail,
        user: c.user,
        postSlug: c.postSlug,
        parentId: c.parentId || null,
        likeCount: c._count?.likes || 0,
        isLiked: likedCommentIds.has(c.id),
        replies: [],
      };
      commentMap.set(c.id, formatted);
    }

    // Assemble 1-level hierarchy
    for (const c of allComments) {
      const formatted = commentMap.get(c.id);
      if (c.parentId && commentMap.has(c.parentId)) {
        // If parent is itself a reply, attach to root parent for 1-level capping
        let parent = commentMap.get(c.parentId);
        if (parent.parentId && commentMap.has(parent.parentId)) {
          parent = commentMap.get(parent.parentId);
        }
        parent.replies.push(formatted);
      } else {
        topLevelComments.push(formatted);
      }
    }

    // Newest top-level comments first, replies chronological
    topLevelComments.reverse();

    return NextResponse.json(topLevelComments, { status: 200 });
  } catch (err) {
    console.error("Error fetching comments:", err);
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 }
    );
  }
};

// CREATE A COMMENT OR REPLY
export const POST = async (req) => {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json(
      { message: "Not Authenticated!" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { desc, postSlug, parentId } = body;

    if (!desc || !desc.trim() || !postSlug) {
      return NextResponse.json(
        { message: "Content and postSlug are required" },
        { status: 400 }
      );
    }

    // If parentId provided, verify it exists and resolve to root if replying to a reply
    let resolvedParentId = null;
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      });
      if (parentComment) {
        // If the parent comment already has a parentId, attach to that root parent
        resolvedParentId = parentComment.parentId || parentComment.id;
      }
    }

    const comment = await prisma.comment.create({
      data: {
        desc: desc.trim(),
        postSlug,
        parentId: resolvedParentId,
        userEmail: session.user.email,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        ...comment,
        likeCount: 0,
        isLiked: false,
        replies: [],
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error creating comment:", err);
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 }
    );
  }
};