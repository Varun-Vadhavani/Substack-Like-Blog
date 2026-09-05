"use client";

import React, { useState, useMemo, useEffect } from "react";
import styles from "./cardList.module.css";
import Card from "../card/Card";
import { rankEvergreenFeed, sortChronological } from "@/utils/feedAlgorithm";
import { useSession } from "next-auth/react";

const CardListClient = ({ initialPosts = [] }) => {
  const { data: session, status } = useSession();

  // Tabs: 'discover' (smart evergreen) | 'recent' (chronological) | 'following' (subscribed)
  const [activeTab, setActiveTab] = useState("discover");
  const [typeFilter, setTypeFilter] = useState("all"); // 'all' | 'articles' | 'notes'
  const [shuffledDiscoverPosts, setShuffledDiscoverPosts] = useState(() =>
    rankEvergreenFeed(initialPosts)
  );
  const [isShuffling, setIsShuffling] = useState(false);

  // Subscribed author emails
  const [subscribedEmails, setSubscribedEmails] = useState(new Set());

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/subscriptions/list")
        .then((res) => res.json())
        .then((data) => {
          if (data?.subscriptions) {
            const emails = new Set(
              data.subscriptions.map((s) => s.author?.email).filter(Boolean)
            );
            setSubscribedEmails(emails);
          }
        })
        .catch(() => {});
    }
  }, [status]);

  // Sync initialPosts if changed from server
  useEffect(() => {
    setShuffledDiscoverPosts(rankEvergreenFeed(initialPosts));
  }, [initialPosts]);

  // Manual Shuffle / Refresh action
  const handleShuffle = () => {
    setIsShuffling(true);
    // Smooth micro-delay for visual feedback
    setTimeout(() => {
      setShuffledDiscoverPosts(rankEvergreenFeed(initialPosts));
      setIsShuffling(false);
    }, 200);
  };

  // Filter posts based on tab and type
  const displayedPosts = useMemo(() => {
    let list = [];

    if (activeTab === "discover") {
      list = shuffledDiscoverPosts;
    } else if (activeTab === "recent") {
      list = sortChronological(initialPosts);
    } else if (activeTab === "following") {
      list = initialPosts.filter((p) =>
        subscribedEmails.has(p.userEmail || p.user?.email)
      );
    }

    // Filter by type (all, articles, notes)
    if (typeFilter === "articles") {
      list = list.filter((p) => p.type !== "note");
    } else if (typeFilter === "notes") {
      list = list.filter((p) => p.type === "note");
    }

    return list;
  }, [activeTab, typeFilter, shuffledDiscoverPosts, initialPosts, subscribedEmails]);

  return (
    <div className={styles.container}>
      {/* ── Substack Style Feed Header ── */}
      <div className={styles.feedHeader}>
        {/* Feed Mode Tabs */}
        <div className={styles.tabGroup}>
          <button
            type="button"
            className={`${styles.tabBtn} ${
              activeTab === "discover" ? styles.tabActive : ""
            }`}
            onClick={() => setActiveTab("discover")}
          >
            <span>Discover</span>
          </button>

          <button
            type="button"
            className={`${styles.tabBtn} ${
              activeTab === "recent" ? styles.tabActive : ""
            }`}
            onClick={() => setActiveTab("recent")}
          >
            <span>Recent</span>
          </button>

          {status === "authenticated" && (
            <button
              type="button"
              className={`${styles.tabBtn} ${
                activeTab === "following" ? styles.tabActive : ""
              }`}
              onClick={() => setActiveTab("following")}
            >
              <span>Following</span>
            </button>
          )}
        </div>

        {/* Action: Quick Refresh / Shuffle Button */}
        <button
          type="button"
          className={`${styles.shuffleBtn} ${isShuffling ? styles.shuffling : ""}`}
          onClick={handleShuffle}
          title="Shuffle / refresh feed"
          aria-label="Shuffle feed"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={styles.shuffleIcon}
          >
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          <span className={styles.shuffleText}>Refresh</span>
        </button>
      </div>

      {/* ── Type Filter Pills (All / Articles / Notes) ── */}
      <div className={styles.filterPillRow}>
        <button
          type="button"
          className={`${styles.filterPill} ${
            typeFilter === "all" ? styles.filterPillActive : ""
          }`}
          onClick={() => setTypeFilter("all")}
        >
          All
        </button>
        <button
          type="button"
          className={`${styles.filterPill} ${
            typeFilter === "articles" ? styles.filterPillActive : ""
          }`}
          onClick={() => setTypeFilter("articles")}
        >
          Articles
        </button>
        <button
          type="button"
          className={`${styles.filterPill} ${
            typeFilter === "notes" ? styles.filterPillActive : ""
          }`}
          onClick={() => setTypeFilter("notes")}
        >
          Notes
        </button>
      </div>

      {/* ── Feed Content Cards ── */}
      <div className={styles.posts}>
        {displayedPosts.length > 0 ? (
          displayedPosts.map((item) => <Card item={item} key={item.id} />)
        ) : (
          <div className={styles.emptyFeedBox}>
            {activeTab === "following" ? (
              <>
                <span className={styles.emptyIcon}>👤</span>
                <p className={styles.emptyTitle}>No posts from writers you follow</p>
                <p className={styles.emptyDesc}>
                  Subscribe to authors to see their latest stories and notes in this tab.
                </p>
                <button
                  type="button"
                  className={styles.emptyActionBtn}
                  onClick={() => setActiveTab("discover")}
                >
                  Explore Discover Feed
                </button>
              </>
            ) : (
              <>
                <span className={styles.emptyIcon}>✍️</span>
                <p className={styles.emptyTitle}>No posts found</p>
                <p className={styles.emptyDesc}>
                  {typeFilter !== "all"
                    ? `There are no ${typeFilter} published yet.`
                    : "Be the first to share a note or article with the community!"}
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CardListClient;
