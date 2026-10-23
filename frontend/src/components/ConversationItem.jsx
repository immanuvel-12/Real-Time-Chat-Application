import Avatar from "./Avatar.jsx";
import { formatConversationTime } from "../utils/time.js";

/**
 * One row in the recent conversations list.
 */
export default function ConversationItem({ conversation, active, unreadCount, isOnline, onOpen }) {
  const other = conversation.other;
  if (!other) return null;

  const preview = conversation.lastMessage?.content || "No messages yet";

  return (
    <button
      onClick={onOpen}
      aria-current={active ? "true" : undefined}
      className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors duration-150 ${
        active ? "bg-cerulean/15 ring-1 ring-cerulean/40" : "hover:bg-incoming"
      }`}
    >
      <Avatar user={other} size={44} showPresence isOnline={isOnline || other.isOnline} />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-semibold text-text-primary">{other.username}</span>
          {conversation.lastMessage && (
            <span className="shrink-0 text-[11px] text-text-secondary">
              {formatConversationTime(conversation.lastMessage.createdAt)}
            </span>
          )}
        </span>
        <span className="mt-0.5 flex items-center justify-between gap-2">
          <span
            className={`truncate text-xs ${
              unreadCount > 0 ? "text-text-primary font-medium" : "text-text-secondary"
            }`}
          >
            {conversation.lastMessage?.isMine ? "You: " : ""}
            {preview}
          </span>
          {unreadCount > 0 && (
            <span
              className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-rose px-1.5 text-[11px] font-bold text-white"
              style={{ boxShadow: "0 0 10px rgba(255,46,136,0.45)" }}
              aria-label={`${unreadCount} unread messages`}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </span>
      </span>
    </button>
  );
}
