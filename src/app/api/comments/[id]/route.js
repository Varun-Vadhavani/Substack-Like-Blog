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

    await prisma.comment.delete({ where: { id } });

    return NextResponse.json({ message: "Comment deleted!" }, { status: 200 });
  } catch (err) {
    console.log(err);
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 }
    );
  }
};
