import { getAuthSession } from "@/utils/auth";
import prisma from "@/utils/connect";
import { NextResponse } from "next/server";

export const GET = async (req) => {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page") || 1;
  const cat = searchParams.get("cat");
  const POST_PER_PAGE = 10;

  const query = {
    take: POST_PER_PAGE,
    skip: POST_PER_PAGE * (page - 1),
    where: {
      status: "published",
      ...(cat && { catSlug: cat }),
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: true,
      _count: { select: { likes: true, comments: true } },
    },
  };

  try {
    const [posts, count] = await prisma.$transaction([
      prisma.post.findMany(query),
      prisma.post.count({ where: query.where }),
    ]);
    return new NextResponse(JSON.stringify({ posts, count }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new NextResponse(
      JSON.stringify({ message: "Something went wrong!" }),
      { status: 500 }
    );
  }
};

// CREATE OR UPDATE A POST / NOTE (PUBLISHED OR DRAFT)
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
    const isNote = body.type === "note";
    const status = body.status || "published";

    // If slug provided, update the existing post
    if (body.slug) {
      const existing = await prisma.post.findUnique({
        where: { slug: body.slug },
      });

      if (existing) {
        const imagesArray = Array.isArray(body.images)
          ? body.images
          : body.img
          ? [body.img]
          : existing.images || [];

        const updated = await prisma.post.update({
          where: { slug: body.slug },
          data: {
            title: body.title !== undefined ? body.title : existing.title,
            desc: body.desc !== undefined ? body.desc : existing.desc,
            img: body.img !== undefined ? body.img : (imagesArray[0] || null),
            images: imagesArray,
            status,
            ...(body.catSlug ? { catSlug: body.catSlug } : {}),
          },
          include: { user: true },
        });

        return new NextResponse(JSON.stringify(updated), { status: 200 });
      }
    }

    // Otherwise create a new post
    const slug =
      isNote
        ? `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
        : (body.title || "untitled")
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-") +
          `-${Math.random().toString(36).substring(2, 6)}`;

    const imagesArray = Array.isArray(body.images)
      ? body.images
      : body.img
      ? [body.img]
      : [];

    const post = await prisma.post.create({
      data: {
        title: body.title || (isNote ? "Note" : "Untitled Draft"),
        desc: body.desc || "",
        img: imagesArray[0] || body.img || null,
        images: imagesArray,
        type: isNote ? "note" : "article",
        status,
        slug,
        userEmail: session.user.email,
        ...(body.catSlug ? { catSlug: body.catSlug } : {}),
      },
      include: { user: true },
    });

    return new NextResponse(JSON.stringify(post), { status: 200 });
  } catch (err) {
    console.error(err);
    return new NextResponse(
      JSON.stringify({ message: "Something went wrong!" }),
      { status: 500 }
    );
  }
};
