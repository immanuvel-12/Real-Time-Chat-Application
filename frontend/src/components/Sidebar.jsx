import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { LogOut, Settings, UserRoundPlus } from "lucide-react";
import { Link } from "react-router-dom";

import Avatar from "./Avatar.jsx";
import ConversationItem from "./ConversationItem.jsx";
import NewConversationModal from "./NewConversationModal.jsx";
import Navbar from "./Navbar.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { getConversations, searchUsers, createConversation } from "../services/chatService.js";
import { formatConversationTime } from "../utils/time.js";

/**
 * Left sidebar: brand, my profile, user search, conversation list,
 * profile/settings and logout.
 */
export default function Sidebar({
  conversations,
  onOpenConversation,
  activeConversationId,
  unreadCounts,
  onlineUserIds,
  onConversationsChanged,
  className = "",
}) {
  const { user, logout } = useAuth();
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const searchTrimmed = search.trim();

  // Live user search while typing (debounced).
  useEffect(() => {
    if (!searchTrimmed) {
      setSearchResults([]);
      setSearching(false);
      return undefined;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const users = await searchUsers(searchTrimmed);
        setSearchResults(users);
      } catch {
        toast.error("Search failed. Is the backend running?");
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTrimmed]);

  const sortedConversations = useMemo(
    () =>
      [...conversations].sort(
        (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
      ),
    [conversations]
  );

  async function handleStartConversation(userId) {
    try {
      const { conversation } = await createConversation(userId);
      setShowNewModal(false);
      setSearch("");
      onConversationsChanged?.();
      onOpenConversation(conversation._id);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not start conversation.");
    }
  }

  return (
    <aside
      className={`flex h-full w-full flex-col border-r border-line bg-surface ${className}`}
    >
      {/* Brand */}
      <div className="px-4 pb-3 pt-4">
        <Navbar compact />
      </div>

      {/* My profile row */}
      <div className="mx-3 mb-3 flex items-center gap-3 rounded-xl border border-line bg-jet px-3 py-2.5">
        <Avatar user={user} size={40} showPresence isOnline />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text-primary">{user?.username}</p>
          <p className="truncate text-xs text-text-secondary">{user?.email}</p>
        </div>
        <div className="flex items-center gap-1">
          <Link
            to="/profile"
            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-incoming hover:text-text-primary"
            title="Profile & settings"
            aria-label="Profile and settings"
          >
            <Settings className="h-[18px] w-[18px]" />
          </Link>
          <button
            onClick={() => setConfirmLogout(true)}
            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-incoming hover:text-rose"
            title="Log out"
            aria-label="Log out"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      {/* Search + new chat */}
      <div className="px-3 pb-2">
        <div className="relative">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users…"
            aria-label="Search users"
            className="input-field pl-9"
          />
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4-4" />
          </svg>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="btn-primary mt-2 w-full"
        >
          <UserRoundPlus className="h-4 w-4" />
          New conversation
        </button>
      </div>

      {/* List */}
      <div className="scrollbar-thin flex-1 overflow-y-auto px-2 pb-4">
        {searchTrimmed ? (
          <div>
            <p className="px-2 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Search results
            </p>
            {searching ? (
              <SearchSkeleton />
            ) : searchResults.length === 0 ? (
              <p className="px-2 py-3 text-sm text-text-secondary">No users found for “{searchTrimmed}”.</p>
            ) : (
              searchResults.map((u) => (
                <button
                  key={u._id}
                  onClick={() => handleStartConversation(u._id)}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-incoming"
                >
                  <Avatar user={u} size={40} showPresence isOnline={onlineUserIds.has(u._id) || u.isOnline} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-text-primary">{u.username}</span>
                    <span className="block truncate text-xs text-text-secondary">{u.email}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        ) : (
          <>
            <p className="px-2 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Conversations
            </p>
            {sortedConversations.length === 0 ? (
              <div className="px-2 py-6 text-sm text-text-secondary">
                No conversations yet. Search a user or tap “New conversation” to start chatting.
              </div>
            ) : (
              sortedConversations.map((c) => (
                <ConversationItem
                  key={c._id}
                  conversation={c}
                  active={c._id === activeConversationId}
                  unreadCount={unreadCounts[c._id] || 0}
                  isOnline={onlineUserIds.has(c.other?._id)}
                  onOpen={() => onOpenConversation(c._id)}
                />
              ))
            )}
          </>
        )}
      </div>

      {/* Logout confirmation */}
      {confirmLogout && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm logout"
          onClick={() => setConfirmLogout(false)}
        >
          <div
            className="card-surface w-full max-w-sm p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-text-primary">Log out of ChatConnect?</h3>
            <p className="mt-1 text-sm text-text-secondary">
              You will need to sign in again to see your messages.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setConfirmLogout(false)}>
                Cancel
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose/80"
                onClick={async () => {
                  setConfirmLogout(false);
                  await logout();
                }}
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewModal && (
        <NewConversationModal
          onClose={() => setShowNewModal(false)}
          onStart={handleStartConversation}
        />
      )}
    </aside>
  );
}

function SearchSkeleton() {
  return (
    <div className="space-y-2 px-2 py-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-incoming" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-28 animate-pulse rounded bg-incoming" />
            <div className="h-3 w-40 animate-pulse rounded bg-incoming" />
          </div>
        </div>
      ))}
    </div>
  );
}

export { formatConversationTime };
