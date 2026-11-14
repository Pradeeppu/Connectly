-- ============================================================================
-- CONNECTLY - Row Level Security (RLS) Policies Migration
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is moderator or admin
CREATE OR REPLACE FUNCTION public.is_moderator()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('moderator', 'admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- PROFILES POLICIES
-- ----------------------------------------------------------------------------
-- Anyone authenticated can view public profiles
CREATE POLICY "Public profiles are viewable by authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Users can update only their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- CHAT ROOMS POLICIES
-- ----------------------------------------------------------------------------
-- Public rooms are readable by anyone authenticated
CREATE POLICY "Public rooms are viewable by authenticated users"
ON public.chat_rooms FOR SELECT
TO authenticated
USING (is_public = true OR owner_id = auth.uid());

-- Authenticated users can create new rooms
CREATE POLICY "Users can create rooms"
ON public.chat_rooms FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- Room owner or moderators can update room details
CREATE POLICY "Room owners can update their rooms"
ON public.chat_rooms FOR UPDATE
TO authenticated
USING (owner_id = auth.uid() OR public.is_moderator());

-- ----------------------------------------------------------------------------
-- ROOM MESSAGES POLICIES
-- ----------------------------------------------------------------------------
-- Messages in public rooms are readable by all authenticated users
CREATE POLICY "Public room messages are viewable"
ON public.room_messages FOR SELECT
TO authenticated
USING (
  deleted_at IS NULL AND EXISTS (
    SELECT 1 FROM public.chat_rooms
    WHERE chat_rooms.id = room_messages.room_id AND (chat_rooms.is_public = true OR chat_rooms.owner_id = auth.uid())
  )
);

-- Users can insert messages in rooms, sender_id MUST equal auth.uid()
CREATE POLICY "Authenticated users can post to rooms"
ON public.room_messages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id AND
  NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_banned = true
  )
);

-- ----------------------------------------------------------------------------
-- CONVERSATIONS & CONVERSATION MEMBERS POLICIES (Private Chats)
-- ----------------------------------------------------------------------------
-- Only conversation members can view the conversation record
CREATE POLICY "Members can view their conversations"
ON public.conversations FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_members.conversation_id = conversations.id
      AND conversation_members.user_id = auth.uid()
  )
);

-- Only members can view conversation membership list
CREATE POLICY "Members can view conversation members"
ON public.conversation_members FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_members AS cm
    WHERE cm.conversation_id = conversation_members.conversation_id
      AND cm.user_id = auth.uid()
  )
);

-- ----------------------------------------------------------------------------
-- DIRECT MESSAGES POLICIES
-- ----------------------------------------------------------------------------
-- Only conversation participants can view direct messages
CREATE POLICY "Participants can view direct messages"
ON public.direct_messages FOR SELECT
TO authenticated
USING (
  deleted_at IS NULL AND EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_members.conversation_id = direct_messages.conversation_id
      AND conversation_members.user_id = auth.uid()
  )
);

-- Only conversation participants can send direct messages
CREATE POLICY "Participants can send direct messages"
ON public.direct_messages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_members.conversation_id = direct_messages.conversation_id
      AND conversation_members.user_id = auth.uid()
  ) AND
  NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_banned = true
  )
);

-- ----------------------------------------------------------------------------
-- MATCH QUEUE POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view and manage their own match queue entry"
ON public.match_queue FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- BLOCKS POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can manage their own blocks"
ON public.blocks FOR ALL
TO authenticated
USING (auth.uid() = blocker_id)
WITH CHECK (auth.uid() = blocker_id);

-- ----------------------------------------------------------------------------
-- REPORTS POLICIES
-- ----------------------------------------------------------------------------
-- Users can submit reports
CREATE POLICY "Users can submit reports"
ON public.reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

-- Users can see their submitted reports; moderators can see all reports
CREATE POLICY "Moderators can view all reports"
ON public.reports FOR SELECT
TO authenticated
USING (auth.uid() = reporter_id OR public.is_moderator());

-- Only moderators can update reports
CREATE POLICY "Moderators can update reports"
ON public.reports FOR UPDATE
TO authenticated
USING (public.is_moderator());

-- ----------------------------------------------------------------------------
-- MODERATION ACTIONS POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "Moderators can view and create moderation actions"
ON public.moderation_actions FOR ALL
TO authenticated
USING (public.is_moderator())
WITH CHECK (public.is_moderator() AND auth.uid() = moderator_id);
