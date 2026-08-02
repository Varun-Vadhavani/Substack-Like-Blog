"use client"

import styles from "./writePage.module.css";
import { useState } from "react";
import Image from "next/image";
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const writePage = () => {

    const { status } = useSession()

    const router = useRouter()

    
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState("");
    
    if (status === "loading") {
      return <div className={styles.loading}>Loading...</div>
    }

    if (status === "authenticated") {
      router.push("/")
    }

  return (
    <div className={styles.container}>
      <input
        type="text"
        placeholder="Title"
        className={styles.input}
      />
      <div className={styles.editor}>
        <button 
        className={styles.button}
        onClick={() => setOpen(!open)}
        >
          <Image src="/plus.png" alt="" width={16} height={16} />
        </button>
       </div>
       {open && (
          <div className={styles.add}>
            <button className={styles.addButton}>
              <label htmlFor="image">
                <Image src="/image.png" alt="" width={16} height={16} />
              </label>
            </button>
            <button className={styles.addButton}>
              <Image src="/external.png" alt="" width={16} height={16} />
            </button>
            <button className={styles.addButton}>
              <Image src="/video.png" alt="" width={16} height={16} />
            </button>
          </div>
        )}
        <ReactQuill
          className={styles.textArea}
          theme="bubble"
          value={value}
          onChange={setValue}
          placeholder="Tell your story..."
        />
        <button className={styles.publish}>Publish</button>
    </div>
  )
}

export default writePage
