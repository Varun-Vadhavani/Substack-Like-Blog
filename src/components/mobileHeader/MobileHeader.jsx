"use client";

import React, { useContext } from "react";
import Link from "next/link";
import styles from "./mobileHeader.module.css";
import { ThemeContext } from "@/context/ThemeContext";

const MobileHeader = () => {
  const { toggle, theme } = useContext(ThemeContext);

  return (
    <header className={styles.mobileHeader}>
      {/* Logo */}
      <Link href="/" className={styles.logo}>
        <span className={styles.logoIcon}>W</span>
        <span className={styles.logoText}>WriteSpace</span>
      </Link>

      {/* Right Controls: Search & Theme Toggle */}
      <div className={styles.actions}>
        {/* Search / Explore */}
        <Link href="/blog" className={styles.actionBtn} title="Explore & Search" aria-label="Search">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </Link>

        {/* Theme Toggle (Dark/Light) */}
        <button
          type="button"
          className={styles.actionBtn}
          onClick={toggle}
          title={theme === "dark" ? "Switch to Light mode" : "Switch to Dark mode"}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            /* Sun Icon */
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            /* Moon Icon */
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
};

export default MobileHeader;
