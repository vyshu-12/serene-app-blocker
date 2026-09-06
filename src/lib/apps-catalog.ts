export type AppDef = {
  key: string;
  name: string;
  emoji: string;
  color: string;
  url: string;
  distracting?: boolean;
};

export const APPS: AppDef[] = [
  { key: "instagram", name: "Instagram", emoji: "📸", color: "from-pink-500 to-orange-400", url: "https://www.instagram.com", distracting: true },
  { key: "tiktok", name: "TikTok", emoji: "🎵", color: "from-slate-800 to-rose-500", url: "https://www.tiktok.com", distracting: true },
  { key: "youtube", name: "YouTube", emoji: "▶️", color: "from-red-500 to-red-700", url: "https://www.youtube.com", distracting: true },
  { key: "twitter", name: "X / Twitter", emoji: "🐦", color: "from-slate-700 to-slate-900", url: "https://www.x.com", distracting: true },
  { key: "facebook", name: "Facebook", emoji: "📘", color: "from-blue-500 to-blue-700", url: "https://www.facebook.com", distracting: true },
  { key: "snapchat", name: "Snapchat", emoji: "👻", color: "from-yellow-300 to-yellow-500", url: "https://www.snapchat.com", distracting: true },
  { key: "reddit", name: "Reddit", emoji: "👽", color: "from-orange-500 to-red-500", url: "https://www.reddit.com", distracting: true },
  { key: "games", name: "Games", emoji: "🎮", color: "from-fuchsia-500 to-purple-700", url: "https://poki.com", distracting: true },
];

export const APP_BY_KEY = Object.fromEntries(APPS.map((a) => [a.key, a]));

export function fmtSeconds(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.max(0, s % 60);
  if (m === 0) return `${sec}s`;
  return `${m}m ${sec.toString().padStart(2, "0")}s`;
}
