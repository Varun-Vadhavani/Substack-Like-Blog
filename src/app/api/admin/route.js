import { getAuthSession } from "@/utils/auth";
import prisma from "@/utils/connect";
import { NextResponse } from "next/server";

// GET ADMIN DASHBOARD DATA
export const GET = async () => {
  const session = await getAuthSession();

  if (!session || session.user.role !== "admin") {
    return new NextResponse(
      JSON.stringify({ message: "Not Authorized!" }),
      { status: 403 }
    );
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

    return new NextResponse(
      JSON.stringify({ posts, comments, userCount }),
      { status: 200 }
    );
  } catch (err) {
    console.log(err);
    return new NextResponse(
      JSON.stringify({ message: "Something went wrong!" }),
      { status: 500 }
    );
  }
};
