"use client";

import React, { useState, useEffect } from "react";
import styles from "./authLinks.module.css";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const AuthLinks = () => {
  const [open, setOpen] = useState(false);
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const checkActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  // Close menu automatically on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const handleLinkClick = () => {
    setOpen(false);
  };

  const avatarUrl =
    session?.user?.image ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      session?.user?.name || "User"
    )}&background=dc143c&color=fff&bold=true`;

  return (
    <>
      {/* Desktop Links */}
      {status === "unauthenticated" ? (
        <Link
          href="/login"
          className={`${styles.link} ${checkActive("/login") ? styles.active : ""}`}
        >
          Login
        </Link>
      ) : (
        <>
          {session?.user?.role === "admin" && (
            <Link
              href="/admin"
              className={`${styles.link} ${checkActive("/admin") ? styles.active : ""}`}
            >
              Admin
            </Link>
          )}
          <Link
            href="/write"
            className={`${styles.link} ${checkActive("/write") ? styles.active : ""}`}
          >
            Write
          </Link>
          <Link
            href="/settings"
            className={`${styles.link} ${checkActive("/settings") ? styles.active : ""}`}
          >
            Settings
          </Link>
          <span className={styles.link} onClick={() => signOut()}>
            Logout
          </span>
        </>
      )}

      {/* Animated Hamburger Icon */}
      <div
        className={`${styles.burger} ${open ? styles.burgerOpen : ""}`}
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
      >
        <div className={styles.line}></div>
        <div className={styles.line}></div>
        <div className={styles.line}></div>
      </div>

      {/* Responsive Mobile Overlay Menu */}
      {open && (
        <div className={styles.responsiveMenu}>
          {/* {status === "authenticated" && session?.user && (
            <div className={styles.userProfileHeader}>
              <Image
                src={avatarUrl}
                alt="Profile"
                width={60}
                height={60}
                className={styles.userAvatar}
              />
              <span className={styles.userName}>{session.user.name}</span>
              <span className={styles.userRole}>{session.user.role || "user"}</span>
            </div>
          )} */}

          <div className={styles.menuLinks}>
            <Link
              href="/"
              onClick={handleLinkClick}
              className={`${styles.mobileLink} ${checkActive("/") ? styles.mobileActive : ""}`}
            >
              Home
            </Link>
            <Link
              href="/about"
              onClick={handleLinkClick}
              className={`${styles.mobileLink} ${checkActive("/about") ? styles.mobileActive : ""}`}
            >
              About
            </Link>

            {status === "unauthenticated" ? (
              <Link
                href="/login"
                onClick={handleLinkClick}
                className={`${styles.mobileLink} ${checkActive("/login") ? styles.mobileActive : ""}`}
              >
                Login
              </Link>
            ) : (
              <>
                {session?.user?.role === "admin" && (
                  <Link
                    href="/admin"
                    onClick={handleLinkClick}
                    className={`${styles.mobileLink} ${checkActive("/admin") ? styles.mobileActive : ""}`}
                  >
                    Admin Dashboard
                  </Link>
                )}
                <Link
                  href="/write"
                  onClick={handleLinkClick}
                  className={`${styles.mobileLink} ${checkActive("/write") ? styles.mobileActive : ""}`}
                >
                  Write Post
                </Link>
                <Link
                  href="/settings"
                  onClick={handleLinkClick}
                  className={`${styles.mobileLink} ${checkActive("/settings") ? styles.mobileActive : ""}`}
                >
                  Account Settings
                </Link>
                <button
                  className={styles.logoutBtn}
                  onClick={() => {
                    handleLinkClick();
                    signOut();
                  }}
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AuthLinks;
