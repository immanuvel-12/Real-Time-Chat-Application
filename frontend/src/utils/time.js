/**
 * Consistent date/time formatting helpers.
 */

export function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** Sidebar-style timestamp: HH:mm today, "Yesterday", weekday this week, else date. */
export function formatConversationTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return formatTime(iso);

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });

  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

/** Message-bubble separator label. */
export function formatDayLabel(iso) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

/** "Online" or "Last seen 5m ago". */
export function formatPresence({ isOnline, lastSeen }) {
  if (isOnline) return "Online";
  if (!lastSeen) return "Offline";
  const diff = Date.now() - new Date(lastSeen).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Last seen just now";
  if (minutes < 60) return `Last seen ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Last seen ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Last seen ${days}d ago`;
  return `Last seen ${new Date(lastSeen).toLocaleDateString()}`;
}
