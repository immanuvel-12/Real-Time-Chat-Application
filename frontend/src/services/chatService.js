import api from "./api.js";

/** All users except me (for starting new chats). */
export async function getAllUsers() {
  const { data } = await api.get("/users");
  return data.users;
}

/** GET /api/users/search?q=... */
export async function searchUsers(q) {
  const { data } = await api.get("/users/search", { params: { q } });
  return data.users;
}

/** GET /api/users/:id */
export async function getUserById(id) {
  const { data } = await api.get(`/users/${id}`);
  return data.user;
}

/** PUT /api/users/profile */
export async function updateProfile(payload) {
  const { data } = await api.put("/users/profile", payload);
  return data.user;
}

/** POST /api/conversations — creates or returns the direct conversation. */
export async function createConversation(participantId) {
  const { data } = await api.post("/conversations", { participantId });
  return data;
}

/** GET /api/conversations */
export async function getConversations() {
  const { data } = await api.get("/conversations");
  return data.conversations;
}

/** GET /api/conversations/:id */
export async function getConversationById(id) {
  const { data } = await api.get(`/conversations/${id}`);
  return data.conversation;
}

/**
 * GET /api/messages/:conversationId
 * `before` is an ISO date cursor; pass the oldest loaded message's createdAt
 * to page backwards through history.
 */
export async function getMessages(conversationId, { before, limit = 30 } = {}) {
  const { data } = await api.get(`/messages/${conversationId}`, {
    params: { before, limit },
  });
  return data; // { messages, hasMore, nextCursor }
}

/** PUT /api/messages/read/:conversationId — marks my view as read. */
export async function markConversationRead(conversationId) {
  return api.put(`/messages/read/${conversationId}`);
}
