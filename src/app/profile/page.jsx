"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./profilePage.module.css";
import Card from "@/components/card/Card";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCreateNote } from "@/context/CreateNoteContext";

const ProfilePageContent = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openNoteModal } = useCreateNote();

  const userParam = searchParams.get("user") || searchParams.get("username");

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("activity"); // 'activity' | 'posts' | 'likes' | 'subscriptions'

  // Dropdown states
  const [createOpen, setCreateOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const createRef = useRef(null);
  const moreRef = useRef(null);

  // Edit profile modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editImage, setEditImage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editError, setEditError] = useState("");

  const fetchProfile = useCallback(async () => {
    try {
      const url = userParam
        ? `/api/users/profile?email=${encodeURIComponent(userParam)}`
        : `/api/users/profile`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
        setEditName(data.user?.name || "");
        setEditUsername(data.user?.username || "");
        setEditImage(data.user?.image || "");
      } else if (res.status === 401 && !userParam) {
        router.push("/login");
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  }, [userParam, router]);

  useEffect(() => {
    if (status !== "loading") {
      fetchProfile();
    }
  }, [status, userParam, fetchProfile]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (createRef.current && !createRef.current.contains(e.target)) {
        setCreateOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopyLink = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      alert("Profile link copied to clipboard!");
      setMoreOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${profileData?.user?.name}'s Profile on WriteSpace`,
        url: window.location.href,
      });
    } else {
      handleCopyLink();
    }
    setMoreOpen(false);
  };

  // Toggle subscribe on author's profile (when viewer is someone else)
  const handleToggleSubscribe = async () => {
    if (!session) {
      router.push("/login");
      return;
    }

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorEmail: profileData.user.email }),
      });
      if (res.ok) {
        const data = await res.json();
        setProfileData((prev) => ({
          ...prev,
          isSubscribed: data.isSubscribed,
          subscribersCount: data.subscribersCount,
        }));
      }
    } catch (err) {
      console.error("Failed to toggle subscribe:", err);
    }
  };

  // Unsubscribe from an author in the Subscriptions list tab
  const handleUnsubscribeAuthor = async (authorEmail) => {
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorEmail }),
      });
      if (res.ok) {
        setProfileData((prev) => ({
          ...prev,
          subscriptions: prev.subscriptions.filter((s) => s.email !== authorEmail),
          subscriptionsCount: Math.max(0, prev.subscriptionsCount - 1),
        }));
      }
    } catch (err) {
      console.error("Failed to unsubscribe:", err);
    }
  };

  // Handle Photo selection in Edit Profile Modal
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setEditImage(URL.createObjectURL(file));
    }
  };

  // Save changes in Edit Profile Modal
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setEditError("");

    let uploadedImageUrl = editImage;

    // Upload new image if selected
    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile);
      try {
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.url) {
          uploadedImageUrl = uploadData.url;
        }
      } catch (err) {
        console.error("Image upload failed:", err);
      }
    }

    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          username: editUsername,
          image: uploadedImageUrl,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setEditOpen(false);
        fetchProfile();
      } else {
        setEditError(data.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error("Save profile error:", err);
      setEditError("An error occurred while saving.");
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading profile...</div>
      </div>
    );
  }

  if (!profileData?.user) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyTabState}>
          <div className={styles.emptyIcon}>👤</div>
          <p className={styles.emptyText}>User profile not found.</p>
        </div>
      </div>
    );
  }

  const { user, posts, likedPosts, subscriptions, subscribersCount, subscriptionsCount, isOwner, isSubscribed } = profileData;

  const avatarSrc =
    user.image ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user.name || "User"
    )}&background=dc143c&color=fff&bold=true`;

  const articlesOnly = posts.filter((p) => p.type !== "note");

  return (
    <div className={styles.container}>
      {/* Top Centered Title */}
      <h1 className={styles.topTitle}>{user.name}</h1>

      {/* Profile Header: Info on Left, Large Avatar on Right */}
      <div className={styles.profileHeader}>
        <div className={styles.profileInfoLeft}>
          <h2 className={styles.displayName}>{user.name}</h2>
          <span className={styles.username}>@{user.username || "user"}</span>

          {/* Substack Publication Badge Pill */}
          <div className={styles.pubBadge}>
            <div className={styles.pubAvatar}>
              <Image src={avatarSrc} alt="" fill style={{ objectFit: "cover" }} />
            </div>
            <span className={styles.pubName}>{user.name}</span>
          </div>

          {/* Subscriber Count Link */}
          <span className={styles.subscribersLink}>
            {subscribersCount} {subscribersCount === 1 ? "subscriber" : "subscribers"}
          </span>
        </div>

        {/* Profile Avatar on Right */}
        <div className={styles.profileAvatarWrapper}>
          <Image
            src={avatarSrc}
            alt={user.name || "Profile"}
            fill
            className={styles.profileAvatar}
            priority
          />
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className={styles.actionRow}>
        {isOwner ? (
          <>
            {/* Create ▾ Button */}
            <div className={styles.createWrapper} ref={createRef}>
              <button
                type="button"
                className={styles.createBtn}
                onClick={() => setCreateOpen(!createOpen)}
              >
                <span>Create</span>
                <span>▾</span>
              </button>

              {createOpen && (
                <div className={styles.createDropdown}>
                  <button
                    type="button"
                    className={styles.dropdownItem}
                    onClick={() => {
                      setCreateOpen(false);
                      openNoteModal();
                    }}
                  >
                    <span>💬</span>
                    <span>New Note</span>
                  </button>

                  <button
                    type="button"
                    className={styles.dropdownItem}
                    onClick={() => {
                      setCreateOpen(false);
                      router.push("/write");
                    }}
                  >
                    <span>✍️</span>
                    <span>New Article</span>
                  </button>
                </div>
              )}
            </div>

            {/* Edit Profile Button */}
            <button
              type="button"
              className={styles.editProfileBtn}
              onClick={() => {
                setEditName(user.name || "");
                setEditUsername(user.username || "");
                setEditImage(user.image || "");
                setSelectedFile(null);
                setEditError("");
                setEditOpen(true);
              }}
            >
              Edit profile
            </button>
          </>
        ) : (
          /* Subscribe / Subscribed button for visitors */
          <button
            type="button"
            className={isSubscribed ? styles.editProfileBtn : styles.createBtn}
            onClick={handleToggleSubscribe}
          >
            {isSubscribed ? "Subscribed ✓" : "Subscribe"}
          </button>
        )}

        {/* ••• More Options */}
        <div className={styles.moreWrapper} ref={moreRef}>
          <button
            type="button"
            className={styles.moreBtn}
            onClick={() => setMoreOpen(!moreOpen)}
            title="More options"
          >
            •••
          </button>

          {moreOpen && (
            <div className={styles.moreDropdown}>
              <button
                type="button"
                className={styles.dropdownItem}
                onClick={handleCopyLink}
              >
                <span>🔗</span>
                <span>Copy link</span>
              </button>

              <button
                type="button"
                className={styles.dropdownItem}
                onClick={handleShare}
              >
                <span>📤</span>
                <span>Share</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Row: Activity, Posts, Likes, Subscriptions */}
      <div className={styles.tabsContainer}>
        <button
          type="button"
          className={`${styles.tabBtn} ${
            activeTab === "activity" ? styles.activeTabBtn : ""
          }`}
          onClick={() => setActiveTab("activity")}
        >
          Activity
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${
            activeTab === "posts" ? styles.activeTabBtn : ""
          }`}
          onClick={() => setActiveTab("posts")}
        >
          Posts
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${
            activeTab === "likes" ? styles.activeTabBtn : ""
          }`}
          onClick={() => setActiveTab("likes")}
        >
          Likes
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${
            activeTab === "subscriptions" ? styles.activeTabBtn : ""
          }`}
          onClick={() => setActiveTab("subscriptions")}
        >
          Subscriptions ({subscriptionsCount})
        </button>
      </div>

      {/* Tab Content Display */}
      {activeTab === "activity" && (
        <div>
          {posts.length > 0 ? (
            posts.map((post) => <Card key={post.id} item={post} />)
          ) : (
            <div className={styles.emptyTabState}>
              <div className={styles.emptyIcon}>📝</div>
              <p className={styles.emptyText}>No published activity yet.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "posts" && (
        <div>
          {articlesOnly.length > 0 ? (
            articlesOnly.map((post) => <Card key={post.id} item={post} />)
          ) : (
            <div className={styles.emptyTabState}>
              <div className={styles.emptyIcon}>📄</div>
              <p className={styles.emptyText}>No articles published yet.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "likes" && (
        <div>
          {likedPosts.length > 0 ? (
            likedPosts.map((post) => <Card key={post.id} item={post} />)
          ) : (
            <div className={styles.emptyTabState}>
              <div className={styles.emptyIcon}>❤️</div>
              <p className={styles.emptyText}>No liked posts yet.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "subscriptions" && (
        <div className={styles.subscriptionsList}>
          {subscriptions.length > 0 ? (
            subscriptions.map((author) => {
              const authorAvatar =
                author.image ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  author.name || "Author"
                )}&background=dc143c&color=fff&bold=true`;

              return (
                <div key={author.id} className={styles.subAuthorCard}>
                  <Link
                    href={`/profile?user=${encodeURIComponent(author.email)}`}
                    className={styles.subAuthorLeft}
                  >
                    <div className={styles.subAuthorAvatarWrapper}>
                      <Image src={authorAvatar} alt="" fill style={{ objectFit: "cover" }} />
                    </div>
                    <div>
                      <h4 className={styles.subAuthorName}>{author.name}</h4>
                      <span className={styles.subAuthorHandle}>
                        @{author.username || "author"}
                      </span>
                    </div>
                  </Link>

                  {isOwner && (
                    <button
                      type="button"
                      className={styles.unsubscribeBtn}
                      onClick={() => handleUnsubscribeAuthor(author.email)}
                    >
                      Subscribed
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div className={styles.emptyTabState}>
              <div className={styles.emptyIcon}>🔔</div>
              <p className={styles.emptyText}>
                {isOwner
                  ? "You haven't subscribed to any authors yet."
                  : "This user hasn't subscribed to any authors yet."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Edit Profile Modal ── */}
      {editOpen && (
        <div className={styles.modalOverlay} onClick={() => setEditOpen(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Edit Profile</h3>
              <button
                type="button"
                className={styles.closeModalBtn}
                onClick={() => setEditOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile}>
              {/* Avatar Upload */}
              <div className={styles.editAvatarSection}>
                <div className={styles.editAvatarWrapper}>
                  <Image
                    src={editImage || avatarSrc}
                    alt=""
                    fill
                    style={{ objectFit: "cover" }}
                  />
                </div>
                <div>
                  <label htmlFor="profile-photo-upload" className={styles.changePhotoBtn}>
                    Change photo
                  </label>
                  <input
                    id="profile-photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    style={{ display: "none" }}
                  />
                </div>
              </div>

              {/* Name Input */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Name</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              {/* Unique Handle / Username Input */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Handle (Unique)</label>
                <div className={styles.inputPrefixWrap}>
                  <span className={styles.inputPrefix}>@</span>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={editUsername}
                    onChange={(e) =>
                      setEditUsername(
                        e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")
                      )
                    }
                    placeholder="yourusername"
                    required
                  />
                </div>
              </div>

              {editError && <p className={styles.formError}>{editError}</p>}

              {/* Modal Footer */}
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelModalBtn}
                  onClick={() => setEditOpen(false)}
                  disabled={savingProfile}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.saveModalBtn}
                  disabled={savingProfile}
                >
                  {savingProfile ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const ProfilePage = () => {
  return (
    <Suspense fallback={<div className={styles.loadingState}><div className={styles.spinner} /><p>Loading profile...</p></div>}>
      <ProfilePageContent />
    </Suspense>
  );
};

export default ProfilePage;
