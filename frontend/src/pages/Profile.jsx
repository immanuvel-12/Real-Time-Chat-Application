import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LoaderCircle, LogOut, Check } from "lucide-react";

import Avatar from "../components/Avatar.jsx";
import Navbar from "../components/Navbar.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useSocket } from "../hooks/useSocket.js";
import { updateProfile } from "../services/chatService.js";
import { formatPresence } from "../utils/time.js";

/**
 * Profile & settings: view identity and presence, update username and
 * profile image URL, log out securely.
 */
export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();

  const [username, setUsername] = useState(user?.username || "");
  const [profileImage, setProfileImage] = useState(user?.profileImage || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  if (!user) return null;

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const updated = await updateProfile({
        username: username.trim(),
        profileImage: profileImage.trim(),
      });
      updateUser(updated);
      setSaved(true);
      toast.success("Profile updated");
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not update profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-jet px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex items-center justify-between">
          <Navbar />
          <Link to="/" className="btn-secondary">
            Back to chat
          </Link>
        </div>

        <div className="card-surface p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <Avatar user={{ ...user, profileImage: profileImage || user.profileImage }} size={64} showPresence isOnline />
            <div>
              <h1 className="text-lg font-bold text-text-primary">{user.username}</h1>
              <p className="text-sm text-text-secondary">{user.email}</p>
              <p className="mt-0.5 text-xs text-emerald-400">
                {formatPresence({ isOnline: socket.current?.connected || user.isOnline, lastSeen: user.lastSeen })}
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="mt-7 space-y-4" noValidate>
            <div>
              <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-text-primary">
                Username
              </label>
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                maxLength={30}
              />
            </div>

            <div>
              <label htmlFor="profileImage" className="mb-1.5 block text-sm font-medium text-text-primary">
                Profile image URL
              </label>
              <input
                id="profileImage"
                type="url"
                value={profileImage}
                onChange={(e) => setProfileImage(e.target.value)}
                className="input-field"
                placeholder="https://example.com/avatar.png"
              />
              <p className="mt-1 text-xs text-text-secondary">
                Paste a direct link to an image ending in .png, .jpg, .gif, .webp or .svg.
              </p>
            </div>

            <button type="submit" className="btn-primary" disabled={saving || !username.trim()}>
              {saving ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : saved ? (
                <>
                  <Check className="h-4 w-4" /> Saved
                </>
              ) : (
                "Save changes"
              )}
            </button>
          </form>

          <div className="mt-8 border-t border-line pt-5">
            <h2 className="text-sm font-semibold text-text-primary">Session</h2>
            <p className="mt-1 text-xs text-text-secondary">
              Logging out clears your authentication cookie on this device.
            </p>
            <button
              onClick={() => setConfirmLogout(true)}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-rose/40 bg-rose/10 px-4 py-2.5 text-sm font-semibold text-rose transition-colors hover:bg-rose/20"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        </div>
      </div>

      {confirmLogout && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm logout"
          onClick={() => setConfirmLogout(false)}
        >
          <div className="card-surface w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-text-primary">Log out of ChatConnect?</h3>
            <p className="mt-1 text-sm text-text-secondary">You can sign back in any time.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setConfirmLogout(false)}>
                Cancel
              </button>
              <button
                className="rounded-lg bg-rose px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose/80"
                onClick={async () => {
                  setConfirmLogout(false);
                  await logout();
                  navigate("/login", { replace: true });
                }}
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
