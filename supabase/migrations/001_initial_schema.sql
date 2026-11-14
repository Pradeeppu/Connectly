-- ============================================================================
-- CONNECTLY - Initial Database Schema Migration
-- ============================================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT DEFAULT '',
  country TEXT DEFAULT '',
  language TEXT DEFAULT 'en',
  interests TEXT[] DEFAULT '{}',
  is_guest BOOLEAN DEFAULT false,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin', 'super_admin')),
  is_banned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for searching profiles
CREATE INDEX IF NOT EXISTS idx_profiles_nickname ON public.profiles(nickname);
CREATE INDEX IF NOT EXISTS idx_profiles_language ON public.profiles(language);

-- 2. Chat Rooms Table
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general',
  is_public BOOLEAN DEFAULT true,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rules TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Room Members Table
CREATE TABLE IF NOT EXISTS public.room_members (
  room_id TEXT REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin', 'owner')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

-- 4. Room Messages Table
CREATE TABLE IF NOT EXISTS public.room_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  card_style TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_room_messages_room_time ON public.room_messages(room_id, created_at DESC);

-- 5. Conversations Table (Private & 1-on-1 random matches)
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('random', 'direct')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ DEFAULT NULL
);

-- 6. Conversation Members Table
CREATE TABLE IF NOT EXISTS public.conversation_members (
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_members_user ON public.conversation_members(user_id);

-- 7. Direct Messages Table
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_direct_messages_conv_time ON public.direct_messages(conversation_id, created_at ASC);

-- 8. Matchmaking Queue Table
CREATE TABLE IF NOT EXISTS public.match_queue (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  language TEXT DEFAULT 'any',
  interests TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'matched', 'cancelled')),
  matched_conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '5 minutes')
);

CREATE INDEX IF NOT EXISTS idx_match_queue_waiting ON public.match_queue(status, joined_at ASC);

-- 9. Blocks Table
CREATE TABLE IF NOT EXISTS public.blocks (
  blocker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

-- 10. Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reported_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  room_id TEXT REFERENCES public.chat_rooms(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  details TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Moderation Actions Table
CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  moderator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('warn', 'kick', 'mute', 'suspend', 'ban', 'unban')),
  reason TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Default Public Rooms
INSERT INTO public.chat_rooms (id, name, description, category, is_public)
VALUES
  ('general', 'General Lounge', 'Welcome to Connectly! Hang out, chat, and say hi to everyone.', 'general', true),
  ('teen-hangout', 'Young Adults (18-21)', 'Friendly space for college students and young adults.', 'teen', true),
  ('singles', 'Singles Cafe', 'Meet new people, mingle, and make friendly connections.', 'singles', true),
  ('tech-coding', 'Dev & Tech Hub', 'Discussions about programming, AI, gadgets, and design.', 'tech', true),
  ('gaming-zone', 'Gaming & Anime', 'Discuss games, streamers, anime, and pop culture.', 'gaming', true),
  ('global-meet', 'Global Citizens', 'International room to exchange cultures and languages.', 'global', true)
ON CONFLICT (id) DO NOTHING;
