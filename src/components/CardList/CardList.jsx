import React from "react";
import prisma from "@/utils/connect";
import CardListClient from "./CardListClient";

const getData = async (cat) => {
  const query = {
    where: {
      status: "published",
      ...(cat && { catSlug: cat }),
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
  };

  try {
    const posts = await prisma.post.findMany(query);
    return posts;
  } catch (err) {
    console.error("CardList getData error:", err);
    return [];
  }
};

const CardList = async ({ cat }) => {
  const posts = await getData(cat);
  const serializedPosts = JSON.parse(JSON.stringify(posts));

  return <CardListClient initialPosts={serializedPosts} />;
};

export default CardList;