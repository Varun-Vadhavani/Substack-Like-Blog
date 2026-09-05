"use client";

import React, { useState, useRef, useEffect } from "react";
import styles from "./sidebar.module.css";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useContext } from "react";
import { ThemeContext } from "@/context/ThemeContext";
import { useCreateNote } from "@/context/CreateNoteContext";

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toggle, theme } = useContext(ThemeContext);
  const { openNoteModal } = useCreateNote();

  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const createMenuRef = useRef(null);

  const isAuthenticated = status === "authenticated";
  const isAdmin = session?.user?.role === "admin";

  const avatarUrl =
    session?.user?.image ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      session?.user?.name || "User"
    )}&background=dc143c&color=fff&bold=true`;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (createMenuRef.current && !createMenuRef.current.contains(e.target)) {
        setCreateMenuOpen(false);
      }
    };
    if (createMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [createMenuOpen]);

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

  const navItems = [
    {
      href: "/",
      label: "Home",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      show: true,
    },
    {
      href: "/blog",
      label: "Explore",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
      show: true,
    },
    {
      href: "/saved",
      label: "Saved",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      ),
      show: isAuthenticated,
    },
    {
      href: "/drafts",
      label: "Drafts",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      ),
      show: isAuthenticated,
    },
    {
      href: "/settings",
      label: "Settings",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
      show: isAuthenticated,
    },
    {
      href: "/admin",
      label: "Admin",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      show: isAdmin,
    },
  ];

  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logoSection}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>W</span>
          <span className={styles.logoText}>WriteSpace</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        {navItems
          .filter((item) => item.show)
          .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${
                isActive(item.href) ? styles.navItemActive : ""
              }`}
              title={item.label}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
              <span className={styles.tooltip}>{item.label}</span>
            </Link>
          ))}

        {/* Prominent + Create Button with Dropdown Choice (Note vs Article) */}
        <div className={styles.createWrapper} ref={createMenuRef}>
          <button
            type="button"
            className={`${styles.createBtn} ${createMenuOpen ? styles.createBtnActive : ""}`}
            onClick={handleCreateClick}
            title="Create Note or Article"
            aria-label="Create Note or Article"
          >
            <span className={styles.createIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </span>
            <span className={styles.createLabel}>New Post</span>
            <span className={styles.tooltip}>New Post</span>
          </button>

          {/* Popup Choice Menu */}
          {createMenuOpen && (
            <div className={styles.createDropdown}>
              <button
                type="button"
                className={styles.dropdownOption}
                onClick={handleSelectNote}
              >
                <div className={styles.optionIconWrapper}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div className={styles.optionContent}>
                  <span className={styles.optionTitle}>Note</span>
                  <span className={styles.optionDesc}>Quick thought or update</span>
                </div>
              </button>

              <button
                type="button"
                className={styles.dropdownOption}
                onClick={handleSelectArticle}
              >
                <div className={styles.optionIconWrapper}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <div className={styles.optionContent}>
                  <span className={styles.optionTitle}>Article</span>
                  <span className={styles.optionDesc}>Long-form rich story</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className={styles.bottomSection}>
        {/* Theme Toggle */}
        <button
          type="button"
          className={styles.navItem}
          onClick={toggle}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          <span className={styles.navIcon}>
            {theme === "dark" ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </span>
          <span className={styles.navLabel}>
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </span>
          <span className={styles.tooltip}>
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </span>
        </button>

        {/* User Section */}
        {isAuthenticated ? (
          <div className={styles.userSection}>
            <Link href="/profile" className={styles.userProfile} title="Profile">
              <div className={styles.userAvatarWrapper}>
                <Image
                  src={avatarUrl}
                  alt={session?.user?.name || "User"}
                  fill
                  className={styles.userAvatar}
                />
              </div>
              <span className={styles.userName}>{session?.user?.name}</span>
              <span className={styles.tooltip}>Profile</span>
            </Link>
            <button
              type="button"
              className={styles.logoutBtn}
              onClick={() => signOut()}
              title="Logout"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span className={styles.tooltip}>Sign Out</span>
            </button>
          </div>
        ) : (
          <Link href="/login" className={styles.navItem} title="Login">
            <span className={styles.navIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </span>
            <span className={styles.navLabel}>Login</span>
            <span className={styles.tooltip}>Login</span>
          </Link>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
