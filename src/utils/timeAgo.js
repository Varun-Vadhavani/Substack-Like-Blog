export const timeAgo = (date) => {
  if (!date) return "";
  const now = new Date();
  const past = new Date(date);
  const secondsAgo = Math.floor((now - past) / 1000);

  if (secondsAgo < 0) return "just now";
  if (secondsAgo < 10) return "just now";
  if (secondsAgo < 60) return `${secondsAgo} seconds ago`;

  const minutesAgo = Math.floor(secondsAgo / 60);
  if (minutesAgo === 1) return "1 minute ago";
  if (minutesAgo < 60) return `${minutesAgo} minutes ago`;

  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo === 1) return "1 hour ago";
  if (hoursAgo < 24) return `${hoursAgo} hours ago`;

  const daysAgo = Math.floor(hoursAgo / 24);
  if (daysAgo === 1) return "1 day ago";
  if (daysAgo < 30) return `${daysAgo} days ago`;

  const monthsAgo = Math.floor(daysAgo / 30);
  if (monthsAgo === 1) return "1 month ago";
  if (monthsAgo < 12) return `${monthsAgo} months ago`;

  const yearsAgo = Math.floor(daysAgo / 365);
  if (yearsAgo === 1) return "1 year ago";
  return `${yearsAgo} years ago`;
};
