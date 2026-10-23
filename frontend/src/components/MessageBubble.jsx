export default function MessageBubble({ message, isMine, showReadReceipt, isRead }) {
  return (
    <div
      className={`flex w-full ${isMine ? "justify-end" : "justify-start"} animate-fade-in-up`}
    >
      <div
        className={`max-w-[78%] rounded-2xl px-3.5 py-2 sm:max-w-[65%] ${
          isMine
            ? "rounded-br-md bg-cerulean text-white"
            : "rounded-bl-md bg-incoming text-text-primary"
        }`}
      >
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.message}</p>
        <div
          className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
            isMine ? "text-white/75" : "text-text-secondary"
          }`}
        >
          <time dateTime={message.createdAt}>
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
          {isMine && showReadReceipt && (
            <span aria-label={isRead ? "Read" : "Sent"}>
              {isRead ? "✓✓" : "✓"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
