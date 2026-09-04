import { getAuthSession } from "@/utils/auth";
import prisma from "@/utils/connect";
import { NextResponse } from "next/server";

// GET /api/likes?slug=xxx  — returns like count + whether current user has liked
export const GET = async (req) => {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return new NextResponse(
      JSON.stringify({ message: "Slug is required" }),
      { status: 400 }
    );
  }

  try {
    const session = await getAuthSession();

    const likeCount = await prisma.like.count({
      where: { postSlug: slug },
    });

    let isLiked = false;
    if (session?.user?.email) {
      const existingLike = await prisma.like.findUnique({
        where: {
          userEmail_postSlug: {
            userEmail: session.user.email,
            postSlug: slug,
          },
        },
      });
      isLiked = !!existingLike;
    }

    return new NextResponse(
      JSON.stringify({ likeCount, isLiked }),
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

// POST /api/likes  { slug } — toggle like (like if not liked, unlike if already liked)
export const POST = async (req) => {
  const session = await getAuthSession();

  if (!session) {
    return new NextResponse(
      JSON.stringify({ message: "Not Authenticated!" }),
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

    const existingLike = await prisma.like.findUnique({
      where: {
        userEmail_postSlug: {
          userEmail: session.user.email,
          postSlug: slug,
        },
      },
    });

    if (existingLike) {
      // Unlike — remove the like
      await prisma.like.delete({
        where: { id: existingLike.id },
      });
    } else {
      // Like — create a new like
      await prisma.like.create({
        data: {
          userEmail: session.user.email,
          postSlug: slug,
        },
      });
    }

    // Return updated count
    const likeCount = await prisma.like.count({
      where: { postSlug: slug },
    });

    return new NextResponse(
      JSON.stringify({ likeCount, isLiked: !existingLike }),
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
