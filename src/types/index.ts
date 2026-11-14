export type UserRole = 'user' | 'moderator' | 'admin' | 'super_admin';

export interface UserProfile {
  id: string;
  nickname: string;
  avatar_url?: string;
  bio?: string;
  country?: string;
  language?: string;
  interests?: string[];
  is_guest: boolean;
  role: UserRole;
  is_banned: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  description: string;
  category: 'general' | 'teen' | 'singles' | 'tech' | 'gaming' | 'music' | 'global' | 'custom';
  is_public: boolean;
  owner_id?: string;
  rules?: string;
  created_at: string;
  member_count?: number;
}

export interface RoomMember {
  room_id: string;
  user_id: string;
  role: 'member' | 'moderator' | 'admin' | 'owner';
  joined_at: string;
  profile?: UserProfile;
}

export interface RoomMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  card_style?: string | null;
  created_at: string;
  sender?: UserProfile;
}

export interface Conversation {
  id: string;
  type: 'random' | 'direct';
  status: 'active' | 'ended';
  created_at: string;
  ended_at?: string | null;
  other_user?: UserProfile;
}

export interface DirectMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  media_url?: string | null;
  media_type?: 'image' | 'video' | null;
  created_at: string;
  sender?: UserProfile;
}

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  sender?: UserProfile;
  receiver?: UserProfile;
}

export interface Friend {
  user_id: string;
  friend_id: string;
  created_at: string;
  friend?: UserProfile;
}

export interface MatchQueueEntry {
  user_id: string;
  language: string;
  interests: string[];
  status: 'waiting' | 'matched' | 'cancelled';
  matched_conversation_id?: string | null;
  joined_at: string;
  expires_at: string;
}

export interface BlockEntry {
  blocker_id: string;
  blocked_id: string;
  created_at: string;
  blocked_user?: UserProfile;
}

export interface ReportItem {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  conversation_id?: string | null;
  room_id?: string | null;
  reason: string;
  details: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  created_at: string;
  reporter?: UserProfile;
  reported_user?: UserProfile;
}

export interface ModerationAction {
  id: string;
  moderator_id: string;
  target_user_id: string;
  action: 'warn' | 'kick' | 'mute' | 'suspend' | 'ban' | 'unban';
  reason: string;
  created_at: string;
  moderator?: UserProfile;
  target_user?: UserProfile;
}
