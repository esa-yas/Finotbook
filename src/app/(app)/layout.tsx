
import React from 'react';
import { BusinessProvider } from '@/contexts/BusinessContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { UIProvider } from '@/contexts/UIContext';
import { AppShell } from './_components/app-shell';


export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <BusinessProvider>
      <NotificationProvider>
        <UIProvider>
          <AppShell>
            {children}
          </AppShell>
        </UIProvider>
      </NotificationProvider>
    </BusinessProvider>
  );
}
