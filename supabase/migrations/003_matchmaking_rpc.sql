-- ============================================================================
-- CONNECTLY - Pure Random 1-on-1 Matchmaking Migration
-- ============================================================================

-- Ensure realtime is enabled on direct_messages, conversations, and match_queue
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_queue;

-- Atomic Pure Random Matchmaker
CREATE OR REPLACE FUNCTION public.find_or_create_match(
  p_language TEXT DEFAULT 'any',
  p_interests TEXT[] DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_partner_id UUID;
  v_conv_id UUID;
  v_partner_profile JSONB;
BEGIN
  -- 1. Ensure user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Mark any previously active conversations as ended
  UPDATE public.conversations
  SET status = 'ended', ended_at = NOW()
  WHERE id IN (
    SELECT conversation_id FROM public.conversation_members WHERE user_id = v_user_id
  ) AND status = 'active';

  -- 3. Search for any waiting user in the queue with row-level locking
  SELECT user_id INTO v_partner_id
  FROM public.match_queue
  WHERE user_id <> v_user_id
    AND status = 'waiting'
    AND expires_at > NOW()
    AND NOT EXISTS (
      SELECT 1 FROM public.blocks
      WHERE (blocker_id = v_user_id AND blocked_id = match_queue.user_id)
         OR (blocker_id = match_queue.user_id AND blocked_id = v_user_id)
    )
  ORDER BY joined_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  -- 4. If partner found, pair them immediately!
  IF v_partner_id IS NOT NULL THEN
    INSERT INTO public.conversations (type, status)
    VALUES ('random', 'active')
    RETURNING id INTO v_conv_id;

    INSERT INTO public.conversation_members (conversation_id, user_id)
    VALUES
      (v_conv_id, v_user_id),
      (v_conv_id, v_partner_id);

    -- Notify partner by updating their queue row
    UPDATE public.match_queue
    SET status = 'matched', matched_conversation_id = v_conv_id
    WHERE user_id = v_partner_id;

    -- Remove current user from queue
    DELETE FROM public.match_queue WHERE user_id = v_user_id;

    -- Fetch partner profile
    SELECT to_jsonb(p) INTO v_partner_profile
    FROM public.profiles p
    WHERE p.id = v_partner_id;

    RETURN jsonb_build_object(
      'matched', true,
      'conversation_id', v_conv_id,
      'partner_profile', v_partner_profile
    );

  ELSE
    -- 5. No partner waiting right now, insert caller into queue
    INSERT INTO public.match_queue (user_id, status, joined_at, expires_at)
    VALUES (v_user_id, 'waiting', NOW(), NOW() + INTERVAL '2 minutes')
    ON CONFLICT (user_id) DO UPDATE
    SET status = 'waiting',
        matched_conversation_id = NULL,
        joined_at = NOW(),
        expires_at = NOW() + INTERVAL '2 minutes';

    RETURN jsonb_build_object(
      'matched', false,
      'status', 'waiting'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Disconnect / End Conversation RPC
CREATE OR REPLACE FUNCTION public.leave_match(
  p_conversation_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.conversations
  SET status = 'ended', ended_at = NOW()
  WHERE id = p_conversation_id
    AND EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_id = p_conversation_id AND user_id = auth.uid()
    );

  DELETE FROM public.match_queue WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
