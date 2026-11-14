import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Shield, User, Users, LogIn, LogOut } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useMatchStore } from '../../stores/matchStore';
import { useFriendStore } from '../../stores/friendStore';
import { FriendsModal } from '../chat/FriendsModal';
import { AuthModal } from '../chat/AuthModal';

export const Navbar: React.FC = () => {
  const { profile, signOut } = useAuthStore();
  const { soundEnabled, toggleSound } = useMatchStore();
  const { pendingRequests, fetchFriends } = useFriendStore();

  const [friendsOpen, setFriendsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchFriends(profile.id);
    }
  }, [profile, fetchFriends]);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
        <div className="flex h-14 items-center justify-between px-4 sm:px-8 max-w-6xl mx-auto">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center font-black text-black text-base shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
                C
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white">
                  Connectly
                </span>
                <span className="text-[11px] font-semibold text-zinc-400 hidden sm:inline">
                  Random Chat
                </span>
              </div>
            </a>

            {/* Live Online Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-medium text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>1,840+ online</span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Friends / Connections Button */}
            <button
              onClick={() => {
                if (!profile || profile.is_guest) {
                  setAuthOpen(true);
                } else {
                  setFriendsOpen(true);
                }
              }}
              className="relative px-3 sm:px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs sm:text-sm font-semibold text-zinc-200 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Users className="w-4 h-4 text-sky-400" />
              <span>Friends</span>
              {pendingRequests.length > 0 && (
                <span className="w-4.5 h-4.5 rounded-full bg-sky-500 text-black font-black text-[10px] flex items-center justify-center">
                  {pendingRequests.length}
                </span>
              )}
            </button>

            {/* Profile / Account Toggle */}
            {profile && !profile.is_guest ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs sm:text-sm text-zinc-300">
                  <User className="w-4 h-4 text-sky-400" />
                  <span className="font-semibold text-white">@{profile.nickname}</span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="p-2 sm:p-2.5 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 transition cursor-pointer active:scale-95"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="px-3 sm:px-3.5 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer transition active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className={`p-2 sm:p-2.5 rounded-xl border transition cursor-pointer active:scale-95 ${
                soundEnabled
                  ? 'bg-zinc-900 text-sky-400 border-zinc-800 hover:text-sky-300'
                  : 'bg-zinc-900/40 text-zinc-500 border-zinc-800/50 hover:text-zinc-400'
              }`}
              title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <a
              href="/safety"
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition"
              title="Safety & Rules"
            >
              <Shield className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Friends & Auth Modals */}
      <FriendsModal isOpen={friendsOpen} onClose={() => setFriendsOpen(false)} />
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
};
