/**
 * Substack-style date formatting:
 * - < 1 min   → "just now"
 * - 1–59 min  → "5m ago"
 * - 1–23 h    → "3h ago"
 * - 1–6 days  → "4 days ago"
 * - 7+ days, same year → "Aug 14"
 * - different year     → "Aug 14, 2022"
 */
export const timeAgo = (date) => {
  if (!date) return "";

  const now = new Date();
  const past = new Date(date);
  const secondsAgo = Math.floor((now - past) / 1000);

  if (secondsAgo < 60) return "just now";

  const minutesAgo = Math.floor(secondsAgo / 60);
  if (minutesAgo < 60) return `${minutesAgo}m ago`;

  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo < 24) return `${hoursAgo}h ago`;

  const daysAgo = Math.floor(hoursAgo / 24);
  if (daysAgo < 7) return daysAgo === 1 ? "1 day ago" : `${daysAgo} days ago`;

  // 7+ days — switch to absolute date
  const isSameYear = past.getFullYear() === now.getFullYear();

  return past.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(isSameYear ? {} : { year: "numeric" }),
  });
};
