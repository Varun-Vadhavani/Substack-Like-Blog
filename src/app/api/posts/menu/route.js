import prisma from "@/utils/connect";
import { NextResponse } from "next/server";

export const GET = async (req) => {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // "popular" or "editors"

  try {
    let posts = [];

    if (type === "popular") {
      posts = await prisma.post.findMany({
        take: 4,
        orderBy: { views: "desc" },
        include: { user: true },
      });
    } else {
      // "editors" or default
      posts = await prisma.post.findMany({
        take: 4,
        orderBy: { createdAt: "desc" },
        include: { user: true },
      });
    }

    return new NextResponse(JSON.stringify(posts), { status: 200 });
  } catch (err) {
    console.log(err);
    return new NextResponse(
      JSON.stringify({ message: "Something went wrong!" }),
      { status: 500 }
    );
  }
};
