"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styles from "./singlePage.module.css";
import Comments from "@/components/comments/Comments";
import { timeAgo } from "@/utils/timeAgo";
import { isVideoUrl } from "@/utils/media";

// Strip editor artifacts from Quill HTML
const sanitizeHtml = (html) => {
  if (!html) return "";
  return html
    .replace(/&nbsp;/g, " ")
    .replace(/\u00A0/g, " ")
    .replace(/background-color\s*:\s*[^;"']+;?/gi, "")
    .replace(/(?<![a-z-])color\s*:\s*[^;"']+;?/gi, "");
};

// Format date like Substack: "FEB 04, 2026"
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).toUpperCase();
};

const ArticleReader = ({ post }) => {
  const { data: session } = useSession();
  const router = useRouter();

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [commentCount] = useState(post._count?.comments || 0);
  const [copied, setCopied] = useState(false);

  const menuRef = useRef(null);

  const authorName = post.user?.name || "Author";
  const authorAvatar =
    post.user?.image ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=dc143c&color=fff&bold=true&size=128`;

  // Init owner + subscription + save + like state
  useEffect(() => {
    if (!session) return;

    setIsOwner(
      session.user.email === post.userEmail ||
        session.user.role === "admin"
    );

    // Check subscription
    fetch(`/api/subscribe?authorEmail=${encodeURIComponent(post.userEmail)}`)
      .then((r) => r.json())
      .then((d) => setIsSubscribed(d.isSubscribed))
      .catch(() => {});

    // Check saved
    fetch(`/api/saved?slug=${post.slug}`)
      .then((r) => r.json())
      .then((d) => setIsSaved(d.isSaved))
      .catch(() => {});

    // Check like
    fetch(`/api/likes?slug=${post.slug}`)
      .then((r) => r.json())
      .then((d) => {
        setLiked(d.isLiked);
        setLikeCount(d.likeCount);
      })
      .catch(() => {});
  }, [session, post.userEmail, post.slug]);

  // Auto-scroll to #comments if page was loaded with #comments hash
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#comments") {
      const timer = setTimeout(() => {
        const el = document.getElementById("comments");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, []);

  // Smooth scroll to comments section on clicking comment button
  const scrollToComments = (e) => {
    if (e) e.preventDefault();
    const el = document.getElementById("comments");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      if (window.location.hash !== "#comments") {
        window.history.replaceState(null, "", "#comments");
      }
      setTimeout(() => {
        const textarea = el.querySelector("textarea");
        if (textarea) textarea.focus();
      }, 600);
    }
  };

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const handleSubscribe = async () => {
    if (!session) { router.push("/login"); return; }
    const next = !isSubscribed;
    setIsSubscribed(next);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorEmail: post.userEmail }),
      });
      const d = await res.json();
      setIsSubscribed(d.isSubscribed);
    } catch { setIsSubscribed(!next); }
  };

  const handleLike = async () => {
    if (!session) { alert("Sign in to like posts!"); return; }
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: post.slug }),
      });
      const d = await res.json();
      setLiked(d.isLiked);
      setLikeCount(d.likeCount);
    } catch {
      setLiked(!next);
      setLikeCount((c) => c + (next ? -1 : 1));
    }
  };

  const handleSave = async () => {
    if (!session) { router.push("/login"); return; }
    const next = !isSaved;
    setIsSaved(next);
    try {
      const res = await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: post.slug }),
      });
      const d = await res.json();
      setIsSaved(d.isSaved);
    } catch { setIsSaved(!next); }
  };

  const handleCopy = async () => {
    const url = `${window.location.origin}/posts/${post.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => { setCopied(false); setMenuOpen(false); }, 1800);
    } catch {}
  };

  const handleDelete = async () => {
    setMenuOpen(false);
    if (!confirm("Delete this post? This cannot be undone.")) return;
    const res = await fetch(`/api/posts/${post.slug}`, { method: "DELETE" });
    if (res.ok) router.push("/");
  };

  return (
    <div className={styles.readerPage}>

      {/* ── Top Navigation Bar ── */}
      <header className={styles.topBar}>
        {/* Left: Back / Close */}
        <button
          type="button"
          className={styles.closeBtn}
          onClick={() => router.back()}
          aria-label="Go back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Center: Publication Avatar */}
        <Link
          href={`/profile?user=${encodeURIComponent(post.userEmail || "")}`}
          className={styles.topAvatarLink}
        >
          <div className={styles.topAvatarWrap}>
            <Image
              src={authorAvatar}
              alt={authorName}
              fill
              className={styles.topAvatar}
              sizes="44px"
            />
          </div>
        </Link>

        {/* Right: Subscribe + ••• menu */}
        <div className={styles.topRight}>
          {!isOwner && (
            <button
              type="button"
              className={isSubscribed ? styles.subscribedBtn : styles.subscribeBtn}
              onClick={handleSubscribe}
            >
              {isSubscribed ? "Subscribed" : "Subscribe"}
            </button>
          )}

          <div className={styles.moreWrap} ref={menuRef}>
            <button
              type="button"
              className={styles.moreBtn}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="More options"
            >
              •••
            </button>

            {menuOpen && (
              <div className={styles.dropdown}>
                {/* Copy link */}
                <button type="button" className={styles.dropItem} onClick={handleCopy}>
                  <span>🔗</span>
                  <span>{copied ? "Link copied!" : "Copy link"}</span>
                </button>

                {/* Share */}
                <button
                  type="button"
                  className={styles.dropItem}
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: post.title, url: `${window.location.origin}/posts/${post.slug}` });
                    } else {
                      handleCopy();
                    }
                    setMenuOpen(false);
                  }}
                >
                  <span>↗</span>
                  <span>Share</span>
                </button>

                {/* Save */}
                <button type="button" className={styles.dropItem} onClick={() => { handleSave(); setMenuOpen(false); }}>
                  <span>{isSaved ? "★" : "🔖"}</span>
                  <span>{isSaved ? "Saved" : "Save"}</span>
                </button>

                {/* Delete — owner only */}
                {isOwner && (
                  <button type="button" className={`${styles.dropItem} ${styles.deleteItem}`} onClick={handleDelete}>
                    <span>🗑️</span>
                    <span>Delete post</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Article Content ── */}
      <article className={styles.article}>
        {/* Publication label */}
        <p className={styles.pubLabel}>{authorName.toUpperCase()}</p>

        {/* Post Title */}
        <h1 className={styles.title}>{post.title}</h1>

        

        {/* Author row */}
        <Link
          href={`/profile?user=${encodeURIComponent(post.userEmail || "")}`}
          className={styles.authorRow}
        >
          <div className={styles.authorAvatarWrap}>
            <Image src={authorAvatar} alt={authorName} fill className={styles.authorAvatar} sizes="40px" />
          </div>
          <div className={styles.authorMeta}>
            <span className={styles.authorName}>{authorName}</span>
            <span className={styles.authorDate}>{formatDate(post.createdAt)}</span>
          </div>
        </Link>

        {/* Cover Media (Image or Video) */}
        {post.img && (
          <div className={styles.coverWrap}>
            {isVideoUrl(post.img) ? (
              <video
                src={post.img}
                className={styles.coverVideo}
                controls
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <Image
                src={post.img}
                alt={post.title || "Cover image"}
                fill
                className={styles.coverImage}
                priority
                sizes="(max-width: 768px) 100vw, 680px"
              />
            )}
          </div>
        )}

        {/* Article Body */}
        <div
          className={styles.body}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.desc) }}
        />

        {/* Comments */}
        <div className={styles.commentsSection}>
          <Comments postSlug={post.slug} />
        </div>
      </article>

      {/* ── Sticky Bottom Engagement Bar ── */}
      <div className={styles.bottomBar}>
        {/* Like */}
        <button
          type="button"
          className={`${styles.engageBtn} ${liked ? styles.liked : ""}`}
          onClick={handleLike}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill={liked ? "#e0245e" : "none"} stroke={liked ? "#e0245e" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>

        {/* Comments */}
        <button
          type="button"
          className={styles.engageBtn}
          onClick={scrollToComments}
          title="Jump to comments"
          aria-label="Jump to comments"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {commentCount > 0 && <span>{commentCount}</span>}
        </button>

        {/* Save */}
        <button type="button" className={`${styles.engageBtn} ${isSaved ? styles.saved : ""}`} onClick={handleSave}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill={isSaved ? "#ff5722" : "none"} stroke={isSaved ? "#ff5722" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>

        {/* Share */}
        <button
          type="button"
          className={styles.engageBtn}
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: post.title, url: `${window.location.origin}/posts/${post.slug}` });
            } else {
              handleCopy();
            }
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ArticleReader;
