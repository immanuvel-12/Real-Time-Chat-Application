# ChatConnect — Real-Time MERN Chat Application

A fully functional, responsive real-time chat application: **React (Vite) + Tailwind** frontend, **Express + Socket.io** backend, **MongoDB Atlas** persistence and **JWT** auth via httpOnly cookies.

## Features

- Register / login / logout with secure password hashing (bcryptjs) and JWT in an httpOnly cookie
- Real-time 1:1 messaging with Socket.io (instant send/receive, typing indicators, online/offline presence, last seen, read receipts)
- Conversation list with last-message previews, unread badges and timestamps
- Cursor-paginated message history (older messages load on scroll)
- User search, profile editing (username + profile image URL)
- Responsive dark UI (Jet Black / Cerulean Blue / Neon Rose palette), mobile conversation-list ↔ chat navigation
- Socket authentication verified server-side; sender identity is derived from the authenticated socket, never from client input; conversation membership is checked before every action

## Project structure

```
chatconnect/
├── backend/          Express API + Socket.io server
│   └── src/
│       ├── config/db.js            Mongoose/Atlas connection
│       ├── models/                 User, Conversation, Message
│       ├── controllers/            auth, user, conversation, message
│       ├── routes/                 /api/auth, /api/users, /api/conversations, /api/messages
│       ├── middleware/             requireAuth, error handling
│       ├── socket/socketHandler.js presence, rooms, send/typing/read
│       ├── app.js                  Express app
│       └── server.js               http + Socket.io bootstrap
└── frontend/         React (Vite) SPA
    └── src/
        ├── components/             Sidebar, ChatHeader, MessageList, MessageBubble, MessageInput, …
        ├── pages/                  Login, Register, ChatDashboard, Profile, NotFound
        ├── context/                AuthContext, SocketContext
        ├── hooks/                  useAuth, useSocket
        ├── services/               api (axios), authService, chatService
        └── utils/                  time formatting
```

## 1. Prerequisites

- Node.js 18+ (20/22 recommended)
- A MongoDB Atlas cluster (free M0 tier works): https://www.mongodb.com/atlas
  - Create a database user (Database Access) and allow your IP in Network Access (`0.0.0.0/0` for development).

## 2. Backend setup

```bash
cd backend
cp .env.example .env       # then edit .env (see below)
npm install
npm run dev                # starts on http://localhost:4000
```

`.env`:

```
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
COOKIE_SECURE=false
```

- `MONGODB_URI` — your Atlas URI. Keep the database name if your URI includes one (e.g. `...mongodb.net/chatconnect?retryWrites=true`). URL-encode special characters in the password (`@` → `%40`).
- `JWT_SECRET` — long random string (e.g. `openssl rand -hex 32`).
- `COOKIE_SECURE=true` in production (HTTPS). For cross-site deployments the cookie is automatically sent with `SameSite=None` when secure is on; set `COOKIE_SAMESITE` to override.

If the connection fails, the console prints a checklist: verify the URI, the database user/password, Atlas Network Access (your IP), and user permissions.

## 3. Frontend setup

```bash
cd frontend
cp .env.example .env       # defaults point at http://localhost:4000
npm install
npm run dev                # starts on http://localhost:5173
```

`.env`:

```
VITE_API_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
```

## 4. Try it end to end

1. Open http://localhost:5173 in two different browser profiles/windows.
2. Register a different user in each (e.g. `alice` / `bob`).
3. In Alice's window: “New conversation” → pick Bob → send a message.
4. In Bob's window the message arrives instantly; typing indicators, unread badges and online status update live.

## API endpoints

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | /api/auth/register | – | Create account (sets httpOnly cookie) |
| POST | /api/auth/login | – | Sign in (sets httpOnly cookie) |
| POST | /api/auth/logout | ✔ | Clear cookie, mark offline |
| GET | /api/auth/me | ✔ | Current user profile |
| GET | /api/users | ✔ | All users except me |
| GET | /api/users/search?q= | ✔ | Search users |
| GET | /api/users/:id | ✔ | One user |
| PUT | /api/users/profile | ✔ | Update username / profile image URL |
| POST | /api/conversations | ✔ | Create/return direct conversation |
| GET | /api/conversations | ✔ | My conversations (with previews) |
| GET | /api/conversations/:id | ✔ | One conversation (participants only) |
| GET | /api/messages/:conversationId?before=&limit= | ✔ | Paginated history (cursor) |
| POST | /api/messages | ✔ | Send message (REST; Socket.io is primary) |
| PUT | /api/messages/read/:conversationId | ✔ | Mark conversation read |
| GET | /api/health | – | Health check |

## Socket.io events

| Event | Direction | Payload |
| --- | --- | --- |
| joinConversation / leaveConversation | client → server | `{ conversationId }` |
| sendMessage | client → server | `{ conversationId, message, tempId }` (ack) |
| receiveMessage | server → client | full message doc (+tempId for dedupe) |
| conversationUpdated | server → client | `{ conversationId }` (sidebar refresh) |
| typing / stopTyping | both | `{ conversationId, userId }` |
| messageRead | both | `{ conversationId, readerId, readAt }` |
| userOnline / userOffline / onlineUsers | server → client | presence |
| resyncPresence | client → server | re-fetch presence snapshot after reconnect |

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `MONGODB_URI is not set` | Create `backend/.env` from `.env.example` |
| Atlas connection refused | Check URI, user/password, Network Access allowlist, user permissions |
| `JWT_SECRET is not configured` | Set a long random secret in `backend/.env` |
| CORS blocked | `CLIENT_ORIGIN` must exactly match the frontend origin, no trailing slash |
| Messages don't arrive live | Both users must be logged in in separate sessions; check `VITE_SOCKET_URL` and that the backend is running |
| Register/login fails | Check backend terminal for the logged error; confirm the backend port matches `VITE_API_URL` |

## Security notes

- Passwords are hashed with bcrypt (never stored or returned in plaintext; the model strips the field from every query/response).
- JWT lives in an httpOnly cookie (JavaScript can't read it); `SameSite`/`Secure` are configurable per environment.
- Every protected API route runs `requireAuth`; every socket connection is verified at handshake.
- Never trust client-sent `senderId` — the server derives it from the verified token and validates conversation membership before persisting or broadcasting.
- Secrets live only in `backend/.env` (gitignored). Nothing sensitive is exposed to Vite.
