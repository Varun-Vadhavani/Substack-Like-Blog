import { getAuthSession } from "@/utils/auth";
import prisma from "@/utils/connect";
import { NextResponse } from "next/server";

// GET /api/saved
// 1. /api/saved?slug=xxx -> checks if specific slug is saved by current user
// 2. /api/saved -> returns all saved posts for current user
export const GET = async (req) => {
  const session = await getAuthSession();

  if (!session) {
    return new NextResponse(
      JSON.stringify({ message: "Not Authenticated!", savedPosts: [], isSaved: false }),
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  try {
    if (slug) {
      const existing = await prisma.savedPost.findUnique({
        where: {
          userEmail_postSlug: {
            userEmail: session.user.email,
            postSlug: slug,
          },
        },
      });

      return new NextResponse(
        JSON.stringify({ isSaved: !!existing }),
        { status: 200 }
      );
    }

    // Fetch all saved posts for this user
    const saved = await prisma.savedPost.findMany({
      where: {
        userEmail: session.user.email,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        post: {
          include: {
            user: true,
            _count: {
              select: {
                likes: true,
                comments: true,
              },
            },
          },
        },
      },
    });

    const posts = saved
      .filter((s) => s.post !== null)
      .map((s) => ({
        ...s.post,
        savedAt: s.createdAt,
      }));

    return new NextResponse(
      JSON.stringify({ posts }),
      { status: 200 }
    );
  } catch (err) {
    console.error("GET /api/saved error:", err);
    return new NextResponse(
      JSON.stringify({ message: "Something went wrong!" }),
      { status: 500 }
    );
  }
};

// POST /api/saved - Toggle save/unsave
export const POST = async (req) => {
  const session = await getAuthSession();

  if (!session) {
    return new NextResponse(
      JSON.stringify({ message: "Please sign in to save posts!" }),
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { slug } = body;

    if (!slug) {
      return new NextResponse(
        JSON.stringify({ message: "Slug is required" }),
        { status: 400 }
      );
    }

    const existing = await prisma.savedPost.findUnique({
      where: {
        userEmail_postSlug: {
          userEmail: session.user.email,
          postSlug: slug,
        },
      },
    });

    if (existing) {
      // Unsave
      await prisma.savedPost.delete({
        where: {
          id: existing.id,
        },
      });
      return new NextResponse(
        JSON.stringify({ isSaved: false, message: "Removed from saved" }),
        { status: 200 }
      );
    } else {
      // Save
      await prisma.savedPost.create({
        data: {
          userEmail: session.user.email,
          postSlug: slug,
        },
      });
      return new NextResponse(
        JSON.stringify({ isSaved: true, message: "Saved to your bookmarks" }),
        { status: 200 }
      );
    }
  } catch (err) {
    console.error("POST /api/saved error:", err);
    return new NextResponse(
      JSON.stringify({ message: "Something went wrong!" }),
      { status: 500 }
    );
  }
};
