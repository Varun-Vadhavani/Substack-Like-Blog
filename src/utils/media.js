/**
 * Checks whether a given URL points to a video file or stream
 * @param {string} url
 * @returns {boolean}
 */
export const isVideoUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  const cleanUrl = url.split("?")[0].split("#")[0].toLowerCase();
  
  // Extension check
  if (/\.(mp4|webm|ogg|mov|m4v|mkv)$/i.test(cleanUrl)) return true;

  // Cloudinary video resource URL check
  if (url.includes("/video/upload/") || url.includes("resource_type=video")) return true;

  return false;
};
