"use client";

import React, { useState, useEffect } from "react";
import styles from "./blogPage.module.css";
import Image from "next/image";
import Link from "next/link";
import Card from "@/components/card/Card";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// ─── Author Search Result Card ───
const AuthorSearchCard = ({ author, onToggleSubscribe }) => {
  const avatarSrc =
    author.image ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      author.name || "Author"
    )}&background=dc143c&color=fff&bold=true`;

  return (
    <div className={styles.authorCard}>
      <Link
        href={`/profile?user=${encodeURIComponent(author.email)}`}
        className={styles.authorLink}
      >
        <div className={styles.authorAvatarWrapper}>
          <Image src={avatarSrc} alt={author.name} fill style={{ objectFit: "cover" }} />
        </div>
        <div className={styles.authorMeta}>
          <span className={styles.authorName}>{author.name}</span>
          <span className={styles.authorHandle}>@{author.username || "author"}</span>
          <span className={styles.subCount}>
            {author.subscribersCount}{" "}
            {author.subscribersCount === 1 ? "subscriber" : "subscribers"}
          </span>
        </div>
      </Link>

      {!author.isOwner && (
        <button
          type="button"
          className={author.isSubscribed ? styles.subscribedBtn : styles.subBtn}
          onClick={() => onToggleSubscribe(author.email)}
        >
          {author.isSubscribed ? "Subscribed ✓" : "Subscribe"}
        </button>
      )}
    </div>
  );
};

const ExploreClient = ({ initialCategories, initialPosts, catParam }) => {
  const { data: session } = useSession();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'articles' | 'notes' | 'authors'
  const [results, setResults] = useState({
    articles: [],
    notes: [],
    authors: [],
    totalCount: 0,
  });
  const [searching, setSearching] = useState(false);

  // Debounced search
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults({ articles: [], notes: [], authors: [], totalCount: 0 });
      setSearching(false);
      return;
    }

    setSearching(true);
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setSearching(false);
      }
    }, 280);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Toggle subscribe on author card in search results
  const handleToggleSubscribe = async (authorEmail) => {
    if (!session) {
      router.push("/login");
      return;
    }

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorEmail }),
      });
      if (res.ok) {
        const data = await res.json();
        setResults((prev) => ({
          ...prev,
          authors: prev.authors.map((a) =>
            a.email === authorEmail
              ? {
                  ...a,
                  isSubscribed: data.isSubscribed,
                  subscribersCount: data.subscribersCount,
                }
              : a
          ),
        }));
      }
    } catch (err) {
      console.error("Subscribe toggle error:", err);
    }
  };

  const hasSearch = query.trim().length > 0;
  const { articles, notes, authors, totalCount } = results;

  return (
    <div className={styles.container}>
      {/* Header & Search Bar */}
      <div className={styles.header}>
        <h1 className={styles.title}>
          {hasSearch
            ? `Search results for "${query.trim()}"`
            : catParam
            ? `${catParam} Articles`
            : "Explore & Search"}
        </h1>

        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>

          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search stories, notes, or writers..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus={hasSearch}
          />

          {hasSearch && (
            <button
              type="button"
              className={styles.clearSearchBtn}
              onClick={() => setQuery("")}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* When Search is Active */}
      {hasSearch ? (
        <>
          {/* Search Tabs: All, Articles, Notes, Authors */}
          <div className={styles.searchTabs}>
            <button
              type="button"
              className={`${styles.tabBtn} ${
                activeTab === "all" ? styles.activeTabBtn : ""
              }`}
              onClick={() => setActiveTab("all")}
            >
              All ({totalCount})
            </button>

            <button
              type="button"
              className={`${styles.tabBtn} ${
                activeTab === "articles" ? styles.activeTabBtn : ""
              }`}
              onClick={() => setActiveTab("articles")}
            >
              Articles ({articles.length})
            </button>

            <button
              type="button"
              className={`${styles.tabBtn} ${
                activeTab === "notes" ? styles.activeTabBtn : ""
              }`}
              onClick={() => setActiveTab("notes")}
            >
              Notes ({notes.length})
            </button>

            <button
              type="button"
              className={`${styles.tabBtn} ${
                activeTab === "authors" ? styles.activeTabBtn : ""
              }`}
              onClick={() => setActiveTab("authors")}
            >
              Authors ({authors.length})
            </button>
          </div>

          {searching ? (
            <div className={styles.loading}>Searching...</div>
          ) : totalCount === 0 ? (
            <div className={styles.emptySearch}>
              <div className={styles.emptyIcon}>🔍</div>
              <h3 className={styles.emptyTitle}>No results found</h3>
              <p className={styles.emptyDesc}>
                We couldn&apos;t find any stories, notes, or writers matching &quot;{query}&quot;.
                Try a different search keyword.
              </p>
            </div>
          ) : (
            <div>
              {/* TAB 1: ALL RESULTS */}
              {activeTab === "all" && (
                <div>
                  {/* Matching Authors preview if any */}
                  {authors.length > 0 && (
                    <div>
                      <div className={styles.sectionHeader}>
                        <h3 className={styles.sectionTitle}>Authors ({authors.length})</h3>
                      </div>
                      <div className={styles.authorsList}>
                        {authors.slice(0, 3).map((author) => (
                          <AuthorSearchCard
                            key={author.id}
                            author={author}
                            onToggleSubscribe={handleToggleSubscribe}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matching Articles */}
                  {articles.length > 0 && (
                    <div>
                      <div className={styles.sectionHeader}>
                        <h3 className={styles.sectionTitle}>Articles ({articles.length})</h3>
                      </div>
                      <div>
                        {articles.map((post) => (
                          <Card key={post.id} item={post} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matching Notes */}
                  {notes.length > 0 && (
                    <div>
                      <div className={styles.sectionHeader}>
                        <h3 className={styles.sectionTitle}>Notes ({notes.length})</h3>
                      </div>
                      <div>
                        {notes.map((note) => (
                          <Card key={note.id} item={note} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: ARTICLES ONLY */}
              {activeTab === "articles" && (
                <div>
                  {articles.length > 0 ? (
                    articles.map((post) => <Card key={post.id} item={post} />)
                  ) : (
                    <div className={styles.emptySearch}>
                      <p className={styles.emptyDesc}>No articles matched &quot;{query}&quot;.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: NOTES ONLY */}
              {activeTab === "notes" && (
                <div>
                  {notes.length > 0 ? (
                    notes.map((note) => <Card key={note.id} item={note} />)
                  ) : (
                    <div className={styles.emptySearch}>
                      <p className={styles.emptyDesc}>No notes matched &quot;{query}&quot;.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: AUTHORS ONLY */}
              {activeTab === "authors" && (
                <div className={styles.authorsList}>
                  {authors.length > 0 ? (
                    authors.map((author) => (
                      <AuthorSearchCard
                        key={author.id}
                        author={author}
                        onToggleSubscribe={handleToggleSubscribe}
                      />
                    ))
                  ) : (
                    <div className={styles.emptySearch}>
                      <p className={styles.emptyDesc}>No authors matched &quot;{query}&quot;.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* When No Search Input is Typed: Show Categories & Explore Feed */
        <div>
          {/* Categories Pill Bar */}
          {initialCategories && initialCategories.length > 0 && (
            <div style={{ marginBottom: "28px" }}>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <Link
                  href="/blog"
                  style={{
                    padding: "8px 18px",
                    borderRadius: "20px",
                    backgroundColor: !catParam ? "#ff5722" : "var(--softBg)",
                    color: !catParam ? "white" : "var(--textColor)",
                    fontSize: "14px",
                    fontWeight: "600",
                    textDecoration: "none",
                    border: "1px solid rgba(128,128,128,0.15)",
                  }}
                >
                  All Topics
                </Link>
                {initialCategories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/blog?cat=${c.slug}`}
                    style={{
                      padding: "8px 18px",
                      borderRadius: "20px",
                      backgroundColor:
                        catParam === c.slug ? "#ff5722" : "var(--softBg)",
                      color: catParam === c.slug ? "white" : "var(--textColor)",
                      fontSize: "14px",
                      fontWeight: "600",
                      textDecoration: "none",
                      border: "1px solid rgba(128,128,128,0.15)",
                      textTransform: "capitalize",
                    }}
                  >
                    {c.title}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Initial Posts List */}
          <div>
            {initialPosts && initialPosts.length > 0 ? (
              initialPosts.map((post) => <Card key={post.id} item={post} />)
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 0",
                  color: "var(--softTextColor)",
                }}
              >
                No posts found for this topic.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExploreClient;
