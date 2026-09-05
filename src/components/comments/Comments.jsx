"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { timeAgo } from "@/utils/timeAgo";
import styles from "./comments.module.css";

const fetcher = async (url) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.message || "Failed to fetch comments");
    throw error;
  }
  return data;
};

// ── Single Comment Item (Supports Top-level and 1-level Nested Reply) ──
const CommentItem = ({
  comment,
  isReply = false,
  parentCommentId = null,
  session,
  status,
  onDelete,
  onReplySubmit,
  replyingToId,
  setReplyingToId,
  replyText,
  setReplyText,
  submittingReply,
}) => {
  const [likeCount, setLikeCount] = useState(comment.likeCount || 0);
  const [isLiked, setIsLiked] = useState(comment.isLiked || false);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    setLikeCount(comment.likeCount || 0);
    setIsLiked(comment.isLiked || false);
  }, [comment.likeCount, comment.isLiked]);

  const handleLike = async () => {
    if (status !== "authenticated") {
      alert("Please sign in to like comments!");
      return;
    }
    if (isLiking) return;

    // Optimistic update
    const previousLiked = isLiked;
    const previousCount = likeCount;
    setIsLiked(!previousLiked);
    setLikeCount(previousLiked ? Math.max(0, previousCount - 1) : previousCount + 1);
    setIsLiking(true);

    try {
      const res = await fetch(`/api/comments/${comment.id}/like`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setIsLiked(data.isLiked);
        setLikeCount(data.likeCount);
      } else {
        // Revert on failure
        setIsLiked(previousLiked);
        setLikeCount(previousCount);
      }
    } catch (err) {
      console.error("Failed to like comment:", err);
      setIsLiked(previousLiked);
      setLikeCount(previousCount);
    } finally {
      setIsLiking(false);
    }
  };

  const isOwner =
    status === "authenticated" &&
    (comment.userEmail === session?.user?.email ||
      session?.user?.role === "admin");

  const avatarUrl =
    comment?.user?.image ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      comment?.user?.name || "User"
    )}&background=dc143c&color=fff&bold=true`;

  const authorName = comment?.user?.name || "Anonymous";

  const isReplyingThis = replyingToId === comment.id;

  const handleToggleReply = () => {
    if (status !== "authenticated") {
      alert("Please sign in to reply to comments!");
      return;
    }

    if (isReplyingThis) {
      setReplyingToId(null);
      setReplyText("");
    } else {
      setReplyingToId(comment.id);
      if (isReply) {
        setReplyText(`@${authorName} `);
      } else {
        setReplyText("");
      }
    }
  };

  return (
    <div className={isReply ? styles.replyItem : styles.commentItem}>
      {/* Header: Avatar, Name, Date, Delete */}
      <div className={styles.commentHeader}>
        <div className={styles.authorRow}>
          <div className={isReply ? styles.replyAvatarWrap : styles.avatarWrap}>
            <Image
              src={avatarUrl}
              alt={authorName}
              width={isReply ? 32 : 38}
              height={isReply ? 32 : 38}
              className={styles.avatar}
            />
          </div>
          <div className={styles.authorMeta}>
            <Link
              href={`/profile?user=${encodeURIComponent(comment.userEmail || "")}`}
              className={styles.authorName}
            >
              {authorName}
            </Link>
            <span className={styles.commentDate}>
              {comment.createdAt ? timeAgo(comment.createdAt) : ""}
            </span>
          </div>
        </div>

        {isOwner && (
          <button
            type="button"
            className={styles.deleteBtn}
            onClick={() => onDelete(comment.id)}
            title="Delete comment"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            <span>Delete</span>
          </button>
        )}
      </div>

      {/* Comment Body */}
      <div className={styles.commentBody}>{comment.desc}</div>

      {/* Engagement Actions: Like & Comment/Reply Icons with Counts */}
      <div className={styles.actionRow}>
        {/* Like Button & Count */}
        <button
          type="button"
          className={`${styles.actionBtn} ${isLiked ? styles.likedAction : ""}`}
          onClick={handleLike}
          aria-label={isLiked ? "Unlike comment" : "Like comment"}
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill={isLiked ? "#e0245e" : "none"}
            stroke={isLiked ? "#e0245e" : "currentColor"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span className={styles.actionCount}>{likeCount}</span>
        </button>

        {/* Comment / Reply Button & Count */}
        <button
          type="button"
          className={`${styles.actionBtn} ${isReplyingThis ? styles.activeAction : ""}`}
          onClick={handleToggleReply}
          aria-label="Reply to comment"
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className={styles.actionCount}>
            {!isReply ? (comment?.replies?.length || 0) : "Reply"}
          </span>
        </button>
      </div>

      {/* Inline Reply Composer (Appears right under comment when Reply is clicked) */}
      {isReplyingThis && (
        <div className={styles.replyComposer}>
          <div className={styles.replyHeader}>
            <span>Replying to <strong>@{authorName}</strong></span>
            <button
              type="button"
              className={styles.cancelReplyBtn}
              onClick={() => {
                setReplyingToId(null);
                setReplyText("");
              }}
            >
              ✕ Cancel
            </button>
          </div>
          <textarea
            className={styles.replyTextarea}
            placeholder={`Write a reply to ${authorName}...`}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={3}
            autoFocus
          />
          <div className={styles.replyFooter}>
            <button
              type="button"
              className={styles.sendReplyBtn}
              disabled={!replyText.trim() || submittingReply}
              onClick={() => onReplySubmit(parentCommentId || comment.id)}
            >
              {submittingReply ? "Posting..." : "Reply"}
            </button>
          </div>
        </div>
      )}

      {/* ── 1-Level Nested Replies (Indented to the Right with subtle thread line) ── */}
      {!isReply && comment.replies && comment.replies.length > 0 && (
        <div className={styles.repliesThread}>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              isReply={true}
              parentCommentId={comment.id}
              session={session}
              status={status}
              onDelete={onDelete}
              onReplySubmit={onReplySubmit}
              replyingToId={replyingToId}
              setReplyingToId={setReplyingToId}
              replyText={replyText}
              setReplyText={setReplyText}
              submittingReply={submittingReply}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main Comments Component ──
const Comments = ({ postSlug }) => {
  const { data: session, status } = useSession();

  const { data: comments, mutate, isLoading } = useSWR(
    `/api/comments?postSlug=${postSlug}`,
    fetcher
  );

  const [newCommentText, setNewCommentText] = useState("");
  const [submittingTop, setSubmittingTop] = useState(false);

  // Inline reply state
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  // Submit top-level comment
  const handleTopSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!newCommentText.trim() || submittingTop) return;

    setSubmittingTop(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          desc: newCommentText.trim(),
          postSlug,
        }),
      });

      if (res.ok) {
        setNewCommentText("");
        mutate();
      } else {
        const errData = await res.json();
        alert(errData.message || "Failed to post comment");
      }
    } catch (err) {
      console.error("Error posting comment:", err);
      alert("Something went wrong while posting your comment.");
    } finally {
      setSubmittingTop(false);
    }
  };

  // Submit reply
  const handleReplySubmit = async (parentId) => {
    if (!replyText.trim() || submittingReply) return;

    setSubmittingReply(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          desc: replyText.trim(),
          postSlug,
          parentId,
        }),
      });

      if (res.ok) {
        setReplyText("");
        setReplyingToId(null);
        mutate();
      } else {
        const errData = await res.json();
        alert(errData.message || "Failed to post reply");
      }
    } catch (err) {
      console.error("Error posting reply:", err);
      alert("Something went wrong while posting your reply.");
    } finally {
      setSubmittingReply(false);
    }
  };

  // Delete comment or reply
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
      if (res.ok) {
        mutate();
      } else {
        const errData = await res.json();
        alert(errData.message || "Failed to delete comment");
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

  // Calculate total comment count (top-level + all replies)
  const totalCount = comments
    ? comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)
    : 0;

  return (
    <div className={styles.container} id="comments">
      <div className={styles.header}>
        <h2 className={styles.title}>
          Discussion <span className={styles.totalBadge}>{totalCount}</span>
        </h2>
      </div>

      {/* Top Comment Composer */}
      {status === "authenticated" ? (
        <form className={styles.composerBox} onSubmit={handleTopSubmit}>
          <div className={styles.composerHeader}>
            <Image
              src={
                session?.user?.image ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  session?.user?.name || "User"
                )}&background=dc143c&color=fff&bold=true`
              }
              alt={session?.user?.name || "Your avatar"}
              width={36}
              height={36}
              className={styles.composerAvatar}
            />
            <span className={styles.composerName}>{session?.user?.name}</span>
          </div>

          <textarea
            placeholder="Write a thoughtful comment..."
            className={styles.composerInput}
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            rows={3}
          />

          <div className={styles.composerFooter}>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={!newCommentText.trim() || submittingTop}
            >
              {submittingTop ? "Posting..." : "Comment"}
            </button>
          </div>
        </form>
      ) : (
        <div className={styles.loginPrompt}>
          <p>Join the conversation</p>
          <Link href="/login" className={styles.loginPromptBtn}>
            Sign in to comment
          </Link>
        </div>
      )}

      {/* Comments List */}
      <div className={styles.commentList}>
        {isLoading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p>Loading comments...</p>
          </div>
        ) : comments && comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              isReply={false}
              session={session}
              status={status}
              onDelete={handleDelete}
              onReplySubmit={handleReplySubmit}
              replyingToId={replyingToId}
              setReplyingToId={setReplyingToId}
              replyText={replyText}
              setReplyText={setReplyText}
              submittingReply={submittingReply}
            />
          ))
        ) : (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>💬</span>
            <p className={styles.emptyTitle}>No comments yet</p>
            <p className={styles.emptySubtitle}>
              Be the first to share your thoughts on this story.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Comments;