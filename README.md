# Connectly — Talk to Strangers (Random 1-on-1 Chat)

> **High-Performance Anonymous 1-on-1 Random Web Chat + Social Connections & WebRTC Calling** built with React 19, TypeScript, Vite, Tailwind CSS v4, and Supabase.

---

## ⚡ Core Features & Capabilities

1. **Instant Random 1-on-1 Chat:**
   - 1-click nickname entry.
   - Atomic server matching with row-level locks (`FOR UPDATE SKIP LOCKED`).
   - Real-time messaging with typing indicators ("Stranger is typing...").
   - Ergonomic **Stop $\rightarrow$ Really? $\rightarrow$ New Chat** flow with `[Esc]` keyboard shortcuts.

2. **Image & Video Sharing (in Random & Direct Chat):**
   - Click the attachment icon (📎) to share pictures (jpg, png, gif) and videos (mp4, webm).
   - Real-time inline previews inside the chat conversation.

3. **Email Login & Friend Connection System:**
   - Users can register/sign in with Email & Password.
   - Click **`Connect`** while chatting with a random stranger to send a connection request.
   - If the stranger accepts:
     - Their user IDs/handles are revealed and saved to your permanent **Friends List**.
     - **WebRTC 1-on-1 Audio & Video Calls** are immediately unlocked!

4. **Friends List & Direct Messaging:**
   - Click **"Friends"** in the top bar to browse accepted friends and pending requests.
   - Open private direct chat with any friend, exchange text/photos/videos, and initiate direct calls.

5. **Integrated WebRTC Audio & Video Calling:**
   - Direct peer-to-peer browser calling with Google STUN servers.
   - Incoming call notification popup with Accept / Decline.
   - Full video call overlay with remote stream, local picture-in-picture, mute mic, camera toggle, and end call buttons.

6. **Senior UI/UX Aesthetics (Zero Violet/Purple):**
   - High-contrast Obsidian / Dark Zinc palette (`#090a0f`, `#18181b`) with Electric Sky-Blue accents (`#0ea5e9`), Emerald Green (`#10b981`), Amber (`#f59e0b`), and Rose (`#ef4444`).
   - Native Web Audio API synthesized notification chimes.
   - Client-side token bucket anti-flood rate limiter to prevent website crashes under high traffic.

---

## 🔒 Database Migrations

In your **Supabase SQL Editor**, execute the migration files:
1. [`supabase/migrations/001_initial_schema.sql`](file:///d:/chat/connectly/supabase/migrations/001_initial_schema.sql)
2. [`supabase/migrations/002_rls_policies.sql`](file:///d:/chat/connectly/supabase/migrations/002_rls_policies.sql)
3. [`supabase/migrations/003_matchmaking_rpc.sql`](file:///d:/chat/connectly/supabase/migrations/003_matchmaking_rpc.sql)
4. [`supabase/migrations/004_friends_and_media.sql`](file:///d:/chat/connectly/supabase/migrations/004_friends_and_media.sql)

---

## 🚀 Running the Project

```bash
cd d:\chat\connectly
npm run dev
```

Open **`http://localhost:5173`** in your browser.
