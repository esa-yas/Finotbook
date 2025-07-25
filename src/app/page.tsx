
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // This effect handles redirection after the initial authentication check is complete.
    if (!loading) {
      if (user) {
        router.push('/books');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  // Always render a loading indicator while the auth check is in progress.
  // This prevents hydration mismatches and provides a consistent loading state.
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
