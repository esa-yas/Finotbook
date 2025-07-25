
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Book,
  Building2,
  ChevronDown,
  CreditCard,
  HelpCircle,
  Settings,
  Users,
  Bell,
  Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotifications } from '@/contexts/NotificationContext';
import { Badge } from '@/components/ui/badge';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsClient } from '@/hooks/use-is-client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useUI } from '@/contexts/UIContext';


const menuItems = [
  {
    group: 'Book Keeping',
    items: [
      {
        href: '/books',
        icon: Book,
        label: 'Cashbooks',
      },
    ],
  },
  {
    group: 'Settings',
    items: [
      { href: '/team', icon: Users, label: 'Team' },
      { href: '/business-settings', icon: Briefcase, label: 'Business Settings' },
      {
        href: '#',
        icon: CreditCard,
        label: 'Subscription',
        disabled: true,
      },
    ],
  },
  {
    group: 'Others',
    items: [
        { href: '/notifications', icon: Bell, label: 'Notifications' },
        { href: '#', icon: HelpCircle, label: 'Help & Support', disabled: true },
    ],
  },
];

function SidebarContent() {
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const { unreadCount, loading: notificationsLoading } = useNotifications();
  const { currentBusiness, loading: businessLoading } = useBusiness();
  const { setIsMobileSidebarOpen } = useUI();
  const isClient = useIsClient();

  const isLoading = !isClient || authLoading || businessLoading.sync || businessLoading.userBusinesses;
  const isOwner = isLoading ? false : currentBusiness?.owner_id === user?.id;


  const isActive = (href: string) => {
    return pathname.startsWith(href);
  };
  
  const handleLinkClick = () => {
    setIsMobileSidebarOpen(false);
  }

  return (
    <>
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/books" className="flex items-center gap-2 font-semibold text-lg">
          <Building2 className="h-6 w-6 text-primary" />
          {isLoading ? (
            <Skeleton className="h-6 w-32" />
          ) : (
            <span className="truncate">{currentBusiness?.name || "FinotBook"}</span>
          )}
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="grid items-start p-2 text-sm font-medium">
          {menuItems.map((menuGroup) => (
            <div key={menuGroup.group} className="py-2">
              <h4 className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {menuGroup.group}
              </h4>
              <ul className="space-y-1">
                {menuGroup.items.map((item) => {
                  if (item.label === 'Business Settings' && !isOwner && !isLoading) {
                    return null; // Don't render Business Settings if not owner
                  }
                  const Icon = item.icon;
                  const itemIsDisabled = item.disabled || (item.label === 'Business Settings' && !isOwner);

                  return (
                    <li key={item.label}>
                      <Button
                        asChild
                        variant="ghost"
                        className={cn(
                          'w-full justify-start gap-3 relative',
                          isActive(item.href) && !itemIsDisabled && 'bg-primary text-white hover:bg-primary/90 hover:text-white',
                          itemIsDisabled && 'cursor-not-allowed opacity-50'
                        )}
                        onClick={handleLinkClick}
                      >
                       <Link href={itemIsDisabled ? '#' : item.href}>
                          <Icon className="h-5 w-5" />
                          {item.label}
                          {item.label === 'Notifications' && (
                            isLoading || notificationsLoading.all ? (
                                <Skeleton className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full" />
                            ) : unreadCount > 0 && (
                              <Badge className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-600 text-white h-5 px-1.5">
                                  {unreadCount > 9 ? '9+' : unreadCount}
                              </Badge>
                            )
                          )}
                        </Link>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </>
  );
}


export function AppSidebar() {
  const { isMobileSidebarOpen, setIsMobileSidebarOpen } = useUI();
  
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sticky top-0 h-screen w-64 flex-col border-r bg-white hidden md:flex">
        <SidebarContent />
      </aside>
      
      {/* Mobile Sidebar */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64 flex flex-col bg-white">
          <SheetHeader className="sr-only">
             <SheetTitle>Main Menu</SheetTitle>
          </SheetHeader>
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  );
}
