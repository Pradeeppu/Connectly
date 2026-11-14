-- ============================================================================
-- CONNECTLY - Friend Connections, Direct Calls & Media Sharing
-- ============================================================================

-- 1. Friend Requests Table
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id),
  CHECK (sender_id <> receiver_id)
);

-- 2. Friends Table (Bilateral Friendship)
CREATE TABLE IF NOT EXISTS public.friends (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, friend_id),
  CHECK (user_id <> friend_id)
);

-- 3. Add Media Fields to direct_messages Table
ALTER TABLE public.direct_messages 
ADD COLUMN IF NOT EXISTS media_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT NULL CHECK (media_type IN ('image', 'video', NULL));

-- Enable Realtime publication for friend_requests and friends
ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friends;

-- Enable RLS
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Users can see friend requests they sent or received
CREATE POLICY "Users can view their own friend requests"
ON public.friend_requests FOR SELECT
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can send friend requests
CREATE POLICY "Users can send friend requests"
ON public.friend_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

-- Receiver can update request (accept/reject)
CREATE POLICY "Receivers can update friend request status"
ON public.friend_requests FOR UPDATE
TO authenticated
USING (auth.uid() = receiver_id);

-- Users can view their friends
CREATE POLICY "Users can view their friends"
ON public.friends FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete friends
CREATE POLICY "Users can remove friends"
ON public.friends FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- RPC to Accept Friend Request atomically
CREATE OR REPLACE FUNCTION public.accept_friend_request(p_request_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_req RECORD;
BEGIN
  SELECT * INTO v_req FROM public.friend_requests
  WHERE id = p_request_id AND receiver_id = auth.uid() AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Friend request not found or not authorized';
  END IF;

  -- Update request status
  UPDATE public.friend_requests
  SET status = 'accepted', updated_at = NOW()
  WHERE id = p_request_id;

  -- Insert bilateral friends rows
  INSERT INTO public.friends (user_id, friend_id)
  VALUES
    (v_req.sender_id, v_req.receiver_id),
    (v_req.receiver_id, v_req.sender_id)
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
