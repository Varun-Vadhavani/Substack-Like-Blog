"use client";

import React, { useState, useEffect } from "react";
import styles from "./draftsPage.module.css";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { timeAgo } from "@/utils/timeAgo";
import { useCreateNote } from "@/context/CreateNoteContext";

const stripHtml = (html) => {
  if (!html) return "";
  const clean = html
    .replace(/<[^>]*>?/gm, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
  return clean.substring(0, 160) + (clean.length > 160 ? "..." : "");
};

const DraftsPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { openNoteModal } = useCreateNote();

  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'articles' | 'notes'

  const fetchDrafts = async () => {
    try {
      const res = await fetch("/api/drafts");
      if (res.ok) {
        const data = await res.json();
        setDrafts(data.drafts || []);
      }
    } catch (err) {
      console.error("Failed to load drafts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetchDrafts();
    }
  }, [status, router]);

  const handleDelete = async (e, slug) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/drafts?slug=${slug}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDrafts((prev) => prev.filter((d) => d.slug !== slug));
      }
    } catch (err) {
      console.error("Failed to delete draft:", err);
    }
  };

  const handleEditNote = (draft) => {
    openNoteModal();
  };

  const filteredDrafts = drafts.filter((draft) => {
    if (activeTab === "articles") return draft.type !== "note";
    if (activeTab === "notes") return draft.type === "note";
    return true;
  });

  if (status === "loading" || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Your Drafts</h1>
          </div>
        </div>
        <div className={styles.loading}>Loading your drafts...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.titleIcon}>
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </span>
          <h1 className={styles.title}>Your Drafts</h1>
        </div>
        <p className={styles.subtitle}>
          Private drafts only visible to you. Resume writing or discard whenever ready.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === "all" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All ({drafts.length})
        </button>
        <button
          type="button"
          className={`${styles.tab} ${
            activeTab === "articles" ? styles.tabActive : ""
          }`}
          onClick={() => setActiveTab("articles")}
        >
          Articles ({drafts.filter((d) => d.type !== "note").length})
        </button>
        <button
          type="button"
          className={`${styles.tab} ${
            activeTab === "notes" ? styles.tabActive : ""
          }`}
          onClick={() => setActiveTab("notes")}
        >
          Notes ({drafts.filter((d) => d.type === "note").length})
        </button>
      </div>

      {/* Drafts List */}
      {filteredDrafts.length > 0 ? (
        <div className={styles.list}>
          {filteredDrafts.map((draft) => {
            const isNote = draft.type === "note";

            return (
              <div key={draft.id} className={styles.draftCard}>
                <div className={styles.draftInfo}>
                  <div className={styles.draftBadgeRow}>
                    <span className={styles.typeBadge}>
                      {isNote ? "Note" : "Article"}
                    </span>
                    <span className={styles.draftDate}>
                      {draft.createdAt ? timeAgo(draft.createdAt) : ""}
                    </span>
                  </div>

                  {!isNote && (
                    <h3 className={styles.draftTitle}>
                      {draft.title || "Untitled Draft"}
                    </h3>
                  )}

                  <p className={styles.draftSnippet}>
                    {stripHtml(draft.desc) || (isNote ? "Empty note draft" : "No content written yet...")}
                  </p>

                  <div className={styles.draftActions}>
                    {isNote ? (
                      <button
                        type="button"
                        className={styles.editBtn}
                        onClick={() => handleEditNote(draft)}
                      >
                        Resume Note
                      </button>
                    ) : (
                      <Link
                        href={`/write?draft=${draft.slug}`}
                        className={styles.editBtn}
                      >
                        Edit Story
                      </Link>
                    )}

                    <button
                      type="button"
                      className={styles.deleteBtn}
                      onClick={(e) => handleDelete(e, draft.slug)}
                      title="Discard draft"
                    >
                      🗑️ Discard
                    </button>
                  </div>
                </div>

                {draft.img && (
                  <div className={styles.draftThumbnail}>
                    <Image src={draft.img} alt="" fill style={{ objectFit: "cover" }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📝</div>
          <h3 className={styles.emptyTitle}>No drafts saved</h3>
          <p className={styles.emptyDesc}>
            {activeTab === "all"
              ? "You don't have any drafts right now. Click '+ New Post' to start writing a thought or story."
              : activeTab === "articles"
              ? "No article drafts found. Start writing a long-form article on the write page."
              : "No note drafts found. Save quick notes anytime from the note composer."}
          </p>
          <Link href="/write" className={styles.createBtn}>
            + Start Writing
          </Link>
        </div>
      )}
    </div>
  );
};

export default DraftsPage;
