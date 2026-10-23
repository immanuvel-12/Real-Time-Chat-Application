import { useEffect, useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";

const MAX_LENGTH = 2000;

/**
 * Message input with Enter-to-send, Shift+Enter for newline and a
 * character counter near the limit. Emits typing/stopTyping around input.
 */
export default function MessageInput({ onSend, onTyping, onStopTyping, disabled }) {
  const [text, setText] = useState("");
  const textareaRef = useRef(null);
  const typingRef = useRef(false);
  const stopTimerRef = useRef(null);

  useEffect(() => () => clearTimeout(stopTimerRef.current), []);

  function handleChange(e) {
    const value = e.target.value.slice(0, MAX_LENGTH);
    setText(value);

    if (!value.trim()) {
      if (typingRef.current) {
        typingRef.current = false;
        onStopTyping?.();
      }
      return;
    }

    if (!typingRef.current) {
      typingRef.current = true;
      onTyping?.();
    }
    // auto stop-typing after 2.5s of silence
    clearTimeout(stopTimerRef.current);
    stopTimerRef.current = setTimeout(() => {
      if (typingRef.current) {
        typingRef.current = false;
        onStopTyping?.();
      }
    }, 2500);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const value = text.trim();
    if (!value || disabled) return;
    onSend(value);
    setText("");
    if (typingRef.current) {
      typingRef.current = false;
      onStopTyping?.();
    }
    textareaRef.current?.focus();
  }

  const nearLimit = text.length > MAX_LENGTH - 100;

  return (
    <div className="border-t border-line bg-surface p-3">
      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            aria-label="Message"
            rows={1}
            maxLength={MAX_LENGTH}
            className="input-field max-h-32 min-h-[44px] resize-none pr-14"
            disabled={disabled}
          />
          {nearLimit && (
            <span className="pointer-events-none absolute bottom-2 right-3 text-[10px] text-text-secondary">
              {text.length}/{MAX_LENGTH}
            </span>
          )}
        </div>
        <button
          onClick={submit}
          disabled={disabled || !text.trim()}
          className="btn-primary h-[44px] w-[52px] shrink-0 px-0"
          aria-label="Send message"
          title="Send (Enter)"
        >
          <SendHorizontal className="h-5 w-5" />
        </button>
      </div>
      <p className="mt-1.5 hidden text-[11px] text-text-secondary sm:block">
        Enter to send · Shift+Enter for a new line · {MAX_LENGTH} character limit
      </p>
    </div>
  );
}
