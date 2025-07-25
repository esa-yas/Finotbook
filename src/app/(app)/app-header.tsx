
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
import { Building, ChevronsUpDown, LogOut, Users, PlusCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function AppHeader() {
  const { user, supabase, loading: authLoading } = useAuth();
  const { 
    currentBusiness, 
    userBusinesses, 
    switchBusiness, 
    loading: businessLoading,
    setIsCreateBusinessOpen,
  } = useBusiness();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };
  
  const isLoading = businessLoading.userBusinesses || authLoading;

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-4 md:px-6">
      {/* Business Switcher */}
       <DropdownMenu>
        <DropdownMenuTrigger asChild>
           <Button variant="ghost" className="flex items-center gap-2 text-base font-semibold" disabled={isLoading}>
              {isLoading || (!currentBusiness && user) ? (
                  <Skeleton className="h-8 w-48" />
              ) : currentBusiness ? (
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

      {/* User Menu */}
      <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" disabled>
            <Users className="mr-2 h-4 w-4" />
            Business Team
          </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2" disabled={authLoading}>
              {authLoading || !user ? (
                  <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <Avatar className="h-8 w-8">
                     <AvatarFallback>
                        {getInitials(user.email || '')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline-block truncate max-w-[150px]">{user.email}</span>
                </>
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
