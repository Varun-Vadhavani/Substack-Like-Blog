import { getAuthSession } from "@/utils/auth";
import prisma from "@/utils/connect";
import { NextResponse } from "next/server";

// GET /api/users/profile?email=... OR ?username=...
export const GET = async (req) => {
  const session = await getAuthSession();
  const { searchParams } = new URL(req.url);

  const emailParam = searchParams.get("email");
  const usernameParam = searchParams.get("username");

  const targetEmail = emailParam || (usernameParam ? undefined : session?.user?.email);

  try {
    let user;

    if (usernameParam) {
      user = await prisma.user.findUnique({
        where: { username: usernameParam.toLowerCase() },
      });
    } else if (targetEmail) {
      user = await prisma.user.findUnique({
        where: { email: targetEmail },
      });
    } else {
      return new NextResponse(
        JSON.stringify({ message: "User not found or not authenticated" }),
        { status: 401 }
      );
    }

    if (!user) {
      return new NextResponse(
        JSON.stringify({ message: "Profile not found" }),
        { status: 404 }
      );
    }

    // 1. Published posts & notes by this user
    const posts = await prisma.post.findMany({
      where: {
        userEmail: user.email,
        status: { not: "draft" },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: true,
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    // 2. Liked posts by this user
    const userLikes = await prisma.like.findMany({
      where: {
        userEmail: user.email,
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

    const likedPosts = userLikes
      .filter((l) => l.post && l.post.status !== "draft")
      .map((l) => l.post);

    // 3. Subscriptions (authors this user subscribed to)
    const subscriptions = await prisma.subscription.findMany({
      where: {
        subscriberEmail: user.email,
      },
      orderBy: {
        createdAt: "desc",
      },
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
    });

    // 4. Subscriber count
    const subscribersCount = await prisma.subscription.count({
      where: {
        authorEmail: user.email,
      },
    });

    const isOwner = session?.user?.email === user.email;

    // 5. Is current viewer subscribed to this user?
    let isSubscribed = false;
    if (session?.user?.email && !isOwner) {
      const sub = await prisma.subscription.findUnique({
        where: {
          subscriberEmail_authorEmail: {
            subscriberEmail: session.user.email,
            authorEmail: user.email,
          },
        },
      });
      isSubscribed = !!sub;
    }

    return new NextResponse(
      JSON.stringify({
        user: {
          id: user.id,
          name: user.name,
          username: user.username || (user.email ? user.email.split("@")[0] : "user"),
          email: user.email,
          image: user.image,
          role: user.role,
        },
        posts,
        likedPosts,
        subscriptions: subscriptions.map((s) => s.author),
        subscribersCount,
        subscriptionsCount: subscriptions.length,
        isOwner,
        isSubscribed,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("GET /api/users/profile error:", err);
    return new NextResponse(
      JSON.stringify({ message: "Something went wrong!" }),
      { status: 500 }
    );
  }
};

// PUT /api/users/profile (Update name, unique username, image)
export const PUT = async (req) => {
  const session = await getAuthSession();

  if (!session?.user?.email) {
    return new NextResponse(
      JSON.stringify({ message: "Not Authenticated!" }),
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { name, username, image } = body;

    let cleanUsername = username
      ? username.toLowerCase().trim().replace(/[^a-z0-9_]/g, "")
      : undefined;

    // Check unique username constraint
    if (cleanUsername) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: cleanUsername,
          email: { not: session.user.email },
        },
      });

      if (existingUser) {
        return new NextResponse(
          JSON.stringify({
            message: `@${cleanUsername} is already taken. Please choose a different username.`,
          }),
          { status: 400 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: {
        email: session.user.email,
      },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(cleanUsername !== undefined ? { username: cleanUsername } : {}),
        ...(image !== undefined ? { image } : {}),
      },
    });

    return new NextResponse(
      JSON.stringify({
        message: "Profile updated successfully!",
        user: updatedUser,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("PUT /api/users/profile error:", err);
    return new NextResponse(
      JSON.stringify({ message: "Failed to update profile." }),
      { status: 500 }
    );
  }
};
