"use client";

import Image from "next/image";
import styles from "./writePage.module.css";
import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { timeAgo } from "@/utils/timeAgo";
import { isVideoUrl } from "@/utils/media";

// Import wrapper component dynamically — fixes Next.js ChunkLoadError with react-quill-new
const QuillEditor = dynamic(
  () => import("@/components/quillEditor/QuillEditor"),
  {
    ssr: false,
    loading: () => (
      <div style={{ minHeight: "300px", padding: "16px", color: "var(--softTextColor)", fontSize: "15px" }}>
        Loading editor...
      </div>
    ),
  }
);

const WritePageContent = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftParam = searchParams.get("draft");

  const [open, setOpen] = useState(false);
  const [media, setMedia] = useState(""); // Top Hero Cover Image
  const [value, setValue] = useState("");
  const [title, setTitle] = useState("");
  const [catSlug, setCatSlug] = useState("philosophy");
  const [currentDraftSlug, setCurrentDraftSlug] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  // Drafts drawer
  const [showDraftsDrawer, setShowDraftsDrawer] = useState(false);
  const [draftsList, setDraftsList] = useState([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);

  // Video embed modal
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoInput, setVideoInput] = useState("");
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
  const [videoType, setVideoType] = useState(""); // "youtube" | "vimeo" | "unknown"

  const quillRef = useRef(null);

  const fetchDrafts = useCallback(async () => {
    if (!session) return;
    setLoadingDrafts(true);
    try {
      const res = await fetch("/api/drafts?type=article");
      if (res.ok) {
        const data = await res.json();
        setDraftsList(data.drafts || []);
      }
    } catch (err) {
      console.error("Failed to load article drafts:", err);
    } finally {
      setLoadingDrafts(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchDrafts();
    }
  }, [session, fetchDrafts]);

  // If ?draft=slug is passed in URL query param, auto-load that draft
  useEffect(() => {
    if (draftParam && session) {
      const loadDraftBySlug = async () => {
        try {
          const res = await fetch("/api/drafts?type=article");
          if (res.ok) {
            const data = await res.json();
            const matchingDraft = data.drafts?.find((d) => d.slug === draftParam);
            if (matchingDraft) {
              setTitle(matchingDraft.title || "");
              setValue(matchingDraft.desc || "");
              setMedia(matchingDraft.img || "");
              setCatSlug(matchingDraft.catSlug || "philosophy");
              setCurrentDraftSlug(matchingDraft.slug);
              setFeedback("Draft loaded");
              setTimeout(() => setFeedback(""), 2500);
            }
          }
        } catch (err) {
          console.error("Failed to auto-load draft:", err);
        }
      };
      loadDraftBySlug();
    }
  }, [draftParam, session]);

  if (status === "loading") {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const slugify = (str) =>
    str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

  // Upload Cover Media (Image or Video)
  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setMedia(data.url);
        setFeedback(file.type.startsWith("video/") ? "Cover video attached" : "Cover photo attached");
        setTimeout(() => setFeedback(""), 2500);
      }
    } catch (err) {
      console.error("Cover upload error:", err);
    } finally {
      setUploading(false);
      setOpen(false);
    }
  };

  // Upload Inline Image at cursor position
  const handleInlineImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        // Insert image HTML directly into editor value
        setValue(
          (prev) =>
            prev +
            `<p><br></p><p><img src="${data.url}" alt="Article image" style="max-width:100%; border-radius:12px; margin: 16px 0;" /></p><p><br></p>`
        );
        setFeedback("Image inserted inline");
        setTimeout(() => setFeedback(""), 2000);
      }
    } catch (err) {
      console.error("Inline image upload error:", err);
    } finally {
      setUploading(false);
      setOpen(false);
    }
  };

  // Parse a YouTube or Vimeo URL into an embeddable iframe src
  const parseVideoUrl = (url) => {
    if (!url) return { embedUrl: "", type: "" };

    // YouTube: youtube.com/watch?v=ID or youtu.be/ID or youtube.com/shorts/ID
    const ytMatch =
      url.match(/youtube\.com\/watch\?v=([\w-]+)/) ||
      url.match(/youtu\.be\/([\w-]+)/) ||
      url.match(/youtube\.com\/shorts\/([\w-]+)/);
    if (ytMatch) {
      return {
        embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`,
        type: "youtube",
      };
    }

    // Vimeo: vimeo.com/ID
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return {
        embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
        type: "vimeo",
      };
    }

    // Direct video file URL (mp4 etc)
    if (url.match(/\.(mp4|webm|ogg)(\?|$)/i)) {
      return { embedUrl: url, type: "direct" };
    }

    return { embedUrl: url, type: "unknown" };
  };

  const handleVideoInputChange = (e) => {
    const url = e.target.value;
    setVideoInput(url);
    const { embedUrl, type } = parseVideoUrl(url.trim());
    setVideoPreviewUrl(embedUrl);
    setVideoType(type);
  };

  const handleEmbedVideo = () => {
    if (!videoPreviewUrl) return;

    let iframeHtml = "";
    if (videoType === "direct") {
      iframeHtml = `<p><br></p><div style="margin: 20px 0; border-radius:12px; overflow:hidden;"><video controls style="width:100%; border-radius:12px;" src="${videoPreviewUrl}"></video></div><p><br></p>`;
    } else {
      iframeHtml = `<p><br></p><div style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden; margin: 20px 0; border-radius:12px;"><iframe src="${videoPreviewUrl}" style="position:absolute; top:0; left:0; width:100%; height:100%; border:none; border-radius:12px;" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe></div><p><br></p>`;
    }

    setValue((prev) => prev + iframeHtml);
    setFeedback("Video embedded ✓");
    setTimeout(() => setFeedback(""), 2000);

    // Reset & close modal
    setShowVideoModal(false);
    setVideoInput("");
    setVideoPreviewUrl("");
    setVideoType("");
    setOpen(false);
  };

  // Save Article as Draft
  const handleSaveDraft = async () => {
    if (!title.trim() && !value.trim()) return;

    setSavingDraft(true);
    setError("");
    setFeedback("");

    try {
      const draftSlug =
        currentDraftSlug ||
        slugify(title || "draft") + `-${Math.random().toString(36).substring(2, 6)}`;

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "Untitled Draft",
          desc: value,
          img: media || null,
          slug: draftSlug,
          catSlug: catSlug || "philosophy",
          type: "article",
          status: "draft",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentDraftSlug(data.slug);
        setFeedback("Draft saved!");
        fetchDrafts();
        setTimeout(() => setFeedback(""), 3000);
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

  // Publish Article
  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Please add a title for your story.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const finalSlug =
        currentDraftSlug ||
        slugify(title) + `-${Math.random().toString(36).substring(2, 6)}`;

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          desc: value,
          img: media || null,
          slug: finalSlug,
          catSlug: catSlug || "philosophy",
          type: "article",
          status: "published",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/posts/${data.slug}`);
      } else {
        const data = await res.json();
        setError(data.message || "Failed to publish article.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to publish article.");
    } finally {
      setSubmitting(false);
    }
  };

  // Select a draft to resume editing
  const handleSelectDraft = (draft) => {
    setTitle(draft.title || "");
    setValue(draft.desc || "");
    setMedia(draft.img || "");
    setCatSlug(draft.catSlug || "philosophy");
    setCurrentDraftSlug(draft.slug);
    setShowDraftsDrawer(false);
    setError("");
    setFeedback("Draft loaded");
    setTimeout(() => setFeedback(""), 2500);
  };

  // Start fresh draft
  const handleNewDraft = () => {
    setTitle("");
    setValue("");
    setMedia("");
    setCatSlug("philosophy");
    setCurrentDraftSlug(null);
    setShowDraftsDrawer(false);
    setFeedback("New blank draft started");
    setTimeout(() => setFeedback(""), 2000);
  };

  // Delete an article draft
  const handleDeleteDraft = async (e, draftSlug) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/drafts?slug=${draftSlug}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (currentDraftSlug === draftSlug) {
          setCurrentDraftSlug(null);
        }
        fetchDrafts();
      }
    } catch (err) {
      console.error("Failed to delete draft:", err);
    }
  };

  return (
    <div className={styles.container}>
      {/* Top Controls Bar */}
      <div className={styles.topBar}>
        <div className={styles.categoryWrap}>
          <label className={styles.catLabel}>Topic:</label>
          <select
            className={styles.select}
            value={catSlug}
            onChange={(e) => setCatSlug(e.target.value)}
          >
            <option value="philosophy">philosophy</option>
            <option value="fashion">fashion</option>
            <option value="food">food</option>
            <option value="culture">culture</option>
            <option value="travel">travel</option>
            <option value="coding">coding</option>
          </select>
        </div>

        <div className={styles.topActions}>
          {feedback && <span className={styles.feedbackText}>✓ {feedback}</span>}
          {error && <span className={styles.errorText}>{error}</span>}

          {/* Drafts Drawer Trigger */}
          <button
            type="button"
            className={`${styles.draftsToggleBtn} ${
              showDraftsDrawer ? styles.draftsToggleActive : ""
            }`}
            onClick={() => setShowDraftsDrawer(!showDraftsDrawer)}
            title="View Saved Drafts"
          >
            Drafts ({draftsList.length})
          </button>

          {/* Save Draft Button */}
          <button
            type="button"
            className={styles.saveDraftBtn}
            onClick={handleSaveDraft}
            disabled={savingDraft || submitting || (!title.trim() && !value.trim())}
          >
            {savingDraft ? "Saving..." : "Save Draft"}
          </button>

          {/* Publish Button */}
          <button
            type="button"
            className={styles.publish}
            onClick={handleSubmit}
            disabled={submitting || savingDraft || !title.trim()}
          >
            {submitting ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>

      {/* Slide-out Drafts Drawer */}
      {showDraftsDrawer && (
        <div
          className={styles.drawerOverlay}
          onClick={() => setShowDraftsDrawer(false)}
        >
          <div
            className={styles.drawerContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.drawerHeader}>
              <h3>Your Article Drafts ({draftsList.length})</h3>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  type="button"
                  className={styles.newDraftBtn}
                  onClick={handleNewDraft}
                >
                  + Blank Story
                </button>
                <button
                  type="button"
                  className={styles.drawerCloseBtn}
                  onClick={() => setShowDraftsDrawer(false)}
                >
                  ✕
                </button>
              </div>
            </div>

            {loadingDrafts ? (
              <p className={styles.loadingText}>Loading drafts...</p>
            ) : draftsList.length > 0 ? (
              <div className={styles.draftsGrid}>
                {draftsList.map((draft) => (
                  <div
                    key={draft.id}
                    className={`${styles.draftCard} ${
                      currentDraftSlug === draft.slug ? styles.activeDraftCard : ""
                    }`}
                    onClick={() => handleSelectDraft(draft)}
                  >
                    <div className={styles.draftCardInfo}>
                      <h4 className={styles.draftCardTitle}>
                        {draft.title || "Untitled Draft"}
                      </h4>
                      <span className={styles.draftCardMeta}>
                        {draft.catSlug} • {draft.createdAt ? timeAgo(draft.createdAt) : ""}
                      </span>
                    </div>

                    {draft.img && (
                      <div className={styles.draftCardThumbnail}>
                        <Image src={draft.img} alt="" fill style={{ objectFit: "cover" }} />
                      </div>
                    )}

                    <button
                      type="button"
                      className={styles.discardBtn}
                      onClick={(e) => handleDeleteDraft(e, draft.slug)}
                      title="Discard draft"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.drawerEmpty}>
                <p>No saved article drafts.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Title Input */}
      <input
        type="text"
        placeholder="Title"
        className={styles.input}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {/* Editor & Media Attachment */}
      <div className={styles.editor}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
          <button
            type="button"
            className={styles.button}
            onClick={() => setOpen(!open)}
            title="Insert media"
          >
            <Image src="/plus.png" alt="" width={14} height={14} />
            <span>Add Media</span>
          </button>

          {open && (
            <div className={styles.add}>
              {/* Cover Photo / Video */}
              <input
                type="file"
                id="cover-image-upload"
                accept="image/*,video/*"
                onChange={handleCoverUpload}
                style={{ display: "none" }}
              />
              <label htmlFor="cover-image-upload" className={styles.addButton}>
                <span>🖼️ Cover Photo/Video</span>
              </label>

              {/* Inline Photo */}
              <input
                type="file"
                id="inline-image-upload"
                accept="image/*"
                onChange={handleInlineImageUpload}
                style={{ display: "none" }}
              />
              <label htmlFor="inline-image-upload" className={styles.addButton}>
                <span>📷 Inline Photo</span>
              </label>

              {/* Video Embed */}
              <button
                type="button"
                className={styles.addButton}
                onClick={() => {
                  setShowVideoModal(true);
                  setOpen(false);
                }}
              >
                <span>🎥 Embed Video</span>
              </button>
            </div>
          )}
        </div>

        {uploading && <p className={styles.uploading}>Uploading media...</p>}

        {/* Hero Cover Media Preview (Image or Video) */}
        {media && (
          <div className={styles.imagePreview}>
            {isVideoUrl(media) ? (
              <video
                src={media}
                controls
                autoPlay
                muted
                loop
                style={{ width: "100%", maxHeight: "360px", objectFit: "cover", borderRadius: "12px", backgroundColor: "#000" }}
              />
            ) : (
              <Image
                src={media}
                alt="Cover preview"
                width={600}
                height={300}
                style={{ objectFit: "cover", borderRadius: "12px" }}
              />
            )}
            <button
              type="button"
              className={styles.removeMediaBtn}
              onClick={() => setMedia("")}
              title="Remove cover media"
            >
              ✕ Remove Cover
            </button>
          </div>
        )}

        <QuillEditor
          editorRef={quillRef}
          className={styles.textArea}
          value={value}
          onChange={setValue}
          placeholder="Tell your story..."
        />
      </div>

      {/* ── Video Embed Modal ── */}
      {showVideoModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowVideoModal(false);
              setVideoInput("");
              setVideoPreviewUrl("");
              setVideoType("");
            }
          }}
        >
          <div
            style={{
              background: "var(--bg)",
              borderRadius: "20px",
              padding: "28px",
              width: "100%",
              maxWidth: "520px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              border: "1px solid rgba(128,128,128,0.15)",
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--textColor)" }}>
                🎥 Embed a Video
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowVideoModal(false);
                  setVideoInput("");
                  setVideoPreviewUrl("");
                  setVideoType("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "18px",
                  cursor: "pointer",
                  color: "var(--softTextColor)",
                  padding: "4px 8px",
                  borderRadius: "6px",
                }}
              >
                ✕
              </button>
            </div>

            {/* URL Input */}
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--softTextColor)", marginBottom: "8px" }}>
              Paste a YouTube or Vimeo link
            </label>
            <input
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={videoInput}
              onChange={handleVideoInputChange}
              autoFocus
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "12px",
                border: "1px solid rgba(128,128,128,0.25)",
                background: "var(--softBg)",
                color: "var(--textColor)",
                fontSize: "15px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />

            {/* Detected platform badge */}
            {videoType && videoType !== "unknown" && (
              <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 700,
                  background: videoType === "youtube" ? "rgba(255,0,0,0.1)" : videoType === "vimeo" ? "rgba(26,183,234,0.1)" : "rgba(128,128,128,0.1)",
                  color: videoType === "youtube" ? "#ff0000" : videoType === "vimeo" ? "#1ab7ea" : "var(--textColor)",
                }}>
                  {videoType === "youtube" && "▶ YouTube detected"}
                  {videoType === "vimeo" && "▶ Vimeo detected"}
                  {videoType === "direct" && "▶ Direct video file"}
                </span>
              </div>
            )}

            {/* Live Preview */}
            {videoPreviewUrl && videoType !== "unknown" && videoType !== "direct" && (
              <div style={{ marginTop: "16px", borderRadius: "12px", overflow: "hidden", background: "#000", position: "relative", paddingBottom: "56.25%", height: 0 }}>
                <iframe
                  src={videoPreviewUrl}
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  title="Video preview"
                />
              </div>
            )}

            {videoType === "unknown" && videoInput.trim() && (
              <p style={{ marginTop: "10px", fontSize: "13px", color: "crimson" }}>
                ⚠️ Couldn&apos;t detect a supported video platform. Try a YouTube or Vimeo link.
              </p>
            )}

            {/* Tips */}
            <p style={{ marginTop: "14px", fontSize: "12px", color: "var(--softTextColor)", lineHeight: 1.6 }}>
              Supports: YouTube, YouTube Shorts, Vimeo, and direct MP4 links.
            </p>

            {/* Embed Button */}
            <div style={{ display: "flex", gap: "10px", marginTop: "18px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => {
                  setShowVideoModal(false);
                  setVideoInput("");
                  setVideoPreviewUrl("");
                  setVideoType("");
                }}
                style={{
                  padding: "10px 20px",
                  borderRadius: "20px",
                  border: "1px solid rgba(128,128,128,0.25)",
                  background: "transparent",
                  color: "var(--textColor)",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEmbedVideo}
                disabled={!videoPreviewUrl || videoType === "unknown"}
                style={{
                  padding: "10px 24px",
                  borderRadius: "20px",
                  border: "none",
                  background: !videoPreviewUrl || videoType === "unknown" ? "rgba(128,128,128,0.3)" : "crimson",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: !videoPreviewUrl || videoType === "unknown" ? "not-allowed" : "pointer",
                  transition: "background 0.2s",
                }}
              >
                Embed Video
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const WritePage = () => {
  return (
    <Suspense fallback={<div className={styles.loading}>Loading editor...</div>}>
      <WritePageContent />
    </Suspense>
  );
};

export default WritePage;

