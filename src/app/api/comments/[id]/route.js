import { getAuthSession } from "@/utils/auth";
import prisma from "@/utils/connect";
import { NextResponse } from "next/server";

// DELETE A COMMENT
export const DELETE = async (req, { params }) => {
  const { id } = params;
  const session = await getAuthSession();

  if (!session) {
    return new NextResponse(
      JSON.stringify({ message: "Not Authenticated!" }),
      { status: 401 }
    );
  }

  try {
    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      return new NextResponse(
        JSON.stringify({ message: "Comment not found!" }),
        { status: 404 }
      );
    }

    // Allow only comment owner or admin
    if (comment.userEmail !== session.user.email && session.user.role !== "admin") {
      return new NextResponse(
        JSON.stringify({ message: "Not Authorized!" }),
        { status: 403 }
      );
    }

    await prisma.comment.delete({ where: { id } });

    return new NextResponse(JSON.stringify({ message: "Comment deleted!" }), {
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
