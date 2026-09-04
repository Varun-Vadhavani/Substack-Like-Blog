import { getAuthSession } from "@/utils/auth";
import prisma from "@/utils/connect";
import { NextResponse } from "next/server";

// GET /api/subscribe?authorEmail=...
export const GET = async (req) => {
  const session = await getAuthSession();
  const { searchParams } = new URL(req.url);
  const authorEmail = searchParams.get("authorEmail");

  if (!authorEmail) {
    return new NextResponse(
      JSON.stringify({ message: "Author email is required" }),
      { status: 400 }
    );
  }

  try {
    const subscribersCount = await prisma.subscription.count({
      where: { authorEmail },
    });

    let isSubscribed = false;
    if (session?.user?.email) {
      const existing = await prisma.subscription.findUnique({
        where: {
          subscriberEmail_authorEmail: {
            subscriberEmail: session.user.email,
            authorEmail,
          },
        },
      });
      isSubscribed = !!existing;
    }

    return new NextResponse(
      JSON.stringify({ isSubscribed, subscribersCount }),
      { status: 200 }
    );
  } catch (err) {
    console.error("GET /api/subscribe error:", err);
    return new NextResponse(
      JSON.stringify({ message: "Something went wrong!" }),
      { status: 500 }
    );
  }
};

// POST /api/subscribe - Toggle subscribe/unsubscribe
export const POST = async (req) => {
  const session = await getAuthSession();

  if (!session?.user?.email) {
    return new NextResponse(
      JSON.stringify({ message: "Please sign in to subscribe!" }),
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { authorEmail } = body;

    if (!authorEmail) {
      return new NextResponse(
        JSON.stringify({ message: "Author email is required" }),
        { status: 400 }
      );
    }

    if (authorEmail === session.user.email) {
      return new NextResponse(
        JSON.stringify({ message: "You cannot subscribe to yourself." }),
        { status: 400 }
      );
    }

    const existing = await prisma.subscription.findUnique({
      where: {
        subscriberEmail_authorEmail: {
          subscriberEmail: session.user.email,
          authorEmail,
        },
      },
    });

    let isSubscribed = false;
    if (existing) {
      // Unsubscribe
      await prisma.subscription.delete({
        where: { id: existing.id },
      });
      isSubscribed = false;
    } else {
      // Subscribe
      await prisma.subscription.create({
        data: {
          subscriberEmail: session.user.email,
          authorEmail,
        },
      });
      isSubscribed = true;
    }

    const subscribersCount = await prisma.subscription.count({
      where: { authorEmail },
    });

    return new NextResponse(
      JSON.stringify({
        isSubscribed,
        subscribersCount,
        message: isSubscribed ? "Subscribed successfully!" : "Unsubscribed",
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("POST /api/subscribe error:", err);
    return new NextResponse(
      JSON.stringify({ message: "Something went wrong!" }),
      { status: 500 }
    );
  }
};
