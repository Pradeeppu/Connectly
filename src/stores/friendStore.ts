import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Friend, FriendRequest, DirectMessage, UserProfile } from '../types';

interface FriendState {
  friends: Friend[];
  pendingRequests: FriendRequest[];
  activeFriendChat: UserProfile | null;
  friendConversationId: string | null;
  friendMessages: DirectMessage[];
  loading: boolean;

  fetchFriends: (currentUserId: string) => Promise<void>;
  sendFriendRequest: (senderId: string, receiverId: string) => Promise<{ error?: string; success?: boolean }>;
  acceptFriendRequest: (requestId: string, currentUserId: string) => Promise<void>;
  rejectFriendRequest: (requestId: string) => Promise<void>;
  openFriendChat: (friendProfile: UserProfile, currentUserId: string) => Promise<void>;
  closeFriendChat: () => void;
  sendFriendMessage: (content: string, senderId: string, mediaUrl?: string, mediaType?: 'image' | 'video') => Promise<{ error?: string }>;
}

export const useFriendStore = create<FriendState>((set, get) => ({
  friends: [],
  pendingRequests: [],
  activeFriendChat: null,
  friendConversationId: null,
  friendMessages: [],
  loading: false,

  fetchFriends: async (currentUserId: string) => {
    if (!isSupabaseConfigured) {
      // Mock friends preview
      set({
        friends: [
          {
            user_id: currentUserId,
            friend_id: 'mock-friend-1',
            created_at: new Date().toISOString(),
            friend: {
              id: 'mock-friend-1',
              nickname: 'Alex_Gamer',
              is_guest: false,
              role: 'user',
              is_banned: false,
              created_at: new Date().toISOString(),
            },
          },
          {
            user_id: currentUserId,
            friend_id: 'mock-friend-2',
            created_at: new Date().toISOString(),
            friend: {
              id: 'mock-friend-2',
              nickname: 'Sam_Dev',
              is_guest: false,
              role: 'user',
              is_banned: false,
              created_at: new Date().toISOString(),
            },
          },
        ],
      });
      return;
    }

    try {
      set({ loading: true });
      // Fetch friends
      const { data: friendsData } = await supabase
        .from('friends')
        .select('*, friend:profiles!friend_id(*)')
        .eq('user_id', currentUserId);

      if (friendsData) {
        set({ friends: friendsData as any });
      }

      // Fetch pending requests
      const { data: requestsData } = await supabase
        .from('friend_requests')
        .select('*, sender:profiles!sender_id(*)')
        .eq('receiver_id', currentUserId)
        .eq('status', 'pending');

      if (requestsData) {
        set({ pendingRequests: requestsData as any });
      }
    } catch (err) {
      console.error('Error fetching friends:', err);
    } finally {
      set({ loading: false });
    }
  },

  sendFriendRequest: async (senderId: string, receiverId: string) => {
    if (!isSupabaseConfigured) {
      return { success: true };
    }
    try {
      const { error } = await supabase.from('friend_requests').insert({
        sender_id: senderId,
        receiver_id: receiverId,
        status: 'pending',
      });
      if (error) return { error: error.message };
      return { success: true };
    } catch (err: any) {
      return { error: err.message };
    }
  },

  acceptFriendRequest: async (requestId: string, currentUserId: string) => {
    if (!isSupabaseConfigured) {
      set((state) => ({
        pendingRequests: state.pendingRequests.filter((r) => r.id !== requestId),
      }));
      return;
    }
    try {
      await supabase.rpc('accept_friend_request', { p_request_id: requestId });
      await get().fetchFriends(currentUserId);
    } catch (err) {
      console.error('Accept friend error:', err);
    }
  },

  rejectFriendRequest: async (requestId: string) => {
    if (!isSupabaseConfigured) {
      set((state) => ({
        pendingRequests: state.pendingRequests.filter((r) => r.id !== requestId),
      }));
      return;
    }
    try {
      await supabase.from('friend_requests').update({ status: 'rejected' }).eq('id', requestId);
      set((state) => ({
        pendingRequests: state.pendingRequests.filter((r) => r.id !== requestId),
      }));
    } catch {
      // ignore
    }
  },

  openFriendChat: async (friendProfile: UserProfile, currentUserId: string) => {
    set({ activeFriendChat: friendProfile, friendMessages: [] });

    if (!isSupabaseConfigured) {
      set({
        friendConversationId: 'mock-conv-' + friendProfile.id,
        friendMessages: [
          {
            id: 'mock-init',
            conversation_id: 'mock-conv-' + friendProfile.id,
            sender_id: friendProfile.id,
            content: `Hey! Good to connect with you.`,
            created_at: new Date().toISOString(),
          },
        ],
      });
      return;
    }

    try {
      // Find or create direct conversation between both users
      const { data: conv } = await supabase
        .from('conversations')
        .select('id, conversation_members!inner(user_id)')
        .eq('type', 'direct')
        .eq('conversation_members.user_id', currentUserId)
        .limit(1);

      let convId = conv?.[0]?.id;

      if (!convId) {
        const { data: newConv } = await supabase
          .from('conversations')
          .insert({ type: 'direct', status: 'active' })
          .select('id')
          .single();

        if (newConv) {
          convId = newConv.id;
          await supabase.from('conversation_members').insert([
            { conversation_id: convId, user_id: currentUserId },
            { conversation_id: convId, user_id: friendProfile.id },
          ]);
        }
      }

      set({ friendConversationId: convId });

      if (convId) {
        const { data: msgs } = await supabase
          .from('direct_messages')
          .select('*')
          .eq('conversation_id', convId)
          .order('created_at', { ascending: true })
          .limit(50);

        if (msgs) set({ friendMessages: msgs as DirectMessage[] });

        // Subscribe to realtime messages for this direct conversation
        supabase
          .channel(`friend_chat:${convId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'direct_messages',
              filter: `conversation_id=eq.${convId}`,
            },
            (payload) => {
              const newMsg = payload.new as DirectMessage;
              set((state) => {
                if (state.friendMessages.some((m) => m.id === newMsg.id)) return state;
                return { friendMessages: [...state.friendMessages, newMsg] };
              });
            }
          )
          .subscribe();
      }
    } catch (err) {
      console.error('Error opening friend chat:', err);
    }
  },

  closeFriendChat: () => {
    set({ activeFriendChat: null, friendConversationId: null, friendMessages: [] });
  },

  sendFriendMessage: async (content: string, senderId: string, mediaUrl?: string, mediaType?: 'image' | 'video') => {
    const { friendConversationId } = get();
    if (!friendConversationId) return { error: 'No active conversation' };

    const newMsg: DirectMessage = {
      id: 'local-' + Date.now(),
      conversation_id: friendConversationId,
      sender_id: senderId,
      content: content.trim(),
      media_url: mediaUrl || null,
      media_type: mediaType || null,
      created_at: new Date().toISOString(),
    };

    set((state) => ({ friendMessages: [...state.friendMessages, newMsg] }));

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('direct_messages').insert({
          conversation_id: friendConversationId,
          sender_id: senderId,
          content: content.trim(),
          media_url: mediaUrl || null,
          media_type: mediaType || null,
        });
        if (error) return { error: error.message };
      } catch (err: any) {
        return { error: err.message };
      }
    }

    return {};
  },
}));
