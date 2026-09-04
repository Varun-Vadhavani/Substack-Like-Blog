import { getAuthSession } from "@/utils/auth";
import prisma from "@/utils/connect";
import { NextResponse } from "next/server";

// GET /api/drafts?type=note|article
export const GET = async (req) => {
  const session = await getAuthSession();

  if (!session) {
    return new NextResponse(
      JSON.stringify({ message: "Not Authenticated!", drafts: [] }),
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  try {
    const drafts = await prisma.post.findMany({
      where: {
        userEmail: session.user.email,
        status: "draft",
        ...(type ? { type } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: true,
      },
    });

    return new NextResponse(JSON.stringify({ drafts }), { status: 200 });
  } catch (err) {
    console.error("GET /api/drafts error:", err);
    return new NextResponse(
      JSON.stringify({ message: "Something went wrong!" }),
      { status: 500 }
    );
  }
};

// DELETE /api/drafts?slug=xxx
export const DELETE = async (req) => {
  const session = await getAuthSession();

  if (!session) {
    return new NextResponse(
      JSON.stringify({ message: "Not Authenticated!" }),
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return new NextResponse(
      JSON.stringify({ message: "Slug is required" }),
      { status: 400 }
    );
  }

  try {
    const draft = await prisma.post.findUnique({
      where: { slug },
    });

    if (!draft || draft.userEmail !== session.user.email) {
      return new NextResponse(
        JSON.stringify({ message: "Draft not found or unauthorized" }),
        { status: 404 }
      );
    }

    await prisma.post.delete({
      where: { slug },
    });

    return new NextResponse(
      JSON.stringify({ message: "Draft deleted successfully" }),
      { status: 200 }
    );
  } catch (err) {
    console.error("DELETE /api/drafts error:", err);
    return new NextResponse(
      JSON.stringify({ message: "Something went wrong!" }),
      { status: 500 }
    );
  }
};
