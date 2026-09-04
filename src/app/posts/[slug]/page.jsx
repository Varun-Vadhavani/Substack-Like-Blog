import prisma from "@/utils/connect";
import { notFound } from "next/navigation";
import ArticleReader from "./ArticleReader";

const getData = async (slug) => {
  try {
    const post = await prisma.post.update({
      where: { slug },
      data: { views: { increment: 1 } },
      include: {
        user: true,
        _count: { select: { likes: true, comments: true } },
      },
    });
    return post;
  } catch (err) {
    console.error("getData error:", err);
    return null;
  }
};

const SinglePage = async ({ params }) => {
  const { slug } = params;
  const post = await getData(slug);

  if (!post) notFound();

  // Serialize — Next.js can't pass Dates/ObjectIds from Server → Client Component directly
  const serialized = JSON.parse(JSON.stringify(post));

  return <ArticleReader post={serialized} />;
};

export default SinglePage;