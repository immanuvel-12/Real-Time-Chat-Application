import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";

import { useAuth } from "./AuthContext.jsx";

const socketURL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

const SocketContext = createContext(null);

/**
 * Owns the single Socket.io connection. It is created only while a user is
 * authenticated; the JWT httpOnly cookie is sent with the handshake
 * (withCredentials) and the server verifies it before accepting the socket.
 */
export function SocketProvider({ children }) {
  const { user, loading } = useAuth();
  const socketRef = useRef(null);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());

  useEffect(() => {
    if (loading) return; // wait for the session check

    if (!user) {
      // signed out: tear the socket down
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setOnlineUserIds(new Set());
      return;
    }

    const socket = io(socketURL, {
      withCredentials: true, // sends the auth cookie with the handshake
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    socketRef.current = socket;

    const onOnlineUsers = ({ onlineUserIds: ids }) => setOnlineUserIds(new Set(ids || []));
    const onUserOnline = ({ userId }) =>
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.add(userId);
        return next;
      });
    const onUserOffline = ({ userId }) =>
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });

    socket.on("onlineUsers", onOnlineUsers);
    socket.on("userOnline", onUserOnline);
    socket.on("userOffline", onUserOffline);

    const onConnect = () => {
      // re-sync presence after a reconnect
      socket.emit("resyncPresence");
    };
    socket.io.on("reconnect", onConnect);

    return () => {
      socket.io.off("reconnect", onConnect);
      socket.off("onlineUsers", onOnlineUsers);
      socket.off("userOnline", onUserOnline);
      socket.off("userOffline", onUserOffline);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, loading]);

  const value = useMemo(() => ({ socket: socketRef }), [onlineUserIds]);

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

/** Returns a ref to the socket (stable across re-renders). Use socketRef.current. */
export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used inside <SocketProvider>");
  return ctx.socket;
}
