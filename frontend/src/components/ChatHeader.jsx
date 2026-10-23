import { ArrowLeft } from "lucide-react";

import Avatar from "./Avatar.jsx";
import { formatPresence } from "../utils/time.js";

/**
 * Chat panel header: back button (mobile), avatar, name and presence.
 */
export default function ChatHeader({ other, isOnline, onBack }) {
  return (
    <header className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3">
      <button
        onClick={onBack}
        className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-incoming hover:text-text-primary md:hidden"
        aria-label="Back to conversations"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      {other ? (
        <>
          <Avatar user={other} size={42} showPresence isOnline={isOnline || other.isOnline} />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-semibold text-text-primary">{other.username}</h2>
            <p
              className={`truncate text-xs ${
                isOnline || other.isOnline ? "text-emerald-400" : "text-text-secondary"
              }`}
            >
              {formatPresence({ isOnline: isOnline || other.isOnline, lastSeen: other.lastSeen })}
            </p>
          </div>
        </>
      ) : (
        <div className="flex-1" />
      )}
    </header>
  );
}
