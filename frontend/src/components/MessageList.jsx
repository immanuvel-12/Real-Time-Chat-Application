import { useEffect, useRef } from "react";

import MessageBubble from "./MessageBubble.jsx";
import TypingIndicator from "./TypingIndicator.jsx";
import { formatDayLabel } from "../utils/time.js";

/**
 * Scrollable message history. Pages older messages backwards via
 * onLoadOlder; auto-scrolls to the latest message unless the user is
 * scrolled up reading history.
 */
export default function MessageList({
  messages,
  myId,
  loadingOlder,
  hasMore,
  otherTyping,
  otherName,
  onLoadOlder,
  readReceiptsEnabled = true,
}) {
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);
  const pinnedToBottom = useRef(true);

  const last = messages[messages.length - 1];

  // Track whether the user is at (or near) the bottom.
  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    pinnedToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;

    // Load older history when scrolled to the very top.
    if (el.scrollTop === 0 && hasMore && !loadingOlder) {
      const prevHeight = el.scrollHeight;
      onLoadOlder?.(() => {
        // keep the viewport anchored to the previously-top message
        requestAnimationFrame(() => {
          const el2 = scrollRef.current;
          if (el2) el2.scrollTop = el2.scrollHeight - prevHeight;
        });
      });
    }
  }

  // New message / typing: follow the bottom only if pinned.
  useEffect(() => {
    if (pinnedToBottom.current) {
      bottomRef.current?.scrollIntoView({ block: "end" });
    }
  }, [last?._id, last?.message, otherTyping]);

  if (loadingOlder && messages.length === 0) {
    return (
      <div className="flex-1 space-y-4 overflow-hidden p-4" aria-busy="true">
        {[70, 45, 60, 40].map((w, i) => (
          <div key={i} className={`flex ${i % 2 ? "justify-end" : "justify-start"}`}>
            <div className="h-9 animate-pulse rounded-2xl bg-incoming" style={{ width: `${w}%` }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="scrollbar-thin flex-1 overflow-y-auto px-4 py-4"
      role="log"
      aria-label="Message history"
      aria-live="polite"
    >
      {hasMore && (
        <div className="mb-3 flex justify-center">
          {loadingOlder ? (
            <span className="text-xs text-text-secondary">Loading older messages…</span>
          ) : (
            <button
              className="text-xs font-medium text-cerulean hover:underline"
              onClick={() => onLoadOlder?.()}
            >
              Load older messages
            </button>
          )}
        </div>
      )}

      {messages.map((m, i) => {
        const prev = messages[i - 1];
        const showDay =
          !prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString();
        const isMine = m.senderId === myId || m.senderId?._id === myId;
        return (
          <div key={m._id || m.tempId || i}>
            {showDay && (
              <div className="my-3 flex items-center gap-3">
                <div className="h-px flex-1 bg-line" />
                <span className="text-[11px] font-medium uppercase tracking-wide text-text-secondary">
                  {formatDayLabel(m.createdAt)}
                </span>
                <div className="h-px flex-1 bg-line" />
              </div>
            )}
            <MessageBubble
              message={m}
              isMine={isMine}
              showReadReceipt={readReceiptsEnabled && isMine && i === messages.length - 1}
              isRead={Boolean(m.readAt)}
            />
          </div>
        );
      })}

      {otherTyping && <TypingIndicator name={otherName} />}

      <div ref={bottomRef} />
    </div>
  );
}
