
'use client';

import React from 'react';
import { AppSidebar } from './app-sidebar';
import { AppHeader } from './app-header';
import { CreateBusinessDialog } from './create-business-dialog';
import { useBusiness } from '@/contexts/BusinessContext';
import { useIsClient } from '@/hooks/use-is-client';

export function AppShell({ children }: { children: React.ReactNode }) {
    const { loading } = useBusiness();
    const isClient = useIsClient();

    // The loading state is now robustly handled to prevent hydration mismatches.
    // It will always render the loading spinner on the server and initial client render.
    if (!isClient || loading.sync) {
        return (
            <div 
                className="flex h-screen w-full items-center justify-center bg-background"
                suppressHydrationWarning={true}
            >
                <div 
                    className="flex flex-col items-center space-y-2"
                    suppressHydrationWarning={true}
                >
                    <div 
                        className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
                        suppressHydrationWarning={true}
                    >
                    </div>
                    <p className="text-muted-foreground">Loading Your Business...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen w-full bg-background flex">
            <AppSidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <AppHeader />
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
            <CreateBusinessDialog />
        </div>
    );
}
