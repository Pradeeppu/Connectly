import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { UserProfile } from '../types';

interface AuthState {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  initialize: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithEmail: (email: string, password: string, nickname: string) => Promise<{ error?: string }>;
  signInAsGuest: (nickname: string, avatarUrl?: string, interests?: string[]) => Promise<{ error?: string }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,

  initialize: async () => {
    if (!isSupabaseConfigured) {
      // Check local storage for mock/demo session if Supabase is not configured yet
      const savedProfile = localStorage.getItem('connectly_demo_profile');
      if (savedProfile) {
        try {
          const profile = JSON.parse(savedProfile);
          set({ user: { id: profile.id }, profile, loading: false, initialized: true });
          return;
        } catch {
          // ignore
        }
      }
      set({ loading: false, initialized: true });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        set({ user: session.user });
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          set({ profile });
          if (profile.nickname) {
            localStorage.setItem('connectly_device_nickname', profile.nickname);
          }
        }
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
    } finally {
      set({ loading: false, initialized: true });
    }

    // Subscribe to auth state changes
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        set({ user: session.user });
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profile) {
          set({ profile });
          if (profile.nickname) {
            localStorage.setItem('connectly_device_nickname', profile.nickname);
          }
        }
      } else {
        set({ user: null, profile: null });
      }
    });
  },

  signInWithEmail: async (email: string, password: string) => {
    set({ loading: true });
    try {
      if (!isSupabaseConfigured) {
        // Local preview fallback
        const mockProfile: UserProfile = {
          id: 'demo-user-1',
          nickname: email.split('@')[0],
          is_guest: false,
          role: 'user',
          is_banned: false,
          created_at: new Date().toISOString(),
        };
        localStorage.setItem('connectly_demo_profile', JSON.stringify(mockProfile));
        set({ user: { id: mockProfile.id, email }, profile: mockProfile, loading: false });
        return {};
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        set({ user: data.user, profile });
      }
      return {};
    } catch (err: any) {
      return { error: err.message || 'Failed to sign in' };
    } finally {
      set({ loading: false });
    }
  },

  signUpWithEmail: async (email: string, password: string, nickname: string) => {
    set({ loading: true });
    try {
      if (!isSupabaseConfigured) {
        const mockProfile: UserProfile = {
          id: 'demo-user-' + Date.now(),
          nickname,
          is_guest: false,
          role: 'user',
          is_banned: false,
          created_at: new Date().toISOString(),
        };
        localStorage.setItem('connectly_demo_profile', JSON.stringify(mockProfile));
        set({ user: { id: mockProfile.id, email }, profile: mockProfile, loading: false });
        return {};
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nickname },
        },
      });
      if (error) return { error: error.message };

      if (data.user) {
        // Create profile row
        const newProfile: Partial<UserProfile> = {
          id: data.user.id,
          nickname,
          is_guest: false,
          role: 'user',
          is_banned: false,
        };
        await supabase.from('profiles').upsert(newProfile);
        set({ user: data.user, profile: newProfile as UserProfile });
      }
      return {};
    } catch (err: any) {
      return { error: err.message || 'Failed to register' };
    } finally {
      set({ loading: false });
    }
  },

  signInAsGuest: async (nickname: string, avatarUrl?: string, interests?: string[]) => {
    set({ loading: true });
    try {
      if (!isSupabaseConfigured) {
        const mockProfile: UserProfile = {
          id: 'guest-' + Math.random().toString(36).substring(2, 9),
          nickname,
          avatar_url: avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + nickname,
          interests: interests || [],
          is_guest: true,
          role: 'user',
          is_banned: false,
          created_at: new Date().toISOString(),
        };
        localStorage.setItem('connectly_demo_profile', JSON.stringify(mockProfile));
        set({ user: { id: mockProfile.id, is_anonymous: true }, profile: mockProfile, loading: false });
        return {};
      }

      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) return { error: error.message };

      if (data.user) {
        const newProfile: Partial<UserProfile> = {
          id: data.user.id,
          nickname,
          avatar_url: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${nickname}`,
          interests: interests || [],
          is_guest: true,
          role: 'user',
          is_banned: false,
        };

        const { error: profileError } = await supabase.from('profiles').upsert(newProfile);
        if (profileError) {
          console.error('Error inserting guest profile:', profileError);
        }
        localStorage.setItem('connectly_device_nickname', nickname);
        set({ user: data.user, profile: newProfile as UserProfile });
      }
      return {};
    } catch (err: any) {
      return { error: err.message || 'Failed to sign in as guest' };
    } finally {
      set({ loading: false });
    }
  },

  updateProfile: async (updates: Partial<UserProfile>) => {
    const { profile, user } = get();
    if (!profile || !user) return { error: 'Not authenticated' };

    try {
      if (!isSupabaseConfigured) {
        const updated = { ...profile, ...updates, updated_at: new Date().toISOString() };
        localStorage.setItem('connectly_demo_profile', JSON.stringify(updated));
        set({ profile: updated });
        return {};
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          nickname: updates.nickname,
          avatar_url: updates.avatar_url,
          bio: updates.bio,
          country: updates.country,
          language: updates.language,
          interests: updates.interests,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) return { error: error.message };
      if (updates.nickname) {
        localStorage.setItem('connectly_device_nickname', updates.nickname);
      }
      set({ profile: { ...profile, ...updates } });
      return {};
    } catch (err: any) {
      return { error: err.message || 'Failed to update profile' };
    }
  },

  signOut: async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('connectly_demo_profile');
    set({ user: null, profile: null });
  },
}));
