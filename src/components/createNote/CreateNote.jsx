"use client";

import React from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./createNote.module.css";
import { useCreateNote } from "@/context/CreateNoteContext";

const CreateNote = () => {
  const { data: session, status } = useSession();
  const { openNoteModal } = useCreateNote();
  const router = useRouter();

  const userName = session?.user?.name || "User";
  const userImage =
    session?.user?.image ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      userName
    )}&background=dc143c&color=fff&bold=true`;

  const handleOpen = () => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    openNoteModal();
  };

  return (
    <div
      className={styles.triggerContainer}
      onClick={handleOpen}
      role="button"
      tabIndex={0}
    >
      <div className={styles.triggerAvatarWrapper}>
        <Image
          src={userImage}
          alt={userName}
          fill
          className={styles.triggerAvatar}
        />
      </div>
      <span className={styles.triggerPlaceholder}>
        What&apos;s on your mind?
      </span>
    </div>
  );
};

export default CreateNote;
