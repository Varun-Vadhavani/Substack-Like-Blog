import { getAuthSession } from "@/utils/auth";
import prisma from "@/utils/connect";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// TOGGLE LIKE ON A COMMENT
export const POST = async (req, { params }) => {
  const { id } = params;

  try {
    const session = await getAuthSession();

    if (!session?.user?.email) {
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

    // Check if like already exists
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        userEmail_commentId: {
          userEmail: session.user.email,
          commentId: id,
        },
      },
    });

    let isLiked = false;

    if (existingLike) {
      await prisma.commentLike.delete({
        where: { id: existingLike.id },
      });
      isLiked = false;
    } else {
      await prisma.commentLike.create({
        data: {
          userEmail: session.user.email,
          commentId: id,
        },
      });
      isLiked = true;
    }

    const likeCount = await prisma.commentLike.count({
      where: { commentId: id },
    });

    return NextResponse.json({ isLiked, likeCount }, { status: 200 });
  } catch (err) {
    console.error("Error toggling comment like:", err);
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 }
    );
  }
};
