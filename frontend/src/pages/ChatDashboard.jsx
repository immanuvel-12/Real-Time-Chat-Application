import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { MessagesSquare } from "lucide-react";

import Sidebar from "../components/Sidebar.jsx";
import ChatHeader from "../components/ChatHeader.jsx";
import MessageList from "../components/MessageList.jsx";
import MessageInput from "../components/MessageInput.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useSocket } from "../hooks/useSocket.js";
import { getConversations, getConversationById, getMessages, markConversationRead, createConversation } from "../services/chatService.js";

/**
 * Chat dashboard: sidebar (conversations) + chat panel, wired to Socket.io
 * for instant messaging, presence and typing indicators.
 */
export default function ChatDashboard() {
  const { user } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [activeOther, setActiveOther] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [typingUserIds, setTypingUserIds] = useState(new Set());
  const [mobileView, setMobileView] = useState("list"); // list | chat
  const [connectionError, setConnectionError] = useState(false);

  const activeIdRef = useRef(null);
  activeIdRef.current = activeId;
  const pendingRef = useRef(new Map()); // tempId -> optimistic message

  const [onlineIds, setOnlineIds] = useState(new Set());
  const isOnlineRef = useRef(onlineIds);
  isOnlineRef.current = onlineIds;

  // ---- Load conversation list ----
  const loadConversations = useCallback(async () => {
    try {
      const list = await getConversations();
      setConversations(list);
      setConnectionError(false);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        toast.error("Your session expired. Please sign in again.");
        navigate("/login", { replace: true });
      } else {
        setConnectionError(true);
        toast.error("Could not load conversations. Is the backend running?");
      }
    } finally {
      setLoadingList(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // ---- Socket lifecycle wiring ----
  useEffect(() => {
    const s = socket.current;
    if (!s) return undefined;

    const onReceive = (msg) => {
      const active = activeIdRef.current;
      if (msg.conversationId === active) {
        setMessages((prev) => {
          // dedupe: replace optimistic copy by tempId, or skip if already present
          const byTemp = msg.tempId ? prev.findIndex((m) => m.tempId === msg.tempId) : -1;
          if (byTemp >= 0) {
            const next = [...prev];
            next[byTemp] = msg;
            pendingRef.current.delete(msg.tempId);
            return next;
          }
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        // mark as read since the conversation is open
        if (msg.senderId !== user._id) {
          s.emit("messageRead", { conversationId: active });
          markConversationRead(active).catch(() => {});
        }
      } else {
        // badge for background conversations (skip my own echoes)
        if (msg.senderId !== user._id) {
          setUnreadCounts((prev) => ({ ...prev, [msg.conversationId]: (prev[msg.conversationId] || 0) + 1 }));
          toast.success("New message", { description: msg.message.slice(0, 80) });
        }
      }
      // always refresh the sidebar preview
      loadConversations();
    };

    const onConversationUpdated = () => loadConversations();

    const onTyping = ({ userId, conversationId }) => {
      if (conversationId === activeIdRef.current && userId !== user._id) {
        setTypingUserIds((prev) => new Set(prev).add(userId));
      }
    };
    const onStopTyping = ({ userId }) => {
      setTypingUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    };
    const onUserOnline = ({ userId }) =>
      setOnlineIds((prev) => new Set(prev).add(userId));
    const onUserOffline = ({ userId }) =>
      setOnlineIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    const onOnlineUsers = ({ onlineUserIds: ids }) => setOnlineIds(new Set(ids || []));
    const onRead = ({ conversationId, readAt }) => {
      if (conversationId === activeIdRef.current) {
        setMessages((prev) =>
          prev.map((m) =>
            m.senderId === user._id && !m.readAt ? { ...m, readAt } : m
          )
        );
      }
    };
    const onSocketError = ({ message }) => toast.error(message || "Socket error");

    s.on("receiveMessage", onReceive);
    s.on("conversationUpdated", onConversationUpdated);
    s.on("typing", onTyping);
    s.on("stopTyping", onStopTyping);
    s.on("userOnline", onUserOnline);
    s.on("userOffline", onUserOffline);
    s.on("onlineUsers", onOnlineUsers);
    s.on("messageRead", onRead);
    s.on("socketError", onSocketError);

    return () => {
      s.off("receiveMessage", onReceive);
      s.off("conversationUpdated", onConversationUpdated);
      s.off("typing", onTyping);
      s.off("stopTyping", onStopTyping);
      s.off("userOnline", onUserOnline);
      s.off("userOffline", onUserOffline);
      s.off("onlineUsers", onOnlineUsers);
      s.off("messageRead", onRead);
      s.off("socketError", onSocketError);
    };
  }, [socket, user._id, loadConversations]);

  // ---- Open a conversation ----
  const openConversation = useCallback(
    async (conversationId) => {
      const s = socket.current;
      if (!s || !conversationId) return;

      // leave the previous room
      if (activeIdRef.current) s.emit("leaveConversation", { conversationId: activeIdRef.current });

      setActiveId(conversationId);
      activeIdRef.current = conversationId;
      setMobileView("chat");
      setMessages([]);
      setLoadingMessages(true);
      setHasMore(false);
      setTypingUserIds(new Set());

      // clear unread badge immediately
      setUnreadCounts((prev) => ({ ...prev, [conversationId]: 0 }));

      try {
        const [{ conversation }, history] = await Promise.all([
          createConversationMetadata(conversationId),
          getMessages(conversationId),
        ]);
        setActiveOther(conversation.other);
        setMessages(history.messages);
        setHasMore(history.hasMore);
      } catch (err) {
        toast.error(err?.response?.data?.message || "Could not open the conversation.");
        setActiveId(null);
        activeIdRef.current = null;
        setMobileView("list");
      } finally {
        setLoadingMessages(false);
      }

      s.emit("joinConversation", { conversationId }, (ack) => {
        if (ack && !ack.ok) toast.error(ack.message || "Could not join conversation room.");
      });
      s.emit("messageRead", { conversationId });
      markConversationRead(conversationId).catch(() => {});
    },
    [socket]
  );

  async function createConversationMetadata(conversationId) {
    const conversation = await getConversationById(conversationId);
    return { conversation };
  }

  // Close/leave room when unmounting
  useEffect(() => {
    const s = socket.current;
    return () => {
      if (s && activeIdRef.current) s.emit("leaveConversation", { conversationId: activeIdRef.current });
    };
  }, [socket]);

  // ---- Load older messages (cursor pagination) ----
  const loadOlder = useCallback(
    async (after) => {
      const conversationId = activeIdRef.current;
      if (!conversationId || loadingOlder || !hasMore) return;
      const oldest = messages[0];
      if (!oldest) return;
      setLoadingOlder(true);
      try {
        const history = await getMessages(conversationId, { before: oldest.createdAt });
        setMessages((prev) => [...history.messages, ...prev]);
        setHasMore(history.hasMore);
        after?.();
      } catch {
        toast.error("Could not load older messages.");
      } finally {
        setLoadingOlder(false);
      }
    },
    [messages, hasMore, loadingOlder, socket]
  );

  // ---- Send a message ----
  const sendMessage = useCallback(
    (text) => {
      const s = socket.current;
      const conversationId = activeIdRef.current;
      if (!s || !conversationId) return;
      if (!s.connected) {
        toast.error("You are offline — reconnecting…");
        return;
      }

      const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const optimistic = {
        _id: null,
        tempId,
        conversationId,
        senderId: user._id,
        message: text,
        createdAt: new Date().toISOString(),
        readAt: null,
        _optimistic: true,
      };
      pendingRef.current.set(tempId, optimistic);
      setMessages((prev) => [...prev, optimistic]);

      s.timeout(5000).emit("sendMessage", { conversationId, message: text, tempId }, (timeoutErr, ack) => {
        if (timeoutErr || !ack?.ok) {
          toast.error(ack?.message || "Message failed to send.");
          setMessages((prev) => prev.filter((m) => m.tempId !== tempId));
          pendingRef.current.delete(tempId);
        }
      });
    },
    [socket, user._id]
  );

  // ---- Typing ----
  const emitTyping = useCallback(() => {
    socket.current?.emit("typing", { conversationId: activeIdRef.current });
  }, [socket]);
  const emitStopTyping = useCallback(() => {
    socket.current?.emit("stopTyping", { conversationId: activeIdRef.current });
  }, [socket]);

  async function handleStartNewFromEmpty(userId) {
    try {
      const { conversation } = await createConversation(userId);
      await loadConversations();
      openConversation(conversation._id);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not start conversation.");
    }
  }

  const otherTypingId = [...typingUserIds][0] || null;

  return (
    <div className="flex h-screen overflow-hidden bg-jet">
      {/* Sidebar — always visible on desktop, first screen on mobile */}
      <div
        className={`h-full w-full md:w-[340px] md:min-w-[340px] ${
          mobileView === "chat" ? "hidden md:block" : "block"
        }`}
      >
        <Sidebar
          conversations={conversations}
          activeConversationId={activeId}
          unreadCounts={unreadCounts}
          onlineUserIds={onlineIds}
          onOpenConversation={openConversation}
          onConversationsChanged={loadConversations}
        />
        {loadingList && (
          <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[340px] items-center justify-center md:flex" />
        )}
      </div>

      {/* Chat panel */}
      <section
        className={`flex h-full min-w-0 flex-1 flex-col bg-jet ${
          mobileView === "chat" ? "flex" : "hidden md:flex"
        }`}
        aria-label="Chat panel"
      >
        {activeId && activeOther ? (
          <>
            <ChatHeader
              other={activeOther}
              isOnline={onlineIds.has(activeOther._id)}
              onBack={() => {
                setMobileView("list");
                setActiveId(null);
                activeIdRef.current = null;
              }}
            />
            <MessageList
              messages={messages}
              myId={user._id}
              loadingOlder={loadingOlder}
              hasMore={hasMore}
              otherTyping={Boolean(otherTypingId)}
              otherName={activeOther.username}
              onLoadOlder={loadOlder}
            />
            <MessageInput onSend={sendMessage} onTyping={emitTyping} onStopTyping={emitStopTyping} />
          </>
        ) : (
          /* Empty state */
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cerulean/15"
              style={{ boxShadow: "0 0 24px rgba(0,127,255,0.25)" }}
            >
              <MessagesSquare className="h-8 w-8 text-cerulean" />
            </div>
            <h2 className="text-lg font-semibold text-text-primary">Your messages</h2>
            <p className="max-w-sm text-sm text-text-secondary">
              Select a conversation from the sidebar, or start a new one — messages send and arrive
              instantly in real time.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
