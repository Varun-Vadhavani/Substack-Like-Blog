"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import styles from "./card.module.css";
import Link from "next/link";
import { timeAgo } from "@/utils/timeAgo";
import { isVideoUrl } from "@/utils/media";
import ScrollReveal from "../scrollReveal/ScrollReveal";
import { useSession } from "next-auth/react";

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

// ─── Heart Icon SVG ───
const HeartIcon = ({ filled }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill={filled ? "#e0245e" : "none"}
    stroke={filled ? "#e0245e" : "currentColor"}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

// ─── Comment Icon SVG ───
const CommentIcon = () => (
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
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

// ─── Like & Comment Actions Bar ───
const EngagementBar = ({ slug, initialLikeCount, commentCount }) => {
  const { data: session } = useSession();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount || 0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Fetch the current user's like status on mount
  useEffect(() => {
    const fetchLikeStatus = async () => {
      try {
        const res = await fetch(`/api/likes?slug=${slug}`);
        const data = await res.json();
        setLikeCount(data.likeCount);
        setLiked(data.isLiked);
      } catch (err) {
        console.error("Failed to fetch like status:", err);
      }
    };
    fetchLikeStatus();
  }, [slug]);

  const handleLike = async () => {
    if (!session) {
      alert("Please sign in to like posts!");
      return;
    }

    // Optimistic update
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((prev) => prev + (newLiked ? 1 : -1));

    if (newLiked) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 400);
    }

    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      setLikeCount(data.likeCount);
      setLiked(data.isLiked);
    } catch (err) {
      // Revert on error
      setLiked(!newLiked);
      setLikeCount((prev) => prev + (newLiked ? -1 : 1));
      console.error("Failed to toggle like:", err);
    }
  };

  return (
    <div className={styles.engagementBar}>
      {/* Like Button */}
      <button
        type="button"
        className={`${styles.engageBtn} ${liked ? styles.liked : ""} ${
          isAnimating ? styles.likeAnimate : ""
        }`}
        onClick={handleLike}
        title={liked ? "Unlike" : "Like"}
        aria-label={liked ? "Unlike" : "Like"}
      >
        <HeartIcon filled={liked} />
        {likeCount > 0 && (
          <span className={`${styles.engageCount} ${liked ? styles.likedCount : ""}`}>
            {likeCount}
          </span>
        )}
      </button>

      {/* Comment Button */}
      <Link href={`/posts/${slug}`} className={styles.engageBtn} title="Comments">
        <CommentIcon />
        {commentCount > 0 && (
          <span className={styles.engageCount}>{commentCount}</span>
        )}
      </Link>
    </div>
  );
};

// ─── Top Actions: Subscribe, 3-Dots Dropdown, and Dismiss (X) ───
const TopActions = ({
  slug,
  itemType,
  onDismiss,
  saved,
  onToggleSave,
  isOwner,
  authorEmail,
}) => {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const menuRef = useRef(null);

  // Check subscription status
  useEffect(() => {
    if (!authorEmail || !session || isOwner) return;
    const checkSub = async () => {
      try {
        const res = await fetch(`/api/subscribe?authorEmail=${encodeURIComponent(authorEmail)}`);
        if (res.ok) {
          const data = await res.json();
          setIsSubscribed(data.isSubscribed);
        }
      } catch (err) {
        console.error(err);
      }
    };
    checkSub();
  }, [authorEmail, session, isOwner]);

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

  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}/posts/${slug}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setMenuOpen(false);
      }, 1500);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleToggleSubscribe = async () => {
    if (!session) {
      alert("Please sign in to subscribe!");
      return;
    }

    const nextState = !isSubscribed;
    setIsSubscribed(nextState);

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorEmail }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsSubscribed(data.isSubscribed);
      }
    } catch (err) {
      setIsSubscribed(!nextState);
      console.error(err);
    }
  };

  const handleDeletePost = async () => {
    setMenuOpen(false);
    const confirmed = window.confirm(
      `Are you sure you want to delete this ${itemType}? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/posts/${slug}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onDismiss(); // Removes the post immediately from the feed
      } else {
        const data = await res.json();
        alert(data.message || "Failed to delete post.");
      }
    } catch (err) {
      console.error("Error deleting post:", err);
      alert("An error occurred while deleting.");
    }
  };

  return (
    <div className={styles.topActionsRight} ref={menuRef}>
      {/* Show Subscribe button only if viewer is NOT the author */}
      {!isOwner && (
        <button
          type="button"
          className={`${styles.subscribeTextBtn} ${
            isSubscribed ? styles.subscribedTextBtn : ""
          }`}
          onClick={handleToggleSubscribe}
        >
          {isSubscribed ? "Subscribed ✓" : "Subscribe"}
        </button>
      )}

      <div className={styles.topMoreWrapper}>
        <button
          type="button"
          className={styles.topMoreBtn}
          onClick={() => setMenuOpen(!menuOpen)}
          title="More options"
          aria-label="More options"
        >
          •••
        </button>

        {menuOpen && (
          <div className={styles.dropdownMenu}>
            {/* Copy Link */}
            <button
              type="button"
              className={`${styles.dropdownItem} ${
                copied ? styles.copiedFeedback : ""
              }`}
              onClick={handleCopyLink}
            >
              <span>{copied ? "✓" : "🔗"}</span>
              <span>{copied ? "Link Copied!" : "Copy link"}</span>
            </button>

            {/* Save Note / Article */}
            <button
              type="button"
              className={styles.dropdownItem}
              onClick={() => {
                onToggleSave();
                setMenuOpen(false);
              }}
            >
              <span>{saved ? "★" : "🔖"}</span>
              <span>
                {saved
                  ? `Saved ${itemType === "note" ? "note" : "article"}`
                  : `Save ${itemType === "note" ? "note" : "article"}`}
              </span>
            </button>

            {/* If NOT the author -> Show Follow/Subscribe */}
            {!isOwner && (
              <button
                type="button"
                className={styles.dropdownItem}
                onClick={() => {
                  handleToggleSubscribe();
                  setMenuOpen(false);
                }}
              >
                <span>👤</span>
                <span>{isSubscribed ? "Following ✓" : "Follow"}</span>
              </button>
            )}

            {/* If IS the author -> Show Delete */}
            {isOwner && (
              <button
                type="button"
                className={`${styles.dropdownItem} ${styles.deleteDropdownItem}`}
                onClick={handleDeletePost}
              >
                <span>🗑️</span>
                <span>Delete {itemType === "note" ? "note" : "article"}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Dismiss / Remove from Feed Button */}
      <button
        type="button"
        className={styles.dismissBtn}
        onClick={onDismiss}
        title="Hide from feed"
        aria-label="Hide from feed"
      >
        ✕
      </button>
    </div>
  );
};

const Card = ({ item, onRemoveFromSaved }) => {
  const { data: session } = useSession();
  const [saved, setSaved] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Check saved status on mount
  useEffect(() => {
    if (!item?.slug) return;
    const checkSaved = async () => {
      try {
        const res = await fetch(`/api/saved?slug=${item.slug}`);
        if (res.ok) {
          const data = await res.json();
          setSaved(data.isSaved);
        }
      } catch (err) {
        console.error("Failed to check saved status:", err);
      }
    };
    checkSaved();
  }, [item?.slug, session]);

  if (dismissed) return null;

  const isNote = item?.type === "note";
  const authorName = item?.user?.name || "The Author";
  const authorAvatar =
    item?.user?.image ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      authorName
    )}&background=dc143c&color=fff&bold=true`;

  const coverImage =
    item?.img && item.img.trim() !== "" && !item.img.startsWith("blob:")
      ? item.img
      : "/p1.jpeg";

  const likeCount = item?._count?.likes || 0;
  const commentCount = item?._count?.comments || 0;

  // Determine if logged-in user is the author of this post
  const isOwner =
    session?.user?.email &&
    (item?.userEmail === session?.user?.email ||
      item?.user?.email === session?.user?.email ||
      session?.user?.role === "admin");

  const handleToggleSave = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!session) {
      alert("Please sign in to save posts!");
      return;
    }

    // Optimistic update
    const newSaved = !saved;
    setSaved(newSaved);

    try {
      const res = await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: item.slug }),
      });
      const data = await res.json();
      setSaved(data.isSaved);

      if (!data.isSaved && onRemoveFromSaved) {
        onRemoveFromSaved(item.slug);
      }
    } catch (err) {
      // Revert on error
      setSaved(!newSaved);
      console.error("Failed to toggle save:", err);
    }
  };

  return (
    <ScrollReveal>
      <div className={styles.feedItemWrapper}>
        {/* Top Header: Profile Image, Username & Date at Left; Subscribe, ..., and ✕ at Right */}
        <div className={styles.topFeedHeader}>
          <Link
            href={`/profile?user=${encodeURIComponent(item?.userEmail || "")}`}
            className={styles.authorLeftInfo}
          >
            <div className={styles.topAvatarWrapper}>
              <Image
                src={authorAvatar}
                alt={authorName}
                fill
                className={styles.topAvatar}
              />
            </div>
            <div className={styles.topAuthorMeta}>
              <span className={styles.topAuthorName}>{authorName}</span>
              <span className={styles.topDate}>
                {item?.createdAt ? timeAgo(item.createdAt) : ""}
              </span>
            </div>
          </Link>

          <TopActions
            slug={item.slug}
            itemType={isNote ? "note" : "article"}
            onDismiss={() => setDismissed(true)}
            saved={saved}
            onToggleSave={handleToggleSave}
            isOwner={isOwner}
            authorEmail={item?.userEmail}
          />
        </div>

        {/* Content Section */}
        {isNote ? (
          /* ==================== NOTE CARD ==================== */
          <div className={styles.noteCardBox}>
            <div className={styles.noteBody}>
              {stripHtml(item?.desc) || item?.desc}
            </div>

            {/* Substack Multi-Photo Collage Grid (1, 2, 3, 4 Photos) */}
            {(() => {
              const noteImages =
                item?.images && item.images.length > 0
                  ? item.images.filter((url) => url && url.trim() !== "")
                  : item?.img && item.img.trim() !== ""
                  ? [item.img]
                  : [];

              if (noteImages.length === 0) return null;

              if (noteImages.length === 1) {
                return (
                  <div className={styles.noteGrid} data-count="1">
                    <div className={styles.noteGridItem}>
                      <Image
                        src={noteImages[0]}
                        alt="Note photo"
                        width={680}
                        height={500}
                        className={styles.singleNoteImg}
                        sizes="(max-width: 768px) 100vw, 680px"
                      />
                    </div>
                  </div>
                );
              }

              return (
                <div
                  className={styles.noteGrid}
                  data-count={Math.min(noteImages.length, 4)}
                >
                  {noteImages.slice(0, 4).map((imgUrl, idx) => (
                    <div key={idx} className={styles.noteGridItem}>
                      <Image
                        src={imgUrl}
                        alt={`Note photo ${idx + 1}`}
                        fill
                        className={styles.noteGridImage}
                        sizes="(max-width: 768px) 100vw, 680px"
                      />
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        ) : (
          /* ==================== ARTICLE PREVIEW CARD (MATCHING MOCKUP) ==================== */
          <div className={styles.articleCardBox}>
            {/* Top Hero Image or Video Preview */}
            <Link href={`/posts/${item.slug}`} className={styles.articleHeroImageLink}>
              {isVideoUrl(item?.img) ? (
                <video
                  src={item.img}
                  className={styles.articleHeroVideo}
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                <Image
                  src={coverImage}
                  alt={item.title || "Article preview image"}
                  fill
                  className={styles.articleHeroImage}
                  sizes="(max-width: 768px) 100vw, 800px"
                  priority={false}
                />
              )}
            </Link>

            {/* Bottom Bar */}
            <div className={styles.articleBottomBar}>
              <div className={styles.articleAuthorRow}>
                <Link
                  href={`/profile?user=${encodeURIComponent(item?.userEmail || "")}`}
                  className={styles.articleAuthorLeft}
                >
                  <div className={styles.articleAuthorSmallAvatar}>
                    <Image
                      src={authorAvatar}
                      alt={authorName}
                      fill
                      className={styles.topAvatar}
                    />
                  </div>
                  <span className={styles.articleAuthorNameSoft}>{authorName}</span>
                </Link>

                {/* Bookmark / Save Icon Button */}
                <button
                  type="button"
                  className={`${styles.bookmarkBtn} ${saved ? styles.savedActive : ""}`}
                  onClick={handleToggleSave}
                  title={saved ? "Saved to bookmarks" : "Save article"}
                  aria-label="Save article"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill={saved ? "#ff5722" : "none"}
                    stroke={saved ? "#ff5722" : "currentColor"}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                  </svg>
                </button>
              </div>

              {/* Article Title */}
              <Link href={`/posts/${item.slug}`} className={styles.articleMainTitleLink}>
                <h3 className={styles.articleMainTitle}>{item.title}</h3>
              </Link>
            </div>
          </div>
        )}

        {/* Like & Comment Bar — sits below the card box */}
        <EngagementBar
          slug={item.slug}
          initialLikeCount={likeCount}
          commentCount={commentCount}
        />
      </div>
    </ScrollReveal>
  );
};

export default Card;