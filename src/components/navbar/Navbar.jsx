"use client";

import React from 'react'
import styles from './navbar.module.css'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ThemeToggle from '../themeToggle/ThemeToggle'
import AuthLinks from '../authLinks/AuthLinks'

const Navbar = () => {
  const pathname = usePathname();

  const isHome = pathname === "/";
  const isAbout = pathname === "/about";

  return (
    <div className={styles.container}>
      <div className={styles.logo}>
        <Link href="/">WriteSpace</Link>
      </div>
      <div className={styles.links}>
        <ThemeToggle />
        <Link href="/" className={`${styles.link} ${isHome ? styles.active : ""}`}>
          Home
        </Link>
        <Link href="/about" className={`${styles.link} ${isAbout ? styles.active : ""}`}>
          About
        </Link>
        <AuthLinks />
      </div>
    </div>
  )
}

export default Navbar
