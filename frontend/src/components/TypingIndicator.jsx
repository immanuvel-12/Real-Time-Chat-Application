export default function TypingIndicator({ name }) {
  return (
    <div className="flex justify-start animate-fade-in-up" aria-live="polite">
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-incoming px-3.5 py-2.5">
        <span className="text-xs text-text-secondary">{name} is typing</span>
        <span className="flex gap-1" aria-hidden="true">
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-text-secondary" />
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-text-secondary [animation-delay:0.2s]" />
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-text-secondary [animation-delay:0.4s]" />
        </span>
      </div>
    </div>
  );
}
