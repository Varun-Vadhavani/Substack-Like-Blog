"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./settingsPage.module.css";
import Image from "next/image";

const SettingsPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  if (status === "loading") {
    return <div className={styles.loading}>Loading settings...</div>;
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const handleDeleteAccount = async () => {
    const confirmed = confirm(
      "Are you sure you want to delete your account? This will permanently remove your account, posts, and comments. This action CANNOT be undone!"
    );

    if (!confirmed) return;

    setDeleting(true);

    try {
      const res = await fetch("/api/users/account", {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Your account has been deleted.");
        signOut({ callbackUrl: "/" });
      } else {
        alert("Failed to delete account. Please try again.");
        setDeleting(false);
      }
    } catch (err) {
      console.log(err);
      alert("An error occurred. Please try again.");
      setDeleting(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Account Settings</h1>

      <div className={styles.profileCard}>
        <Image
          src={
            session?.user?.image ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              session?.user?.name || "User"
            )}&background=dc143c&color=fff&bold=true`
          }
          alt={session?.user?.name || "Profile avatar"}
          width={80}
          height={80}
          className={styles.avatar}
        />
        <div className={styles.profileInfo}>
          <h2 className={styles.name}>{session?.user?.name}</h2>
          <p className={styles.email}>{session?.user?.email}</p>
        </div>
      </div>

      <div className={styles.dangerZone}>
        <p className={styles.dangerDesc}>
          Deleting your account will permanently remove all your published posts,
          comments, and personal data from WriteSpace.
        </p>
        <button
          className={styles.deleteBtn}
          onClick={handleDeleteAccount}
          disabled={deleting}
        >
          {deleting ? "Deleting Account..." : "Delete My Account"}
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
