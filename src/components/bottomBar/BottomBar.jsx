"use client";

import React, { useState, useRef, useEffect } from "react";
import styles from "./bottomBar.module.css";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCreateNote } from "@/context/CreateNoteContext";

const BottomBar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { openNoteModal } = useCreateNote();
  const isAuthenticated = status === "authenticated";

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const avatarUrl =
    session?.user?.image ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      session?.user?.name || "User"
    )}&background=dc143c&color=fff&bold=true`;

  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const handleCreateClick = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    setMenuOpen(!menuOpen);
  };

  const handleSelectNote = () => {
    setMenuOpen(false);
    openNoteModal();
  };

  const handleSelectArticle = () => {
    setMenuOpen(false);
    router.push("/write");
  };

  return (
    <nav className={styles.bottomBar} ref={menuRef}>
      {/* Home Tab */}
      <Link
        href="/"
        className={`${styles.tab} ${isActive("/") ? styles.tabActive : ""}`}
        title="Home"
      >
        <span className={styles.tabIcon}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </span>
        <span className={styles.tabLabel}>Home</span>
      </Link>

      {/* Explore Tab */}
      <Link
        href="/blog"
        className={`${styles.tab} ${isActive("/blog") ? styles.tabActive : ""}`}
        title="Explore"
      >
        <span className={styles.tabIcon}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <span className={styles.tabLabel}>Explore</span>
      </Link>

      {/* + Create Action Tab */}
      <div className={styles.mobileCreateWrapper}>
        <button
          type="button"
          className={styles.mobileCreateBtn}
          onClick={handleCreateClick}
          title="Create"
          aria-label="Create Note or Article"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        {menuOpen && (
          <div className={styles.mobileDropdown}>
            <button
              type="button"
              className={styles.mobileDropdownOption}
              onClick={handleSelectNote}
            >
              <span>💬</span>
              <span>New Note</span>
            </button>
            <button
              type="button"
              className={styles.mobileDropdownOption}
              onClick={handleSelectArticle}
            >
              <span>✍️</span>
              <span>New Article</span>
            </button>
          </div>
        )}
      </div>

      {/* Profile / Login Tab */}
      <Link
        href={isAuthenticated ? "/profile" : "/login"}
        className={`${styles.tab} ${
          isActive(isAuthenticated ? "/profile" : "/login")
            ? styles.tabActive
            : ""
        }`}
        title={isAuthenticated ? "Profile" : "Login"}
      >
        {isAuthenticated ? (
          <div className={styles.tabAvatarWrapper}>
            <Image
              src={avatarUrl}
              alt="Profile"
              fill
              className={styles.tabAvatar}
            />
          </div>
        ) : (
          <span className={styles.tabIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </span>
        )}
        <span className={styles.tabLabel}>
          {isAuthenticated ? "Profile" : "Login"}
        </span>
      </Link>
    </nav>
  );
};

export default BottomBar;
