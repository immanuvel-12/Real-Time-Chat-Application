export default function Avatar({ user, size = 44, showPresence = false, isOnline = false }) {
  const name = user?.username || "?";
  const initial = name.charAt(0).toUpperCase();

  const dimension = { width: size, height: size, minWidth: size };
  const fontSize = Math.max(12, Math.round(size * 0.38));

  return (
    <div className="relative inline-block shrink-0" style={dimension}>
      {user?.profileImage ? (
        <img
          src={user.profileImage}
          alt={name}
          className="h-full w-full rounded-full border border-line object-cover"
          style={dimension}
          loading="lazy"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center rounded-full border border-line bg-incoming font-semibold text-text-primary"
          style={{ fontSize }}
          aria-hidden="true"
        >
          {initial}
        </div>
      )}
      {showPresence && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 block rounded-full border-2 border-surface ${
            isOnline ? "bg-emerald-500" : "bg-text-secondary"
          }`}
          style={{ width: Math.max(10, size * 0.26), height: Math.max(10, size * 0.26) }}
          title={isOnline ? "Online" : "Offline"}
        />
      )}
    </div>
  );
}
