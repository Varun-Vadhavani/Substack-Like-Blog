import React from 'react'
import Link from 'next/link'
import styles from './menuCategories.module.css'

const MenuCategories = () => {
  return (
    <div className={styles.categoryList}>
        <Link href="/blog?cat=style" className={`${styles.categoryItem} ${styles.style}`}>Style</Link>
      </div>
  )
}

export default MenuCategories
