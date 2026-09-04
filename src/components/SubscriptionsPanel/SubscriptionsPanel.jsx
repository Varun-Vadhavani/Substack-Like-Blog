"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import styles from "./SubscriptionsPanel.module.css";
import { useRouter } from "next/navigation";

const SubscriptionsPanel = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (status !== "authenticated") return;
    const fetchSubs = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/subscriptions/list");
        if (res.ok) {
          const data = await res.json();
          setSubs(data.subscriptions || []);
        }
      } catch (err) {
        console.error("Failed to load subscriptions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubs();
  }, [status]);

  const filtered = subs.filter((s) =>
    s.author?.name?.toLowerCase().includes(query.toLowerCase())
  );

  if (status === "unauthenticated") {
    return (
      <aside className={styles.panel}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search WriteSpace"
            onFocus={() => router.push("/blog")}
            readOnly
          />
        </div>
        <div className={styles.loginPrompt}>
          <p>Sign in to see your subscriptions</p>
          <Link href="/login" className={styles.signInBtn}>Sign in</Link>
        </div>
      </aside>
    );
  }

  return (
    <aside className={styles.panel}>
      {/* Search Bar */}
      <div className={styles.searchWrap}>
        <span className={styles.searchIcon}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search WriteSpace"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => !query && router.push("/blog")}
        />
      </div>

      {/* Subscriptions Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Subscriptions</h3>

        {loading ? (
          <div className={styles.loadingGrid}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.skeletonItem}>
                <div className={styles.skeletonAvatar} />
                <div className={styles.skeletonName} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className={styles.empty}>
            {query ? `No results for "${query}"` : "You haven't subscribed to anyone yet."}
          </p>
        ) : (
          <div className={styles.subsGrid}>
            {filtered.slice(0, 9).map((sub) => {
              const author = sub.author;
              const avatar =
                author?.image ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  author?.name || "A"
                )}&background=dc143c&color=fff&bold=true&size=96`;

              return (
                <Link
                  key={sub.id}
                  href={`/profile?user=${encodeURIComponent(author?.email || "")}`}
                  className={styles.subItem}
                  title={author?.name}
                >
                  <div className={styles.avatarWrap}>
                    <Image
                      src={avatar}
                      alt={author?.name || "Author"}
                      fill
                      className={styles.avatar}
                      sizes="64px"
                    />
                    <span className={styles.onlineDot} />
                  </div>
                  <span className={styles.subName}>
                    {author?.name
                      ? author.name.split(" ")[0] + (author.name.split(" ")[1]?.[0] ? " " + author.name.split(" ")[1][0] + "." : "")
                      : "Author"}
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {filtered.length > 9 && (
          <Link href="/profile#subscriptions" className={styles.seeAllBtn}>
            See all {filtered.length} subscriptions
          </Link>
        )}
      </div>
    </aside>
  );
};

export default SubscriptionsPanel;
