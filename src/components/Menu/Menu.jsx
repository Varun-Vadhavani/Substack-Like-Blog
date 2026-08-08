import React from 'react'
import styles from './menu.module.css'
import MenuPosts from '../MenuPosts/MenuPosts'
import MenuCategories from '../MenuCategories/MenuCategories'
import ScrollReveal from '../scrollReveal/ScrollReveal'

const Menu = () => {
  return (
    <div className={styles.container}>
      {/* What's Hot / Most Popular */}
      <ScrollReveal>
        <h2 className={styles.subtitle}>What&apos;s hot</h2>
        <h1 className={styles.title}>Most Popular</h1>
        <MenuPosts withImage={false} type="popular" />
      </ScrollReveal>

      {/* Discover by Topic */}
      <ScrollReveal delay={100}>
        <h2 className={styles.subtitle}>Discover by Topic</h2>
        <h1 className={styles.title}>Categories</h1>
        <MenuCategories />
      </ScrollReveal>

      {/* Editor's Pick */}
      <ScrollReveal delay={200}>
        <h2 className={styles.subtitle}>Chosen by the editor</h2>
        <h1 className={styles.title}>Editors Pick</h1>
        <MenuPosts withImage={true} type="editors" />
      </ScrollReveal>
    </div>
  )
}

export default Menu
