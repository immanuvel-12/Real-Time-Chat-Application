[ChatConnect-README.md](https://github.com/user-attachments/files/33979511/ChatConnect-README.md)
# ChatConnect — Real-Time Chat Application

A full-stack, real-time messaging application built with the **MERN stack**. ChatConnect combines a React frontend with an Express and Socket.IO backend, MongoDB persistence, and cookie-based JWT authentication.

## Overview

ChatConnect enables users to register, find other users, start one-to-one conversations, and exchange messages in real time. The interface is responsive and uses a dark **Jet Black, Cerulean Blue, and Neon Rose** color palette.

## Key Features

- **Authentication:** Register, log in, and log out with bcryptjs password hashing and JWT authentication stored in an `httpOnly` cookie.
- **Real-time messaging:** Send and receive one-to-one messages instantly using Socket.IO.
- **Live chat indicators:** Typing status, online/offline presence, last-seen information, and read receipts.
- **Conversation dashboard:** Last-message previews, unread-message badges, and timestamps.
- **Message history:** Cursor-based pagination for loading older messages while scrolling.
- **User discovery:** Search for users and start direct conversations.
- **Profile management:** Update username and profile image URL.
- **Responsive interface:** Mobile-friendly navigation between the conversation list and active chat.
- **Server-side validation:** Socket connections are authenticated, sender identity is derived from the authenticated socket, and conversation membership is checked before actions.

## Technology Stack

| Area | Technologies |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Real-time communication | Socket.IO |
| Database | MongoDB Atlas, Mongoose |
| Authentication | JWT, httpOnly cookies |
| Password security | bcryptjs |
| API communication | Axios |

## Project Structure

```text
chatconnect/
├── backend/
│   └── src/
│       ├── config/       # Database connection
│       ├── models/       # User, Conversation, Message
│       ├── controllers/  # Authentication, users, conversations, messages
│       ├── routes/       # REST API routes
│       ├── middleware/   # Authentication and error handling
│       ├── socket/       # Socket.IO events and presence
│       ├── app.js        # Express application
│       └── server.js     # HTTP and Socket.IO server
└── frontend/
    └── src/
        ├── components/   # Chat UI components
        ├── pages/        # Login, Register, Dashboard, Profile, NotFound
        ├── context/      # Authentication and socket contexts
        ├── hooks/        # Authentication and socket hooks
        ├── services/     # API, authentication, and chat services
        └── utils/        # Time formatting utilities
```

## Getting Started

### Prerequisites

- Node.js 18 or later (Node.js 20 or 22 recommended)
- npm
- A MongoDB Atlas cluster

Create a MongoDB database user and configure Network Access in MongoDB Atlas. For local development, allow access from your current IP address.

### 1. Set Up the Backend

From the project root, run:

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

The backend runs at `http://localhost:4000` by default.

Configure `backend/.env` with your own values:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
COOKIE_SECURE=false
```

**Configuration notes**
- `MONGODB_URI`: Your MongoDB Atlas connection string. Ensure it includes the intended database name.
- `JWT_SECRET`: Use a long, randomly generated secret.
- `CLIENT_ORIGIN`: Must match the frontend origin exactly.
- For production over HTTPS, configure secure cookies as required by your deployment.

### 2. Set Up the Frontend

Open a second terminal from the project root:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` by default.

Configure `frontend/.env`:

```env
VITE_API_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
```

### 3. Test the Application

1. Open `http://localhost:5173` in two separate browser profiles or windows.
2. Register a different user in each window.
3. In one account, create a new conversation and select the other user.
4. Send a message and confirm that it appears instantly in the other session.
5. Test typing indicators, unread badges, and online status.

## API Endpoints

| Method | Endpoint | Authentication | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | No | Create an account |
| POST | `/api/auth/login` | No | Sign in |
| POST | `/api/auth/logout` | Yes | Sign out and mark offline |
| GET | `/api/auth/me` | Yes | Get the current user |
| GET | `/api/users` | Yes | List users except the current user |
| GET | `/api/users/search?q=` | Yes | Search users |
| GET | `/api/users/:id` | Yes | Get a user |
| PUT | `/api/users/profile` | Yes | Update profile details |
| POST | `/api/conversations` | Yes | Create or retrieve a direct conversation |
| GET | `/api/conversations` | Yes | List the user's conversations |
| GET | `/api/conversations/:id` | Yes | Get a conversation |
| GET | `/api/messages/:conversationId?before=&limit=` | Yes | Get paginated message history |
| POST | `/api/messages` | Yes | Send a message through REST |
| PUT | `/api/messages/read/:conversationId` | Yes | Mark a conversation as read |
| GET | `/api/health` | No | Check server health |

## Socket.IO Events

| Event | Direction | Purpose |
| --- | --- | --- |
| `joinConversation` / `leaveConversation` | Client → Server | Join or leave a conversation |
| `sendMessage` | Client → Server | Send a message |
| `receiveMessage` | Server → Client | Deliver a message |
| `conversationUpdated` | Server → Client | Refresh conversation previews |
| `typing` / `stopTyping` | Both | Share typing status |
| `messageRead` | Both | Share read-receipt updates |
| `userOnline` / `userOffline` / `onlineUsers` | Server → Client | Update online presence |
| `resyncPresence` | Client → Server | Request a fresh presence snapshot |

## Security

- Passwords are hashed with bcryptjs and are not stored in plaintext.
- JWT authentication is handled using an `httpOnly` cookie.
- Protected API routes use authentication middleware.
- Socket connections are authenticated during the handshake.
- The server derives sender identity from the authenticated connection rather than trusting a client-supplied sender ID.
- Conversation membership is validated before relevant actions.
- Keep secrets in environment files and never commit real credentials to GitHub.

> **Important:** Do not upload your real `.env` files or expose your MongoDB URI, JWT secret, or other credentials in a public repository. Use the example environment files for documentation.

## Troubleshooting

| Issue | What to check |
| --- | --- |
| `MONGODB_URI is not set` | Create `backend/.env` from `.env.example` and add your Atlas URI. |
| MongoDB connection fails | Verify the URI, database credentials, Network Access settings, and database permissions. |
| `JWT_SECRET is not configured` | Set a strong secret in `backend/.env`. |
| CORS error | Ensure `CLIENT_ORIGIN` exactly matches the frontend URL, without a trailing slash. |
| Messages do not arrive live | Confirm the backend is running and both users are logged in from separate sessions. Check `VITE_SOCKET_URL`. |
| Login or registration fails | Review the backend terminal logs and verify that the frontend API URL and backend port match. |

## Future Improvements

Potential enhancements include group conversations, file and image sharing, push notifications, and deployment links.

## Author

**Immanuvel**  
MERN Stack Developer — Fresher

---

*ChatConnect is a portfolio project demonstrating full-stack development, real-time communication, REST API design, authentication, database integration, and responsive UI development.*
