import prisma from "@/utils/connect";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export const GET = async () => {
  try {
    const post = await prisma.post.findFirst({
      orderBy: { createdAt: "desc" },
      include: { user: true },
    });

    return new NextResponse(JSON.stringify(post || null), { status: 200 });
  } catch (err) {
    console.log(err);
    return new NextResponse(
      JSON.stringify({ message: "Something went wrong!" }),
      { status: 500 }
    );
  }
};
