"use client";

import React, { useState, useEffect } from "react";
import styles from "./featured.module.css";
import Image from "next/image";
import Link from "next/link";
import { timeAgo } from "@/utils/timeAgo";

const words = ["philosophy.", "stories.", "creative ideas.", "culture.", "code."];

const Featured = () => {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [featuredPost, setFeaturedPost] = useState(null);

  // Typewriter effect
  useEffect(() => {
    if (subIndex === words[index].length + 1 && !reverse) {
      const timeout = setTimeout(() => setReverse(true), 1400);
      return () => clearTimeout(timeout);
    }

    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % words.length);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, reverse ? 40 : 80);

    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse]);

  // Fetch latest post for Featured Story
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch("/api/featured", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setFeaturedPost(data);
        }
      } catch (err) {
        console.log(err);
      }
    };
    fetchFeatured();
  }, []);

  // Clean HTML tags and decode HTML entities like &nbsp; &#39;
  const stripHtml = (html) => {
    if (!html) return "";
    if (typeof window !== "undefined") {
      const doc = new DOMParser().parseFromString(html, "text/html");
      const text = doc.body.textContent || "";
      const cleaned = text.replace(/\s+/g, " ").trim();
      return cleaned.substring(0, 180) + (cleaned.length > 180 ? "..." : "");
    }
    return html
      .replace(/<[^>]*>?/gm, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 180);
  };

  const title = featuredPost?.title || "The Art of Letting Go: Finding Clarity in a Noisy World";
  const desc = featuredPost?.desc
    ? stripHtml(featuredPost.desc)
    : "Explore how taking a step back and releasing unnecessary distractions can create space for deep creativity, focus, and authentic personal growth.";
  const img = (featuredPost?.img && featuredPost.img.trim() !== "") ? featuredPost.img : "/p1.jpeg";
  const category = featuredPost?.catSlug || "Philosophy";
  const dateStr = featuredPost?.createdAt
    ? timeAgo(featuredPost.createdAt)
    : "Featured Story";
  const slug = featuredPost?.slug;
  const linkHref = slug ? `/posts/${slug}` : "/blog?cat=philosophy";

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        <b>Hey, welcome to WriteSpace!</b> Discover{" "}
        <span className={styles.typedText}>
          {words[index].substring(0, subIndex)}
        </span>
        <span className={styles.cursor}>|</span>
      </h1>
      <div className={styles.post}>
        <div className={styles.imageContainer}>
          <Image
            src={img}
            alt="Featured Story"
            fill
            className={styles.image}
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
        <div className={styles.textContainer}>
          <div className={styles.meta}>
            <span className={styles.categoryBadge}>{category}</span>
            <span className={styles.date}>{dateStr}</span>
          </div>
          <h2 className={styles.postTitle}>{title}</h2>
          <p className={styles.postDesc}>{desc}</p>
          <Link href={linkHref} className={styles.link}>
            Read More
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Featured;
