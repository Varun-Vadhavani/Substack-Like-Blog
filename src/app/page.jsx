import styles from "./homepage.module.css";
import Featured from "@/components/Featured/Featured";
import CreateNote from "@/components/createNote/CreateNote";
import CardList from "@/components/CardList/CardList";
import SubscriptionsPanel from "@/components/SubscriptionsPanel/SubscriptionsPanel";

export default function Home() {
  return (
    <div className={styles.pageWrapper}>
      {/* Main Feed Column */}
      <div className={styles.feedColumn}>
        <Featured />
        <CreateNote />
        <CardList />
      </div>

      {/* Right Subscriptions Panel — big screens only */}
      <div className={styles.rightPanel}>
        <SubscriptionsPanel />
      </div>
    </div>
  );
}
