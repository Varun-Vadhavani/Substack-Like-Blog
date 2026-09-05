/**
 * Smart Evergreen Feed Algorithm (Substack Style)
 *
 * Rather than strict chronological order, modern editorial feeds prioritize:
 * 1. Freshness Guarantee: Posts from the last 3 hours are surfaced near the top.
 * 2. Evergreen Quality: Posts with likes, comments, and views remain discoverable.
 * 3. Gentle Time Decay: Prevents older posts from completely vanishing.
 * 4. Refresh Jitter: A controlled random multiplier (0.75 - 1.35) shuffles the order
 *    on each refresh so visitors discover different gems every time they visit.
 * 5. Content Interleaving: Balances notes and articles to avoid monotonous streaks.
 *
 * @param {Array} posts - Array of published post objects
 * @returns {Array} - Dynamically ranked and shuffled posts
 */
export const rankEvergreenFeed = (posts) => {
  if (!Array.isArray(posts) || posts.length <= 1) return posts || [];

  const now = Date.now();
  const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

  const superFresh = [];
  const standardPool = [];

  for (const post of posts) {
    const postTime = post.createdAt ? new Date(post.createdAt).getTime() : now;
    const ageMs = Math.max(0, now - postTime);

    if (ageMs < THREE_HOURS_MS) {
      // Keep very recent posts at the top
      superFresh.push(post);
    } else {
      const ageHours = ageMs / (1000 * 60 * 60);
      const likes = post._count?.likes || 0;
      const comments = post._count?.comments || 0;
      const views = post.views || 0;

      // Base engagement score
      const engagement = likes * 3 + comments * 4 + views * 0.2 + 5;

      // Gentle evergreen decay curve: age in hours + 12 offset
      const decay = Math.pow(ageHours + 12, 0.75);

      // Random jitter factor for variation on every refresh
      const jitter = 0.75 + Math.random() * 0.6;

      const score = (engagement / decay) * jitter;
      standardPool.push({ post, score });
    }
  }

  // Sort older pool by calculated score descending
  standardPool.sort((a, b) => b.score - a.score);
  const rankedOlder = standardPool.map((item) => item.post);

  // Combine fresh + scored older posts
  const combined = [...superFresh, ...rankedOlder];

  // Interleave Notes and Articles for reading variety
  const notes = combined.filter((p) => p.type === "note");
  const articles = combined.filter((p) => p.type !== "note");

  if (notes.length === 0 || articles.length === 0) {
    return combined;
  }

  const interleaved = [];
  let nIdx = 0;
  let aIdx = 0;
  let startWithNote = Math.random() > 0.5;

  while (nIdx < notes.length || aIdx < articles.length) {
    if (startWithNote) {
      if (nIdx < notes.length) interleaved.push(notes[nIdx++]);
      if (aIdx < articles.length) interleaved.push(articles[aIdx++]);
    } else {
      if (aIdx < articles.length) interleaved.push(articles[aIdx++]);
      if (nIdx < notes.length) interleaved.push(notes[nIdx++]);
    }
  }

  return interleaved;
};

/**
 * Strict chronological sorting by createdAt descending (Newest first)
 * @param {Array} posts
 * @returns {Array}
 */
export const sortChronological = (posts) => {
  if (!Array.isArray(posts)) return [];
  return [...posts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};
