import { getAuthSession } from "@/utils/auth";
import prisma from "@/utils/connect";
import { NextResponse } from "next/server";

// GET SINGLE POST
export const GET = async (req, { params }) => {
  const { slug } = params;

  try {
    const post = await prisma.post.update({
      where: { slug },
      data: { views: { increment: 1 } },
      include: { user: true },
    });

    return new NextResponse(JSON.stringify(post, { status: 200 }));
  } catch (err) {
    console.log(err);
    return new NextResponse(
      JSON.stringify({ message: "Something went wrong!" }, { status: 500 })
    );
  }
};

// DELETE A POST
export const DELETE = async (req, { params }) => {
  const { slug } = params;
  const session = await getAuthSession();

  if (!session) {
    return new NextResponse(
      JSON.stringify({ message: "Not Authenticated!" }),
      { status: 401 }
    );
  }

  try {
    const post = await prisma.post.findUnique({
      where: { slug },
    });

    if (!post) {
      return new NextResponse(
        JSON.stringify({ message: "Post not found!" }),
        { status: 404 }
      );
    }

    // Allow only post owner or admin
    if (post.userEmail !== session.user.email && session.user.role !== "admin") {
      return new NextResponse(
        JSON.stringify({ message: "Not Authorized!" }),
        { status: 403 }
      );
    }

    // Delete comments first (relation constraint)
    await prisma.comment.deleteMany({ where: { postSlug: slug } });
    await prisma.post.delete({ where: { slug } });

    return new NextResponse(JSON.stringify({ message: "Post deleted!" }), {
      status: 200,
    });
  } catch (err) {
    console.log(err);
    return new NextResponse(
      JSON.stringify({ message: "Something went wrong!" }),
      { status: 500 }
    );
  }
};