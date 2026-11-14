import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useMatchStore } from '../stores/matchStore';
import { Shuffle, Shield, ArrowRight, RefreshCw } from 'lucide-react';

const RANDOM_NAMES = [
  'Explorer', 'Nova', 'Shadow', 'Phoenix', 'Cosmo',
  'SkyWalker', 'Echo', 'Drifter', 'Voyager', 'Nomad',
  'Pixel', 'Atlas', 'Comet', 'Matrix', 'Zenith'
];

export const LandingPage: React.FC = () => {
  const { signInAsGuest, updateProfile, profile, loading } = useAuthStore();
  const { startMatchmaking } = useMatchStore();
  const navigate = useNavigate();

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
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 bg-zinc-950 text-center">
      <div className="w-full max-w-md p-6 sm:p-8 bg-zinc-900/80 border border-zinc-800 rounded-2xl shadow-2xl backdrop-blur-md">
        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-800 border border-zinc-700/60 text-xs sm:text-sm font-semibold text-zinc-300 mb-6">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
          <span>Talk to Strangers • 1-on-1 Instant Chat</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-2.5">
          Connect with{' '}
          <span className="text-sky-400">Strangers</span>
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 mb-8 leading-relaxed">
          Random, instant text chat with real people online. No registration required.
        </p>

        {error && (
          <div className="p-3.5 mb-5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs sm:text-sm text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleStart} className="space-y-5 text-left">
          {/* Nickname Input */}
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2 flex items-center justify-between">
              <span>Your Nickname</span>
              <button
                type="button"
                onClick={() => setNickname(generateRandomNickname())}
                className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1.5 cursor-pointer py-1 px-2 rounded-lg hover:bg-zinc-800 transition"
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
              className="w-full px-4 py-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-base font-medium text-white placeholder:text-zinc-600 focus:outline-none focus:border-sky-500 transition"
            />
          </div>

          {/* 18+ Confirmation */}
          <label className="flex items-start gap-3 cursor-pointer text-xs sm:text-sm text-zinc-400 select-none bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800/80">
            <input
              type="checkbox"
              required
              checked={isAdult}
              onChange={(e) => setIsAdult(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-sky-500 focus:ring-sky-500"
            />
            <span>
              I confirm I am <strong className="text-zinc-200">18 or older</strong> and agree to be respectful and follow safety rules.
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
        <div className="mt-6 pt-5 border-t border-zinc-800/80 flex items-center justify-center gap-2 text-zinc-500 text-xs sm:text-sm">
          <Shield className="w-4 h-4 text-zinc-400" />
          <span>100% Anonymous • End or skip chat anytime</span>
        </div>

        {/* Multi-Tab Testing Tip */}
        <div className="mt-4 p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-400 text-left">
          <p className="font-semibold text-zinc-300 mb-1">💡 Testing on the same computer?</p>
          <p>
            Open your 2nd tab in an <span className="text-sky-400 font-semibold">Incognito / Private Window</span> (<kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-300 text-[11px]">Ctrl + Shift + N</kbd>) or a different browser so each tab has its own separate user identity.
          </p>
        </div>
      </div>
    </div>
  );
};
