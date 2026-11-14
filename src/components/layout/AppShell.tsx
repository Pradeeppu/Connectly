import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { CallModal } from '../chat/CallModal';
import { useAuthStore } from '../../stores/authStore';
import { useCallStore } from '../../stores/callStore';

export const AppShell: React.FC = () => {
  const { profile } = useAuthStore();
  const { initSignaling } = useCallStore();

  useEffect(() => {
    if (profile?.id) {
      initSignaling(profile.id);
    }
  }, [profile, initSignaling]);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 antialiased selection:bg-sky-500 selection:text-black">
      <Navbar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </main>
      <CallModal />
    </div>
  );
};
