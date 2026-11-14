import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { LandingPage } from '../pages/LandingPage';
import { ChatPage } from '../pages/ChatPage';
import { SafetyPage } from '../pages/SafetyPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'chat', element: <ChatPage /> },
      { path: 'safety', element: <SafetyPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
