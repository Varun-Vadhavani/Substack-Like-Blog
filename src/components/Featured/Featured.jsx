"use client";

import React, { useState, useEffect } from "react";
import styles from "./featured.module.css";

const words = ["philosophy.", "stories.", "creative ideas."];

const Featured = () => {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);

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

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        <b>Hey, welcome to WriteSpace!</b> Discover{" "}
        <span className={styles.typedText}>
          {words[index].substring(0, subIndex)}
        </span>
        <span className={styles.cursor}>|</span>
      </h1>
    </div>
  );
};

export default Featured;
