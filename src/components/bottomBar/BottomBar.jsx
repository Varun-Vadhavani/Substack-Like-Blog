"use client";

import React, { useState, useRef, useEffect, useContext } from "react";
import styles from "./bottomBar.module.css";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useCreateNote } from "@/context/CreateNoteContext";
import { ThemeContext } from "@/context/ThemeContext";

const BottomBar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { openNoteModal } = useCreateNote();
  const { toggle, theme } = useContext(ThemeContext);

  const isAuthenticated = status === "authenticated";
  const isAdmin = session?.user?.role === "admin";

  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const createRef = useRef(null);
  const drawerRef = useRef(null);

  // Close menus on outside click or route change
  useEffect(() => {
    setCreateMenuOpen(false);
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (createRef.current && !createRef.current.contains(e.target)) {
        setCreateMenuOpen(false);
      }
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        setDrawerOpen(false);
      }
    };
    if (createMenuOpen || drawerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [createMenuOpen, drawerOpen]);

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
    setCreateMenuOpen(!createMenuOpen);
  };

  const handleSelectNote = () => {
    setCreateMenuOpen(false);
    openNoteModal();
  };

  const handleSelectArticle = () => {
    setCreateMenuOpen(false);
    router.push("/write");
  };

  return (
    <>
      {/* ── Slide-up Mobile Drawer Menu ── */}
      {drawerOpen && (
        <div className={styles.drawerBackdrop} onClick={() => setDrawerOpen(false)}>
          <div
            className={styles.drawerSheet}
            ref={drawerRef}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className={styles.drawerHeader}>
              {isAuthenticated ? (
                <div className={styles.drawerUserInfo}>
                  <div className={styles.drawerAvatarWrap}>
                    <Image
                      src={avatarUrl}
                      alt={session?.user?.name || "User"}
                      fill
                      className={styles.drawerAvatar}
                    />
                  </div>
                  <div className={styles.drawerUserMeta}>
                    <span className={styles.drawerUserName}>{session?.user?.name}</span>
                    <span className={styles.drawerUserEmail}>{session?.user?.email}</span>
                  </div>
                </div>
              ) : (
                <div className={styles.drawerPrompt}>
                  <span className={styles.drawerPromptTitle}>Welcome to WriteSpace</span>
                  <span className={styles.drawerPromptSub}>Sign in to write, comment, and save</span>
                </div>
              )}

              <button
                type="button"
                className={styles.drawerCloseBtn}
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            {/* Drawer Navigation Links */}
            <div className={styles.drawerLinks}>
              {isAuthenticated ? (
                <>
                  <Link
                    href="/profile"
                    className={styles.drawerLink}
                    onClick={() => setDrawerOpen(false)}
                  >
                    <span className={styles.drawerLinkIcon}>👤</span>
                    <span className={styles.drawerLinkLabel}>My Profile</span>
                  </Link>

                  <Link
                    href="/saved"
                    className={styles.drawerLink}
                    onClick={() => setDrawerOpen(false)}
                  >
                    <span className={styles.drawerLinkIcon}>🔖</span>
                    <span className={styles.drawerLinkLabel}>Saved Posts</span>
                  </Link>

                  <Link
                    href="/drafts"
                    className={styles.drawerLink}
                    onClick={() => setDrawerOpen(false)}
                  >
                    <span className={styles.drawerLinkIcon}>✍️</span>
                    <span className={styles.drawerLinkLabel}>Drafts</span>
                  </Link>

                  <Link
                    href="/settings"
                    className={styles.drawerLink}
                    onClick={() => setDrawerOpen(false)}
                  >
                    <span className={styles.drawerLinkIcon}>⚙️</span>
                    <span className={styles.drawerLinkLabel}>Settings</span>
                  </Link>

                  {isAdmin && (
                    <Link
                      href="/admin"
                      className={styles.drawerLink}
                      onClick={() => setDrawerOpen(false)}
                    >
                      <span className={styles.drawerLinkIcon}>🛡️</span>
                      <span className={styles.drawerLinkLabel}>Admin Dashboard</span>
                    </Link>
                  )}
                </>
              ) : (
                <Link
                  href="/login"
                  className={styles.drawerSignInBtn}
                  onClick={() => setDrawerOpen(false)}
                >
                  Sign In / Register
                </Link>
              )}

              {/* Theme Toggle in Drawer */}
              <button
                type="button"
                className={styles.drawerThemeBtn}
                onClick={() => {
                  toggle();
                }}
              >
                <span className={styles.drawerLinkIcon}>
                  {theme === "dark" ? "☀️" : "🌙"}
                </span>
                <span className={styles.drawerLinkLabel}>
                  {theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                </span>
              </button>

              {/* Sign Out Button */}
              {isAuthenticated && (
                <button
                  type="button"
                  className={styles.drawerLogoutBtn}
                  onClick={() => {
                    setDrawerOpen(false);
                    signOut();
                  }}
                >
                  <span className={styles.drawerLinkIcon}>🚪</span>
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Fixed Bottom Navigation Bar (5 Tabs) ── */}
      <nav className={styles.bottomBar}>
        {/* 1. Home Tab */}
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

        {/* 2. Explore Tab */}
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

        {/* 3. + Create Button */}
        <div className={styles.mobileCreateWrapper} ref={createRef}>
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

          {createMenuOpen && (
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

        {/* 4. Saved Tab */}
        <Link
          href={isAuthenticated ? "/saved" : "/login"}
          className={`${styles.tab} ${isActive("/saved") ? styles.tabActive : ""}`}
          title="Saved"
        >
          <span className={styles.tabIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </span>
          <span className={styles.tabLabel}>Saved</span>
        </Link>

        {/* 5. Menu / Profile Tab (Toggles Drawer Sheet) */}
        <button
          type="button"
          className={`${styles.tab} ${styles.menuTabBtn} ${drawerOpen ? styles.tabActive : ""}`}
          onClick={() => setDrawerOpen(!drawerOpen)}
          title="Menu"
          aria-label="Open mobile menu"
        >
          {isAuthenticated ? (
            <div className={styles.tabAvatarWrapper}>
              <Image
                src={avatarUrl}
                alt="Menu"
                fill
                className={styles.tabAvatar}
              />
            </div>
          ) : (
            <span className={styles.tabIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </span>
          )}
          <span className={styles.tabLabel}>Menu</span>
        </button>
      </nav>
    </>
  );
};

export default BottomBar;
