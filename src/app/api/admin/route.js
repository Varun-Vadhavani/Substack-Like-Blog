import { getAuthSession } from "@/utils/auth";
import prisma from "@/utils/connect";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET ADMIN DASHBOARD DATA
export const GET = async () => {
  const session = await getAuthSession();

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ message: "Not Authorized!" }, { status: 403 });
  }

  try {
    const [posts, comments, userCount] = await Promise.all([
      prisma.post.findMany({
        include: { user: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.comment.findMany({
        include: { user: true, post: { select: { title: true, slug: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count(),
    ]);

    return NextResponse.json({ posts, comments, userCount }, { status: 200 });
  } catch (err) {
    console.log(err);
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 }
    );
  }
};

// DELETE POST BY ID (admin only)
export const DELETE = async (req) => {
  const session = await getAuthSession();

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ message: "Not Authorized!" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId");
    const commentId = searchParams.get("commentId");

    if (postId) {
      // Delete all comments on this post, then the post
      const post = await prisma.post.findUnique({ where: { id: postId } });
      if (!post) {
        return NextResponse.json({ message: "Post not found!" }, { status: 404 });
      }
      await prisma.comment.deleteMany({ where: { postSlug: post.slug } });
      await prisma.post.delete({ where: { id: postId } });
      return NextResponse.json({ message: "Post deleted!" }, { status: 200 });
    }

    if (commentId) {
      await prisma.comment.delete({ where: { id: commentId } });
      return NextResponse.json({ message: "Comment deleted!" }, { status: 200 });
    }

    return NextResponse.json({ message: "Missing postId or commentId" }, { status: 400 });
  } catch (err) {
    console.log(err);
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 }
    );
  }
};
