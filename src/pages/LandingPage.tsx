import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useMatchStore } from '../stores/matchStore';
import { useThemeStore } from '../stores/themeStore';
import { Shuffle, Shield, ArrowRight, RefreshCw } from 'lucide-react';

const RANDOM_NAMES = [
  'Explorer', 'Nova', 'Shadow', 'Phoenix', 'Cosmo',
  'SkyWalker', 'Echo', 'Drifter', 'Voyager', 'Nomad',
  'Pixel', 'Atlas', 'Comet', 'Matrix', 'Zenith'
];

export const LandingPage: React.FC = () => {
  const { signInAsGuest, updateProfile, profile, loading } = useAuthStore();
  const { startMatchmaking } = useMatchStore();
  const { theme } = useThemeStore();
  const navigate = useNavigate();

  const isDark = theme === 'dark';

  const generateRandomNickname = () => {
    const word = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    const num = Math.floor(Math.random() * 900 + 100);
    return `${word}_${num}`;
  };

  const [nickname, setNickname] = useState(profile?.nickname || generateRandomNickname());
  const [isAdult, setIsAdult] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError('Please choose a nickname');
      return;
    }
    if (!isAdult) {
      setError('You must confirm you are at least 18 years old.');
      return;
    }

    setError(null);
    let activeProfile = profile;

    if (!activeProfile) {
      const res = await signInAsGuest(nickname.trim());
      if (res.error) {
        setError(res.error);
        return;
      }
      activeProfile = useAuthStore.getState().profile;
    } else if (activeProfile.nickname !== nickname.trim()) {
      await updateProfile({ nickname: nickname.trim() });
      activeProfile = useAuthStore.getState().profile;
    }

    if (activeProfile) {
      startMatchmaking(activeProfile);
      navigate('/chat');
    }
  };

  return (
    <div className={`flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center transition-colors ${
      isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-100/70 text-zinc-900'
    }`}>
      <div className={`w-full max-w-md p-6 sm:p-8 rounded-2xl shadow-2xl backdrop-blur-md border transition-colors ${
        isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200/90 shadow-zinc-200/50'
      }`}>
        {/* Header Badge */}
        <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs sm:text-sm font-semibold mb-6 ${
          isDark ? 'bg-zinc-800 border-zinc-700/60 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-700'
        }`}>
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
          <span>Talk to Strangers • 1-on-1 Instant Chat</span>
        </div>

        {/* Hero Title */}
        <h1 className={`text-3xl sm:text-5xl font-black tracking-tight mb-2.5 ${
          isDark ? 'text-white' : 'text-zinc-950'
        }`}>
          Connect with{' '}
          <span className="text-sky-500">Strangers</span>
        </h1>
        <p className={`text-sm sm:text-base mb-8 leading-relaxed ${
          isDark ? 'text-zinc-400' : 'text-zinc-600'
        }`}>
          Random, instant text chat with real people online. No registration required.
        </p>

        {error && (
          <div className="p-3.5 mb-5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs sm:text-sm text-rose-500">
            {error}
          </div>
        )}

        <form onSubmit={handleStart} className="space-y-5 text-left">
          {/* Nickname Input */}
          <div>
            <label className={`block text-sm font-semibold mb-2 flex items-center justify-between ${
              isDark ? 'text-zinc-300' : 'text-zinc-700'
            }`}>
              <span>Your Nickname</span>
              <button
                type="button"
                onClick={() => setNickname(generateRandomNickname())}
                className="text-xs text-sky-500 hover:text-sky-400 flex items-center gap-1.5 cursor-pointer py-1 px-2 rounded-lg hover:bg-zinc-800/10 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Randomize
              </button>
            </label>
            <input
              type="text"
              required
              maxLength={20}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Stranger_101"
              className={`w-full px-4 py-3.5 border rounded-xl text-base font-medium transition focus:outline-none focus:border-sky-500 ${
                isDark
                  ? 'bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600'
                  : 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400'
              }`}
            />
          </div>

          {/* 18+ Confirmation */}
          <label className={`flex items-start gap-3 cursor-pointer text-xs sm:text-sm select-none p-3.5 rounded-xl border ${
            isDark
              ? 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400'
              : 'bg-zinc-50 border-zinc-200 text-zinc-600'
          }`}>
            <input
              type="checkbox"
              required
              checked={isAdult}
              onChange={(e) => setIsAdult(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-zinc-400 text-sky-500 focus:ring-sky-500"
            />
            <span>
              I confirm I am <strong className={isDark ? 'text-zinc-200' : 'text-zinc-800'}>18 or older</strong> and agree to be respectful and follow safety rules.
            </span>
          </label>

          {/* Start Chatting CTA */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-sky-500 hover:bg-sky-400 text-black font-black text-base sm:text-lg rounded-xl transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
          >
            <Shuffle className="w-5 h-5" />
            {loading ? 'Entering...' : 'Start Chatting (Instant)'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        {/* Safety Note */}
        <div className={`mt-6 pt-5 border-t flex items-center justify-center gap-2 text-xs sm:text-sm ${
          isDark ? 'border-zinc-800/80 text-zinc-500' : 'border-zinc-200 text-zinc-400'
        }`}>
          <Shield className="w-4 h-4" />
          <span>100% Anonymous • End or skip chat anytime</span>
        </div>
      </div>
    </div>
  );
};
