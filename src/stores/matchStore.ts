import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { sounds } from '../lib/sound';
import { rateLimiter } from '../lib/rateLimiter';
import type { UserProfile, DirectMessage } from '../types';

export interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name?: string;
  content: string;
  media_url?: string | null;
  media_type?: 'image' | 'video' | 'audio' | null;
  is_system?: boolean;
  created_at: string;
}

interface MatchState {
  status: 'idle' | 'searching' | 'matched' | 'ended';
  conversationId: string | null;
  partner: UserProfile | null;
  messages: ChatMessage[];
  partnerTyping: boolean;
  channel: any | null;
  error: string | null;
  soundEnabled: boolean;
  incomingFriendRequest: boolean;

  toggleSound: () => void;
  startMatchmaking: (userProfile: UserProfile) => Promise<void>;
  leaveMatch: () => Promise<void>;
  nextMatch: (userProfile: UserProfile) => Promise<void>;
  sendMessage: (content: string, senderProfile: UserProfile, mediaUrl?: string, mediaType?: 'image' | 'video' | 'audio') => Promise<{ error?: string }>;
  sendTyping: (isTyping: boolean) => void;
  sendFriendRequestSignal: () => void;
  respondFriendRequestSignal: (accepted: boolean) => void;
  subscribeToConversation: (conversationId: string, currentUserId: string) => void;
}

let queuePollInterval: any = null;

export const useMatchStore = create<MatchState>((set, get) => ({
  status: 'idle',
  conversationId: null,
  partner: null,
  messages: [],
  partnerTyping: false,
  channel: null,
  error: null,
  soundEnabled: true,
  incomingFriendRequest: false,

  toggleSound: () => {
    const current = get().soundEnabled;
    sounds.enabled = !current;
    set({ soundEnabled: !current });
  },

  startMatchmaking: async (userProfile: UserProfile) => {
    if (queuePollInterval) {
      clearInterval(queuePollInterval);
      queuePollInterval = null;
    }

    const { leaveMatch } = get();
    await leaveMatch();

    set({
      status: 'searching',
      error: null,
      messages: [
        {
          id: 'sys-searching-' + Date.now(),
          sender_id: 'system',
          content: 'Looking for someone you can chat with...',
          is_system: true,
          created_at: new Date().toISOString(),
        },
      ],
      partner: null,
      partnerTyping: false,
    });

    if (!isSupabaseConfigured) {
      // Demo preview simulation
      setTimeout(() => {
        const dummyPartner: UserProfile = {
          id: 'stranger-' + Math.floor(Math.random() * 9000 + 1000),
          nickname: 'Stranger',
          is_guest: true,
          role: 'user',
          is_banned: false,
          created_at: new Date().toISOString(),
        };
        const convId = 'demo-' + Date.now();
        sounds.playConnected();
        set({
          status: 'matched',
          conversationId: convId,
          partner: dummyPartner,
          messages: [
            {
              id: 'sys-connected-' + Date.now(),
              sender_id: 'system',
              content: "You're now chatting with a random stranger. Say hi!",
              is_system: true,
              created_at: new Date().toISOString(),
            },
          ],
        });
      }, 1500);
      return;
    }

    try {
      // Call atomic matchmaking procedure
      const { data, error } = await supabase.rpc('find_or_create_match', {
        p_language: 'any',
        p_interests: [],
      });

      if (error) {
        set({ status: 'idle', error: error.message });
        return;
      }

      if (data && data.matched && data.conversation_id) {
        // Paired immediately!
        const convId = data.conversation_id;
        const partnerProfile = (data.partner_profile as UserProfile) || {
          id: 'partner',
          nickname: 'Stranger',
          is_guest: true,
          role: 'user',
          is_banned: false,
          created_at: new Date().toISOString(),
        };

        sounds.playConnected();
        set({
          status: 'matched',
          conversationId: convId,
          partner: partnerProfile,
          messages: [
            {
              id: 'sys-connected-' + Date.now(),
              sender_id: 'system',
              content: "You're now chatting with a random stranger. Say hi!",
              is_system: true,
              created_at: new Date().toISOString(),
            },
          ],
        });

        get().subscribeToConversation(convId, userProfile.id);
      } else {
        // Enqueued, waiting for next person. Listen for queue pairing update.
        const onMatched = async (matchedConvId: string) => {
          if (queuePollInterval) {
            clearInterval(queuePollInterval);
            queuePollInterval = null;
          }

          // Fetch partner details
          const { data: convMembers } = await supabase
            .from('conversation_members')
            .select('user_id, profile:profiles(*)')
            .eq('conversation_id', matchedConvId)
            .neq('user_id', userProfile.id);

          const partner =
            (convMembers?.[0]?.profile as unknown as UserProfile) || {
              id: 'stranger',
              nickname: 'Stranger',
              is_guest: true,
              role: 'user',
              is_banned: false,
              created_at: new Date().toISOString(),
            };

          sounds.playConnected();
          set({
            status: 'matched',
            conversationId: matchedConvId,
            partner,
            messages: [
              {
                id: 'sys-connected-' + Date.now(),
                sender_id: 'system',
                content: "You're now chatting with a random stranger. Say hi!",
                is_system: true,
                created_at: new Date().toISOString(),
              },
            ],
          });

          if (get().channel) {
            supabase.removeChannel(get().channel);
          }
          get().subscribeToConversation(matchedConvId, userProfile.id);
        };

        const queueChannel = supabase
          .channel(`match_queue:${userProfile.id}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'match_queue',
              filter: `user_id=eq.${userProfile.id}`,
            },
            async (payload) => {
              const updated = payload.new;
              if (updated.status === 'matched' && updated.matched_conversation_id) {
                await onMatched(updated.matched_conversation_id);
              }
            }
          )
          .subscribe();

        // Robust 1.5s fallback polling for instant pairing
        queuePollInterval = setInterval(async () => {
          if (get().status !== 'searching') {
            if (queuePollInterval) {
              clearInterval(queuePollInterval);
              queuePollInterval = null;
            }
            return;
          }

          try {
            const { data: qRows } = await supabase
              .from('match_queue')
              .select('status, matched_conversation_id')
              .eq('user_id', userProfile.id)
              .limit(1);

            if (qRows && qRows[0] && qRows[0].status === 'matched' && qRows[0].matched_conversation_id) {
              await onMatched(qRows[0].matched_conversation_id);
            }
          } catch {
            // ignore network glitch in poll
          }
        }, 1500);

        set({ channel: queueChannel });
      }
    } catch (err: any) {
      set({ status: 'idle', error: err.message || 'Connection error' });
    }
  },

  subscribeToConversation: (conversationId: string, currentUserId: string) => {
    const dmChannel = supabase
      .channel(`conversation:${conversationId}`, {
        config: { broadcast: { self: false } },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as DirectMessage;
          const current = get().messages;
          if (current.some((m) => m.id === newMsg.id)) return;

          // Sound alert if received from partner
          if (newMsg.sender_id !== currentUserId) {
            sounds.playMessage();
          }

          set((state) => ({
            partnerTyping: false,
            messages: [
              ...state.messages,
              {
                id: newMsg.id,
                sender_id: newMsg.sender_id,
                content: newMsg.content,
                media_url: newMsg.media_url,
                media_type: newMsg.media_type,
                is_system: false,
                created_at: newMsg.created_at,
              },
            ],
          }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.new.status === 'ended' && get().status === 'matched') {
            sounds.playDisconnected();
            set((state) => ({
              status: 'ended',
              partnerTyping: false,
              messages: [
                ...state.messages,
                {
                  id: 'sys-ended-' + Date.now(),
                  sender_id: 'system',
                  content: 'Stranger has disconnected.',
                  is_system: true,
                  created_at: new Date().toISOString(),
                },
              ],
            }));
          }
        }
      )
      .on('broadcast', { event: 'typing' }, (payload) => {
        set({ partnerTyping: Boolean(payload.payload?.isTyping) });
      })
      .on('broadcast', { event: 'chat:message' }, ({ payload }) => {
        if (payload?.sender_id !== currentUserId) {
          sounds.playMessage();
          set((state) => ({
            partnerTyping: false,
            messages: [...state.messages, payload],
          }));
        }
      })
      .on('broadcast', { event: 'chat:disconnect' }, () => {
        if (get().status === 'matched') {
          sounds.playDisconnected();
          set((state) => ({
            status: 'ended',
            partnerTyping: false,
            messages: [
              ...state.messages,
              {
                id: 'sys-disc-' + Date.now(),
                sender_id: 'system',
                content: 'Stranger has disconnected.',
                is_system: true,
                created_at: new Date().toISOString(),
              },
            ],
          }));
        }
      })
      .on('broadcast', { event: 'friend_request' }, () => {
        set({ incomingFriendRequest: true });
      })
      .on('broadcast', { event: 'friend_response' }, ({ payload }) => {
        if (payload?.accepted) {
          const partner = get().partner;
          set((state) => ({
            messages: [
              ...state.messages,
              {
                id: 'sys-friend-accepted-' + Date.now(),
                sender_id: 'system',
                content: `Connection accepted! You and @${partner?.nickname || 'Stranger'} are now connected. Audio/video calls unlocked!`,
                is_system: true,
                created_at: new Date().toISOString(),
              },
            ],
          }));
        }
      })
      .subscribe();

    set({ channel: dmChannel });
  },

  sendFriendRequestSignal: () => {
    const { channel } = get();
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'friend_request',
        payload: {},
      });
      set((state) => ({
        messages: [
          ...state.messages,
          {
            id: 'sys-friend-sent-' + Date.now(),
            sender_id: 'system',
            content: 'Friend connection request sent to Stranger. Waiting for them to accept...',
            is_system: true,
            created_at: new Date().toISOString(),
          },
        ],
      }));
    }
  },

  respondFriendRequestSignal: (accepted: boolean) => {
    const { channel, partner } = get();
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'friend_response',
        payload: { accepted },
      });
    }
    set((state) => ({
      incomingFriendRequest: false,
      messages: [
        ...state.messages,
        {
          id: 'sys-resp-' + Date.now(),
          sender_id: 'system',
          content: accepted
            ? `You accepted the connection request! You are now connected with @${partner?.nickname || 'Stranger'}.`
            : 'You declined the connection request.',
          is_system: true,
          created_at: new Date().toISOString(),
        },
      ],
    }));
  },

  sendTyping: (isTyping: boolean) => {
    const { channel } = get();
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { isTyping },
      });
    }
  },

  leaveMatch: async () => {
    if (queuePollInterval) {
      clearInterval(queuePollInterval);
      queuePollInterval = null;
    }

    const { conversationId, channel, status } = get();
    if (channel) {
      try {
        await channel.send({
          type: 'broadcast',
          event: 'chat:disconnect',
          payload: {},
        });
      } catch {
        // ignore
      }
      supabase.removeChannel(channel);
    }

    if (conversationId && isSupabaseConfigured) {
      try {
        await supabase.rpc('leave_match', { p_conversation_id: conversationId });
      } catch {
        // ignore
      }
    }

    if (status === 'matched') {
      sounds.playDisconnected();
    }

    set({
      status: 'ended',
      conversationId: null,
      channel: null,
      partnerTyping: false,
    });
  },

  nextMatch: async (userProfile: UserProfile) => {
    await get().leaveMatch();
    await get().startMatchmaking(userProfile);
  },

  sendMessage: async (content: string, senderProfile: UserProfile, mediaUrl?: string, mediaType?: 'image' | 'video' | 'audio') => {
    const { conversationId, partner, status } = get();
    if (status !== 'matched' || !conversationId) {
      return { error: 'Not connected to a stranger' };
    }

    const cleanContent = content.trim();
    if (!cleanContent && !mediaUrl) return { error: 'Empty message' };
    if (cleanContent.length > 1000) {
      return { error: 'Message exceeds 1,000 characters limit' };
    }

    // Traffic Rate-limiting check
    const rateCheck = rateLimiter.canSendMessage();
    if (!rateCheck.allowed) {
      return { error: `Slow down! Wait ${rateCheck.waitSeconds}s to prevent spamming.` };
    }

    const newMsg: ChatMessage = {
      id: 'local-' + Date.now(),
      sender_id: senderProfile.id,
      content: cleanContent,
      media_url: mediaUrl || null,
      media_type: mediaType || null,
      is_system: false,
      created_at: new Date().toISOString(),
    };

    sounds.playMessage();
    set((state) => ({ messages: [...state.messages, newMsg] }));

    // Instant zero-disk broadcast over Realtime
    const { channel } = get();
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'chat:message',
        payload: newMsg,
      });
    }

    if (!isSupabaseConfigured) {
      // Demo preview echo simulation
      setTimeout(() => {
        if (get().status === 'matched') {
          sounds.playMessage();
          const replies = [
            'Hello! Where are you from?',
            'Nice to meet you! How is your day going?',
            'Haha cool!',
            'What do you do for fun?',
            'I am just browsing random chat.',
          ];
          const reply = replies[Math.floor(Math.random() * replies.length)];
          set((state) => ({
            messages: [
              ...state.messages,
              {
                id: 'partner-' + Date.now(),
                sender_id: partner?.id || 'stranger',
                content: reply,
                is_system: false,
                created_at: new Date().toISOString(),
              },
            ],
          }));
        }
      }, 1200);
    }

    return {};
  },
}));
