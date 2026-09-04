import { getAuthSession } from "@/utils/auth";
import prisma from "@/utils/connect";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export const GET = async (req) => {
  const session = await getAuthSession();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q) {
    return new NextResponse(
      JSON.stringify({ articles: [], notes: [], authors: [], totalCount: 0 }),
      { status: 200 }
    );
  }

  const cleanHandle = q.replace(/^@/, "");

  // Build casing variants for case-insensitive search on MongoDB
  const variants = [...new Set([
    q,
    q.toLowerCase(),
    q.toUpperCase(),
    q.charAt(0).toUpperCase() + q.slice(1).toLowerCase(),
  ])];

  const buildContainsOR = (field) =>
    variants.map((v) => ({ [field]: { contains: v } }));

  try {
    // Fetch ALL matching published posts (MongoDB doesn't support { not: "note" } or type filters reliably)
    // Then split client-side into articles vs notes
    const allMatchingPosts = await prisma.post.findMany({
      where: {
        status: "published",
        OR: [
          ...buildContainsOR("title"),
          ...buildContainsOR("desc"),
          ...buildContainsOR("catSlug"),
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
        _count: {
          select: { likes: true, comments: true },
        },
      },
    });

    // Split by type in JS — avoids MongoDB Prisma type-filter bug
    const uniquePosts = [...new Map(allMatchingPosts.map((p) => [p.id, p])).values()];
    const articles = uniquePosts.filter((p) => p.type !== "note");
    const notes = uniquePosts.filter((p) => p.type === "note");

    // Search Authors
    const handleVariants = [...new Set(variants.map((v) => v.replace(/^@/, "")))];
    const rawAuthors = await prisma.user.findMany({
      where: {
        OR: [
          ...handleVariants.map((v) => ({ name: { contains: v } })),
          ...handleVariants.map((v) => ({ username: { contains: v } })),
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
      },
      take: 20,
    });

    const uniqueRawAuthors = [...new Map(rawAuthors.map((u) => [u.id, u])).values()];

    // Augment authors with subscriber counts and subscription state
    const authors = await Promise.all(
      uniqueRawAuthors.map(async (author) => {
        const subscribersCount = await prisma.subscription.count({
          where: { authorEmail: author.email },
        });

        let isSubscribed = false;
        if (session?.user?.email && session.user.email !== author.email) {
          const sub = await prisma.subscription.findUnique({
            where: {
              subscriberEmail_authorEmail: {
                subscriberEmail: session.user.email,
                authorEmail: author.email,
              },
            },
          });
          isSubscribed = !!sub;
        }

        return {
          ...author,
          subscribersCount,
          isSubscribed,
          isOwner: session?.user?.email === author.email,
        };
      })
    );

    const totalCount = articles.length + notes.length + authors.length;

    return new NextResponse(
      JSON.stringify({ articles, notes, authors, totalCount }),
      { status: 200 }
    );
  } catch (err) {
    console.error("GET /api/search error:", err);
    return new NextResponse(
      JSON.stringify({ message: "Search failed", error: err.message }),
      { status: 500 }
    );
  }
};
