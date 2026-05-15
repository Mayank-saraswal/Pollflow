# PollFlow Deployment Guide

Deploying PollFlow involves two main components because of its architecture:
1. **Next.js Application** (Frontend & API) -> **Vercel**
2. **Socket Server** (Real-time WebSockets) -> **Render / Railway / Fly.io**

> **Warning**
> Vercel is a serverless platform and **does not support long-running WebSocket connections**. Your custom `socket.io` server (`socket-server` folder) must be hosted on a platform that supports continuous long-running Node.js processes, such as Render, Railway, or Heroku.

---

## Part 1: Deploying the Socket Server (Render Example)

Before deploying the frontend, you should deploy the socket server so you have its URL ready for Vercel. We recommend **Render.com** (Free tier available).

1. Push your code to GitHub.
2. Create an account on [Render](https://render.com/).
3. Click **New +** and select **Web Service**.
4. Connect your GitHub repository.
5. Configure the service:
   - **Name**: `pollflow-socket-server`
   - **Root Directory**: `socket-server` *(Important: specify this folder)*
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
6. **Environment Variables**:
   - `SOCKET_PORT`: `3001` (or let Render assign it)
   - `NEXT_PUBLIC_APP_URL`: `https://your-future-vercel-domain.vercel.app` (You can update this later once Vercel is deployed)
   - `SOCKET_INTERNAL_SECRET`: A strong random string (e.g., generate one with `openssl rand -base64 32`). **Must match the one in Vercel**.
7. Click **Create Web Service**.
8. Note the deployed URL (e.g., `https://pollflow-socket-server.onrender.com`).

---

## Part 2: Deploying the Next.js App to Vercel

1. Create a [Vercel](https://vercel.com/) account and connect your GitHub.
2. Click **Add New** -> **Project**.
3. Import your `Pollflow` GitHub repository.
4. **Framework Preset**: Vercel should auto-detect `Next.js`.
5. **Root Directory**: Leave as `./` (root).
6. **Build Command**: Leave default (`next build`).
7. **Install Command**: Leave default.

### 🔐 Environment Variables Configuration

Copy all these variables into Vercel's "Environment Variables" section before clicking Deploy:

#### Database
- `DATABASE_URL`: `postgresql://neondb_owner:npg_Ul7NkIxXMRj6@ep-dry-bonus-aoxraw18-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`

#### NextAuth (Authentication)
- `NEXTAUTH_SECRET`: Generate a new random string (or use `"akjhkfakfhkafshkahkffk"` for testing).
- `NEXTAUTH_URL`: The production URL (e.g., `https://your-pollflow-app.vercel.app`). *Vercel often auto-handles this, but it's safe to define it.*

#### OAuth Providers
- `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth Secret
- `GITHUB_CLIENT_ID`: Your GitHub OAuth ID (Optional)
- `GITHUB_CLIENT_SECRET`: Your GitHub OAuth Secret (Optional)

#### Redis (Upstash)
- `UPSTASH_REDIS_REST_URL`: `https://valued-wolf-123671.upstash.io`
- `UPSTASH_REDIS_REST_TOKEN`: `gQAAAAAAAeMXAAIgcDExY2NmYzcxZWY3MjU0NjQ5YTJkYjAyYjFhZWI5OTE1Nw`

#### Storage (Azure)
- `AZURE_STORAGE_CONNECTION_STRING`: `DefaultEndpointsProtocol=https;AccountName=nodebasemedia...`
- `AZURE_STORAGE_CONTAINER_NAME`: `nodebasestorage`

#### Socket Server Bridge
- `NEXT_PUBLIC_SOCKET_URL`: The URL from Part 1 (e.g., `https://pollflow-socket-server.onrender.com`).
- `SOCKET_INTERNAL_SECRET`: The exact same secret string you set in Render.

#### OpenAI
- `OPENAI_API_KEY`: Your OpenAI `sk-proj-...` key.

#### App General
- `NEXT_PUBLIC_APP_URL`: Your Vercel domain (e.g., `https://your-pollflow-app.vercel.app`).

> **Tip**
> After setting these, click **Deploy**.

---

## Part 3: Post-Deployment Setup

1. **Update URLs**: Once Vercel gives you your live URL (e.g., `pollflow.vercel.app`), go back to your Socket Server (Render) settings and update `NEXT_PUBLIC_APP_URL` to match your Vercel URL. This ensures CORS works correctly.
2. **Update OAuth Callbacks**: Go to your Google Cloud Console / GitHub Developer settings and add your new Vercel URL to the "Authorized redirect URIs" (e.g., `https://pollflow.vercel.app/api/auth/callback/google`).
3. **Run Prisma Migrations (if needed)**: Usually, your Neon DB is already migrated. If not, Vercel runs `prisma generate` automatically, but if you change schemas later, you'll need to run `npx prisma db push` against the prod DB.

## Common Gotchas

- **Socket Connections Failing**: If WebSockets fail in production, check that `NEXT_PUBLIC_SOCKET_URL` in Vercel exactly matches your Render URL (no trailing slash), and that `NEXT_PUBLIC_APP_URL` in Render exactly matches your Vercel URL.
- **Unauthorized Socket Emits**: Ensure `SOCKET_INTERNAL_SECRET` is exactly the same in both Vercel and Render environments.
