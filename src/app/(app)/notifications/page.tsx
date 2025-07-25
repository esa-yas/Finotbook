
'use client';

import { useNotifications } from '@/contexts/NotificationContext';
import { Skeleton } from '@/components/ui/skeleton';
import { BellRing } from 'lucide-react';
import { NotificationCard } from './_components/notification-card';

export default function NotificationsPage() {
  const { invitations, loading } = useNotifications();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-muted-foreground">Invitations and updates will appear here.</p>
      </header>

      {loading['all'] ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : invitations.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-muted rounded-full">
              <BellRing className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <h2 className="text-xl font-semibold">All caught up!</h2>
          <p className="text-muted-foreground">You have no new invitations.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {invitations.map((invitation) => (
            <NotificationCard key={invitation.id} invitation={invitation} />
          ))}
        </div>
      )}
    </div>
  );
}
