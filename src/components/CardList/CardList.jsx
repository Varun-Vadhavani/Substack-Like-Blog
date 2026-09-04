import React from "react";
import styles from "./cardList.module.css";
import Card from "../card/Card";
import prisma from "@/utils/connect";

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

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Recent Posts</h1>
      <div className={styles.posts}>
        {posts && posts.length > 0 ? (
          posts.map((item) => <Card item={item} key={item.id} />)
        ) : (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--softTextColor)" }}>
            No posts found. Be the first to share a note or article!
          </div>
        )}
      </div>
    </div>
  );
};

export default CardList;