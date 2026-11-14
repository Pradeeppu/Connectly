import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useAuthStore } from '../stores/authStore';
import { Toaster } from 'sonner';

export const App: React.FC = () => {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" theme="dark" richColors />
    </>
  );
};

export default App;
