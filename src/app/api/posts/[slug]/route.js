import { getAuthSession } from "@/utils/auth";
import prisma from "@/utils/connect";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET SINGLE POST
export const GET = async (req, { params }) => {
  const { slug } = params;

  try {
    const post = await prisma.post.update({
      where: { slug },
      data: { views: { increment: 1 } },
      include: { user: true },
    });

    return NextResponse.json(post, { status: 200 });
  } catch (err) {
    console.log(err);
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 }
    );
  }
};

// DELETE A POST
export const DELETE = async (req, { params }) => {
  const { slug } = params;

  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json(
        { message: "Not Authenticated!" },
        { status: 401 }
      );
    }

    const post = await prisma.post.findUnique({
      where: { slug },
    });

    if (!post) {
      return NextResponse.json(
        { message: "Post not found!" },
        { status: 404 }
      );
    }

    // Allow only post owner or admin
    if (post.userEmail !== session.user.email && session.user.role !== "admin") {
      return NextResponse.json(
        { message: "Not Authorized!" },
        { status: 403 }
      );
    }

    // Delete comments first (relation constraint)
    await prisma.comment.deleteMany({ where: { postSlug: slug } });
    await prisma.post.delete({ where: { slug } });

    return NextResponse.json({ message: "Post deleted!" }, { status: 200 });
  } catch (err) {
    console.log(err);
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 }
    );
  }
};