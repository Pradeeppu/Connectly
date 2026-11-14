import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { CallModal } from '../chat/CallModal';
import { useAuthStore } from '../../stores/authStore';
import { useCallStore } from '../../stores/callStore';
import { useThemeStore } from '../../stores/themeStore';

export const AppShell: React.FC = () => {
  const { profile } = useAuthStore();
  const { initSignaling } = useCallStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    if (profile?.id) {
      initSignaling(profile.id);
    }
  }, [profile, initSignaling]);

  return (
    <div className={`min-h-screen flex flex-col antialiased selection:bg-sky-500 selection:text-black transition-colors duration-200 ${
      theme === 'dark'
        ? 'bg-zinc-950 text-zinc-100'
        : 'bg-zinc-50 text-zinc-900'
    }`}>
      <Navbar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </main>
      <CallModal />
    </div>
  );
};
