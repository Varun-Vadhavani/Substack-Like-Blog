import styles from "./aboutPage.module.css";
import Link from "next/link";
import ScrollReveal from "@/components/scrollReveal/ScrollReveal";

const AboutPage = () => {
  return (
    <div className={styles.container}>
      {/* Hero */}
      <ScrollReveal>
        <div className={styles.hero}>
          <p className={styles.subtitle}>About Us</p>
          <h1 className={styles.title}>
            A space for thinkers,
            <br />
            writers, and <span className={styles.highlight}>dreamers</span>.
          </h1>
          <p className={styles.tagline}>
            WriteSpace is a modern blogging platform where ideas find their voice.
            Whether you&apos;re sharing a recipe, exploring philosophy, or documenting
            your travels — this is your space.
          </p>
        </div>
      </ScrollReveal>

      {/* Our Story */}
      <ScrollReveal delay={100}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Our Story</h2>
          <p className={styles.text}>
            WriteSpace was born from a simple idea: everyone has a story worth
            telling. In a world overflowing with noise, we wanted to create a calm,
            focused corner of the internet where writing comes first. No
            distractions, no algorithms deciding what you see — just pure,
            authentic content from real people.
          </p>
        </div>
      </ScrollReveal>

      {/* Our Values */}
      <ScrollReveal delay={150}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>What We Believe In</h2>
          <div className={styles.values}>
            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>✍️</div>
              <h3 className={styles.valueTitle}>Writing First</h3>
              <p className={styles.valueDesc}>
                We put the writing experience at the center. A clean editor, no
                clutter — just you and your words.
              </p>
            </div>
            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>🌍</div>
              <h3 className={styles.valueTitle}>Open to Everyone</h3>
              <p className={styles.valueDesc}>
                Whether you&apos;re a seasoned writer or posting for the first time,
                WriteSpace welcomes all voices and perspectives.
              </p>
            </div>
            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>💡</div>
              <h3 className={styles.valueTitle}>Ideas Matter</h3>
              <p className={styles.valueDesc}>
                Great ideas deserve great platforms. We help your thoughts reach
                people who care about them.
              </p>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Topics */}
      <ScrollReveal delay={200}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>What People Write About</h2>
          <p className={styles.text}>
            Our community writes across a wide range of topics. Here are some of
            the spaces you can explore:
          </p>
          <div className={styles.categories}>
            <span className={`${styles.categoryTag} ${styles.philosophy}`}>
              Philosophy
            </span>
            <span className={`${styles.categoryTag} ${styles.fashion}`}>
              Fashion
            </span>
            <span className={`${styles.categoryTag} ${styles.food}`}>Food</span>
            <span className={`${styles.categoryTag} ${styles.culture}`}>
              Culture
            </span>
            <span className={`${styles.categoryTag} ${styles.travel}`}>
              Travel
            </span>
            <span className={`${styles.categoryTag} ${styles.coding}`}>
              Coding
            </span>
          </div>
        </div>
      </ScrollReveal>

      {/* CTA */}
      <ScrollReveal delay={250}>
        <div className={styles.cta}>
          <h2 className={styles.ctaTitle}>Ready to start writing?</h2>
          <p className={styles.ctaText}>
            Join WriteSpace today and share your story with the world.
          </p>
          <Link href="/write">
            <button className={styles.ctaButton}>Start Writing</button>
          </Link>
        </div>
      </ScrollReveal>
    </div>
  );
};

export default AboutPage;
