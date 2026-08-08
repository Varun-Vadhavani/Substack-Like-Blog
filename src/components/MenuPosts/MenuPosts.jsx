"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./menuPosts.module.css";
import Image from "next/image";
import { timeAgo } from "@/utils/timeAgo";

const MenuPosts = ({ withImage, type = "editors" }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch(`/api/posts/menu?type=${type}`);
        if (res.ok) {
          const data = await res.json();
          setPosts(data);
        }
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [type]);

  if (loading) {
    return <div className={styles.items}>Loading posts...</div>;
  }

  return (
    <div className={styles.items}>
      {posts?.map((item) => {
        const img = item.img || "/p1.jpeg";
        const catStyle = styles[item.catSlug] || "";

        return (
          <Link href={`/posts/${item.slug}`} className={styles.item} key={item.id}>
            {withImage && (
              <div className={styles.imageContainer}>
                <Image src={img} alt="" fill className={styles.image} />
              </div>
            )}
            <div className={styles.textContainer}>
              <span className={`${styles.category} ${catStyle}`}>
                {item.catSlug}
              </span>
              <h3 className={styles.postTitle}>{item.title}</h3>
              <div className={styles.detail}>
                <span className={styles.username}>{item.user?.name || "Author"}</span>
                <span className={styles.date}> - {timeAgo(item.createdAt)}</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default MenuPosts;
