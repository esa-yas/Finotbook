
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { MemberRole } from './BusinessContext';
import { useRouter } from 'next/navigation';

export interface BusinessInvitation {
  id: string;
  business_id: string;
  email: string;
  role: MemberRole;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  businesses: {
      name: string;
  }
}

interface NotificationContextType {
  invitations: BusinessInvitation[];
  unreadCount: number;
  loading: Record<string, boolean>; // a map of invitation id to loading state, or 'all' for general loading
  acceptInvitation: (invitation: BusinessInvitation) => Promise<void>;
  declineInvitation: (invitationId: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, supabase } = useAuth();
  const { toast } = useToast();
  const [invitations, setInvitations] = useState<BusinessInvitation[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({ all: true });

  const fetchInvitations = useCallback(async (supabaseClient: SupabaseClient, currentUser: User) => {
    if (!currentUser?.email) {
      setInvitations([]);
      setLoading(prev => ({ ...prev, all: false }));
      return;
    }

    setLoading(prev => ({ ...prev, all: true }));
    try {
      const { data, error } = await supabaseClient
        .from('business_invitations')
        .select('*, businesses(name)')
        .eq('email', currentUser.email)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }
      
      setInvitations(data || []);
    } catch (error) {
      console.error('Error fetching invitations:', error instanceof Error ? error.message : 'Unknown error');
      // Don't show a toast for timeouts, as they are common network issues.
      if (error instanceof Error && !error.message.includes('ERR_TIMED_OUT')) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not fetch notifications.',
          });
      }
    } finally {
      setLoading(prev => ({ ...prev, all: false }));
    }
  }, [toast]);

  useEffect(() => {
    if (user && supabase) {
      fetchInvitations(supabase, user);
    } else if (!user) {
      setInvitations([]);
      setLoading({ all: false });
    }
  }, [user, supabase, fetchInvitations]);

  const acceptInvitation = async (invitation: BusinessInvitation) => {
    if (!supabase || !user || !invitation.business_id) return;
    setLoading(prev => ({ ...prev, [invitation.id]: true }));
    try {
        // 1. Add user to the business_members table
        const { error: memberError } = await supabase
            .from('business_members')
            .insert({
                business_id: invitation.business_id,
                user_id: user.id,
                role: invitation.role
            });
        
        if (memberError && memberError.code !== '23505') throw memberError; // Ignore if already a member

        // 2. Update the invitation status
        const { error: invitationError } = await supabase
            .from('business_invitations')
            .update({ status: 'accepted' })
            .eq('id', invitation.id);
        
        if (invitationError) throw invitationError;
        
        toast({ title: "Joined Business!", description: `You are now a member of ${invitation.businesses.name}. Redirecting...` });
        
        setInvitations(prev => prev.filter(i => i.id !== invitation.id));
        
        setTimeout(() => {
            window.location.assign('/books');
        }, 1500);


    } catch (error: any)
     {
        console.error("Error accepting invitation:", error);
        toast({ variant: 'destructive', title: 'Failed to Join', description: error.message });
    } finally {
      setLoading(prev => ({ ...prev, [invitation.id]: false }));
    }
  };

  const declineInvitation = async (invitationId: string) => {
    if (!supabase || !user) return;
    setLoading(prev => ({ ...prev, [invitationId]: true }));
    try {
        const { error } = await supabase
            .from('business_invitations')
            .update({ status: 'declined' })
            .eq('id', invitationId);
        
        if (error) throw error;
        
        toast({ description: "Invitation declined." });
        setInvitations(prev => prev.filter(i => i.id !== invitationId));

    } catch (error: any) {
        console.error("Error declining invitation:", error);
        toast({ variant: 'destructive', title: 'Action Failed', description: error.message });
    } finally {
        setLoading(prev => ({ ...prev, [invitationId]: false }));
    }
  };


  const unreadCount = invitations.length;

  const value = {
    invitations,
    unreadCount,
    loading,
    acceptInvitation,
    declineInvitation,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
