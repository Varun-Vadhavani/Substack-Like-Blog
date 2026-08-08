import React from "react";
import styles from "./categoryList.module.css";
import Link from "next/link";
import Image from "next/image";
import ScrollReveal from "../scrollReveal/ScrollReveal";
import prisma from "@/utils/connect";

const getData = async () => {
  try {
    const categories = await prisma.category.findMany();
    return categories;
  } catch (err) {
    console.log(err);
    return [];
  }
};

const CategoryList = async () => {
  const data = await getData();
  return (
    <ScrollReveal>
      <div className={styles.container}>
        <h1 className={styles.title}>Popular Categories</h1>
        <div className={styles.categories}>
          {data?.map((item) => (
            <Link
              href={`/blog?cat=${item.slug}`}
              className={`${styles.category} ${styles[item.slug]}`}
              key={item.id}
            >
              {item.img && (
                <Image
                  src={item.img}
                  alt=""
                  width={32}
                  height={32}
                  className={styles.image}
                />
              )}
              {item.title}
            </Link>
          ))}
        </div>
      </div>
    </ScrollReveal>
  );
};

export default CategoryList;