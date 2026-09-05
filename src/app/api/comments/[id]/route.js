import { getAuthSession } from "@/utils/auth";
import prisma from "@/utils/connect";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// DELETE A COMMENT
export const DELETE = async (req, { params }) => {
  const { id } = params;

  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json(
        { message: "Not Authenticated!" },
        { status: 401 }
      );
    }

    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      return NextResponse.json(
        { message: "Comment not found!" },
        { status: 404 }
      );
    }

    // Allow only comment owner or admin
    if (comment.userEmail !== session.user.email && session.user.role !== "admin") {
      return NextResponse.json(
        { message: "Not Authorized!" },
        { status: 403 }
      );
    }

    // Find all replies to this comment
    const replies = await prisma.comment.findMany({
      where: { parentId: id },
      select: { id: true },
    });
    const replyIds = replies.map((r) => r.id);
    const allCommentIdsToDelete = [id, ...replyIds];

    // Delete comment likes for this comment and its replies
    await prisma.commentLike.deleteMany({
      where: { commentId: { in: allCommentIdsToDelete } },
    });

    // Delete all replies first
    if (replyIds.length > 0) {
      await prisma.comment.deleteMany({
        where: { parentId: id },
      });
    }

    // Delete the comment itself
    await prisma.comment.delete({ where: { id } });

    return NextResponse.json({ message: "Comment and any replies deleted!" }, { status: 200 });
  } catch (err) {
    console.log(err);
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 }
    );
  }
};
