import { getAuthSession } from "@/utils/auth";
import prisma from "@/utils/connect";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export const GET = async () => {
  const session = await getAuthSession();

  if (!session?.user?.email) {
    return new NextResponse(
      JSON.stringify({ subscriptions: [] }),
      { status: 200 }
    );
  }

  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { subscriberEmail: session.user.email },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return new NextResponse(
      JSON.stringify({ subscriptions }),
      { status: 200 }
    );
  } catch (err) {
    console.error("GET /api/subscriptions/list error:", err);
    return new NextResponse(
      JSON.stringify({ message: "Failed to load subscriptions" }),
      { status: 500 }
    );
  }
};
