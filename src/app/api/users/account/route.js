import { getAuthSession } from "@/utils/auth";
import prisma from "@/utils/connect";
import { NextResponse } from "next/server";

// DELETE OWN ACCOUNT
export const DELETE = async () => {
  const session = await getAuthSession();

  if (!session) {
    return new NextResponse(
      JSON.stringify({ message: "Not Authenticated!" }),
      { status: 401 }
    );
  }

  const email = session.user.email;

  try {
    // 1. Delete all comments by this user
    await prisma.comment.deleteMany({ where: { userEmail: email } });

    // 2. Delete all comments on this user's posts
    const userPosts = await prisma.post.findMany({
      where: { userEmail: email },
      select: { slug: true },
    });
    const postSlugs = userPosts.map((p) => p.slug);
    if (postSlugs.length > 0) {
      await prisma.comment.deleteMany({ where: { postSlug: { in: postSlugs } } });
    }

    // 3. Delete all posts by this user
    await prisma.post.deleteMany({ where: { userEmail: email } });

    // 4. Delete sessions and accounts
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.session.deleteMany({ where: { userId: user.id } });
      await prisma.account.deleteMany({ where: { userId: user.id } });
    }

    // 5. Delete the user
    await prisma.user.delete({ where: { email } });

    return new NextResponse(
      JSON.stringify({ message: "Account deleted successfully!" }),
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
