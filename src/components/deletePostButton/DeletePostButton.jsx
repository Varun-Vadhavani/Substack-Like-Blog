"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./deletePostButton.module.css";

const DeletePostButton = ({ slug, authorEmail }) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status !== "authenticated") return null;

  const isOwner = session?.user?.email === authorEmail;
  const isAdmin = session?.user?.role === "admin";

  if (!isOwner && !isAdmin) return null;

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    const res = await fetch(`/api/posts/${slug}`, {
      method: "DELETE",
    });

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      alert("Failed to delete post.");
    }
  };

  return (
    <button className={styles.deleteBtn} onClick={handleDelete}>
      Delete Post
    </button>
  );
};

export default DeletePostButton;
