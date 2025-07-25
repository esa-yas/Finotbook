'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamically import the chat component with no SSR
const ChatComponent = dynamic(
  () => import('./chat-component').then((mod) => mod.ChatComponent),
  { 
    ssr: false,
    loading: () => <Skeleton className="h-48 w-full" />
  }
);

export default function ChatView() {
  return (
    <div className="rounded-lg border bg-card p-4">
      <ChatComponent />
    </div>
  );
}
