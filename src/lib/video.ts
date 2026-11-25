/** Convert a YouTube or Vimeo URL into an embeddable player URL. */
export function getEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\.|^m\./, "");

    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1` : null;
    }
    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      let id = u.searchParams.get("v");
      if (!id) {
        const m = u.pathname.match(/\/(embed|shorts|live)\/([\w-]{6,})/);
        id = m?.[2] ?? null;
      }
      return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1` : null;
    }
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const m = u.pathname.match(/(\d{6,})/);
      return m ? `https://player.vimeo.com/video/${m[1]}?dnt=1` : null;
    }
  } catch {
    return null;
  }
  return null;
}

export function isSupportedVideoUrl(url: string) {
  return getEmbedUrl(url) !== null;
}
