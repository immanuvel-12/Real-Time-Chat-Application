import { useEffect, useState } from "react";
import { X, Search } from "lucide-react";

import Avatar from "./Avatar.jsx";
import { getAllUsers } from "../services/chatService.js";

/**
 * Pick a user to start a new conversation.
 */
export default function NewConversationModal({ onClose, onStart }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [startingId, setStartingId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await getAllUsers();
        setUsers(list);
      } catch {
        setError("Could not load users. Is the backend running?");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = users.filter((u) =>
    `${u.username} ${u.email}`.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Start a new conversation"
      onClick={onClose}
    >
      <div className="card-surface flex max-h-[80vh] w-full max-w-md flex-col p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-text-primary">New conversation</h3>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-text-secondary hover:bg-incoming hover:text-text-primary">
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div className="relative mb-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter users…"
            aria-label="Filter users"
            className="input-field pl-9"
            autoFocus
          />
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
        </div>

        <div className="scrollbar-thin -mx-1 flex-1 overflow-y-auto px-1">
          {loading ? (
            <div className="space-y-2 py-2" aria-busy="true">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-incoming" />
                  <div className="h-3 w-32 animate-pulse rounded bg-incoming" />
                </div>
              ))}
            </div>
          ) : error ? (
            <p className="py-4 text-sm text-rose">{error}</p>
          ) : filtered.length === 0 ? (
            <p className="py-4 text-sm text-text-secondary">
              No users found. Ask a friend to register first.
            </p>
          ) : (
            filtered.map((u) => (
              <button
                key={u._id}
                disabled={startingId === u._id}
                onClick={async () => {
                  setStartingId(u._id);
                  await onStart(u._id);
                  setStartingId(null);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-incoming disabled:opacity-50"
              >
                <Avatar user={u} size={40} showPresence isOnline={u.isOnline} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-text-primary">{u.username}</span>
                  <span className="block truncate text-xs text-text-secondary">{u.email}</span>
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
