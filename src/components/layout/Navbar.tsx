import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Shield, User, Users, LogIn, LogOut, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useMatchStore } from '../../stores/matchStore';
import { useFriendStore } from '../../stores/friendStore';
import { useThemeStore } from '../../stores/themeStore';
import { FriendsModal } from '../chat/FriendsModal';
import { AuthModal } from '../chat/AuthModal';

export const Navbar: React.FC = () => {
  const { profile, signOut } = useAuthStore();
  const { soundEnabled, toggleSound } = useMatchStore();
  const { pendingRequests, fetchFriends } = useFriendStore();
  const { theme, toggleTheme } = useThemeStore();

  const [friendsOpen, setFriendsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchFriends(profile.id);
    }
  }, [profile, fetchFriends]);

  const isDark = theme === 'dark';

  return (
    <>
      <header className={`sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors ${
        isDark ? 'border-zinc-800/80 bg-zinc-950/90' : 'border-zinc-200 bg-white/90'
      }`}>
        <div className="flex h-14 items-center justify-between px-3 sm:px-8 max-w-6xl mx-auto">
          {/* Brand */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center font-black text-black text-base shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
                C
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`font-extrabold text-lg tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                  Connectly
                </span>
                <span className="text-[11px] font-semibold text-zinc-400 hidden sm:inline">
                  Random Chat
                </span>
              </div>
            </a>

            {/* Live Online Indicator */}
            <div className={`hidden xs:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-700'
            }`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>1,840+ online</span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Friends / Connections Button */}
            <button
              onClick={() => {
                if (!profile || profile.is_guest) {
                  setAuthOpen(true);
                } else {
                  setFriendsOpen(true);
                }
              }}
              className={`relative px-2.5 sm:px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                isDark
                  ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-200'
                  : 'bg-zinc-100 hover:bg-zinc-200/80 border-zinc-200 text-zinc-800'
              }`}
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
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs sm:text-sm ${
                  isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-800'
                }`}>
                  <User className="w-4 h-4 text-sky-400" />
                  <span className="font-semibold">@{profile.nickname}</span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="p-2 sm:p-2.5 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-zinc-800/40 transition cursor-pointer active:scale-95"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="px-2.5 sm:px-3.5 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer transition active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 sm:p-2.5 rounded-xl border transition cursor-pointer active:scale-95 ${
                isDark
                  ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-amber-400 hover:text-amber-300'
                  : 'bg-zinc-100 hover:bg-zinc-200/80 border-zinc-200 text-sky-600 hover:text-sky-500'
              }`}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? (
                <Sun className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              ) : (
                <Moon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              )}
            </button>

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className={`p-2 sm:p-2.5 rounded-xl border transition cursor-pointer active:scale-95 ${
                soundEnabled
                  ? isDark
                    ? 'bg-zinc-900 text-sky-400 border-zinc-800 hover:text-sky-300'
                    : 'bg-zinc-100 text-sky-600 border-zinc-200 hover:text-sky-500'
                  : isDark
                  ? 'bg-zinc-900/40 text-zinc-500 border-zinc-800/50 hover:text-zinc-400'
                  : 'bg-zinc-100/60 text-zinc-400 border-zinc-200/60 hover:text-zinc-600'
              }`}
              title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <a
              href="/safety"
              className="p-2 sm:p-2.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 transition"
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
