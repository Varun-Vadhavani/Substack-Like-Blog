"use client";

import React, { useState, useEffect } from "react";
import styles from "./savedPage.module.css";
import Card from "@/components/card/Card";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const SavedPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'articles' | 'notes'

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      const fetchSavedPosts = async () => {
        try {
          const res = await fetch("/api/saved");
          if (res.ok) {
            const data = await res.json();
            setSavedPosts(data.posts || []);
          }
        } catch (err) {
          console.error("Failed to load saved posts:", err);
        } finally {
          setLoading(false);
        }
      };

      fetchSavedPosts();
    }
  }, [status, router]);

  const handleRemoveSaved = (slug) => {
    setSavedPosts((prev) => prev.filter((p) => p.slug !== slug));
  };

  const filteredPosts = savedPosts.filter((post) => {
    if (activeTab === "articles") return post.type !== "note";
    if (activeTab === "notes") return post.type === "note";
    return true;
  });

  if (status === "loading" || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Saved</h1>
          </div>
        </div>
        <div className={styles.loading}>Loading your saved posts...</div>
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
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
          </span>
          <h1 className={styles.title}>Saved</h1>
        </div>
        <p className={styles.subtitle}>
          All your bookmarked notes and articles in one place
        </p>
      </div>

      {/* Filter Tabs */}
      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === "all" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All ({savedPosts.length})
        </button>
        <button
          type="button"
          className={`${styles.tab} ${
            activeTab === "articles" ? styles.tabActive : ""
          }`}
          onClick={() => setActiveTab("articles")}
        >
          Articles (
          {savedPosts.filter((p) => p.type !== "note").length}
          )
        </button>
        <button
          type="button"
          className={`${styles.tab} ${
            activeTab === "notes" ? styles.tabActive : ""
          }`}
          onClick={() => setActiveTab("notes")}
        >
          Notes (
          {savedPosts.filter((p) => p.type === "note").length}
          )
        </button>
      </div>

      {/* Saved Posts List */}
      {filteredPosts.length > 0 ? (
        <div className={styles.list}>
          {filteredPosts.map((post) => (
            <Card
              key={post.id}
              item={post}
              onRemoveFromSaved={handleRemoveSaved}
            />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🔖</div>
          <h3 className={styles.emptyTitle}>No saved items</h3>
          <p className={styles.emptyDesc}>
            {activeTab === "all"
              ? "You haven't saved any notes or articles yet. Click the bookmark icon on any post to save it for later."
              : activeTab === "articles"
              ? "No saved articles found. Save long-form stories to read them whenever you want."
              : "No saved notes found. Save quick notes to reference them later."}
          </p>
          <Link href="/" className={styles.exploreBtn}>
            Discover Feed
          </Link>
        </div>
      )}
    </div>
  );
};

export default SavedPage;
