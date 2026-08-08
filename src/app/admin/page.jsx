"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./adminPage.module.css";

const AdminPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || session?.user?.role !== "admin") {
      router.push("/");
      return;
    }

    const fetchData = async () => {
      const res = await fetch("/api/admin");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
      setLoading(false);
    };
    fetchData();
  }, [status, session, router]);

  const handleDeletePost = async (slug) => {
    if (!confirm("Delete this post and all its comments?")) return;
    const res = await fetch(`/api/posts/${slug}`, { method: "DELETE" });
    if (res.ok) {
      setData((prev) => ({
        ...prev,
        posts: prev.posts.filter((p) => p.slug !== slug),
        comments: prev.comments.filter((c) => c.post?.slug !== slug),
      }));
    }
  };

  const handleDeleteComment = async (id) => {
    if (!confirm("Delete this comment?")) return;
    const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
    if (res.ok) {
      setData((prev) => ({
        ...prev,
        comments: prev.comments.filter((c) => c.id !== id),
      }));
    }
  };

  if (status === "loading" || loading) {
    return <div className={styles.loading}>Loading dashboard...</div>;
  }

  if (!data) {
    return <div className={styles.loading}>Access denied</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Admin Dashboard</h1>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{data.userCount}</span>
          <span className={styles.statLabel}>Users</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{data.posts.length}</span>
          <span className={styles.statLabel}>Posts</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{data.comments.length}</span>
          <span className={styles.statLabel}>Comments</span>
        </div>
      </div>

      {/* Posts Table */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>All Posts</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Category</th>
                <th>Views</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.posts.map((post) => (
                <tr key={post.id}>
                  <td>{post.title}</td>
                  <td>{post.user?.name || post.userEmail}</td>
                  <td>{post.catSlug}</td>
                  <td>{post.views}</td>
                  <td>{new Date(post.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDeletePost(post.slug)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {data.posts.length === 0 && (
                <tr>
                  <td colSpan={6} className={styles.empty}>No posts yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comments Table */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>All Comments</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Comment</th>
                <th>Author</th>
                <th>On Post</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.comments.map((comment) => (
                <tr key={comment.id}>
                  <td>{comment.desc.length > 60 ? comment.desc.substring(0, 60) + "..." : comment.desc}</td>
                  <td>{comment.user?.name || comment.userEmail}</td>
                  <td>{comment.post?.title || comment.postSlug}</td>
                  <td>{new Date(comment.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDeleteComment(comment.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {data.comments.length === 0 && (
                <tr>
                  <td colSpan={5} className={styles.empty}>No comments yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
