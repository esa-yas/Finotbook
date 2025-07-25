
'use client';

import React from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Building, ChevronsUpDown, LogOut, PlusCircle, Menu, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsClient } from '@/hooks/use-is-client';
import { useUI } from '@/contexts/UIContext';

export function AppHeader() {
  const { user, supabase, loading: authLoading } = useAuth();
  const { 
    currentBusiness, 
    userBusinesses, 
    switchBusiness, 
    loading: businessLoading,
    setIsCreateBusinessOpen,
    refreshData,
  } = useBusiness();
  const { setIsMobileSidebarOpen } = useUI();
  const isClient = useIsClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      const nameParts = name.split(' ');
      if (nameParts.length > 1) {
        return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };
  
  const isLoading = !isClient || authLoading || businessLoading.sync || businessLoading.userBusinesses;

  if (isLoading) {
    return (
      <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-4 md:px-6">
        <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 md:hidden" />
            <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </header>
    );
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-4 md:px-6">
       <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMobileSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open sidebar</span>
        </Button>
        
        {/* Business Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 text-base font-semibold">
                {currentBusiness ? (
                  <>
                    <Building className="h-5 w-5" />
                    <span className="truncate max-w-[150px] md:max-w-[200px]">{currentBusiness.name}</span>
                    <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                  </>
                ) : (
                  <span className="text-sm">No Business Found</span>
                )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>Switch Workspace</DropdownMenuLabel>
            <DropdownMenuGroup>
              {userBusinesses.map(business => (
                <DropdownMenuItem 
                  key={business.id} 
                  onClick={() => switchBusiness(business.id)}
                  className={currentBusiness?.id === business.id ? 'bg-accent' : ''}
                  >
                  <Building className="mr-2 h-4 w-4" />
                  <span className="truncate">{business.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setIsCreateBusinessOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              <span>Create New Business</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>


      {/* User Menu */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={refreshData} disabled={businessLoading.sync}>
          <RefreshCw className={`h-4 w-4 ${businessLoading.sync ? 'animate-spin' : ''}`} />
          <span className="sr-only">Refresh Data</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              {user ? (
                <>
                  <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {getInitials(user.user_metadata.full_name, user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline-block truncate max-w-[150px]">{user.user_metadata.full_name || user.email}</span>
                </>
              ) : (
                 <Skeleton className="h-8 w-32" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Profile</DropdownMenuItem>
            <DropdownMenuItem disabled>Billing</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
