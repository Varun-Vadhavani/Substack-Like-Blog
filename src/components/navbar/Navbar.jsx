import React from 'react'
import styles from './navbar.module.css'
import Link from 'next/link'
import ThemeToggle from '../themeToggle/ThemeToggle'
import AuthLinks from '../authLinks/AuthLinks'

const Navbar = () => {
  return (
    <div className={styles.container}>
      <div className={styles.social}>
        <img src="/facebook.png" alt="Facebook" width={24} height={24}/>
        <img src="/instagram.png" alt="Instagram" width={24} height={24}/>
        <img src="/tiktok.png" alt="TikTok" width={24} height={24}/>
        <img src="/youtube.png" alt="YouTube" width={24} height={24}/>
      </div>
      <div className={styles.logo}>Blog</div>
      <div className={styles.links}>
        <ThemeToggle />
        <Link href="/" className={styles.link}>Home</Link>
        <Link href="/contact" className={styles.link}>Contact</Link>
        <Link href="/about" className={styles.link}>About</Link>
        <AuthLinks />
      </div>
    </div>
  )
}

export default Navbar
