import Image from "next/image";
import styles from "./card.module.css";
import Link from "next/link";
import { timeAgo } from "@/utils/timeAgo";
import ScrollReveal from "../scrollReveal/ScrollReveal";

const stripHtml = (html) => {
  if (!html) return "";
  const cleanText = html
    .replace(/<[^>]*>?/gm, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
  return cleanText.substring(0, 160) + (cleanText.length > 160 ? "..." : "");
};

const Card = ({ item }) => {
  const img = (item?.img && item.img.trim() !== "") ? item.img : "/p1.jpeg";

  return (
    <ScrollReveal>
      <div className={styles.container}>
        <div className={styles.imageContainer}>
          <Image
            src={img}
            alt={item.title || "Post image"}
            fill
            className={styles.image}
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 40vw, 500px"
          />
        </div>
        <div className={styles.textContainer}>
          <div className={styles.detail}>
            <span className={styles.date}>
              {timeAgo(item.createdAt)} -{" "}
            </span>
            <span className={styles.category}>{item.catSlug}</span>
          </div>
          <Link href={`/posts/${item.slug}`}>
            <h1>{item.title}</h1>
          </Link>
          <p className={styles.desc}>{stripHtml(item?.desc)}</p>
          <Link href={`/posts/${item.slug}`} className={styles.link}>
            Read More
          </Link>
        </div>
      </div>
    </ScrollReveal>
  );
};

export default Card;