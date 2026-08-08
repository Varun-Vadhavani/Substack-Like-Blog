import React from 'react'
import styles from './footer.module.css'
import Image from 'next/image'
import Link from 'next/link'

const Footer = () => {
  return (
    <div className={styles.container}>
      <div className={styles.info}>
        <div className={styles.logo}>
          <h1 className={styles.logoText}>WriteSpace</h1>
        </div>
        <p className={styles.desc}>
          WriteSpace is a modern blogging platform where ideas find their voice. Discover thoughtful articles across philosophy, culture, coding, travel, and more.
        </p>
      </div>
      <div className={styles.links}>
        <div className={styles.list}>
          <span className={styles.listTitle}>Links</span>
          <Link href="/">Homepage</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/about">About</Link>
          <Link href="/write">Write</Link>
        </div>
        <div className={styles.list}>
          <span className={styles.listTitle}>Categories</span>
          <Link href="/blog?cat=philosophy">Philosophy</Link>
          <Link href="/blog?cat=fashion">Fashion</Link>
          <Link href="/blog?cat=food">Food</Link>
          <Link href="/blog?cat=culture">Culture</Link>
          <Link href="/blog?cat=travel">Travel</Link>
          <Link href="/blog?cat=coding">Coding</Link>
        </div>
      </div>
    </div>
  )
}

export default Footer

