"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./createNote.module.css";
import { useCreateNote } from "@/context/CreateNoteContext";
import { timeAgo } from "@/utils/timeAgo";

const NoteModal = () => {
  const { isNoteModalOpen, closeNoteModal } = useCreateNote();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [noteText, setNoteText] = useState("");
  const [images, setImages] = useState([]);
  const [currentDraftSlug, setCurrentDraftSlug] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  // Drafts drawer / view
  const [showDrafts, setShowDrafts] = useState(false);
  const [draftsList, setDraftsList] = useState([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);

  const modalRef = useRef(null);

  const userName = session?.user?.name || "User";
  const userImage =
    session?.user?.image ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      userName
    )}&background=dc143c&color=fff&bold=true`;

  const fetchDrafts = useCallback(async () => {
    if (!session) return;
    setLoadingDrafts(true);
    try {
      const res = await fetch("/api/drafts?type=note");
      if (res.ok) {
        const data = await res.json();
        setDraftsList(data.drafts || []);
      }
    } catch (err) {
      console.error("Failed to load note drafts:", err);
    } finally {
      setLoadingDrafts(false);
    }
  }, [session]);

  useEffect(() => {
    if (isNoteModalOpen && session) {
      fetchDrafts();
    }
  }, [isNoteModalOpen, session, fetchDrafts]);

  const handleClose = useCallback(() => {
    closeNoteModal();
    setNoteText("");
    setImages([]);
    setCurrentDraftSlug(null);
    setShowDrafts(false);
    setError("");
    setFeedback("");
  }, [closeNoteModal]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isNoteModalOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isNoteModalOpen, handleClose]);

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = 4 - images.length;
    if (remainingSlots <= 0) {
      alert("You can attach up to 4 photos per note.");
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    setUploading(true);

    try {
      const uploadedUrls = await Promise.all(
        filesToUpload.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          return data.url;
        })
      );

      const validUrls = uploadedUrls.filter(Boolean);
      setImages((prev) => [...prev, ...validUrls].slice(0, 4));
    } catch (err) {
      console.error("Multi-image upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Save Note as Draft
  const handleSaveDraft = async () => {
    if (!noteText.trim() && images.length === 0) return;

    setSavingDraft(true);
    setError("");
    setFeedback("");

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          desc: noteText.trim(),
          img: images[0] || null,
          images: images,
          type: "note",
          status: "draft",
          slug: currentDraftSlug || undefined,
        }),
      });

      if (res.ok) {
        const savedData = await res.json();
        setCurrentDraftSlug(savedData.slug);
        setFeedback("Draft saved!");
        fetchDrafts();
        setTimeout(() => setFeedback(""), 2500);
      } else {
        const data = await res.json();
        setError(data.message || "Failed to save draft.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to save draft.");
    } finally {
      setSavingDraft(false);
    }
  };

  // Resume Draft from Drawer
  const handleSelectDraft = (draft) => {
    setNoteText(draft.desc || "");
    const draftImages =
      draft.images && draft.images.length > 0
        ? draft.images
        : draft.img
        ? [draft.img]
        : [];
    setImages(draftImages);
    setCurrentDraftSlug(draft.slug);
    setShowDrafts(false);
  };

  // Delete Draft from Drawer
  const handleDeleteDraft = async (e, draftSlug) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/drafts?slug=${draftSlug}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDraftsList((prev) => prev.filter((d) => d.slug !== draftSlug));
        if (currentDraftSlug === draftSlug) {
          setCurrentDraftSlug(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete draft:", err);
    }
  };

  // Publish Note
  const handlePost = async () => {
    if (!noteText.trim() && images.length === 0) return;

    if (!session) {
      router.push("/login");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          desc: noteText.trim(),
          img: images[0] || null,
          images: images,
          type: "note",
          status: "published",
          slug: currentDraftSlug || undefined,
        }),
      });

      if (res.ok) {
        handleClose();
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.message || "Something went wrong.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to post note. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isNoteModalOpen) return null;

  return (
    <div
      className={styles.modalOverlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className={styles.modalContainer} ref={modalRef}>
        {/* Modal Top Header */}
        <div className={styles.modalHeader}>
          <div className={styles.userProfile}>
            <div className={styles.modalAvatarWrapper}>
              <Image
                src={userImage}
                alt={userName}
                fill
                className={styles.modalAvatar}
              />
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{userName}</span>
              <span className={styles.userSubtitle}>Posting to your feed</span>
            </div>
          </div>

          <div className={styles.headerActions}>
            {draftsList.length > 0 && (
              <button
                type="button"
                className={`${styles.draftsBtn} ${
                  showDrafts ? styles.draftsBtnActive : ""
                }`}
                onClick={() => setShowDrafts(!showDrafts)}
                title="View your saved note drafts"
              >
                Drafts ({draftsList.length})
              </button>
            )}

            <button
              type="button"
              className={styles.closeBtn}
              onClick={handleClose}
              aria-label="Close composer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Drafts Drawer inside Modal */}
        {showDrafts ? (
          <div className={styles.draftsContainer}>
            <div className={styles.draftsHeader}>
              <h4>Your Note Drafts</h4>
              <button
                type="button"
                className={styles.backBtn}
                onClick={() => setShowDrafts(false)}
              >
                ← Back to Composer
              </button>
            </div>

            <div className={styles.draftsList}>
              {loadingDrafts ? (
                <p className={styles.loadingDrafts}>Loading drafts...</p>
              ) : draftsList.length > 0 ? (
                draftsList.map((draft) => (
                  <div
                    key={draft.id}
                    className={`${styles.draftItem} ${
                      currentDraftSlug === draft.slug ? styles.activeDraftItem : ""
                    }`}
                    onClick={() => handleSelectDraft(draft)}
                  >
                    <div className={styles.draftTextContent}>
                      <p className={styles.draftPreviewText}>
                        {draft.desc || "Empty draft note"}
                      </p>
                      <span className={styles.draftTime}>
                        {draft.createdAt ? timeAgo(draft.createdAt) : ""}
                      </span>
                    </div>

                    {(draft.images?.[0] || draft.img) && (
                      <div className={styles.draftThumb}>
                        <Image
                          src={draft.images?.[0] || draft.img}
                          alt=""
                          fill
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                    )}

                    <button
                      type="button"
                      className={styles.deleteDraftBtn}
                      onClick={(e) => handleDeleteDraft(e, draft.slug)}
                      title="Discard draft"
                    >
                      🗑️
                    </button>
                  </div>
                ))
              ) : (
                <p className={styles.emptyDrafts}>No note drafts found.</p>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Note Textarea Input */}
            <textarea
              className={styles.modalTextarea}
              placeholder="What's on your mind? Share a thought, quote, or note..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              autoFocus
            />

            {/* Multi-Photo Preview Collage Grid in Modal */}
            {images.length > 0 && (
              <div
                className={styles.multiImageGrid}
                data-count={Math.min(images.length, 4)}
              >
                {images.map((imgUrl, index) => (
                  <div key={index} className={styles.imagePreviewItem}>
                    <Image
                      src={imgUrl}
                      alt={`Attached photo ${index + 1}`}
                      fill
                      className={styles.previewImage}
                    />
                    <button
                      type="button"
                      className={styles.removeImageBtn}
                      onClick={() => handleRemoveImage(index)}
                      title="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {uploading && (
              <div className={styles.uploadingIndicator}>
                Uploading photo{images.length > 1 ? "s" : ""}...
              </div>
            )}

            {feedback && <div className={styles.feedbackMsg}>{feedback}</div>}
            {error && <div className={styles.errorMsg}>{error}</div>}

            {/* Modal Bottom Footer Actions */}
            <div className={styles.modalFooter}>
              <div className={styles.mediaActions}>
                {images.length < 4 && (
                  <>
                    <input
                      type="file"
                      id="modal-note-photos"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: "none" }}
                    />
                    <label htmlFor="modal-note-photos" className={styles.photoButton}>
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <span>
                        {images.length === 0
                          ? "Photos"
                          : `Add more (${images.length}/4)`}
                      </span>
                    </label>
                  </>
                )}
              </div>

              <div className={styles.footerRightActions}>
                <button
                  type="button"
                  className={styles.saveDraftBtn}
                  onClick={handleSaveDraft}
                  disabled={
                    savingDraft ||
                    submitting ||
                    uploading ||
                    (!noteText.trim() && images.length === 0)
                  }
                >
                  {savingDraft ? "Saving..." : "Save Draft"}
                </button>

                <button
                  type="button"
                  className={styles.postButton}
                  onClick={handlePost}
                  disabled={
                    submitting ||
                    uploading ||
                    (!noteText.trim() && images.length === 0)
                  }
                >
                  {submitting ? "Posting..." : "Post Note"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NoteModal;
