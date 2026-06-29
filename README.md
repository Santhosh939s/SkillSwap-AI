# SkillSwap AI

SkillSwap AI is a modern, full-stack community-driven platform for users to learn new skills by teaching one of their own. It connects learners and teachers worldwide through video calling, chat, dynamic leaderboards, and assessments.

## Architecture

This project is built using the **MERN Stack** (MongoDB, Express, React, Node.js) and is split into two primary components:

1. **`frontend/`**: The React Single Page Application (SPA) built with Vite and Tailwind CSS.
2. **`backend/`**: The Node.js/Express API, WebSocket Server (Socket.IO), and WebRTC signaling server.

---

## Folder Structure

```
SkillSwap-AI/
├── frontend/             # React Application
│   ├── src/              # Components, Pages, Contexts
│   ├── index.html        # HTML Entry
│   ├── vite.config.js    # Vite Build config
│   ├── tailwind.config.js
│   └── package.json
├── backend/              # Node.js Server
│   ├── config/           # Database configuration
│   ├── models/           # Mongoose schemas (User, Message, Meeting, Assessment, Review)
│   ├── routes/           # Express API endpoints
│   ├── controllers/      # Route logic
│   ├── middleware/       # Authentication and Upload handlers
│   ├── server.js         # Entry point and WebSocket handlers
│   └── package.json
├── vercel.json           # Vercel Deployment configuration
└── package.json          # Root Monorepo configuration
```

---

## Local Development

### 1. Install Dependencies
From the root of the project, run:
```bash
npm run install:all
```
*This command uses concurrently to install dependencies for the root, frontend, and backend folders.*

### 2. Configure Environment Variables
You will need two `.env` files.

**`backend/.env`**
```env
PORT=3000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/skillswap
JWT_SECRET=your_super_secret_jwt_key
```

**`frontend/.env`**
```env
VITE_API_URL=http://localhost:3000
```

### 3. Start the Development Servers
From the root of the project, run:
```bash
npm start
```
*This spins up both the Vite frontend server and the Express backend server concurrently.*

---

## Production Deployment

### Frontend (Vercel)
The frontend is optimized for deployment on Vercel from the repository root.
Vercel is explicitly configured using `vercel.json` to build the `frontend/` directory and route traffic appropriately. 

**Vercel Settings:**
- **Root Directory**: `[Leave Blank / Repository Root]`
- **Framework**: `Other` (handled by vercel.json)
- Environment Variables:
  - `VITE_API_URL=https://your-backend-url.onrender.com`

### Backend (Render / Heroku)
The backend should be deployed as a standard Node.js Web Service.

**Render Settings:**
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- Environment Variables:
  - `MONGO_URI`
  - `JWT_SECRET`
  - `PORT=3000` (Optional, Render assigns this automatically)

---

## Features
- **Real-Time Video Calling**: Powered by WebRTC for seamless mentorship meetings.
- **Global Leaderboards**: Rank users based on XP, Learning Hours, and Streaks.
- **Assessments**: Test your knowledge and earn verified Skill Badges.
- **Admin Dashboard**: View platform analytics, manage user roles, and monitor system health.
- **Instant Messaging**: Real-time Socket.IO chat integration.
