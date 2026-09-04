import prisma from "@/utils/connect";
import ExploreClient from "./ExploreClient";

export const dynamic = "force-dynamic";

const getCategories = async () => {
  try {
    const categories = await prisma.category.findMany();
    return categories;
  } catch (err) {
    console.error("getCategories error:", err);
    return [];
  }
};

const getPosts = async (cat) => {
  try {
    const posts = await prisma.post.findMany({
      where: {
        status: "published",
        ...(cat ? { catSlug: cat } : {}),
      },
      orderBy: { createdAt: "desc" },
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
    return posts;
  } catch (err) {
    console.error("getPosts error:", err);
    return [];
  }
};

const BlogPage = async ({ searchParams }) => {
  const { cat } = searchParams;

  const [categories, posts] = await Promise.all([
    getCategories(),
    getPosts(cat),
  ]);

  return (
    <ExploreClient
      initialCategories={categories}
      initialPosts={posts}
      catParam={cat}
    />
  );
};

export default BlogPage;